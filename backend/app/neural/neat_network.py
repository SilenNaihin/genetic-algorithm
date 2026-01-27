"""
NEAT network execution and genome creation.

Implements feedforward neural networks with variable topology.
Each genome can have different numbers of hidden neurons and connections.

See docs/NEAT.md for technical details.
"""

import math
import random
from collections import deque
from typing import Literal, Optional

import torch

from app.schemas.neat import (
    ConnectionGene,
    InnovationCounter,
    NEATGenome,
    NeuronGene,
)


# Activation functions
def tanh(x: float) -> float:
    """Hyperbolic tangent activation."""
    return math.tanh(x)


def relu(x: float) -> float:
    """Rectified linear unit activation."""
    return max(0.0, x)


def sigmoid(x: float) -> float:
    """Sigmoid activation."""
    return 1.0 / (1.0 + math.exp(-max(-500, min(500, x))))  # Clamp to avoid overflow


ACTIVATIONS = {
    'tanh': tanh,
    'relu': relu,
    'sigmoid': sigmoid,
}


def create_minimal_neat_genome(
    input_size: int,
    output_size: int,
    output_bias: float = -0.5,
    activation: Literal['tanh', 'relu', 'sigmoid'] = 'tanh',
    innovation_counter: InnovationCounter | None = None,
) -> NEATGenome:
    """
    Create a minimal NEAT genome with Option B topology.

    Option B: All inputs connected directly to all outputs (no hidden neurons).
    This gives creatures basic functionality immediately while allowing
    evolution to add complexity as needed.

    Args:
        input_size: Number of input neurons (sensors)
        output_size: Number of output neurons (muscles)
        output_bias: Initial bias for output neurons (negative = harder to activate)
        activation: Activation function for hidden/output neurons
        innovation_counter: Optional counter for assigning innovation IDs

    Returns:
        NEATGenome with input_size inputs, output_size outputs, fully connected
    """
    neurons: list[NeuronGene] = []
    connections: list[ConnectionGene] = []

    # Create input neurons (IDs 0 to input_size-1)
    for i in range(input_size):
        neurons.append(NeuronGene(
            id=i,
            type='input',
            bias=0.0,  # Input neurons don't use bias
            innovation=None,  # Input neurons don't have innovation IDs
        ))

    # Create output neurons (IDs input_size to input_size+output_size-1)
    for i in range(output_size):
        neurons.append(NeuronGene(
            id=input_size + i,
            type='output',
            bias=output_bias,
            innovation=None,  # Output neurons don't have innovation IDs
        ))

    # Create connections from every input to every output (Option B)
    innovation = 0
    for input_id in range(input_size):
        for output_offset in range(output_size):
            output_id = input_size + output_offset

            # Get innovation ID from counter if provided, otherwise use sequential
            if innovation_counter is not None:
                inn_id = innovation_counter.get_connection_innovation(input_id, output_id)
            else:
                inn_id = innovation
                innovation += 1

            # Random initial weight in [-0.5, 0.5]
            weight = random.uniform(-0.5, 0.5)

            connections.append(ConnectionGene(
                from_node=input_id,
                to_node=output_id,
                weight=weight,
                enabled=True,
                innovation=inn_id,
            ))

    return NEATGenome(
        neurons=neurons,
        connections=connections,
        activation=activation,
    )


def topological_sort(genome: NEATGenome) -> list[int]:
    """
    Compute evaluation order for feedforward network.

    Returns neuron IDs in order such that each neuron is evaluated
    only after all neurons that feed into it have been evaluated.

    Input neurons are not included (they're set directly from inputs).

    Args:
        genome: NEAT genome to sort

    Returns:
        List of neuron IDs in evaluation order (inputs excluded)

    Raises:
        ValueError: If the network contains a cycle (shouldn't happen in feedforward)
    """
    # Build adjacency list (which neurons feed into which)
    # incoming[neuron_id] = set of neuron IDs that feed into it
    incoming: dict[int, set[int]] = {n.id: set() for n in genome.neurons}

    for conn in genome.connections:
        if conn.enabled:
            incoming[conn.to_node].add(conn.from_node)

    # Get input neuron IDs (they have no dependencies)
    input_ids = {n.id for n in genome.neurons if n.type == 'input'}

    # Kahn's algorithm for topological sort
    # Start with neurons that have no incoming connections OR only input connections
    in_degree: dict[int, int] = {}
    for neuron_id, sources in incoming.items():
        # Only count non-input sources as dependencies
        non_input_sources = sources - input_ids
        in_degree[neuron_id] = len(non_input_sources)

    # Queue starts with all neurons that only depend on inputs
    queue = deque([
        n.id for n in genome.neurons
        if n.type != 'input' and in_degree[n.id] == 0
    ])

    result: list[int] = []

    # Build reverse adjacency (which neurons does each neuron feed into)
    outgoing: dict[int, set[int]] = {n.id: set() for n in genome.neurons}
    for conn in genome.connections:
        if conn.enabled:
            outgoing[conn.from_node].add(conn.to_node)

    while queue:
        neuron_id = queue.popleft()
        result.append(neuron_id)

        # For each neuron this one feeds into, reduce in-degree
        for target_id in outgoing[neuron_id]:
            if target_id not in input_ids:  # Don't process inputs
                in_degree[target_id] -= 1
                if in_degree[target_id] == 0:
                    queue.append(target_id)

    # Check if we processed all non-input neurons
    non_input_count = sum(1 for n in genome.neurons if n.type != 'input')
    if len(result) != non_input_count:
        raise ValueError(
            f"Network contains a cycle! Processed {len(result)} of {non_input_count} non-input neurons"
        )

    return result


def neat_forward(
    genome: NEATGenome,
    inputs: list[float],
) -> list[float]:
    """
    Execute forward pass through a NEAT network.

    Args:
        genome: NEAT genome defining the network topology
        inputs: Input values (one per input neuron)

    Returns:
        Output values (one per output neuron, in neuron ID order)

    Raises:
        ValueError: If input size doesn't match number of input neurons
    """
    input_neurons = genome.get_input_neurons()
    output_neurons = genome.get_output_neurons()

    if len(inputs) != len(input_neurons):
        raise ValueError(
            f"Expected {len(input_neurons)} inputs, got {len(inputs)}"
        )

    # Get activation function
    activate = ACTIVATIONS.get(genome.activation, tanh)

    # Initialize neuron values
    neuron_values: dict[int, float] = {}

    # Set input values (sorted by ID to ensure consistent ordering)
    sorted_inputs = sorted(input_neurons, key=lambda n: n.id)
    for neuron, value in zip(sorted_inputs, inputs):
        neuron_values[neuron.id] = value

    # Build lookup for neuron biases
    neuron_bias: dict[int, float] = {n.id: n.bias for n in genome.neurons}

    # Build connection lookup: to_node -> list of (from_node, weight)
    incoming_connections: dict[int, list[tuple[int, float]]] = {
        n.id: [] for n in genome.neurons
    }
    for conn in genome.connections:
        if conn.enabled:
            incoming_connections[conn.to_node].append((conn.from_node, conn.weight))

    # Process neurons in topological order
    eval_order = topological_sort(genome)

    for neuron_id in eval_order:
        # Sum weighted inputs
        total = neuron_bias[neuron_id]
        for from_id, weight in incoming_connections[neuron_id]:
            total += neuron_values[from_id] * weight

        # Apply activation
        neuron_values[neuron_id] = activate(total)

    # Return output values (sorted by ID for consistent ordering)
    sorted_outputs = sorted(output_neurons, key=lambda n: n.id)
    return [neuron_values[n.id] for n in sorted_outputs]


def neat_forward_full(
    genome: NEATGenome,
    inputs: list[float],
) -> dict[str, list[float]]:
    """
    Execute forward pass and return all activations (for visualization).

    Args:
        genome: NEAT genome defining the network topology
        inputs: Input values (one per input neuron)

    Returns:
        Dictionary with 'inputs', 'hidden', 'outputs' activation lists
    """
    input_neurons = genome.get_input_neurons()
    hidden_neurons = genome.get_hidden_neurons()
    output_neurons = genome.get_output_neurons()

    if len(inputs) != len(input_neurons):
        raise ValueError(
            f"Expected {len(input_neurons)} inputs, got {len(inputs)}"
        )

    activate = ACTIVATIONS.get(genome.activation, tanh)
    neuron_values: dict[int, float] = {}

    # Set input values
    sorted_inputs = sorted(input_neurons, key=lambda n: n.id)
    for neuron, value in zip(sorted_inputs, inputs):
        neuron_values[neuron.id] = value

    neuron_bias: dict[int, float] = {n.id: n.bias for n in genome.neurons}

    incoming_connections: dict[int, list[tuple[int, float]]] = {
        n.id: [] for n in genome.neurons
    }
    for conn in genome.connections:
        if conn.enabled:
            incoming_connections[conn.to_node].append((conn.from_node, conn.weight))

    eval_order = topological_sort(genome)

    for neuron_id in eval_order:
        total = neuron_bias[neuron_id]
        for from_id, weight in incoming_connections[neuron_id]:
            total += neuron_values[from_id] * weight
        neuron_values[neuron_id] = activate(total)

    # Collect activations by type
    sorted_inputs = sorted(input_neurons, key=lambda n: n.id)
    sorted_hidden = sorted(hidden_neurons, key=lambda n: n.id)
    sorted_outputs = sorted(output_neurons, key=lambda n: n.id)

    return {
        'inputs': [neuron_values[n.id] for n in sorted_inputs],
        'hidden': [neuron_values[n.id] for n in sorted_hidden],
        'outputs': [neuron_values[n.id] for n in sorted_outputs],
    }


def would_create_cycle(
    genome: NEATGenome,
    from_neuron: int,
    to_neuron: int,
) -> bool:
    """
    Check if adding a connection would create a cycle.

    For feedforward networks, we need to ensure no cycles exist.
    A cycle would be created if there's already a path from to_neuron to from_neuron.

    Args:
        genome: Current genome
        from_neuron: Source neuron ID for proposed connection
        to_neuron: Target neuron ID for proposed connection

    Returns:
        True if adding this connection would create a cycle
    """
    # If from_neuron == to_neuron, that's a self-loop (cycle)
    if from_neuron == to_neuron:
        return True

    # Build adjacency list of current connections
    outgoing: dict[int, set[int]] = {n.id: set() for n in genome.neurons}
    for conn in genome.connections:
        if conn.enabled:
            outgoing[conn.from_node].add(conn.to_node)

    # BFS from to_neuron to see if we can reach from_neuron
    # If we can, adding from_neuron -> to_neuron would complete a cycle
    visited: set[int] = set()
    queue = deque([to_neuron])

    while queue:
        current = queue.popleft()
        if current == from_neuron:
            return True  # Found path from to_neuron to from_neuron

        if current in visited:
            continue
        visited.add(current)

        # Add all neurons this one connects to
        for target in outgoing.get(current, set()):
            if target not in visited:
                queue.append(target)

    return False


def get_network_depth(genome: NEATGenome) -> int:
    """
    Calculate the depth (longest path) of the network.

    Useful for visualization - arranging neurons in layers.

    Returns:
        Maximum path length from any input to any output
    """
    input_ids = {n.id for n in genome.neurons if n.type == 'input'}

    # Build adjacency
    outgoing: dict[int, set[int]] = {n.id: set() for n in genome.neurons}
    for conn in genome.connections:
        if conn.enabled:
            outgoing[conn.from_node].add(conn.to_node)

    # BFS from inputs, tracking depth
    depth: dict[int, int] = {n_id: 0 for n_id in input_ids}
    queue = deque(input_ids)

    while queue:
        current = queue.popleft()
        current_depth = depth[current]

        for target in outgoing.get(current, set()):
            new_depth = current_depth + 1
            if target not in depth or new_depth > depth[target]:
                depth[target] = new_depth
                queue.append(target)

    # Return max depth (or 1 if only inputs exist)
    return max(depth.values()) if depth else 1


def get_neuron_depths(genome: NEATGenome) -> dict[int, int]:
    """
    Calculate depth for each neuron (for visualization layout).

    Input neurons have depth 0, output neurons have max depth.
    Hidden neurons are placed based on their longest path from inputs.

    Returns:
        Dictionary mapping neuron ID to depth
    """
    input_ids = {n.id for n in genome.neurons if n.type == 'input'}
    output_ids = {n.id for n in genome.neurons if n.type == 'output'}

    outgoing: dict[int, set[int]] = {n.id: set() for n in genome.neurons}
    for conn in genome.connections:
        if conn.enabled:
            outgoing[conn.from_node].add(conn.to_node)

    # BFS from inputs
    depth: dict[int, int] = {n_id: 0 for n_id in input_ids}
    queue = deque(input_ids)

    while queue:
        current = queue.popleft()
        current_depth = depth[current]

        for target in outgoing.get(current, set()):
            new_depth = current_depth + 1
            if target not in depth or new_depth > depth[target]:
                depth[target] = new_depth
                queue.append(target)

    # Ensure all outputs have the same (max) depth
    max_depth = max(depth.values()) if depth else 1
    for output_id in output_ids:
        depth[output_id] = max_depth

    # Any neuron not reached gets depth 0 (disconnected)
    for neuron in genome.neurons:
        if neuron.id not in depth:
            depth[neuron.id] = 0

    return depth


class NEATBatchedNetwork:
    """
    Wrapper for NEAT genomes that provides BatchedNeuralNetwork-compatible interface.

    Since NEAT networks have variable topology, we can't use true tensor batching.
    Instead, this class iterates over genomes and collects results into tensors.

    Implements the same interface as BatchedNeuralNetwork:
    - forward(inputs) -> [B, max_muscles]
    - forward_full(inputs) -> dict with inputs, hidden, outputs
    - forward_with_dead_zone(inputs, dead_zone) -> [B, max_muscles]
    - forward_full_with_dead_zone(inputs, dead_zone) -> dict
    """

    def __init__(
        self,
        genomes: list[NEATGenome],
        num_muscles: list[int],
        max_muscles: int = 15,
        max_hidden: int = 64,
        device: Optional[torch.device] = None,
    ):
        """
        Initialize NEAT batched network.

        Args:
            genomes: List of NEATGenome objects
            num_muscles: Number of muscles per creature (for output padding)
            max_muscles: Maximum muscles (for output tensor size)
            max_hidden: Maximum hidden neurons (for hidden tensor size)
            device: Torch device
        """
        self.genomes = genomes
        self.num_muscles = num_muscles
        self.max_muscles = max_muscles
        self.max_hidden = max_hidden
        self.device = device or torch.device('cpu')
        self.batch_size = len(genomes)

    @torch.no_grad()
    def forward(self, inputs: torch.Tensor) -> torch.Tensor:
        """
        Forward pass through all NEAT networks.

        Args:
            inputs: [B, input_size] sensor inputs for each creature

        Returns:
            outputs: [B, max_muscles] neural network outputs in [-1, 1] range
        """
        outputs = torch.zeros(self.batch_size, self.max_muscles, device=self.device)

        for i, genome in enumerate(self.genomes):
            input_list = inputs[i].cpu().tolist()
            output_list = neat_forward(genome, input_list)

            # Pad/truncate outputs to match num_muscles for this creature
            n_out = min(len(output_list), self.num_muscles[i])
            for j in range(n_out):
                outputs[i, j] = output_list[j]

        return outputs

    @torch.no_grad()
    def forward_full(self, inputs: torch.Tensor) -> dict:
        """
        Forward pass returning full activation data for visualization.

        Args:
            inputs: [B, input_size] sensor inputs for each creature

        Returns:
            dict with:
                - 'inputs': [B, input_size] the input tensor
                - 'hidden': [B, max_hidden] hidden layer activations (padded)
                - 'outputs': [B, max_muscles] output layer activations
        """
        input_size = inputs.shape[1]
        outputs = torch.zeros(self.batch_size, self.max_muscles, device=self.device)
        hidden = torch.zeros(self.batch_size, self.max_hidden, device=self.device)

        for i, genome in enumerate(self.genomes):
            input_list = inputs[i].cpu().tolist()
            result = neat_forward_full(genome, input_list)

            # Copy hidden activations (padded to max_hidden)
            for j, h_val in enumerate(result['hidden'][:self.max_hidden]):
                hidden[i, j] = h_val

            # Copy outputs (padded to num_muscles)
            n_out = min(len(result['outputs']), self.num_muscles[i])
            for j in range(n_out):
                outputs[i, j] = result['outputs'][j]

        return {
            'inputs': inputs,
            'hidden': hidden,
            'outputs': outputs,
        }

    @torch.no_grad()
    def forward_with_dead_zone(self, inputs: torch.Tensor, dead_zone: float = 0.1) -> torch.Tensor:
        """
        Forward pass with dead zone applied (pure mode).

        Small outputs (abs < dead_zone) are zeroed out.
        """
        output = self.forward(inputs)

        if dead_zone > 0:
            mask = torch.abs(output) < dead_zone
            output = output.masked_fill(mask, 0.0)

        return output

    @torch.no_grad()
    def forward_full_with_dead_zone(self, inputs: torch.Tensor, dead_zone: float = 0.1) -> dict:
        """
        Forward pass with dead zone applied, returning full activations (pure mode).

        Returns:
            dict with 'inputs', 'hidden', 'outputs', 'outputs_raw'
        """
        result = self.forward_full(inputs)

        # Store raw outputs before dead zone
        result['outputs_raw'] = result['outputs'].clone()

        if dead_zone > 0:
            mask = torch.abs(result['outputs']) < dead_zone
            result['outputs'] = result['outputs'].masked_fill(mask, 0.0)

        return result

    @classmethod
    def from_genome_dicts(
        cls,
        neat_genomes: list[dict],
        num_muscles: list[int],
        max_muscles: int = 15,
        max_hidden: int = 64,
        device: Optional[torch.device] = None,
    ) -> "NEATBatchedNetwork":
        """
        Create NEATBatchedNetwork from genome dicts (from API).

        Args:
            neat_genomes: List of NEAT genome dicts
            num_muscles: Number of muscles per creature
            max_muscles: Maximum muscles
            max_hidden: Maximum hidden neurons
            device: Torch device
        """
        genomes = [NEATGenome(**g) for g in neat_genomes]
        return cls(genomes, num_muscles, max_muscles, max_hidden, device)

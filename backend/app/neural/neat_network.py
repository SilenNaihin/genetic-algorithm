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

import numpy as np
import torch

from app.schemas.neat import (
    ConnectionGene,
    InnovationCounter,
    NEATGenome,
    NeuronGene,
)

# Try to import Numba for accelerated forward pass
try:
    from numba import njit, prange
    HAS_NUMBA = True
except ImportError:
    HAS_NUMBA = False
    # Create no-op decorators if numba not available
    def njit(*args, **kwargs):
        def decorator(func):
            return func
        return decorator if not args else decorator(args[0])
    def prange(*args):
        return range(*args)


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

# Numba activation function codes (for JIT compilation)
ACTIVATION_TANH = 0
ACTIVATION_RELU = 1
ACTIVATION_SIGMOID = 2


# =============================================================================
# Numba JIT-compiled forward pass functions
# These provide significant speedup (3-6x) for NEAT network evaluation
# =============================================================================

@njit
def _numba_forward_single(
    inputs: np.ndarray,
    n_neurons: int,
    biases: np.ndarray,
    conn_starts: np.ndarray,
    conn_from: np.ndarray,
    conn_weights: np.ndarray,
    eval_order: np.ndarray,
    n_eval: int,
    input_indices: np.ndarray,
    n_inputs: int,
    output_indices: np.ndarray,
    n_outputs: int,
    bias_indices: np.ndarray,
    n_bias: int,
    activation_code: int,
    max_neurons: int,
) -> np.ndarray:
    """
    Numba-compiled forward pass for a single NEAT network.

    Returns array of output values.
    """
    values = np.zeros(max_neurons)

    # Set bias neurons to 1.0
    for i in range(n_bias):
        values[bias_indices[i]] = 1.0

    # Set input values
    for i in range(n_inputs):
        values[input_indices[i]] = inputs[i]

    # Process neurons in topological order
    for e in range(n_eval):
        neuron_idx = eval_order[e]
        start = conn_starts[neuron_idx]
        end = conn_starts[neuron_idx + 1]
        total = biases[neuron_idx]
        for j in range(start, end):
            total += values[conn_from[j]] * conn_weights[j]

        # Apply activation
        if activation_code == ACTIVATION_TANH:
            values[neuron_idx] = np.tanh(total)
        elif activation_code == ACTIVATION_RELU:
            values[neuron_idx] = max(0.0, total)
        else:  # sigmoid
            clamped = max(-500.0, min(500.0, total))
            values[neuron_idx] = 1.0 / (1.0 + np.exp(-clamped))

    # Extract outputs
    outputs = np.zeros(n_outputs)
    for i in range(n_outputs):
        outputs[i] = values[output_indices[i]]
    return outputs


@njit(parallel=True)
def _numba_forward_batch_parallel(
    inputs_batch: np.ndarray,
    n_neurons: np.ndarray,
    biases: np.ndarray,
    conn_starts: np.ndarray,
    conn_from: np.ndarray,
    conn_weights: np.ndarray,
    eval_order: np.ndarray,
    n_eval: np.ndarray,
    input_indices: np.ndarray,
    n_inputs: np.ndarray,
    output_indices: np.ndarray,
    n_outputs: np.ndarray,
    bias_indices: np.ndarray,
    n_bias: np.ndarray,
    activation_codes: np.ndarray,
    max_neurons: int,
    max_outputs: int,
) -> np.ndarray:
    """
    Numba-compiled parallel forward pass for a batch of NEAT networks.

    Uses prange for parallel execution across creatures.
    Provides ~5-6x speedup for batch sizes >= 500.
    """
    batch_size = inputs_batch.shape[0]
    all_outputs = np.zeros((batch_size, max_outputs))

    for g_idx in prange(batch_size):
        values = np.zeros(max_neurons)

        # Set bias neurons to 1.0
        for i in range(n_bias[g_idx]):
            values[bias_indices[g_idx, i]] = 1.0

        # Set input values
        for i in range(n_inputs[g_idx]):
            values[input_indices[g_idx, i]] = inputs_batch[g_idx, i]

        # Process neurons in topological order
        activation_code = activation_codes[g_idx]
        for e in range(n_eval[g_idx]):
            neuron_idx = eval_order[g_idx, e]
            start = conn_starts[g_idx, neuron_idx]
            end = conn_starts[g_idx, neuron_idx + 1]
            total = biases[g_idx, neuron_idx]
            for j in range(start, end):
                total += values[conn_from[g_idx, j]] * conn_weights[g_idx, j]

            # Apply activation
            if activation_code == ACTIVATION_TANH:
                values[neuron_idx] = np.tanh(total)
            elif activation_code == ACTIVATION_RELU:
                values[neuron_idx] = max(0.0, total)
            else:  # sigmoid
                clamped = max(-500.0, min(500.0, total))
                values[neuron_idx] = 1.0 / (1.0 + np.exp(-clamped))

        # Extract outputs
        for i in range(n_outputs[g_idx]):
            all_outputs[g_idx, i] = values[output_indices[g_idx, i]]

    return all_outputs


@njit
def _numba_forward_batch_sequential(
    inputs_batch: np.ndarray,
    n_neurons: np.ndarray,
    biases: np.ndarray,
    conn_starts: np.ndarray,
    conn_from: np.ndarray,
    conn_weights: np.ndarray,
    eval_order: np.ndarray,
    n_eval: np.ndarray,
    input_indices: np.ndarray,
    n_inputs: np.ndarray,
    output_indices: np.ndarray,
    n_outputs: np.ndarray,
    bias_indices: np.ndarray,
    n_bias: np.ndarray,
    activation_codes: np.ndarray,
    max_neurons: int,
    max_outputs: int,
) -> np.ndarray:
    """
    Numba-compiled sequential forward pass for a batch of NEAT networks.

    Same as parallel version but without prange.
    Used for small batches where parallel overhead exceeds benefit.
    """
    batch_size = inputs_batch.shape[0]
    all_outputs = np.zeros((batch_size, max_outputs))

    for g_idx in range(batch_size):
        values = np.zeros(max_neurons)

        for i in range(n_bias[g_idx]):
            values[bias_indices[g_idx, i]] = 1.0

        for i in range(n_inputs[g_idx]):
            values[input_indices[g_idx, i]] = inputs_batch[g_idx, i]

        activation_code = activation_codes[g_idx]
        for e in range(n_eval[g_idx]):
            neuron_idx = eval_order[g_idx, e]
            start = conn_starts[g_idx, neuron_idx]
            end = conn_starts[g_idx, neuron_idx + 1]
            total = biases[g_idx, neuron_idx]
            for j in range(start, end):
                total += values[conn_from[g_idx, j]] * conn_weights[g_idx, j]

            if activation_code == ACTIVATION_TANH:
                values[neuron_idx] = np.tanh(total)
            elif activation_code == ACTIVATION_RELU:
                values[neuron_idx] = max(0.0, total)
            else:
                clamped = max(-500.0, min(500.0, total))
                values[neuron_idx] = 1.0 / (1.0 + np.exp(-clamped))

        for i in range(n_outputs[g_idx]):
            all_outputs[g_idx, i] = values[output_indices[g_idx, i]]

    return all_outputs


def create_minimal_neat_genome(
    input_size: int,
    output_size: int,
    output_bias: float = -0.5,
    activation: Literal['tanh', 'relu', 'sigmoid'] = 'tanh',
    innovation_counter: InnovationCounter | None = None,
    bias_mode: Literal['none', 'node', 'bias_node'] = 'node',
    connectivity: Literal['full', 'sparse', 'sparse_inputs', 'sparse_outputs', 'none'] = 'full',
) -> NEATGenome:
    """
    Create a minimal NEAT genome with configurable initial connectivity.

    Args:
        input_size: Number of input neurons (sensors)
        output_size: Number of output neurons (muscles)
        output_bias: Initial bias for output neurons (negative = harder to activate)
        activation: Activation function for hidden/output neurons
        innovation_counter: Optional counter for assigning innovation IDs
        bias_mode: How biases are implemented:
            - 'none': No biases
            - 'node': Per-node bias attributes (default)
            - 'bias_node': Special input neuron always=1.0 (original NEAT style)
        connectivity: Initial network connectivity:
            - 'full': All inputs connected to all outputs (standard NEAT)
            - 'sparse_inputs': Each input connects to one random output (total = input_size)
            - 'sparse_outputs': Each output gets one random input (total = output_size)
            - 'sparse': Alias for 'sparse_outputs' (backwards compatibility)
            - 'none': No initial connections (topology emerges from evolution)

    Returns:
        NEATGenome with specified connectivity pattern
    """
    neurons: list[NeuronGene] = []
    connections: list[ConnectionGene] = []

    # For bias_node mode, reserve ID 0 for the bias neuron
    # Regular inputs start at ID 1
    bias_node_id = 0 if bias_mode == 'bias_node' else None
    input_start_id = 1 if bias_mode == 'bias_node' else 0

    # Create bias neuron if using bias_node mode
    if bias_mode == 'bias_node':
        neurons.append(NeuronGene(
            id=bias_node_id,
            type='bias',  # Special type for bias node
            bias=0.0,
            innovation=None,
        ))

    # Create input neurons
    for i in range(input_size):
        neurons.append(NeuronGene(
            id=input_start_id + i,
            type='input',
            bias=0.0,  # Input neurons don't use bias
            innovation=None,
        ))

    # Output neurons start after inputs (and bias node if present)
    output_start_id = input_start_id + input_size

    # Create output neurons
    for i in range(output_size):
        neurons.append(NeuronGene(
            id=output_start_id + i,
            type='output',
            # Use node bias only if bias_mode is 'node', else 0
            bias=output_bias if bias_mode == 'node' else 0.0,
            innovation=None,
        ))

    # Create connections based on connectivity mode
    innovation = 0

    if connectivity == 'full':
        # Full connectivity: every input to every output (standard NEAT)
        for i in range(input_size):
            input_id = input_start_id + i
            for output_offset in range(output_size):
                output_id = output_start_id + output_offset

                if innovation_counter is not None:
                    inn_id = innovation_counter.get_connection_innovation(input_id, output_id)
                else:
                    inn_id = innovation
                    innovation += 1

                weight = random.uniform(-0.5, 0.5)

                connections.append(ConnectionGene(
                    from_node=input_id,
                    to_node=output_id,
                    weight=weight,
                    enabled=True,
                    innovation=inn_id,
                ))

    elif connectivity in ('sparse', 'sparse_outputs'):
        # Sparse outputs: each output gets exactly one random input
        # Total connections = output_size (inputs may be reused)
        for output_offset in range(output_size):
            output_id = output_start_id + output_offset
            # Pick a random input for this output
            input_id = input_start_id + random.randint(0, input_size - 1)

            if innovation_counter is not None:
                inn_id = innovation_counter.get_connection_innovation(input_id, output_id)
            else:
                inn_id = innovation
                innovation += 1

            weight = random.uniform(-0.5, 0.5)

            connections.append(ConnectionGene(
                from_node=input_id,
                to_node=output_id,
                weight=weight,
                enabled=True,
                innovation=inn_id,
            ))

    elif connectivity == 'sparse_inputs':
        # Sparse inputs: each input connects to exactly one random output
        # Total connections = input_size (outputs may have multiple or none)
        for i in range(input_size):
            input_id = input_start_id + i
            # Pick a random output for this input
            output_id = output_start_id + random.randint(0, output_size - 1)

            if innovation_counter is not None:
                inn_id = innovation_counter.get_connection_innovation(input_id, output_id)
            else:
                inn_id = innovation
                innovation += 1

            weight = random.uniform(-0.5, 0.5)

            connections.append(ConnectionGene(
                from_node=input_id,
                to_node=output_id,
                weight=weight,
                enabled=True,
                innovation=inn_id,
            ))

    # connectivity == 'none': no connections, topology emerges from evolution

    # Create connections from bias node to all outputs (bias_node mode)
    if bias_mode == 'bias_node':
        for output_offset in range(output_size):
            output_id = output_start_id + output_offset

            if innovation_counter is not None:
                inn_id = innovation_counter.get_connection_innovation(bias_node_id, output_id)
            else:
                inn_id = innovation
                innovation += 1

            # Initial bias weight (replaces the output_bias attribute)
            connections.append(ConnectionGene(
                from_node=bias_node_id,
                to_node=output_id,
                weight=output_bias,
                enabled=True,
                innovation=inn_id,
            ))

    return NEATGenome(
        neurons=neurons,
        connections=connections,
        activation=activation,
    )


def adapt_neat_topology(
    genome: NEATGenome,
    target_output_count: int,
    removed_indices: list[int] | None = None,
    output_bias: float = -0.5,
    innovation_counter: InnovationCounter | None = None,
) -> NEATGenome:
    """
    Adapt NEAT genome when muscle count changes.

    - If muscles added: adds new output neurons with sparse initial connections
    - If muscles removed: removes outputs at specific indices (from mutation)
      or removes highest-numbered outputs (fallback for crossover)

    This ensures the NEAT genome always matches the creature's actual muscle count,
    preventing wasted evolution effort on non-existent outputs.

    Args:
        genome: NEAT genome to adapt
        target_output_count: Desired number of output neurons (= muscle count)
        removed_indices: Specific muscle indices that were removed (for correct output removal).
            If provided, removes outputs at these indices. If None, falls back to
            count-based removal (highest IDs removed).
        output_bias: Initial bias for new output neurons
        innovation_counter: Optional counter for new connection innovations

    Returns:
        Adapted genome (new instance, original not modified)
    """
    from copy import deepcopy

    current_outputs = [n for n in genome.neurons if n.type == 'output']
    current_count = len(current_outputs)

    if current_count == target_output_count and not removed_indices:
        return genome  # No change needed

    # Deep copy to avoid modifying original
    adapted = deepcopy(genome)

    # Handle specific index removal (from mutation)
    if removed_indices:
        # Sort outputs by ID to establish index mapping
        outputs_sorted = sorted(
            [n for n in adapted.neurons if n.type == 'output'],
            key=lambda n: n.id
        )

        # Find output IDs to remove (by index)
        # Only valid indices: 0 <= idx < len(outputs_sorted)
        outputs_to_remove = set()
        for idx in removed_indices:
            if 0 <= idx < len(outputs_sorted):
                outputs_to_remove.add(outputs_sorted[idx].id)

        # Remove neurons and their connections
        adapted.neurons = [n for n in adapted.neurons if n.id not in outputs_to_remove]
        adapted.connections = [
            c for c in adapted.connections
            if c.from_node not in outputs_to_remove and c.to_node not in outputs_to_remove
        ]

        # Update current count after removal
        current_outputs = [n for n in adapted.neurons if n.type == 'output']
        current_count = len(current_outputs)

    if target_output_count > current_count:
        # Need to add output neurons
        # Find the max neuron ID to assign new IDs
        max_id = max(n.id for n in adapted.neurons)

        # Find input/bias neurons to connect new outputs to
        sources = [n for n in adapted.neurons if n.type in ('input', 'bias')]
        if not sources:
            sources = [n for n in adapted.neurons if n.type == 'input']

        # Determine bias_mode from existing genome
        has_bias_node = any(n.type == 'bias' for n in adapted.neurons)
        bias_node = next((n for n in adapted.neurons if n.type == 'bias'), None)

        # Track next innovation ID
        innovation = max((c.innovation for c in adapted.connections), default=0) + 1

        for i in range(target_output_count - current_count):
            new_id = max_id + 1 + i

            # Create new output neuron
            # Use node bias only if NOT using bias_node mode
            new_neuron = NeuronGene(
                id=new_id,
                type='output',
                bias=output_bias if not has_bias_node else 0.0,
                innovation=None,
            )
            adapted.neurons.append(new_neuron)

            # Add connection from random input to new output
            if sources:
                source = random.choice(sources)
                if innovation_counter is not None:
                    inn_id = innovation_counter.get_connection_innovation(source.id, new_id)
                else:
                    inn_id = innovation
                    innovation += 1

                adapted.connections.append(ConnectionGene(
                    from_node=source.id,
                    to_node=new_id,
                    weight=random.uniform(-0.5, 0.5),
                    enabled=True,
                    innovation=inn_id,
                ))

            # Add bias connection if using bias_node mode
            # Only add if we didn't already pick bias_node as the random source
            if bias_node is not None and (not sources or source.id != bias_node.id):
                if innovation_counter is not None:
                    inn_id = innovation_counter.get_connection_innovation(bias_node.id, new_id)
                else:
                    inn_id = innovation
                    innovation += 1

                adapted.connections.append(ConnectionGene(
                    from_node=bias_node.id,
                    to_node=new_id,
                    weight=output_bias,
                    enabled=True,
                    innovation=inn_id,
                ))

    elif target_output_count < current_count:
        # Still have too many outputs - do count-based removal
        # This handles:
        # 1. No removed_indices provided (crossover adaptation)
        # 2. removed_indices provided but all invalid (e.g., [999999])
        # 3. removed_indices didn't remove enough (mismatch scenario)
        #
        # Sort outputs by ID to remove the highest-numbered ones
        # (preserves the original outputs that were evolved)
        current_outputs = [n for n in adapted.neurons if n.type == 'output']
        output_ids_sorted = sorted(n.id for n in current_outputs)
        outputs_to_remove = set(output_ids_sorted[target_output_count:])

        # Remove excess output neurons
        adapted.neurons = [n for n in adapted.neurons if n.id not in outputs_to_remove]

        # Remove connections to/from removed outputs
        adapted.connections = [
            c for c in adapted.connections
            if c.from_node not in outputs_to_remove and c.to_node not in outputs_to_remove
        ]

    return adapted


def topological_sort(genome: NEATGenome) -> list[int]:
    """
    Compute evaluation order for feedforward network.

    Returns neuron IDs in order such that each neuron is evaluated
    only after all neurons that feed into it have been evaluated.

    Input and bias neurons are not included (they're set directly).

    Args:
        genome: NEAT genome to sort

    Returns:
        List of neuron IDs in evaluation order (inputs/bias excluded)

    Raises:
        ValueError: If the network contains a cycle (shouldn't happen in feedforward)
    """
    # Build adjacency list (which neurons feed into which)
    # incoming[neuron_id] = set of neuron IDs that feed into it
    incoming: dict[int, set[int]] = {n.id: set() for n in genome.neurons}

    for conn in genome.connections:
        if conn.enabled:
            incoming[conn.to_node].add(conn.from_node)

    # Get input and bias neuron IDs (they have no dependencies, values set directly)
    input_ids = {n.id for n in genome.neurons if n.type in ('input', 'bias')}

    # Kahn's algorithm for topological sort
    # Start with neurons that have no incoming connections OR only input connections
    in_degree: dict[int, int] = {}
    for neuron_id, sources in incoming.items():
        # Only count non-input sources as dependencies
        non_input_sources = sources - input_ids
        in_degree[neuron_id] = len(non_input_sources)

    # Queue starts with all neurons that only depend on inputs/bias
    # Exclude input and bias neurons (they're set directly, not evaluated)
    queue = deque([
        n.id for n in genome.neurons
        if n.type not in ('input', 'bias') and in_degree[n.id] == 0
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

    # Check if we processed all non-input/non-bias neurons
    non_input_count = sum(1 for n in genome.neurons if n.type not in ('input', 'bias'))
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
        inputs: Input values (one per input neuron, NOT including bias neuron)

    Returns:
        Output values (one per output neuron, in neuron ID order)

    Raises:
        ValueError: If input size doesn't match number of input neurons
    """
    input_neurons = genome.get_input_neurons()
    output_neurons = genome.get_output_neurons()
    bias_neurons = [n for n in genome.neurons if n.type == 'bias']

    if len(inputs) != len(input_neurons):
        raise ValueError(
            f"Expected {len(input_neurons)} inputs, got {len(inputs)}"
        )

    # Get activation function
    activate = ACTIVATIONS.get(genome.activation, tanh)

    # Initialize neuron values
    neuron_values: dict[int, float] = {}

    # Set bias neuron values (always 1.0)
    for bias_neuron in bias_neurons:
        neuron_values[bias_neuron.id] = 1.0

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
        inputs: Input values (one per input neuron, NOT including bias neuron)

    Returns:
        Dictionary with 'inputs', 'hidden', 'outputs' activation lists
    """
    input_neurons = genome.get_input_neurons()
    hidden_neurons = genome.get_hidden_neurons()
    output_neurons = genome.get_output_neurons()
    bias_neurons = [n for n in genome.neurons if n.type == 'bias']

    if len(inputs) != len(input_neurons):
        raise ValueError(
            f"Expected {len(input_neurons)} inputs, got {len(inputs)}"
        )

    activate = ACTIVATIONS.get(genome.activation, tanh)
    neuron_values: dict[int, float] = {}

    # Set bias neuron values (always 1.0)
    for bias_neuron in bias_neurons:
        neuron_values[bias_neuron.id] = 1.0

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
    input_ids = {n.id for n in genome.neurons if n.type in ('input', 'bias')}

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
    input_ids = {n.id for n in genome.neurons if n.type in ('input', 'bias')}
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

    Performance optimizations:
    - Topological sort is cached per genome (not recomputed every forward pass)
    - Incoming connections and biases are pre-computed as lookup structures
    - Batch CPU transfer: all inputs converted at once instead of per-creature
    - Numba JIT compilation: 3x speedup for sequential, 5-6x for parallel (batch >= 300)
    """

    # Threshold for using parallel Numba (below this, sequential is faster)
    NUMBA_PARALLEL_THRESHOLD = 300

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

        # Pre-compute and cache network structures for each genome
        # This avoids recomputing topological_sort and building lookups every forward pass
        self._cached_structures: list[dict] = []
        for genome in genomes:
            self._cached_structures.append(self._precompute_structure(genome))

        # Build Numba-compatible packed arrays if Numba is available
        self._use_numba = HAS_NUMBA and self.batch_size > 0
        self._numba_compiled = False  # Track if JIT compilation has happened
        if self._use_numba:
            self._build_numba_arrays()

    def _precompute_structure(self, genome: NEATGenome) -> dict:
        """
        Pre-compute all static structures needed for forward pass.

        Returns dict with:
        - eval_order: topological sort (list of neuron IDs)
        - input_ids: sorted list of input neuron IDs
        - output_ids: sorted list of output neuron IDs
        - hidden_ids: sorted list of hidden neuron IDs
        - bias_ids: list of bias neuron IDs
        - neuron_bias: dict mapping neuron_id -> bias value
        - incoming: dict mapping neuron_id -> list of (from_id, weight)
        - activation: activation function
        """
        input_neurons = sorted(genome.get_input_neurons(), key=lambda n: n.id)
        output_neurons = sorted(genome.get_output_neurons(), key=lambda n: n.id)
        hidden_neurons = sorted(genome.get_hidden_neurons(), key=lambda n: n.id)
        bias_neurons = [n for n in genome.neurons if n.type == 'bias']

        # Topological sort (cached - this is expensive to recompute)
        eval_order = topological_sort(genome)

        # Neuron biases
        neuron_bias = {n.id: n.bias for n in genome.neurons}

        # Incoming connections lookup
        incoming: dict[int, list[tuple[int, float]]] = {n.id: [] for n in genome.neurons}
        for conn in genome.connections:
            if conn.enabled:
                incoming[conn.to_node].append((conn.from_node, conn.weight))

        # Get activation function
        activation = ACTIVATIONS.get(genome.activation, tanh)

        return {
            'eval_order': eval_order,
            'input_ids': [n.id for n in input_neurons],
            'output_ids': [n.id for n in output_neurons],
            'hidden_ids': [n.id for n in hidden_neurons],
            'bias_ids': [n.id for n in bias_neurons],
            'neuron_bias': neuron_bias,
            'incoming': incoming,
            'activation': activation,
        }

    def _build_numba_arrays(self) -> None:
        """
        Build packed numpy arrays for Numba-accelerated forward pass.

        Creates contiguous arrays that can be efficiently processed by JIT-compiled code.
        """
        if self.batch_size == 0:
            return

        # Find maximum dimensions across all genomes
        max_neurons = 0
        max_conns = 0
        max_inputs = 0
        max_outputs = 0
        max_bias = 0
        max_eval = 0

        for cache in self._cached_structures:
            # Count neurons from the ID mappings
            all_ids = set(cache['input_ids']) | set(cache['output_ids']) | \
                      set(cache['hidden_ids']) | set(cache['bias_ids'])
            max_neurons = max(max_neurons, len(all_ids))

            # Count connections
            n_conns = sum(len(conns) for conns in cache['incoming'].values())
            max_conns = max(max_conns, n_conns)

            max_inputs = max(max_inputs, len(cache['input_ids']))
            max_outputs = max(max_outputs, len(cache['output_ids']))
            max_bias = max(max_bias, len(cache['bias_ids']))
            max_eval = max(max_eval, len(cache['eval_order']))

        # Ensure we have at least 1 for each dimension to avoid empty arrays
        max_neurons = max(max_neurons, 1)
        max_conns = max(max_conns, 1)
        max_inputs = max(max_inputs, 1)
        max_outputs = max(max_outputs, 1)
        max_bias = max(max_bias, 1)
        max_eval = max(max_eval, 1)

        n = self.batch_size

        # Allocate packed arrays
        self._nb_n_neurons = np.zeros(n, dtype=np.int32)
        self._nb_n_eval = np.zeros(n, dtype=np.int32)
        self._nb_n_inputs = np.zeros(n, dtype=np.int32)
        self._nb_n_outputs = np.zeros(n, dtype=np.int32)
        self._nb_n_bias = np.zeros(n, dtype=np.int32)
        self._nb_activation_codes = np.zeros(n, dtype=np.int32)

        self._nb_biases = np.zeros((n, max_neurons), dtype=np.float64)
        self._nb_conn_starts = np.zeros((n, max_neurons + 1), dtype=np.int32)
        self._nb_conn_from = np.zeros((n, max_conns), dtype=np.int32)
        self._nb_conn_weights = np.zeros((n, max_conns), dtype=np.float64)
        self._nb_eval_order = np.zeros((n, max_eval), dtype=np.int32)
        self._nb_input_indices = np.zeros((n, max_inputs), dtype=np.int32)
        self._nb_output_indices = np.zeros((n, max_outputs), dtype=np.int32)
        self._nb_bias_indices = np.zeros((n, max_bias), dtype=np.int32)

        self._nb_max_neurons = max_neurons
        self._nb_max_outputs = max_outputs

        # Fill arrays for each genome
        for g_idx, cache in enumerate(self._cached_structures):
            # Build ID to index mapping for this genome
            all_ids = sorted(set(
                cache['input_ids'] + cache['output_ids'] +
                cache['hidden_ids'] + cache['bias_ids']
            ))
            id_to_idx = {nid: idx for idx, nid in enumerate(all_ids)}
            nn = len(all_ids)

            # Sanity check: nn should never exceed max_neurons
            if nn > max_neurons:
                raise ValueError(
                    f"Genome {g_idx} has {nn} neurons but max_neurons={max_neurons}. "
                    f"This indicates a bug in max_neurons computation. "
                    f"input_ids={len(cache['input_ids'])}, output_ids={len(cache['output_ids'])}, "
                    f"hidden_ids={len(cache['hidden_ids'])}, bias_ids={len(cache['bias_ids'])}"
                )

            self._nb_n_neurons[g_idx] = nn
            self._nb_n_eval[g_idx] = len(cache['eval_order'])
            self._nb_n_inputs[g_idx] = len(cache['input_ids'])
            self._nb_n_outputs[g_idx] = len(cache['output_ids'])
            self._nb_n_bias[g_idx] = len(cache['bias_ids'])

            # Activation code
            activation_func = cache['activation']
            if activation_func == tanh:
                self._nb_activation_codes[g_idx] = ACTIVATION_TANH
            elif activation_func == relu:
                self._nb_activation_codes[g_idx] = ACTIVATION_RELU
            else:
                self._nb_activation_codes[g_idx] = ACTIVATION_SIGMOID

            # Biases
            for nid, bias in cache['neuron_bias'].items():
                if nid in id_to_idx:
                    self._nb_biases[g_idx, id_to_idx[nid]] = bias

            # Connections in CSR-like format
            conn_idx = 0
            for i, nid in enumerate(all_ids):
                self._nb_conn_starts[g_idx, i] = conn_idx
                for from_id, weight in cache['incoming'].get(nid, []):
                    self._nb_conn_from[g_idx, conn_idx] = id_to_idx[from_id]
                    self._nb_conn_weights[g_idx, conn_idx] = weight
                    conn_idx += 1
            self._nb_conn_starts[g_idx, nn] = conn_idx

            # Evaluation order
            for i, nid in enumerate(cache['eval_order']):
                idx = id_to_idx.get(nid)
                if idx is None:
                    raise ValueError(
                        f"Genome {g_idx}: eval_order contains neuron {nid} not in id_to_idx. "
                        f"all_ids={all_ids}, eval_order={cache['eval_order']}"
                    )
                if idx >= max_neurons:
                    raise ValueError(
                        f"Genome {g_idx}: neuron {nid} has index {idx} >= max_neurons {max_neurons}"
                    )
                self._nb_eval_order[g_idx, i] = idx

            # Input/output/bias indices
            for i, nid in enumerate(cache['input_ids']):
                self._nb_input_indices[g_idx, i] = id_to_idx[nid]
            for i, nid in enumerate(cache['output_ids']):
                self._nb_output_indices[g_idx, i] = id_to_idx[nid]
            for i, nid in enumerate(cache['bias_ids']):
                self._nb_bias_indices[g_idx, i] = id_to_idx[nid]

    def _forward_numba(self, inputs_cpu: np.ndarray) -> np.ndarray:
        """
        Execute forward pass using Numba JIT-compiled functions.

        Args:
            inputs_cpu: [B, input_size] numpy array of inputs

        Returns:
            [B, max_outputs] numpy array of outputs
        """
        # Choose parallel vs sequential based on batch size
        if self.batch_size >= self.NUMBA_PARALLEL_THRESHOLD:
            return _numba_forward_batch_parallel(
                inputs_cpu,
                self._nb_n_neurons,
                self._nb_biases,
                self._nb_conn_starts,
                self._nb_conn_from,
                self._nb_conn_weights,
                self._nb_eval_order,
                self._nb_n_eval,
                self._nb_input_indices,
                self._nb_n_inputs,
                self._nb_output_indices,
                self._nb_n_outputs,
                self._nb_bias_indices,
                self._nb_n_bias,
                self._nb_activation_codes,
                self._nb_max_neurons,
                self._nb_max_outputs,
            )
        else:
            return _numba_forward_batch_sequential(
                inputs_cpu,
                self._nb_n_neurons,
                self._nb_biases,
                self._nb_conn_starts,
                self._nb_conn_from,
                self._nb_conn_weights,
                self._nb_eval_order,
                self._nb_n_eval,
                self._nb_input_indices,
                self._nb_n_inputs,
                self._nb_output_indices,
                self._nb_n_outputs,
                self._nb_bias_indices,
                self._nb_n_bias,
                self._nb_activation_codes,
                self._nb_max_neurons,
                self._nb_max_outputs,
            )

    @torch.no_grad()
    def forward(self, inputs: torch.Tensor) -> torch.Tensor:
        """
        Forward pass through all NEAT networks.

        Args:
            inputs: [B, input_size] sensor inputs for each creature

        Returns:
            outputs: [B, max_muscles] neural network outputs in [-1, 1] range
        """
        if self.batch_size == 0:
            return torch.zeros(0, self.max_muscles, device=self.device)

        # Single batch CPU transfer (optimization: avoid per-creature transfers)
        inputs_cpu = inputs.cpu().numpy()

        # Use Numba-accelerated forward pass if available
        if self._use_numba:
            numba_outputs = self._forward_numba(inputs_cpu)

            # Fast conversion: create tensor directly from numpy
            # Numba outputs are [B, max_outputs], we need [B, max_muscles]
            if self._nb_max_outputs == self.max_muscles:
                # Same size - direct conversion
                outputs = torch.from_numpy(numba_outputs).float()
            else:
                # Need to pad/truncate - use numpy slicing
                outputs_np = np.zeros((self.batch_size, self.max_muscles), dtype=np.float64)
                copy_cols = min(self._nb_max_outputs, self.max_muscles)
                outputs_np[:, :copy_cols] = numba_outputs[:, :copy_cols]
                outputs = torch.from_numpy(outputs_np).float()

            # Apply num_muscles masking efficiently using numpy before conversion
            # Create mask for outputs beyond each creature's muscle count
            if hasattr(self, '_num_muscles_mask'):
                outputs = outputs * self._num_muscles_mask
            else:
                # Build and cache the mask
                mask = np.zeros((self.batch_size, self.max_muscles), dtype=np.float64)
                for i in range(self.batch_size):
                    mask[i, :self.num_muscles[i]] = 1.0
                self._num_muscles_mask = torch.from_numpy(mask).float()
                outputs = outputs * self._num_muscles_mask

            # Move to target device if not CPU
            if self.device.type != 'cpu':
                outputs = outputs.to(self.device)

            return outputs

        # Fallback to dict-based forward pass
        outputs = torch.zeros(self.batch_size, self.max_muscles, device=self.device)

        for i in range(self.batch_size):
            output_list = self._forward_cached(i, inputs_cpu[i])

            # Pad/truncate outputs to match num_muscles for this creature
            n_out = min(len(output_list), self.num_muscles[i])
            for j in range(n_out):
                outputs[i, j] = output_list[j]

        return outputs

    def _forward_cached(self, genome_idx: int, inputs: 'np.ndarray') -> list[float]:
        """
        Fast forward pass using pre-computed cached structures.

        Args:
            genome_idx: Index of genome in self.genomes
            inputs: NumPy array of input values

        Returns:
            List of output values
        """
        cache = self._cached_structures[genome_idx]

        # Initialize neuron values
        neuron_values: dict[int, float] = {}

        # Set bias neuron values (always 1.0)
        for bias_id in cache['bias_ids']:
            neuron_values[bias_id] = 1.0

        # Set input values
        for idx, input_id in enumerate(cache['input_ids']):
            neuron_values[input_id] = float(inputs[idx])

        # Process neurons in cached topological order
        neuron_bias = cache['neuron_bias']
        incoming = cache['incoming']
        activation = cache['activation']

        for neuron_id in cache['eval_order']:
            # Sum weighted inputs
            total = neuron_bias[neuron_id]
            for from_id, weight in incoming[neuron_id]:
                total += neuron_values[from_id] * weight

            # Apply activation
            neuron_values[neuron_id] = activation(total)

        # Return output values in order
        return [neuron_values[out_id] for out_id in cache['output_ids']]

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
        outputs = torch.zeros(self.batch_size, self.max_muscles, device=self.device)
        hidden = torch.zeros(self.batch_size, self.max_hidden, device=self.device)

        # Single batch CPU transfer
        inputs_cpu = inputs.cpu().numpy()

        for i in range(self.batch_size):
            result = self._forward_full_cached(i, inputs_cpu[i])

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

    def _forward_full_cached(self, genome_idx: int, inputs: 'np.ndarray') -> dict:
        """
        Fast forward pass with full activations using cached structures.

        Args:
            genome_idx: Index of genome in self.genomes
            inputs: NumPy array of input values

        Returns:
            Dict with 'inputs', 'hidden', 'outputs' activation lists
        """
        cache = self._cached_structures[genome_idx]

        # Initialize neuron values
        neuron_values: dict[int, float] = {}

        # Set bias neuron values (always 1.0)
        for bias_id in cache['bias_ids']:
            neuron_values[bias_id] = 1.0

        # Set input values
        for idx, input_id in enumerate(cache['input_ids']):
            neuron_values[input_id] = float(inputs[idx])

        # Process neurons in cached topological order
        neuron_bias = cache['neuron_bias']
        incoming = cache['incoming']
        activation = cache['activation']

        for neuron_id in cache['eval_order']:
            total = neuron_bias[neuron_id]
            for from_id, weight in incoming[neuron_id]:
                total += neuron_values[from_id] * weight
            neuron_values[neuron_id] = activation(total)

        # Collect activations by type
        return {
            'inputs': [float(inputs[idx]) for idx in range(len(cache['input_ids']))],
            'hidden': [neuron_values[h_id] for h_id in cache['hidden_ids']],
            'outputs': [neuron_values[out_id] for out_id in cache['output_ids']],
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

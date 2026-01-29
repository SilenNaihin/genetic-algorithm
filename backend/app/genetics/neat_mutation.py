"""
NEAT structural mutation operators.

Implements mutations that change network topology (add connections, add nodes)
as well as weight perturbations for NEAT genomes.

See docs/NEAT.md for technical details.
"""

import random
from copy import deepcopy

from app.neural.neat_network import would_create_cycle
from app.schemas.neat import (
    ConnectionGene,
    InnovationCounter,
    NEATGenome,
    NeuronGene,
)


def mutate_add_connection(
    genome: NEATGenome,
    innovation_counter: InnovationCounter,
    max_attempts: int = 20,
) -> bool:
    """
    Add a new connection between two unconnected neurons.

    For feedforward networks, connections can only go from:
    - input -> hidden
    - input -> output
    - hidden -> hidden (if no cycle created)
    - hidden -> output
    - bias -> hidden (if bias_node mode)
    - bias -> output (if bias_node mode)

    Args:
        genome: NEAT genome to mutate (modified in place)
        innovation_counter: Innovation counter for tracking new genes
        max_attempts: Maximum attempts to find a valid connection

    Returns:
        True if a connection was added, False if no valid connection found
    """
    # Find valid source neurons (input, hidden, or bias)
    sources = [n for n in genome.neurons if n.type in ('input', 'hidden', 'bias')]

    # Find valid target neurons (hidden or output)
    targets = [n for n in genome.neurons if n.type in ('hidden', 'output')]

    if not sources or not targets:
        return False

    # Try to find a valid connection
    for _ in range(max_attempts):
        source = random.choice(sources)
        target = random.choice(targets)

        # Skip if connection already exists
        if genome.connection_exists(source.id, target.id):
            continue

        # Skip if this would create a cycle (feedforward only)
        if would_create_cycle(genome, source.id, target.id):
            continue

        # Create the new connection
        innovation = innovation_counter.get_connection_innovation(source.id, target.id)
        new_connection = ConnectionGene(
            from_node=source.id,
            to_node=target.id,
            weight=random.uniform(-0.5, 0.5),
            enabled=True,
            innovation=innovation,
        )

        genome.connections.append(new_connection)
        return True

    return False


def mutate_add_node(
    genome: NEATGenome,
    innovation_counter: InnovationCounter,
    max_hidden_nodes: int = 16,
) -> bool:
    """
    Split an existing connection with a new hidden node.

    The original connection A->B becomes:
    - A->new_node with weight 1.0 (preserves signal strength)
    - new_node->B with original weight (preserves behavior initially)

    The original connection is disabled (not removed, following NEAT paper).

    Args:
        genome: NEAT genome to mutate (modified in place)
        innovation_counter: Innovation counter for tracking new genes
        max_hidden_nodes: Maximum allowed hidden nodes

    Returns:
        True if a node was added, False otherwise
    """
    # Check if we've hit the hidden node limit
    current_hidden = len(genome.get_hidden_neurons())
    if current_hidden >= max_hidden_nodes:
        return False

    # Get enabled connections to split
    enabled_connections = genome.get_enabled_connections()
    if not enabled_connections:
        return False

    # Pick a random connection to split
    conn_to_split = random.choice(enabled_connections)

    # Disable the original connection
    conn_to_split.enabled = False

    # Create new hidden node
    new_node_id = genome.max_neuron_id() + 1
    node_innovation = innovation_counter.get_node_innovation(conn_to_split.innovation)

    new_node = NeuronGene(
        id=new_node_id,
        type='hidden',
        bias=0.0,  # Start with no bias
        innovation=node_innovation,
    )

    # Create connection from original source to new node (weight 1.0)
    conn1_innovation = innovation_counter.get_connection_innovation(
        conn_to_split.from_node, new_node_id
    )
    conn1 = ConnectionGene(
        from_node=conn_to_split.from_node,
        to_node=new_node_id,
        weight=1.0,  # Preserve signal strength
        enabled=True,
        innovation=conn1_innovation,
    )

    # Create connection from new node to original target (original weight)
    conn2_innovation = innovation_counter.get_connection_innovation(
        new_node_id, conn_to_split.to_node
    )
    conn2 = ConnectionGene(
        from_node=new_node_id,
        to_node=conn_to_split.to_node,
        weight=conn_to_split.weight,  # Preserve original behavior
        enabled=True,
        innovation=conn2_innovation,
    )

    genome.neurons.append(new_node)
    genome.connections.append(conn1)
    genome.connections.append(conn2)

    return True


def mutate_toggle_connection(genome: NEATGenome, disable_rate: float = 0.5) -> bool:
    """
    Toggle the enabled state of a random connection.

    Args:
        genome: NEAT genome to mutate (modified in place)
        disable_rate: Probability to pick disable (vs enable) when both options exist

    Returns:
        True if a connection was toggled, False if no connections exist
    """
    if not genome.connections:
        return False

    enabled = [c for c in genome.connections if c.enabled]
    disabled = [c for c in genome.connections if not c.enabled]

    # Filter disabled to only those safe to re-enable (no cycle creation)
    safe_to_enable = [
        c for c in disabled
        if not would_create_cycle(genome, c.from_node, c.to_node)
    ]

    # Decide whether to enable or disable based on what's available
    if enabled and safe_to_enable:
        # Both options available, use rate to decide
        if random.random() < disable_rate:
            conn = random.choice(enabled)
            conn.enabled = False
        else:
            conn = random.choice(safe_to_enable)
            conn.enabled = True
    elif enabled:
        # Only enabled connections (or no safe disabled), disable one
        conn = random.choice(enabled)
        conn.enabled = False
    elif safe_to_enable:
        # Only disabled connections that are safe to enable
        conn = random.choice(safe_to_enable)
        conn.enabled = True
    else:
        return False

    return True


def mutate_enable_connection(genome: NEATGenome) -> bool:
    """
    Enable a random disabled connection (if it won't create a cycle).

    Args:
        genome: NEAT genome to mutate (modified in place)

    Returns:
        True if a connection was enabled, False if none could be enabled
    """
    disabled = [c for c in genome.connections if not c.enabled]
    if not disabled:
        return False

    # Filter to only connections that won't create a cycle when re-enabled
    # (a cycle could have formed since the connection was disabled)
    safe_to_enable = [
        c for c in disabled
        if not would_create_cycle(genome, c.from_node, c.to_node)
    ]

    if not safe_to_enable:
        return False

    conn = random.choice(safe_to_enable)
    conn.enabled = True
    return True


def mutate_disable_connection(genome: NEATGenome) -> bool:
    """
    Disable a random enabled connection.

    Args:
        genome: NEAT genome to mutate (modified in place)

    Returns:
        True if a connection was disabled, False if none were enabled
    """
    enabled = [c for c in genome.connections if c.enabled]
    if not enabled:
        return False

    conn = random.choice(enabled)
    conn.enabled = False
    return True


def mutate_neat_weights(
    genome: NEATGenome,
    mutation_rate: float = 0.8,
    perturb_rate: float = 0.9,
    perturb_magnitude: float = 0.2,
    reset_magnitude: float = 0.5,
) -> int:
    """
    Mutate connection weights with Gaussian perturbation or reset.

    In canonical NEAT, weight mutations are applied to all offspring.
    Each individual weight has mutation_rate probability of being mutated.
    Of those mutated, perturb_rate are perturbed, rest are reset.

    Args:
        genome: NEAT genome to mutate (modified in place)
        mutation_rate: Probability each weight is mutated (typically 0.8)
        perturb_rate: Of mutations, probability of perturbation vs full reset
        perturb_magnitude: Standard deviation of perturbation
        reset_magnitude: Range for full weight reset [-magnitude, magnitude]

    Returns:
        Number of weights that were mutated
    """
    mutations = 0
    for conn in genome.connections:
        # Each weight has mutation_rate chance to mutate
        if random.random() < mutation_rate:
            if random.random() < perturb_rate:
                # Perturb existing weight
                conn.weight += _random_gaussian() * perturb_magnitude
            else:
                # Reset to new random value
                conn.weight = random.uniform(-reset_magnitude, reset_magnitude)
            mutations += 1

    return mutations


def mutate_neat_biases(
    genome: NEATGenome,
    mutation_rate: float = 0.8,
    perturb_rate: float = 0.9,
    perturb_magnitude: float = 0.2,
    bias_mode: str = 'node',
) -> int:
    """
    Mutate neuron biases with Gaussian perturbation.

    Only hidden and output neurons have mutable biases.
    Skipped entirely if bias_mode is 'none' or 'bias_node' (biases via connections).

    Args:
        genome: NEAT genome to mutate (modified in place)
        mutation_rate: Probability each bias mutates
        perturb_rate: Probability of perturbation vs reset
        perturb_magnitude: Standard deviation of perturbation
        bias_mode: 'node' = per-node biases, 'bias_node' = bias via connections, 'none' = no biases

    Returns:
        Number of biases that were mutated
    """
    # Skip bias mutation if not using per-node biases
    if bias_mode in ('none', 'bias_node'):
        return 0

    mutations = 0
    for neuron in genome.neurons:
        # Only mutate hidden and output biases
        if neuron.type in ('input', 'bias'):
            continue

        if random.random() < mutation_rate:
            if random.random() < perturb_rate:
                neuron.bias += _random_gaussian() * perturb_magnitude
            else:
                neuron.bias = random.uniform(-0.5, 0.5)
            mutations += 1

    return mutations


def mutate_neat_genome(
    genome: NEATGenome,
    innovation_counter: InnovationCounter,
    add_connection_rate: float = 0.5,
    add_node_rate: float = 0.2,
    enable_rate: float = 0.02,
    disable_rate: float = 0.01,
    weight_mutation_rate: float = 0.8,
    weight_perturb_rate: float = 0.9,
    weight_perturb_magnitude: float = 0.2,
    bias_mutation_rate: float = 0.3,
    max_hidden_nodes: int = 16,
    bias_mode: str = 'node',
) -> NEATGenome:
    """
    Apply all NEAT mutations to a genome.

    Creates a deep copy and applies structural and weight mutations.

    Args:
        genome: Original genome (not modified)
        innovation_counter: Innovation counter for new genes
        add_connection_rate: Probability of adding a new connection
        add_node_rate: Probability of adding a new node
        enable_rate: Probability of enabling a disabled connection
        disable_rate: Probability of disabling an enabled connection
        weight_mutation_rate: Probability of weight mutations
        weight_perturb_rate: Of weight mutations, probability of perturbation vs reset
        weight_perturb_magnitude: Standard deviation of weight perturbation
        bias_mutation_rate: Probability of bias mutations
        max_hidden_nodes: Maximum hidden nodes allowed
        bias_mode: 'node' = per-node biases, 'bias_node' = bias via connections, 'none' = no biases

    Returns:
        New mutated genome
    """
    # Deep copy to avoid modifying original
    mutated = deepcopy(genome)

    # Structural mutations - both can happen independently
    # This is crucial for 'none' connectivity where add_node can only split bias connections
    # and add_connection is the ONLY way to create input->output pathways
    if random.random() < add_node_rate:
        mutate_add_node(mutated, innovation_counter, max_hidden_nodes)
    if random.random() < add_connection_rate:
        mutate_add_connection(mutated, innovation_counter)

    # Connection enable/disable
    if random.random() < enable_rate:
        mutate_enable_connection(mutated)
    if random.random() < disable_rate:
        mutate_disable_connection(mutated)

    # Weight mutations
    mutate_neat_weights(
        mutated,
        mutation_rate=weight_mutation_rate,
        perturb_rate=weight_perturb_rate,
        perturb_magnitude=weight_perturb_magnitude,
    )

    # Bias mutations (skipped for 'none' or 'bias_node' modes)
    mutate_neat_biases(
        mutated,
        mutation_rate=bias_mutation_rate,
        bias_mode=bias_mode,
    )

    return mutated


def _random_gaussian() -> float:
    """Generate random number from standard normal distribution (Box-Muller)."""
    import math
    u1 = max(random.random(), 1e-10)  # Avoid log(0)
    u2 = random.random()
    return math.sqrt(-2 * math.log(u1)) * math.cos(2 * math.pi * u2)

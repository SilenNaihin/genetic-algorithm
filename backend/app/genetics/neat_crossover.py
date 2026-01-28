"""
NEAT crossover operators.

Implements gene alignment and crossover by innovation number,
the key mechanism that allows NEAT to cross over genomes of different topologies.

See docs/NEAT.md for technical details.
"""

import random
from collections import deque
from copy import deepcopy

from app.schemas.neat import ConnectionGene, NEATGenome, NeuronGene


def _would_create_cycle_with_connections(
    neurons: list[NeuronGene],
    connections: list[ConnectionGene],
    from_neuron: int,
    to_neuron: int,
) -> bool:
    """
    Check if adding a connection would create a cycle given existing connections.

    Used during crossover to filter out cycle-creating genes.
    """
    if from_neuron == to_neuron:
        return True

    # Build adjacency from existing connections
    # Use defaultdict-like behavior to handle neurons not in list
    neuron_ids = {n.id for n in neurons}
    outgoing: dict[int, set[int]] = {n.id: set() for n in neurons}
    for conn in connections:
        if conn.enabled:
            # Handle connections from neurons not in our list (shouldn't happen but be safe)
            if conn.from_node not in outgoing:
                outgoing[conn.from_node] = set()
            outgoing[conn.from_node].add(conn.to_node)

    # BFS from to_neuron to see if we can reach from_neuron
    visited: set[int] = set()
    queue = deque([to_neuron])

    while queue:
        current = queue.popleft()
        if current == from_neuron:
            return True
        if current in visited:
            continue
        visited.add(current)
        for target in outgoing.get(current, set()):
            if target not in visited:
                queue.append(target)

    return False


def _filter_cycle_creating_connections(
    neurons: list[NeuronGene],
    connections: list[ConnectionGene],
) -> list[ConnectionGene]:
    """
    Filter out connections that would create cycles.

    Processes connections in order, keeping only those that don't create cycles
    with the already-accepted connections.
    """
    filtered: list[ConnectionGene] = []

    for conn in connections:
        if not _would_create_cycle_with_connections(neurons, filtered, conn.from_node, conn.to_node):
            filtered.append(conn)

    return filtered


def align_genes(
    parent_a: NEATGenome,
    parent_b: NEATGenome,
) -> tuple[
    list[tuple[ConnectionGene | None, ConnectionGene | None]],
    set[int],
    set[int],
    set[int],
]:
    """
    Align connection genes by innovation number.

    Returns:
        - aligned_pairs: List of (gene_a, gene_b) tuples aligned by innovation
        - matching: Set of innovation IDs present in both parents
        - disjoint: Set of innovation IDs within range but only in one parent
        - excess: Set of innovation IDs beyond the other parent's max
    """
    # Index connections by innovation
    a_by_inn = {c.innovation: c for c in parent_a.connections}
    b_by_inn = {c.innovation: c for c in parent_b.connections}

    a_innovations = set(a_by_inn.keys())
    b_innovations = set(b_by_inn.keys())

    # Find max innovation in each parent
    max_a = max(a_innovations) if a_innovations else -1
    max_b = max(b_innovations) if b_innovations else -1

    # Classify genes
    matching = a_innovations & b_innovations

    # Disjoint: in one parent, within the range of the other
    # Excess: in one parent, beyond the max of the other
    disjoint = set()
    excess = set()

    for inn in a_innovations - matching:
        if inn > max_b:
            excess.add(inn)
        else:
            disjoint.add(inn)

    for inn in b_innovations - matching:
        if inn > max_a:
            excess.add(inn)
        else:
            disjoint.add(inn)

    # Build aligned pairs
    all_innovations = sorted(a_innovations | b_innovations)
    aligned_pairs = []

    for inn in all_innovations:
        gene_a = a_by_inn.get(inn)
        gene_b = b_by_inn.get(inn)
        aligned_pairs.append((gene_a, gene_b))

    return aligned_pairs, matching, disjoint, excess


def neat_crossover(
    parent_a: NEATGenome,
    parent_b: NEATGenome,
    fitness_a: float,
    fitness_b: float,
    disabled_gene_inherit_rate: float = 0.75,
) -> NEATGenome:
    """
    NEAT crossover: align genes by innovation, inherit from fitter parent.

    Rules (per NEAT paper):
    1. Matching genes: randomly inherit from either parent
    2. Disjoint/excess genes: inherit from fitter parent only
    3. If either parent has a matching gene disabled, 75% chance child's gene is disabled
    4. Neuron genes are inherited from the fitter parent (they determine topology)

    Args:
        parent_a: First parent genome
        parent_b: Second parent genome
        fitness_a: Fitness of parent A
        fitness_b: Fitness of parent B
        disabled_gene_inherit_rate: Probability that a gene stays disabled
            if either parent has it disabled (default 0.75 per NEAT paper)

    Returns:
        Child genome with crossed-over genes
    """
    # Ensure A is the fitter (or equal) parent
    if fitness_b > fitness_a:
        parent_a, parent_b = parent_b, parent_a
        fitness_a, fitness_b = fitness_b, fitness_a

    # Align connection genes
    aligned_pairs, matching, disjoint, excess = align_genes(parent_a, parent_b)

    # Index parent B's connections for quick lookup
    b_by_inn = {c.innovation: c for c in parent_b.connections}

    # Build child connections
    child_connections: list[ConnectionGene] = []

    for gene_a, gene_b in aligned_pairs:
        # Determine which gene to inherit
        if gene_a is not None and gene_b is not None:
            # Matching gene: random choice
            chosen = random.choice([gene_a, gene_b])
            new_conn = ConnectionGene(
                from_node=chosen.from_node,
                to_node=chosen.to_node,
                weight=chosen.weight,
                enabled=chosen.enabled,
                innovation=chosen.innovation,
            )

            # If either parent has it disabled, 75% chance child is disabled
            if not gene_a.enabled or not gene_b.enabled:
                if random.random() < disabled_gene_inherit_rate:
                    new_conn.enabled = False

            child_connections.append(new_conn)

        elif gene_a is not None:
            # Disjoint/excess from fitter parent (A) - always inherit
            child_connections.append(ConnectionGene(
                from_node=gene_a.from_node,
                to_node=gene_a.to_node,
                weight=gene_a.weight,
                enabled=gene_a.enabled,
                innovation=gene_a.innovation,
            ))

        # gene_b only (disjoint/excess from less fit parent) - don't inherit

    # Inherit neurons from fitter parent
    # We need all neurons referenced by child connections
    needed_neuron_ids = set()
    for conn in child_connections:
        needed_neuron_ids.add(conn.from_node)
        needed_neuron_ids.add(conn.to_node)

    # Start with all neurons from fitter parent
    child_neurons: list[NeuronGene] = []
    a_neuron_ids = {n.id for n in parent_a.neurons}

    for neuron in parent_a.neurons:
        child_neurons.append(NeuronGene(
            id=neuron.id,
            type=neuron.type,
            bias=neuron.bias,
            innovation=neuron.innovation,
        ))

    # If we need neurons that aren't in parent A (shouldn't happen with standard
    # NEAT since disjoint/excess from B aren't inherited, but handle edge case)
    missing_neurons = needed_neuron_ids - a_neuron_ids
    if missing_neurons:
        b_neurons_by_id = {n.id: n for n in parent_b.neurons}
        for neuron_id in missing_neurons:
            if neuron_id in b_neurons_by_id:
                neuron = b_neurons_by_id[neuron_id]
                child_neurons.append(NeuronGene(
                    id=neuron.id,
                    type=neuron.type,
                    bias=neuron.bias,
                    innovation=neuron.innovation,
                ))

    # Filter out any connections that would create cycles
    # (can happen when combining genes from different topologies)
    child_connections = _filter_cycle_creating_connections(child_neurons, child_connections)

    return NEATGenome(
        neurons=child_neurons,
        connections=child_connections,
        activation=parent_a.activation,
    )


def neat_crossover_equal_fitness(
    parent_a: NEATGenome,
    parent_b: NEATGenome,
    disabled_gene_inherit_rate: float = 0.75,
) -> NEATGenome:
    """
    NEAT crossover when parents have equal fitness.

    When fitness is equal, disjoint/excess genes from both parents are inherited.
    This increases genetic diversity compared to the standard case.

    Args:
        parent_a: First parent genome
        parent_b: Second parent genome
        disabled_gene_inherit_rate: Probability that a gene stays disabled

    Returns:
        Child genome
    """
    # Align connection genes
    aligned_pairs, matching, disjoint, excess = align_genes(parent_a, parent_b)

    # Build child connections - inherit from both parents
    child_connections: list[ConnectionGene] = []

    for gene_a, gene_b in aligned_pairs:
        if gene_a is not None and gene_b is not None:
            # Matching: random choice
            chosen = random.choice([gene_a, gene_b])
            new_conn = ConnectionGene(
                from_node=chosen.from_node,
                to_node=chosen.to_node,
                weight=chosen.weight,
                enabled=chosen.enabled,
                innovation=chosen.innovation,
            )
            if not gene_a.enabled or not gene_b.enabled:
                if random.random() < disabled_gene_inherit_rate:
                    new_conn.enabled = False
            child_connections.append(new_conn)

        elif gene_a is not None:
            # Disjoint/excess from A - 50% chance to inherit
            if random.random() < 0.5:
                child_connections.append(ConnectionGene(
                    from_node=gene_a.from_node,
                    to_node=gene_a.to_node,
                    weight=gene_a.weight,
                    enabled=gene_a.enabled,
                    innovation=gene_a.innovation,
                ))

        elif gene_b is not None:
            # Disjoint/excess from B - 50% chance to inherit
            if random.random() < 0.5:
                child_connections.append(ConnectionGene(
                    from_node=gene_b.from_node,
                    to_node=gene_b.to_node,
                    weight=gene_b.weight,
                    enabled=gene_b.enabled,
                    innovation=gene_b.innovation,
                ))

    # Inherit neurons from both parents as needed
    needed_neuron_ids = set()
    for conn in child_connections:
        needed_neuron_ids.add(conn.from_node)
        needed_neuron_ids.add(conn.to_node)

    # Combine neurons from both parents
    all_neurons_by_id: dict[int, NeuronGene] = {}

    for neuron in parent_a.neurons:
        all_neurons_by_id[neuron.id] = neuron

    for neuron in parent_b.neurons:
        if neuron.id not in all_neurons_by_id:
            all_neurons_by_id[neuron.id] = neuron

    # Build child neurons - include all input/output plus needed hidden
    child_neurons: list[NeuronGene] = []
    for neuron_id, neuron in all_neurons_by_id.items():
        # Always include input/output neurons
        if neuron.type in ('input', 'output') or neuron_id in needed_neuron_ids:
            child_neurons.append(NeuronGene(
                id=neuron.id,
                type=neuron.type,
                bias=neuron.bias,
                innovation=neuron.innovation,
            ))

    # Choose activation from random parent
    activation = random.choice([parent_a.activation, parent_b.activation])

    # Filter out any connections that would create cycles
    # (more likely in equal fitness crossover since we inherit from both parents)
    child_connections = _filter_cycle_creating_connections(child_neurons, child_connections)

    return NEATGenome(
        neurons=child_neurons,
        connections=child_connections,
        activation=activation,
    )


def crossover_biases(
    parent_a: NEATGenome,
    parent_b: NEATGenome,
    child: NEATGenome,
) -> None:
    """
    Crossover neuron biases for matching neurons.

    This is a secondary operation after the main crossover.
    For neurons that exist in both parents, we interpolate biases.

    Args:
        parent_a: First parent
        parent_b: Second parent
        child: Child genome (modified in place)
    """
    a_biases = {n.id: n.bias for n in parent_a.neurons}
    b_biases = {n.id: n.bias for n in parent_b.neurons}

    for neuron in child.neurons:
        if neuron.id in a_biases and neuron.id in b_biases:
            # Interpolate biases
            t = random.random()
            neuron.bias = a_biases[neuron.id] * (1 - t) + b_biases[neuron.id] * t
        elif neuron.id in a_biases:
            neuron.bias = a_biases[neuron.id]
        elif neuron.id in b_biases:
            neuron.bias = b_biases[neuron.id]
        # else: keep default (0.0)

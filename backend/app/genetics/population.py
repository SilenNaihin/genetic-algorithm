"""
Population management for genetic evolution.

Ported from TypeScript src/genetics/Population.ts.
Handles genome generation, evolution, and population statistics.
"""

import math
import random
from dataclasses import dataclass, field
from typing import Any

from .selection import (
    truncation_selection,
    rank_based_probabilities,
    weighted_random_select,
)
from .mutation import (
    mutate_genome,
    MutationConfig,
    GenomeConstraints,
    generate_id,
    random_unit_vector,
)
from .crossover import (
    single_point_crossover,
    clone_genome,
    initialize_neural_genome,
)


@dataclass
class DecayConfig:
    """Decay configuration for mutation rate scheduling."""

    mode: str = 'off'  # 'off', 'linear', 'exponential'
    start_rate: float = 0.5
    end_rate: float = 0.1
    decay_generations: int = 100


@dataclass
class PopulationStats:
    """Statistics about a population."""

    generation: int
    best_fitness: float
    average_fitness: float
    worst_fitness: float
    avg_nodes: float
    avg_muscles: float


@dataclass
class EvolutionConfig:
    """Configuration for evolution operations."""

    # Population
    population_size: int = 100
    elite_count: int = 5

    # Selection
    cull_percentage: float = 0.5

    # Reproduction
    crossover_rate: float = 0.5
    use_mutation: bool = True
    use_crossover: bool = True

    # Mutation
    mutation_rate: float = 0.1
    mutation_magnitude: float = 0.3
    structural_rate: float = 0.1

    # Neural mutation
    weight_mutation_rate: float = 0.1
    weight_mutation_magnitude: float = 0.3
    weight_mutation_decay: str = 'off'  # 'off', 'linear', 'exponential'

    # Neural initialization
    use_neural_net: bool = True
    neural_hidden_size: int = 8
    neural_output_bias: float = 0.0

    # Constraints
    min_nodes: int = 3
    max_nodes: int = 8
    min_muscles: int = 2
    max_muscles: int = 15
    spawn_radius: float = 1.5
    min_size: float = 0.2
    max_size: float = 0.6
    min_stiffness: float = 50.0
    max_stiffness: float = 200.0
    min_frequency: float = 0.5
    max_frequency: float = 2.0
    max_amplitude: float = 0.5


def calculate_decayed_rate(
    generation: int,
    config: DecayConfig | dict,
) -> float:
    """
    Calculate decayed mutation rate based on generation.

    Args:
        generation: Current generation number
        config: Decay configuration

    Returns:
        Effective mutation rate for this generation
    """
    if isinstance(config, dict):
        mode = config.get('mode', 'off')
        start_rate = config.get('start_rate', 0.5)
        end_rate = config.get('end_rate', 0.1)
        decay_generations = config.get('decay_generations', 100)
    else:
        mode = config.mode
        start_rate = config.start_rate
        end_rate = config.end_rate
        decay_generations = config.decay_generations

    if mode == 'off':
        return end_rate

    if mode == 'linear':
        progress = min(1, generation / decay_generations)
        return start_rate - (start_rate - end_rate) * progress
    else:  # exponential
        tau = decay_generations / 3
        return end_rate + (start_rate - end_rate) * math.exp(-generation / tau)


def random_range(min_val: float, max_val: float) -> float:
    """Generate a random float in range [min_val, max_val]."""
    return random.random() * (max_val - min_val) + min_val


def random_int(min_val: int, max_val: int) -> int:
    """Generate a random integer in range [min_val, max_val] inclusive."""
    return random.randint(min_val, max_val)


def random_vector3(radius: float) -> dict:
    """Generate a random position within spawn radius."""
    return {
        'x': random_range(-radius, radius),
        'y': random_range(0.3, radius * 1.5),
        'z': random_range(-radius, radius),
    }


def generate_random_genome(
    constraints: GenomeConstraints | dict | None = None,
    use_neural_net: bool = True,
    neural_hidden_size: int = 8,
    neural_output_bias: float = 0.0,
) -> dict:
    """
    Generate a random creature genome.

    Args:
        constraints: Genome constraints
        use_neural_net: Whether to initialize neural genome
        neural_hidden_size: Hidden layer size for neural network
        neural_output_bias: Initial bias for output neurons

    Returns:
        Random genome dict
    """
    if constraints is None:
        constraints = GenomeConstraints()
    elif isinstance(constraints, dict):
        constraints = GenomeConstraints(
            min_nodes=constraints.get('minNodes', constraints.get('min_nodes', 3)),
            max_nodes=constraints.get('maxNodes', constraints.get('max_nodes', 8)),
            min_muscles=constraints.get('minMuscles', constraints.get('min_muscles', 2)),
            max_muscles=constraints.get('maxMuscles', constraints.get('max_muscles', 15)),
            spawn_radius=constraints.get('spawnRadius', constraints.get('spawn_radius', 1.5)),
            min_size=constraints.get('minSize', constraints.get('min_size', 0.2)),
            max_size=constraints.get('maxSize', constraints.get('max_size', 0.6)),
            min_stiffness=constraints.get('minStiffness', constraints.get('min_stiffness', 50.0)),
            max_stiffness=constraints.get('maxStiffness', constraints.get('max_stiffness', 200.0)),
            min_frequency=constraints.get('minFrequency', constraints.get('min_frequency', 0.5)),
            max_frequency=constraints.get('maxFrequency', constraints.get('max_frequency', 2.0)),
            max_amplitude=constraints.get('maxAmplitude', constraints.get('max_amplitude', 0.5)),
        )

    # Ensure we can connect all nodes
    effective_max_nodes = min(constraints.max_nodes, constraints.max_muscles + 1)
    effective_min_nodes = min(constraints.min_nodes, effective_max_nodes)

    # Generate nodes
    node_count = random_int(effective_min_nodes, effective_max_nodes)
    nodes = []

    for _ in range(node_count):
        nodes.append({
            'id': generate_id('node'),
            'size': random_range(constraints.min_size, constraints.max_size),
            'friction': random_range(0.3, 0.9),
            'position': random_vector3(constraints.spawn_radius),
        })

    # Generate muscles ensuring connectivity
    muscles = []
    max_muscles = min(
        constraints.max_muscles,
        (node_count * (node_count - 1)) // 2
    )

    # Create spanning tree first (ensures connectivity)
    connected = {nodes[0]['id']}
    unconnected = {n['id'] for n in nodes[1:]}

    while unconnected:
        connected_list = list(connected)
        unconnected_list = list(unconnected)

        from_id = random.choice(connected_list)
        to_id = random.choice(unconnected_list)

        from_node = next(n for n in nodes if n['id'] == from_id)
        to_node = next(n for n in nodes if n['id'] == to_id)

        muscles.append(create_muscle(from_node, to_node, constraints))

        connected.add(to_id)
        unconnected.remove(to_id)

    # Add random additional muscles up to limit
    existing_connections = {
        tuple(sorted([m['nodeA'], m['nodeB']]))
        for m in muscles
    }

    while len(muscles) < max_muscles:
        # Pick two random nodes
        i, j = random.sample(range(len(nodes)), 2)
        key = tuple(sorted([nodes[i]['id'], nodes[j]['id']]))

        if key not in existing_connections:
            muscles.append(create_muscle(nodes[i], nodes[j], constraints))
            existing_connections.add(key)
        else:
            # No more unique connections possible
            break

    # Create neural genome if enabled
    neural_genome = None
    controller_type = 'oscillator'

    if use_neural_net and len(muscles) > 0:
        neural_genome = initialize_neural_genome(
            num_muscles=len(muscles),
            hidden_size=neural_hidden_size,
            input_size=8,  # Hybrid mode
            output_bias=neural_output_bias,
        )
        controller_type = 'neural'

    return {
        'id': generate_id('creature'),
        'generation': 0,
        'survivalStreak': 0,
        'parentIds': [],
        'nodes': nodes,
        'muscles': muscles,
        'globalFrequencyMultiplier': random_range(0.8, 1.2),
        'controllerType': controller_type,
        'neuralGenome': neural_genome,
        'color': {
            'h': random.random(),
            's': random_range(0.5, 0.9),
            'l': random_range(0.4, 0.6),
        },
    }


def create_muscle(
    node_a: dict,
    node_b: dict,
    constraints: GenomeConstraints,
) -> dict:
    """Create a muscle connecting two nodes."""
    pos_a = node_a.get('position', {'x': 0, 'y': 0.5, 'z': 0})
    pos_b = node_b.get('position', {'x': 0, 'y': 0.5, 'z': 0})

    dx = pos_a['x'] - pos_b['x']
    dy = pos_a['y'] - pos_b['y']
    dz = pos_a['z'] - pos_b['z']
    dist = math.sqrt(dx * dx + dy * dy + dz * dz)

    return {
        'id': generate_id('muscle'),
        'nodeA': node_a['id'],
        'nodeB': node_b['id'],
        'restLength': max(0.1, dist * random_range(0.8, 1.2)),
        'stiffness': random_range(constraints.min_stiffness, constraints.max_stiffness),
        'damping': random_range(0.05, 0.5),
        'frequency': random_range(constraints.min_frequency, constraints.max_frequency),
        'amplitude': random_range(0.1, constraints.max_amplitude),
        'phase': random_range(0, math.pi * 2),
        # v1: Direction sensing
        'directionBias': random_unit_vector(),
        'biasStrength': random_range(0, 0.8),
        # v2: Velocity sensing
        'velocityBias': random_unit_vector(),
        'velocityStrength': random_range(0, 0.5),
        # v2: Distance awareness
        'distanceBias': random_range(-1, 1),
        'distanceStrength': random_range(0, 0.5),
    }


def generate_population(
    size: int,
    constraints: GenomeConstraints | dict | None = None,
    use_neural_net: bool = True,
    neural_hidden_size: int = 8,
    neural_output_bias: float = 0.0,
) -> list[dict]:
    """
    Generate an initial population of random genomes.

    Args:
        size: Number of genomes to generate
        constraints: Genome constraints
        use_neural_net: Whether to initialize neural genomes
        neural_hidden_size: Hidden layer size
        neural_output_bias: Initial output bias

    Returns:
        List of genome dicts
    """
    return [
        generate_random_genome(
            constraints=constraints,
            use_neural_net=use_neural_net,
            neural_hidden_size=neural_hidden_size,
            neural_output_bias=neural_output_bias,
        )
        for _ in range(size)
    ]


def get_population_stats(
    genomes: list[dict],
    fitness_scores: list[float],
    generation: int,
) -> PopulationStats:
    """
    Calculate population statistics.

    Args:
        genomes: List of genome dicts
        fitness_scores: Fitness values for each genome
        generation: Current generation number

    Returns:
        PopulationStats object
    """
    if not fitness_scores:
        return PopulationStats(
            generation=generation,
            best_fitness=0,
            average_fitness=0,
            worst_fitness=0,
            avg_nodes=0,
            avg_muscles=0,
        )

    sorted_fitness = sorted(fitness_scores, reverse=True)

    total_nodes = sum(len(g.get('nodes', [])) for g in genomes)
    total_muscles = sum(len(g.get('muscles', [])) for g in genomes)

    return PopulationStats(
        generation=generation,
        best_fitness=sorted_fitness[0],
        average_fitness=sum(fitness_scores) / len(fitness_scores),
        worst_fitness=sorted_fitness[-1],
        avg_nodes=total_nodes / len(genomes) if genomes else 0,
        avg_muscles=total_muscles / len(genomes) if genomes else 0,
    )


def evolve_population(
    genomes: list[dict],
    fitness_scores: list[float],
    config: EvolutionConfig | dict | None = None,
    generation: int = 0,
) -> tuple[list[dict], PopulationStats]:
    """
    Evolve a population to the next generation.

    Survivors (top performers) pass through unchanged.
    New creatures fill culled slots via crossover or mutation.

    Args:
        genomes: Current population genomes
        fitness_scores: Fitness values for each genome
        config: Evolution configuration
        generation: Current generation number

    Returns:
        Tuple of (new genomes, population stats)
    """
    if config is None:
        config = EvolutionConfig(population_size=len(genomes))
    elif isinstance(config, dict):
        # Default population_size to input size if not specified
        if 'population_size' not in config:
            config['population_size'] = len(genomes)
        config = EvolutionConfig(
            population_size=config.get('population_size', 100),
            elite_count=config.get('elite_count', 5),
            cull_percentage=config.get('cull_percentage', 0.5),
            crossover_rate=config.get('crossover_rate', 0.5),
            use_mutation=config.get('use_mutation', True),
            use_crossover=config.get('use_crossover', True),
            mutation_rate=config.get('mutation_rate', 0.1),
            mutation_magnitude=config.get('mutation_magnitude', 0.3),
            structural_rate=config.get('structural_rate', 0.1),
            weight_mutation_rate=config.get('weight_mutation_rate', 0.1),
            weight_mutation_magnitude=config.get('weight_mutation_magnitude', 0.3),
            weight_mutation_decay=config.get('weight_mutation_decay', 'off'),
            use_neural_net=config.get('use_neural_net', True),
            neural_hidden_size=config.get('neural_hidden_size', 8),
            neural_output_bias=config.get('neural_output_bias', -0.5),
            min_nodes=config.get('min_nodes', 3),
            max_nodes=config.get('max_nodes', 8),
            min_muscles=config.get('min_muscles', 2),
            max_muscles=config.get('max_muscles', 15),
            spawn_radius=config.get('spawn_radius', 1.5),
            min_size=config.get('min_size', 0.2),
            max_size=config.get('max_size', 0.6),
            min_stiffness=config.get('min_stiffness', 50.0),
            max_stiffness=config.get('max_stiffness', 200.0),
            min_frequency=config.get('min_frequency', 0.5),
            max_frequency=config.get('max_frequency', 2.0),
            max_amplitude=config.get('max_amplitude', 0.5),
        )

    # Build constraints from config
    constraints = GenomeConstraints(
        min_nodes=config.min_nodes,
        max_nodes=config.max_nodes,
        min_muscles=config.min_muscles,
        max_muscles=config.max_muscles,
        spawn_radius=config.spawn_radius,
        min_size=config.min_size,
        max_size=config.max_size,
        min_stiffness=config.min_stiffness,
        max_stiffness=config.max_stiffness,
        min_frequency=config.min_frequency,
        max_frequency=config.max_frequency,
        max_amplitude=config.max_amplitude,
    )

    # Select survivors
    result = truncation_selection(genomes, fitness_scores, 1 - config.cull_percentage)
    survivors = result.survivors

    # Get survivor fitness scores for rank-based selection
    survivor_ids = {g['id'] for g in survivors}
    survivor_fitness = [
        fitness_scores[i] for i, g in enumerate(genomes)
        if g['id'] in survivor_ids
    ]

    # Map survivor ID to fitness for ancestry building
    survivor_fitness_map = {}
    for i, g in enumerate(genomes):
        if g['id'] in survivor_ids:
            survivor_fitness_map[g['id']] = fitness_scores[i]

    def build_ancestry_chain(child: dict, parent1: dict, parent1_fitness: float,
                             parent2: dict = None, parent2_fitness: float = None):
        """Build ancestry chain for offspring from parent info."""
        # Get parent1's existing chain
        chain = list(parent1.get('ancestryChain', []))

        # Add parent1's info
        chain.append({
            'generation': parent1.get('generation', 0),
            'fitness': round(parent1_fitness, 1),
            'nodeCount': len(parent1.get('nodes', [])),
            'muscleCount': len(parent1.get('muscles', [])),
            'color': parent1.get('color', {'h': 0.5, 's': 0.7, 'l': 0.5}),
        })

        # For crossover, add parent2 info as well
        if parent2 and parent2_fitness is not None:
            chain.append({
                'generation': parent2.get('generation', 0),
                'fitness': round(parent2_fitness, 1),
                'nodeCount': len(parent2.get('nodes', [])),
                'muscleCount': len(parent2.get('muscles', [])),
                'color': parent2.get('color', {'h': 0.5, 's': 0.7, 'l': 0.5}),
            })

        # Limit chain length to avoid bloat (keep last 100 ancestors)
        if len(chain) > 100:
            chain = chain[-100:]

        child['ancestryChain'] = chain

    # Survivors pass through with incremented survivalStreak (keep birth generation)
    next_gen = generation + 1
    survivor_genomes = []
    for genome in survivors:
        new_genome = dict(genome)
        # Keep original generation (birth gen) for ancestry tracking
        # new_genome['generation'] = next_gen  # REMOVED - don't update birth gen
        new_genome['survivalStreak'] = genome.get('survivalStreak', 0) + 1
        survivor_genomes.append(new_genome)

    # Calculate selection probabilities
    probabilities = rank_based_probabilities(survivors, survivor_fitness)

    # Calculate decayed neural mutation rate
    decay_config = DecayConfig(
        mode=config.weight_mutation_decay,
        start_rate=config.weight_mutation_rate * 5,  # Start higher
        end_rate=config.weight_mutation_rate,
        decay_generations=50,
    )
    effective_neural_rate = calculate_decayed_rate(generation, decay_config)

    # Build mutation config
    mutation_config = MutationConfig(
        rate=config.mutation_rate,
        magnitude=config.mutation_magnitude,
        structural_rate=config.structural_rate,
        neural_rate=effective_neural_rate,
        neural_magnitude=config.weight_mutation_magnitude,
    )

    # Start with survivors
    new_genomes = list(survivor_genomes)
    target_size = config.population_size
    new_creatures_needed = target_size - len(survivors)

    # Create new creatures to fill culled slots
    for _ in range(new_creatures_needed):
        use_crossover = config.use_crossover
        use_mutation = config.use_mutation

        crossover_prob = config.crossover_rate if use_crossover else 0
        do_crossover = random.random() < crossover_prob and len(survivors) >= 2

        if do_crossover:
            # Crossover of two survivors
            parent1 = weighted_random_select(survivors, probabilities)
            parent2 = weighted_random_select(survivors, probabilities)

            # Ensure different parents
            attempts = 0
            while parent2['id'] == parent1['id'] and attempts < 10:
                parent2 = weighted_random_select(survivors, probabilities)
                attempts += 1

            child = single_point_crossover(parent1, parent2, constraints)
            # New offspring start at next generation with 0 survival streak
            child['generation'] = next_gen
            child['survivalStreak'] = 0
            # Build ancestry chain from both parents
            build_ancestry_chain(
                child, parent1, survivor_fitness_map.get(parent1['id'], 0),
                parent2, survivor_fitness_map.get(parent2['id'], 0)
            )
            new_genomes.append(child)

        elif use_mutation:
            # Clone + mutate
            parent = weighted_random_select(survivors, probabilities)
            child = clone_genome(parent, constraints)
            mutated = mutate_genome(child, mutation_config, constraints)
            # New offspring start at next generation with 0 survival streak
            mutated['generation'] = next_gen
            mutated['survivalStreak'] = 0
            # Build ancestry chain from parent
            build_ancestry_chain(mutated, parent, survivor_fitness_map.get(parent['id'], 0))
            new_genomes.append(mutated)

        else:
            # Just clone
            parent = weighted_random_select(survivors, probabilities)
            child = clone_genome(parent, constraints)
            # New offspring start at next generation with 0 survival streak
            child['generation'] = next_gen
            child['survivalStreak'] = 0
            # Build ancestry chain from parent
            build_ancestry_chain(child, parent, survivor_fitness_map.get(parent['id'], 0))
            new_genomes.append(child)

    # Calculate stats
    stats = get_population_stats(genomes, fitness_scores, generation)

    return new_genomes, stats

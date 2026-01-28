"""
Population management for genetic evolution.

Ported from TypeScript src/genetics/Population.ts.
Handles genome generation, evolution, and population statistics.

When use_neat=True, uses NEAT-specific operations:
- Creates minimal NEAT genomes instead of fixed-topology neural networks
- Uses NEAT crossover for variable-topology networks
- Uses NEAT mutation with structural operators
- Uses NEAT distance function for speciation
- Tracks innovation counter for gene alignment
"""

import math
import random
from dataclasses import dataclass, field
from typing import Any

from .selection import (
    truncation_selection,
    tournament_selection,
    rank_based_probabilities,
    weighted_random_select,
)
from .mutation import (
    mutate_genome,
    mutate_genome_neat,
    MutationConfig,
    NEATMutationConfig,
    GenomeConstraints,
    generate_id,
    random_unit_vector,
)
from .crossover import (
    single_point_crossover,
    clone_genome,
    initialize_neural_genome,
)
from .fitness_sharing import apply_fitness_sharing
from .speciation import apply_speciation
from .neat_distance import create_neat_distance_fn
from app.neural.network import get_input_size
from app.neural.neat_network import create_minimal_neat_genome
from app.schemas.neat import InnovationCounter


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
    survivor_ids: set[str] | None = None  # IDs of creatures that survived selection


@dataclass
class EvolutionConfig:
    """Configuration for evolution operations."""

    # Population
    population_size: int = 100
    elite_count: int = 5

    # Selection
    cull_percentage: float = 0.5
    selection_method: str = 'rank'  # 'truncation', 'tournament', 'rank', 'speciation'
    tournament_size: int = 3  # For tournament selection

    # Adaptive mutation (boost level is computed externally and passed in)
    adaptive_boost_level: float = 1.0  # Current boost multiplier (1.0 = no boost)

    # Reproduction
    crossover_rate: float = 0.5
    use_crossover: bool = True

    # Neural crossover method
    neural_crossover_method: str = 'sbx'  # 'interpolation', 'uniform', 'sbx'
    sbx_eta: float = 2.0  # Distribution index for SBX (0.5-5.0)

    # Fitness sharing (diversity maintenance)
    use_fitness_sharing: bool = False
    sharing_radius: float = 0.5  # Genome distance threshold

    # Speciation parameters (used when selection_method='speciation')
    compatibility_threshold: float = 1.0  # Genome distance for same species
    min_species_size: int = 2  # Minimum survivors per species

    # Mutation
    mutation_rate: float = 0.2
    mutation_magnitude: float = 0.3
    structural_rate: float = 0.1

    # Neural mutation
    weight_mutation_rate: float = 0.2
    weight_mutation_magnitude: float = 0.05
    weight_mutation_decay: str = 'linear'  # 'off', 'linear', 'exponential'

    # Neural initialization
    use_neural_net: bool = True
    neural_hidden_size: int = 8
    neural_output_bias: float = -0.1

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

    # NEAT configuration
    use_neat: bool = False  # Use NEAT for variable-topology neural networks
    bias_mode: str = 'node'  # 'none', 'node' (per-neuron), 'bias_node' (original NEAT style)
    neat_initial_connectivity: str = 'full'  # 'full', 'sparse', 'none' - initial network connectivity
    neat_add_connection_rate: float = 0.5  # Per-genome probability to add a connection (NEAT standard)
    neat_add_node_rate: float = 0.2  # Per-genome probability to add a node (NEAT standard)
    neat_enable_rate: float = 0.02  # Per-genome probability to re-enable connection
    neat_disable_rate: float = 0.01  # Per-genome probability to disable connection
    neat_excess_coefficient: float = 1.0  # Weight for excess genes in distance
    neat_disjoint_coefficient: float = 1.0  # Weight for disjoint genes in distance
    neat_weight_coefficient: float = 0.4  # Weight for weight differences in distance
    neat_max_hidden_nodes: int = 16  # Maximum hidden neurons to prevent bloat


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
    neural_mode: str = 'hybrid',
    time_encoding: str = 'cyclic',
    use_proprioception: bool = False,
    proprioception_inputs: str = 'all',
    use_neat: bool = False,
    innovation_counter: InnovationCounter | None = None,
    bias_mode: str = 'node',
    neat_initial_connectivity: str = 'full',
) -> dict:
    """
    Generate a random creature genome.

    Args:
        constraints: Genome constraints
        use_neural_net: Whether to initialize neural genome
        neural_hidden_size: Hidden layer size for neural network
        neural_output_bias: Initial bias for output neurons
        neural_mode: Neural network mode ('pure' or 'hybrid')
        time_encoding: Time encoding for hybrid mode ('cyclic', 'sin', 'raw')
        use_proprioception: Whether to include proprioception inputs
        proprioception_inputs: Which proprioception inputs to use ('strain', 'velocity', 'ground', 'all')
        use_neat: Whether to create NEAT genome instead of fixed-topology
        innovation_counter: Innovation counter for NEAT (optional, created if None and use_neat=True)
        bias_mode: Bias implementation ('none', 'node', 'bias_node')
        neat_initial_connectivity: Initial NEAT network connectivity ('full', 'sparse', 'none')

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
    neat_genome = None
    controller_type = 'oscillator'

    if use_neural_net and len(muscles) > 0:
        # Calculate input size based on mode, time encoding, and proprioception
        input_size = get_input_size(
            neural_mode, time_encoding, use_proprioception, proprioception_inputs
        )

        if use_neat:
            # Create NEAT genome with minimal topology
            neat_genome_obj = create_minimal_neat_genome(
                input_size=input_size,
                output_size=len(muscles),
                output_bias=neural_output_bias,
                innovation_counter=innovation_counter,
                bias_mode=bias_mode,
                connectivity=neat_initial_connectivity,
            )
            neat_genome = neat_genome_obj.model_dump()
        else:
            # Create fixed-topology neural genome
            neural_genome = initialize_neural_genome(
                num_muscles=len(muscles),
                hidden_size=neural_hidden_size,
                input_size=input_size,
                output_bias=neural_output_bias,
            )
        controller_type = 'neural'

    result = {
        'id': generate_id('creature'),
        'generation': 0,
        'survivalStreak': 0,
        'parentIds': [],
        'nodes': nodes,
        'muscles': muscles,
        'globalFrequencyMultiplier': random_range(0.8, 1.2),
        'controllerType': controller_type,
        'color': {
            'h': random.random(),
            's': random_range(0.5, 0.9),
            'l': random_range(0.4, 0.6),
        },
    }

    # Add appropriate neural network field
    if neat_genome is not None:
        result['neatGenome'] = neat_genome
    elif neural_genome is not None:
        result['neuralGenome'] = neural_genome

    return result


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
        'damping': random_range(2.0, 4.0),  # Muscle-like damping for quick settling
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
    neural_mode: str = 'hybrid',
    time_encoding: str = 'cyclic',
    use_proprioception: bool = False,
    proprioception_inputs: str = 'all',
    use_neat: bool = False,
    innovation_counter: InnovationCounter | None = None,
    bias_mode: str = 'node',
    neat_initial_connectivity: str = 'full',
) -> list[dict]:
    """
    Generate an initial population of random genomes.

    Args:
        size: Number of genomes to generate
        constraints: Genome constraints
        use_neural_net: Whether to initialize neural genomes
        neural_hidden_size: Hidden layer size
        neural_output_bias: Initial output bias
        neural_mode: Neural network mode ('pure' or 'hybrid')
        time_encoding: Time encoding for hybrid mode ('cyclic', 'sin', 'raw')
        use_proprioception: Whether to include proprioception inputs
        proprioception_inputs: Which proprioception inputs to use ('strain', 'velocity', 'ground', 'all')
        use_neat: Whether to create NEAT genomes instead of fixed-topology
        innovation_counter: Innovation counter for NEAT (shared across population)
        bias_mode: Bias implementation ('none', 'node', 'bias_node')
        neat_initial_connectivity: Initial NEAT network connectivity ('full', 'sparse', 'none')

    Returns:
        List of genome dicts
    """
    # Create innovation counter if using NEAT and not provided
    if use_neat and innovation_counter is None:
        innovation_counter = InnovationCounter()

    return [
        generate_random_genome(
            constraints=constraints,
            use_neural_net=use_neural_net,
            neural_hidden_size=neural_hidden_size,
            neural_output_bias=neural_output_bias,
            neural_mode=neural_mode,
            time_encoding=time_encoding,
            use_proprioception=use_proprioception,
            proprioception_inputs=proprioception_inputs,
            use_neat=use_neat,
            innovation_counter=innovation_counter,
            bias_mode=bias_mode,
            neat_initial_connectivity=neat_initial_connectivity,
        )
        for _ in range(size)
    ]


def get_population_stats(
    genomes: list[dict],
    fitness_scores: list[float],
    generation: int,
    survivor_ids: set[str] | None = None,
) -> PopulationStats:
    """
    Calculate population statistics.

    Args:
        genomes: List of genome dicts
        fitness_scores: Fitness values for each genome
        generation: Current generation number
        survivor_ids: IDs of creatures that survived selection

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
            survivor_ids=survivor_ids,
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
        survivor_ids=survivor_ids,
    )


def evolve_population(
    genomes: list[dict],
    fitness_scores: list[float],
    config: EvolutionConfig | dict | None = None,
    generation: int = 0,
    innovation_counter: InnovationCounter | None = None,
) -> tuple[list[dict], PopulationStats]:
    """
    Evolve a population to the next generation.

    Survivors (top performers) pass through unchanged.
    New creatures fill culled slots via crossover or mutation.

    When config.use_neat=True, uses NEAT-specific operations:
    - NEAT crossover aligns genes by innovation number
    - NEAT mutation includes structural operators (add node/connection)
    - NEAT distance function for speciation
    - Innovation counter tracks structural mutations

    Args:
        genomes: Current population genomes
        fitness_scores: Fitness values for each genome
        config: Evolution configuration (includes adaptive_boost_level if computed externally)
        generation: Current generation number
        innovation_counter: Innovation counter for NEAT (tracks structural mutations)

    Returns:
        Tuple of (new genomes, population stats)
    """
    if config is None:
        config = EvolutionConfig(population_size=len(genomes))
    elif isinstance(config, dict):
        # Default population_size to input size if not specified
        if 'population_size' not in config:
            config['population_size'] = len(genomes)

        # Derive use_neat first - needed to enforce NEAT defaults
        use_neat = config.get('neural_mode') == 'neat' or config.get('use_neat', False)

        # Migrate legacy use_speciation to selection_method
        use_speciation = config.get('use_speciation', False) or config.get('useSpeciation', False)
        selection_method = config.get('selection_method', 'rank')
        if use_speciation:
            selection_method = 'speciation'

        # ENFORCE NEAT defaults - speciation is REQUIRED for topology to evolve
        use_fitness_sharing = config.get('use_fitness_sharing', False)
        if use_neat:
            selection_method = 'speciation'  # FORCE ON - without this, structural innovations get culled
            use_fitness_sharing = False  # Redundant with speciation

        config = EvolutionConfig(
            population_size=config.get('population_size', 100),
            elite_count=config.get('elite_count', 5),
            cull_percentage=config.get('cull_percentage', 0.5),
            selection_method=selection_method,
            tournament_size=config.get('tournament_size', 3),
            adaptive_boost_level=config.get('adaptive_boost_level', 1.0),
            crossover_rate=config.get('crossover_rate', 0.5),
            use_crossover=config.get('use_crossover', True),
            neural_crossover_method=config.get('neural_crossover_method', 'sbx'),
            sbx_eta=config.get('sbx_eta', 2.0),
            use_fitness_sharing=use_fitness_sharing,
            sharing_radius=config.get('sharing_radius', 0.5),
            compatibility_threshold=config.get('compatibility_threshold', 1.0),
            min_species_size=config.get('min_species_size', 2),
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
            # NEAT configuration (already derived above)
            use_neat=use_neat,
            bias_mode=config.get('bias_mode', 'bias_node' if use_neat else 'node'),
            neat_add_connection_rate=config.get('neat_add_connection_rate', 0.5),
            neat_add_node_rate=config.get('neat_add_node_rate', 0.2),
            neat_enable_rate=config.get('neat_enable_rate', 0.02),
            neat_disable_rate=config.get('neat_disable_rate', 0.01),
            neat_excess_coefficient=config.get('neat_excess_coefficient', 1.0),
            neat_disjoint_coefficient=config.get('neat_disjoint_coefficient', 1.0),
            neat_weight_coefficient=config.get('neat_weight_coefficient', 0.4),
            neat_max_hidden_nodes=config.get('neat_max_hidden_nodes', 16),
        )

    # Create innovation counter if using NEAT and not provided
    if config.use_neat and innovation_counter is None:
        innovation_counter = InnovationCounter()

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

    # Apply fitness sharing if enabled (before selection)
    # This penalizes creatures in crowded niches to maintain diversity
    selection_fitness = fitness_scores
    if config.use_fitness_sharing:
        selection_fitness = apply_fitness_sharing(
            genomes, fitness_scores, config.sharing_radius
        )

    # Select survivors based on configured method
    survival_rate = 1 - config.cull_percentage
    num_survivors = max(1, int(len(genomes) * survival_rate))

    # Species list for within-species breeding (only used when selection_method='speciation')
    species_list = None

    # Apply speciation if selection_method is 'speciation'
    if config.selection_method == 'speciation':
        # Speciation groups creatures by genome similarity
        # Selection happens within each species, protecting diverse solutions
        # Use NEAT distance function if NEAT is enabled
        distance_fn = None
        if config.use_neat:
            distance_fn = create_neat_distance_fn(
                excess_coefficient=config.neat_excess_coefficient,
                disjoint_coefficient=config.neat_disjoint_coefficient,
                weight_coefficient=config.neat_weight_coefficient,
            )
        survivors, species_list = apply_speciation(
            genomes,
            selection_fitness,
            config.compatibility_threshold,
            survival_rate,
            config.min_species_size,
            distance_fn=distance_fn,
        )
    elif config.selection_method == 'truncation':
        # Strict cutoff - only top performers survive
        result = truncation_selection(genomes, selection_fitness, survival_rate)
        survivors = result.survivors
    elif config.selection_method == 'tournament':
        # Tournament selection - random groups, best of each survives
        survivors = tournament_selection(
            genomes, selection_fitness, num_survivors, config.tournament_size
        )
    else:  # 'rank' (default)
        # Rank-based selection - higher rank = higher survival probability
        # Still uses truncation for initial survival, but rank-based for breeding
        result = truncation_selection(genomes, selection_fitness, survival_rate)
        survivors = result.survivors

    # Get survivor fitness scores for rank-based selection
    # Use shared fitness for selection probabilities (if sharing enabled)
    survivor_ids = {g['id'] for g in survivors}
    survivor_fitness = [
        selection_fitness[i] for i, g in enumerate(genomes)
        if g['id'] in survivor_ids
    ]

    # Map survivor ID to RAW fitness for ancestry building (not shared)
    # We want to record actual performance, not adjusted scores
    survivor_fitness_map = {}
    for i, g in enumerate(genomes):
        if g['id'] in survivor_ids:
            survivor_fitness_map[g['id']] = fitness_scores[i]

    def build_ancestry_chain(child: dict, parent1: dict, parent1_fitness: float,
                             parent2: dict = None, parent2_fitness: float = None,
                             reproduction_type: str = 'mutation'):
        """Build ancestry chain for offspring from parent info.

        Args:
            reproduction_type: 'crossover', 'mutation', or 'clone'
        """
        # Get parent1's existing chain
        chain = list(parent1.get('ancestryChain', []))

        # Add parent1's info with reproduction type
        chain.append({
            'generation': parent1.get('generation', 0),
            'fitness': round(parent1_fitness, 1),
            'nodeCount': len(parent1.get('nodes', [])),
            'muscleCount': len(parent1.get('muscles', [])),
            'color': parent1.get('color', {'h': 0.5, 's': 0.7, 'l': 0.5}),
            'reproductionType': reproduction_type,
        })

        # For crossover, add parent2 info as well
        if parent2 and parent2_fitness is not None:
            chain.append({
                'generation': parent2.get('generation', 0),
                'fitness': round(parent2_fitness, 1),
                'nodeCount': len(parent2.get('nodes', [])),
                'muscleCount': len(parent2.get('muscles', [])),
                'color': parent2.get('color', {'h': 0.5, 's': 0.7, 'l': 0.5}),
                'reproductionType': reproduction_type,
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

    # Apply adaptive boost (computed externally and passed via config)
    # Boost level of 1.0 = no boost, 2.0 = double, etc.
    boost = config.adaptive_boost_level
    effective_mutation_rate = min(1.0, config.mutation_rate * boost)
    effective_neural_rate = min(1.0, effective_neural_rate * boost)

    # Build mutation config
    mutation_config = MutationConfig(
        rate=effective_mutation_rate,
        magnitude=config.mutation_magnitude,
        structural_rate=config.structural_rate,
        neural_rate=effective_neural_rate,
        neural_magnitude=config.weight_mutation_magnitude,
    )

    # Build NEAT mutation config if using NEAT
    neat_config = None
    if config.use_neat:
        neat_config = NEATMutationConfig(
            add_connection_rate=config.neat_add_connection_rate,
            add_node_rate=config.neat_add_node_rate,
            enable_rate=config.neat_enable_rate,
            disable_rate=config.neat_disable_rate,
            weight_mutation_rate=effective_neural_rate,
            weight_perturb_rate=0.9,
            weight_perturb_magnitude=config.weight_mutation_magnitude,
            max_hidden_nodes=config.neat_max_hidden_nodes,
            bias_mode=config.bias_mode,
        )

    # Start with survivors
    new_genomes = list(survivor_genomes)
    target_size = config.population_size
    new_creatures_needed = target_size - len(survivors)

    def create_offspring(species_members: list[dict], species_probabilities: dict[str, float]) -> dict:
        """Create a single offspring from within a species."""
        crossover_prob = config.crossover_rate if config.use_crossover else 0
        do_crossover = random.random() < crossover_prob and len(species_members) >= 2

        if do_crossover:
            # Crossover of two parents from same species
            parent1 = weighted_random_select(species_members, species_probabilities)
            parent2 = weighted_random_select(species_members, species_probabilities)

            # Ensure different parents
            attempts = 0
            while parent2['id'] == parent1['id'] and attempts < 10:
                parent2 = weighted_random_select(species_members, species_probabilities)
                attempts += 1

            # Use NEAT crossover if enabled
            parent1_fitness = survivor_fitness_map.get(parent1['id'], 0)
            parent2_fitness = survivor_fitness_map.get(parent2['id'], 0)
            child = single_point_crossover(
                parent1, parent2, constraints,
                neural_crossover_method=config.neural_crossover_method,
                sbx_eta=config.sbx_eta,
                use_neat=config.use_neat,
                fitness1=parent1_fitness,
                fitness2=parent2_fitness,
            )
            reproduction_type = 'crossover'
            # Build ancestry chain from both parents
            build_ancestry_chain(
                child, parent1, survivor_fitness_map.get(parent1['id'], 0),
                parent2, survivor_fitness_map.get(parent2['id'], 0),
                reproduction_type=reproduction_type
            )
        else:
            # Clone from single parent
            parent = weighted_random_select(species_members, species_probabilities)
            child = clone_genome(parent, constraints)
            reproduction_type = 'clone'
            # Clone inherits parent's ancestry chain
            child['ancestryChain'] = list(parent.get('ancestryChain', []))

        # Always mutate offspring - survivors are already kept unchanged
        # This ensures evolution always has variation (no duplicate genomes)
        if config.use_neat:
            # Use NEAT mutation for variable-topology networks
            child = mutate_genome_neat(
                child, innovation_counter, mutation_config, constraints, neat_config
            )
        else:
            # Use standard mutation for fixed-topology networks
            child = mutate_genome(child, mutation_config, constraints)
        # Update reproduction type if mutation was the only operator
        if reproduction_type == 'clone':
            reproduction_type = 'mutation'
            build_ancestry_chain(child, parent, survivor_fitness_map.get(parent['id'], 0),
                                 reproduction_type=reproduction_type)

        # New offspring start at next generation with 0 survival streak
        child['generation'] = next_gen
        child['survivalStreak'] = 0
        return child

    # Create new creatures to fill culled slots
    if species_list is not None and len(species_list) > 0:
        # WITHIN-SPECIES BREEDING (speciation mode)
        # Allocate offspring slots proportional to species average fitness
        total_avg_fitness = sum(max(0.01, s.avg_fitness) for s in species_list)

        # Calculate offspring allocation per species
        offspring_per_species = []
        allocated = 0
        for i, species in enumerate(species_list):
            if i == len(species_list) - 1:
                # Last species gets remaining to avoid rounding errors
                count = max(0, new_creatures_needed - allocated)
            else:
                # Proportional allocation based on average fitness
                proportion = max(0.01, species.avg_fitness) / total_avg_fitness
                count = round(new_creatures_needed * proportion)
                # Cap to not exceed remaining slots
                count = min(count, new_creatures_needed - allocated)
            offspring_per_species.append(count)
            allocated += count

        # Breed within each species
        for species, offspring_count in zip(species_list, offspring_per_species):
            if species.size == 0 or offspring_count == 0:
                continue

            # Calculate probabilities within this species
            species_probs = rank_based_probabilities(species.members, species.fitness_scores)

            # Create offspring for this species
            for _ in range(offspring_count):
                child = create_offspring(species.members, species_probs)
                new_genomes.append(child)
    else:
        # GLOBAL BREEDING (non-speciation selection methods)
        # Standard GA flow: selection → crossover (optional) → mutation (optional)
        for _ in range(new_creatures_needed):
            child = create_offspring(survivors, probabilities)
            new_genomes.append(child)

    # Clear innovation cache at end of generation (same structural mutation
    # in different creatures within a generation should get same innovation ID,
    # but next generation should start fresh)
    if config.use_neat and innovation_counter is not None:
        innovation_counter.clear_generation_cache()

    # Calculate stats (include survivor_ids for frontend to know which creatures died)
    stats = get_population_stats(genomes, fitness_scores, generation, survivor_ids)

    return new_genomes, stats

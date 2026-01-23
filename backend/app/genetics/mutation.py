"""
Mutation operators for genetic evolution.

Ported from TypeScript src/genetics/Mutation.ts.
Works with genome dicts (matching API schema).
"""

import math
import random
import uuid
from dataclasses import dataclass
from typing import Any


@dataclass
class MutationConfig:
    """Configuration for mutation operations."""

    rate: float = 0.3  # Per-gene mutation probability
    magnitude: float = 0.5  # Scale of mutation (0-1)
    structural_rate: float = 0.1  # Add/remove nodes/muscles probability
    neural_rate: float = 0.1  # Per-weight mutation probability
    neural_magnitude: float = 0.3  # Std dev of weight perturbation


@dataclass
class GenomeConstraints:
    """Constraints for genome generation and mutation."""

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


def generate_id(prefix: str = '') -> str:
    """Generate a unique ID with optional prefix."""
    return f"{prefix}_{uuid.uuid4().hex[:8]}"


def clamp(value: float, min_val: float, max_val: float) -> float:
    """Clamp value to range [min_val, max_val]."""
    return max(min_val, min(max_val, value))


def distance(a: dict, b: dict) -> float:
    """Calculate Euclidean distance between two 3D points."""
    dx = a.get('x', 0) - b.get('x', 0)
    dy = a.get('y', 0) - b.get('y', 0)
    dz = a.get('z', 0) - b.get('z', 0)
    return math.sqrt(dx * dx + dy * dy + dz * dz)


def normalize(v: dict) -> dict:
    """Normalize a 3D vector to unit length."""
    x, y, z = v.get('x', 0), v.get('y', 0), v.get('z', 0)
    length = math.sqrt(x * x + y * y + z * z)
    if length < 1e-8:
        return {'x': 0, 'y': 1, 'z': 0}  # Default up vector
    return {'x': x / length, 'y': y / length, 'z': z / length}


def random_unit_vector() -> dict:
    """Generate a random unit vector (uniformly distributed on sphere)."""
    theta = random.random() * math.pi * 2
    phi = math.acos(2 * random.random() - 1)
    return {
        'x': math.sin(phi) * math.cos(theta),
        'y': math.sin(phi) * math.sin(theta),
        'z': math.cos(phi)
    }


def random_gaussian() -> float:
    """Generate random number from standard normal distribution (Box-Muller)."""
    u1 = random.random()
    u2 = random.random()
    # Avoid log(0)
    u1 = max(u1, 1e-10)
    return math.sqrt(-2 * math.log(u1)) * math.cos(2 * math.pi * u2)


def mutate_value(
    value: float,
    min_val: float,
    max_val: float,
    magnitude: float,
) -> float:
    """Mutate a value within bounds."""
    range_val = max_val - min_val
    delta = (random.random() * 2 - 1) * range_val * magnitude
    return clamp(value + delta, min_val, max_val)


def mutate_node(
    node: dict,
    config: MutationConfig,
    constraints: GenomeConstraints,
) -> dict:
    """Mutate a node gene."""
    new_node = dict(node)
    new_node['id'] = generate_id('node')

    # Mutate size
    if random.random() < config.rate:
        new_node['size'] = mutate_value(
            node.get('size', 0.5),
            constraints.min_size,
            constraints.max_size,
            config.magnitude
        )

    # Mutate friction
    if random.random() < config.rate:
        new_node['friction'] = mutate_value(
            node.get('friction', 0.5),
            0.1, 1.0,
            config.magnitude
        )

    # Mutate position slightly
    if random.random() < config.rate:
        pos = node.get('position', {'x': 0, 'y': 0.5, 'z': 0})
        new_node['position'] = {
            'x': mutate_value(pos.get('x', 0), -constraints.spawn_radius, constraints.spawn_radius, config.magnitude * 0.5),
            'y': mutate_value(pos.get('y', 0.5), 0.3, constraints.spawn_radius * 1.5, config.magnitude * 0.5),
            'z': mutate_value(pos.get('z', 0), -constraints.spawn_radius, constraints.spawn_radius, config.magnitude * 0.5),
        }

    return new_node


def mutate_muscle(
    muscle: dict,
    config: MutationConfig,
    constraints: GenomeConstraints,
) -> dict:
    """Mutate a muscle gene."""
    new_muscle = dict(muscle)
    new_muscle['id'] = generate_id('muscle')

    # Stiffness
    if random.random() < config.rate:
        new_muscle['stiffness'] = mutate_value(
            muscle.get('stiffness', 100),
            constraints.min_stiffness,
            constraints.max_stiffness,
            config.magnitude
        )

    # Damping
    if random.random() < config.rate:
        new_muscle['damping'] = mutate_value(
            muscle.get('damping', 0.5),
            0.05, 0.8,
            config.magnitude
        )

    # Frequency
    if random.random() < config.rate:
        new_muscle['frequency'] = mutate_value(
            muscle.get('frequency', 1.0),
            constraints.min_frequency,
            constraints.max_frequency,
            config.magnitude
        )

    # Amplitude
    if random.random() < config.rate:
        new_muscle['amplitude'] = mutate_value(
            muscle.get('amplitude', 0.3),
            0.05,
            constraints.max_amplitude,
            config.magnitude
        )

    # Phase (use modulo to wrap around, keeping in [0, 2π) range)
    if random.random() < config.rate:
        phase = muscle.get('phase', 0)
        delta = (random.random() * 2 - 1) * math.pi * 2 * config.magnitude
        new_muscle['phase'] = (phase + delta) % (math.pi * 2)

    # Rest length (smaller magnitude to avoid drastic changes)
    if random.random() < config.rate:
        new_muscle['restLength'] = mutate_value(
            muscle.get('restLength', 1.0),
            0.2, 4.0,
            config.magnitude * 0.3
        )

    # v1: Direction bias
    direction_bias = muscle.get('directionBias') or muscle.get('direction_bias')
    if random.random() < config.rate and direction_bias:
        perturbed = {
            'x': direction_bias.get('x', 0) + (random.random() * 2 - 1) * config.magnitude,
            'y': direction_bias.get('y', 1) + (random.random() * 2 - 1) * config.magnitude,
            'z': direction_bias.get('z', 0) + (random.random() * 2 - 1) * config.magnitude,
        }
        new_muscle['directionBias'] = normalize(perturbed)

    # v1: Bias strength
    bias_strength = muscle.get('biasStrength') or muscle.get('bias_strength')
    if random.random() < config.rate and bias_strength is not None:
        new_muscle['biasStrength'] = mutate_value(bias_strength, 0, 1.0, config.magnitude)

    # v2: Velocity bias
    velocity_bias = muscle.get('velocityBias') or muscle.get('velocity_bias')
    if random.random() < config.rate and velocity_bias:
        perturbed = {
            'x': velocity_bias.get('x', 0) + (random.random() * 2 - 1) * config.magnitude,
            'y': velocity_bias.get('y', 1) + (random.random() * 2 - 1) * config.magnitude,
            'z': velocity_bias.get('z', 0) + (random.random() * 2 - 1) * config.magnitude,
        }
        new_muscle['velocityBias'] = normalize(perturbed)

    # v2: Velocity strength
    velocity_strength = muscle.get('velocityStrength') or muscle.get('velocity_strength')
    if random.random() < config.rate and velocity_strength is not None:
        new_muscle['velocityStrength'] = mutate_value(velocity_strength, 0, 1.0, config.magnitude)

    # v2: Distance bias
    distance_bias = muscle.get('distanceBias') or muscle.get('distance_bias')
    if random.random() < config.rate and distance_bias is not None:
        new_muscle['distanceBias'] = mutate_value(distance_bias, -1.0, 1.0, config.magnitude)

    # v2: Distance strength
    distance_strength = muscle.get('distanceStrength') or muscle.get('distance_strength')
    if random.random() < config.rate and distance_strength is not None:
        new_muscle['distanceStrength'] = mutate_value(distance_strength, 0, 1.0, config.magnitude)

    return new_muscle


def add_node(
    genome: dict,
    constraints: GenomeConstraints,
) -> tuple[dict, dict] | None:
    """
    Add a new node to the genome with a connecting muscle.

    Returns (node, muscle) tuple or None if at limits.
    """
    nodes = genome.get('nodes', [])
    muscles = genome.get('muscles', [])

    # Check limits
    if len(nodes) >= constraints.max_nodes or len(muscles) >= constraints.max_muscles:
        return None

    # Create new node near an existing node
    parent_node = random.choice(nodes)
    parent_pos = parent_node.get('position', {'x': 0, 'y': 0.5, 'z': 0})

    new_node = {
        'id': generate_id('node'),
        'size': random.random() * (constraints.max_size - constraints.min_size) + constraints.min_size,
        'friction': random.random() * 0.5 + 0.3,
        'position': {
            'x': parent_pos.get('x', 0) + (random.random() * 2 - 1) * 1.5,
            'y': parent_pos.get('y', 0.5) + (random.random() * 2 - 1) * 1.0,
            'z': parent_pos.get('z', 0) + (random.random() * 2 - 1) * 1.5,
        }
    }

    # Ensure node is above ground
    new_node['position']['y'] = max(new_node['size'] * 0.5, new_node['position']['y'])

    rest_length = distance(parent_pos, new_node['position'])

    # Create muscle connecting to parent
    new_muscle = {
        'id': generate_id('muscle'),
        'nodeA': parent_node['id'],
        'nodeB': new_node['id'],
        'restLength': max(0.1, rest_length * (random.random() * 0.4 + 0.8)),
        'stiffness': random.random() * (constraints.max_stiffness - constraints.min_stiffness) + constraints.min_stiffness,
        'damping': random.random() * 0.4 + 0.1,
        'frequency': random.random() * (constraints.max_frequency - constraints.min_frequency) + constraints.min_frequency,
        'amplitude': random.random() * constraints.max_amplitude,
        'phase': random.random() * math.pi * 2,
        # v1: Direction sensing
        'directionBias': random_unit_vector(),
        'biasStrength': random.random() * 0.8,
        # v2: Velocity sensing
        'velocityBias': random_unit_vector(),
        'velocityStrength': random.random() * 0.5,
        # v2: Distance awareness
        'distanceBias': random.random() * 2 - 1,
        'distanceStrength': random.random() * 0.5,
    }

    return (new_node, new_muscle)


def remove_node(
    genome: dict,
    constraints: GenomeConstraints,
) -> tuple[str, list[str]] | None:
    """
    Remove a node and its connected muscles.

    Returns (node_id, muscle_ids) tuple or None if at minimum.
    """
    nodes = genome.get('nodes', [])
    muscles = genome.get('muscles', [])

    if len(nodes) <= constraints.min_nodes:
        return None

    # Count connections for each node
    connection_counts: dict[str, int] = {node['id']: 0 for node in nodes}
    for muscle in muscles:
        node_a = muscle.get('nodeA') or muscle.get('node_a', '')
        node_b = muscle.get('nodeB') or muscle.get('node_b', '')
        if node_a in connection_counts:
            connection_counts[node_a] += 1
        if node_b in connection_counts:
            connection_counts[node_b] += 1

    # Sort by connection count (ascending) and pick from less connected
    sorted_nodes = sorted(nodes, key=lambda n: connection_counts.get(n['id'], 0))

    # Pick from the bottom half
    candidate_count = max(1, len(sorted_nodes) // 2)
    node_to_remove = random.choice(sorted_nodes[:candidate_count])

    # Find all muscles connected to this node
    muscle_ids = [
        m['id'] for m in muscles
        if (m.get('nodeA') or m.get('node_a', '')) == node_to_remove['id']
        or (m.get('nodeB') or m.get('node_b', '')) == node_to_remove['id']
    ]

    return (node_to_remove['id'], muscle_ids)


def add_muscle(
    genome: dict,
    constraints: GenomeConstraints,
) -> dict | None:
    """
    Add a new muscle between existing unconnected nodes.

    Returns new muscle or None if not possible.
    """
    nodes = genome.get('nodes', [])
    muscles = genome.get('muscles', [])

    if len(muscles) >= constraints.max_muscles:
        return None

    # Find existing connections
    existing = set()
    for muscle in muscles:
        node_a = muscle.get('nodeA') or muscle.get('node_a', '')
        node_b = muscle.get('nodeB') or muscle.get('node_b', '')
        key = '-'.join(sorted([node_a, node_b]))
        existing.add(key)

    # Find unconnected pairs
    possible_pairs = []
    for i, node_a in enumerate(nodes):
        for node_b in nodes[i + 1:]:
            key = '-'.join(sorted([node_a['id'], node_b['id']]))
            if key not in existing:
                possible_pairs.append((node_a, node_b))

    if not possible_pairs:
        return None

    node_a, node_b = random.choice(possible_pairs)
    pos_a = node_a.get('position', {'x': 0, 'y': 0.5, 'z': 0})
    pos_b = node_b.get('position', {'x': 0, 'y': 0.5, 'z': 0})
    rest_length = distance(pos_a, pos_b)

    return {
        'id': generate_id('muscle'),
        'nodeA': node_a['id'],
        'nodeB': node_b['id'],
        'restLength': max(0.1, rest_length * (random.random() * 0.4 + 0.8)),
        'stiffness': random.random() * (constraints.max_stiffness - constraints.min_stiffness) + constraints.min_stiffness,
        'damping': random.random() * 0.4 + 0.1,
        'frequency': random.random() * (constraints.max_frequency - constraints.min_frequency) + constraints.min_frequency,
        'amplitude': random.random() * constraints.max_amplitude,
        'phase': random.random() * math.pi * 2,
        # v1: Direction sensing
        'directionBias': random_unit_vector(),
        'biasStrength': random.random() * 0.8,
        # v2: Velocity sensing
        'velocityBias': random_unit_vector(),
        'velocityStrength': random.random() * 0.5,
        # v2: Distance awareness
        'distanceBias': random.random() * 2 - 1,
        'distanceStrength': random.random() * 0.5,
    }


def mutate_neural_weights(
    weights: list[float],
    mutation_rate: float,
    mutation_magnitude: float,
) -> list[float]:
    """
    Mutate neural network weights with Gaussian perturbation.

    Args:
        weights: Flat array of network weights
        mutation_rate: Probability each weight mutates (0-1)
        mutation_magnitude: Standard deviation of Gaussian perturbation

    Returns:
        New mutated weight array
    """
    return [
        w + random_gaussian() * mutation_magnitude if random.random() < mutation_rate else w
        for w in weights
    ]


def mutate_neural_genome(
    neural_genome: dict,
    mutation_rate: float,
    mutation_magnitude: float,
) -> dict:
    """
    Mutate a complete neural genome.

    Args:
        neural_genome: Neural genome dict with weights
        mutation_rate: Probability each weight mutates
        mutation_magnitude: Standard deviation of perturbation

    Returns:
        New mutated neural genome
    """
    new_genome = dict(neural_genome)

    # Mutate all weight arrays
    for key in ['weights_ih', 'weights_ho']:
        if key in new_genome:
            new_genome[key] = mutate_neural_weights(
                new_genome[key],
                mutation_rate,
                mutation_magnitude
            )

    # Mutate biases
    for key in ['biases_h', 'biases_o']:
        if key in new_genome:
            new_genome[key] = mutate_neural_weights(
                new_genome[key],
                mutation_rate,
                mutation_magnitude
            )

    return new_genome


def mutate_genome(
    genome: dict,
    config: MutationConfig | None = None,
    constraints: GenomeConstraints | None = None,
) -> dict:
    """
    Mutate an entire genome.

    Args:
        genome: Genome dict to mutate
        config: Mutation configuration
        constraints: Genome constraints

    Returns:
        New mutated genome (original is not modified)
    """
    if config is None:
        config = MutationConfig()
    if constraints is None:
        constraints = GenomeConstraints()

    nodes = genome.get('nodes', [])
    muscles = genome.get('muscles', [])

    # Mutate nodes and create ID mapping
    new_nodes = []
    old_to_new_id: dict[str, str] = {}

    for node in nodes:
        new_node = mutate_node(node, config, constraints)
        old_to_new_id[node['id']] = new_node['id']
        new_nodes.append(new_node)

    # Mutate muscles with updated node references
    new_muscles = []
    for muscle in muscles:
        new_muscle = mutate_muscle(muscle, config, constraints)
        # Update node references
        old_a = muscle.get('nodeA') or muscle.get('node_a', '')
        old_b = muscle.get('nodeB') or muscle.get('node_b', '')
        new_muscle['nodeA'] = old_to_new_id.get(old_a, old_a)
        new_muscle['nodeB'] = old_to_new_id.get(old_b, old_b)
        new_muscles.append(new_muscle)

    # Build new genome
    new_genome = {
        'id': generate_id('creature'),
        'generation': genome.get('generation', 0),  # Mutation doesn't change generation
        'parentIds': genome.get('parentIds', genome.get('parent_ids', [])),
        'survivalStreak': genome.get('survivalStreak', genome.get('survival_streak', 0)),
        'nodes': new_nodes,
        'muscles': new_muscles,
        'globalFrequencyMultiplier': genome.get('globalFrequencyMultiplier', genome.get('global_frequency_multiplier', 1.0)),
        'controllerType': genome.get('controllerType', genome.get('controller_type', 'oscillator')),
    }

    # Mutate global frequency multiplier
    if random.random() < config.rate:
        new_genome['globalFrequencyMultiplier'] = mutate_value(
            new_genome['globalFrequencyMultiplier'],
            0.3, 2.0,
            config.magnitude
        )

    # Mutate color if present
    color = genome.get('color')
    if color:
        new_color = dict(color)
        if random.random() < config.rate * 0.5:
            new_color['h'] = (color.get('h', 0.5) + (random.random() * 0.1 - 0.05) + 1) % 1
        new_genome['color'] = new_color

    # Structural mutations
    if random.random() < config.structural_rate:
        result = add_node(new_genome, constraints)
        if result:
            node, muscle = result
            new_genome['nodes'].append(node)
            new_genome['muscles'].append(muscle)

    if random.random() < config.structural_rate:
        result = remove_node(new_genome, constraints)
        if result:
            node_id, muscle_ids = result
            new_genome['nodes'] = [n for n in new_genome['nodes'] if n['id'] != node_id]
            new_genome['muscles'] = [m for m in new_genome['muscles'] if m['id'] not in muscle_ids]

    if random.random() < config.structural_rate:
        new_muscle = add_muscle(new_genome, constraints)
        if new_muscle:
            new_genome['muscles'].append(new_muscle)

    # Mutate neural genome if present
    neural_genome = genome.get('neuralGenome') or genome.get('neural_genome')
    if neural_genome:
        new_genome['neuralGenome'] = mutate_neural_genome(
            neural_genome,
            config.neural_rate,
            config.neural_magnitude
        )

    return new_genome

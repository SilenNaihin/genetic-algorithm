"""
Crossover operators for genetic evolution.

Ported from TypeScript src/genetics/Crossover.ts.
Works with genome dicts (matching API schema).
"""

import math
import random
from dataclasses import dataclass
from typing import Any

from .mutation import generate_id, distance, normalize, GenomeConstraints

DEFAULT_OUTPUT_BIAS = 0.0


def lerp(a: float, b: float, t: float) -> float:
    """Linear interpolation between a and b."""
    return a + (b - a) * t


def clamp_phase(phase: float) -> float:
    """Clamp phase to [0, 2π) range using modulo."""
    two_pi = math.pi * 2
    return phase % two_pi


def lerp_vector3(a: dict, b: dict, t: float) -> dict:
    """Linear interpolation between two 3D vectors."""
    return {
        'x': lerp(a.get('x', 0), b.get('x', 0), t),
        'y': lerp(a.get('y', 0), b.get('y', 0), t),
        'z': lerp(a.get('z', 0), b.get('z', 0), t),
    }


def lerp_hsl(a: dict | None, b: dict | None, t: float) -> dict:
    """Linear interpolation between two HSL colors."""
    if not a and not b:
        return {'h': random.random(), 's': 0.7, 'l': 0.5}
    if not a:
        return dict(b)
    if not b:
        return dict(a)
    return {
        'h': lerp(a.get('h', 0.5), b.get('h', 0.5), t),
        's': lerp(a.get('s', 0.7), b.get('s', 0.7), t),
        'l': lerp(a.get('l', 0.5), b.get('l', 0.5), t),
    }


def single_point_crossover(
    parent1: dict,
    parent2: dict,
    constraints: GenomeConstraints | None = None,
    neural_crossover_method: str = 'interpolation',
    sbx_eta: float = 2.0,
) -> dict:
    """
    Single-point crossover on genome properties.
    Takes structure from parent1 and interpolates values with parent2.

    Args:
        parent1: First parent genome
        parent2: Second parent genome
        constraints: Genome constraints
        neural_crossover_method: Method for neural weight crossover ('interpolation', 'uniform', 'sbx')
        sbx_eta: Distribution index for SBX crossover (0.5-5.0)

    Returns:
        Child genome
    """
    if constraints is None:
        constraints = GenomeConstraints()

    nodes1 = parent1.get('nodes', [])
    nodes2 = parent2.get('nodes', [])
    muscles1 = parent1.get('muscles', [])
    muscles2 = parent2.get('muscles', [])

    # Limit nodes based on muscle constraint
    effective_max_nodes = min(constraints.max_nodes, constraints.max_muscles + 1)
    node_count = min(len(nodes1), effective_max_nodes)

    # Create child nodes with interpolated values
    child_nodes = []
    old_to_new_id: dict[str, str] = {}

    for i in range(node_count):
        node1 = nodes1[i]
        node2 = nodes2[i % len(nodes2)]
        t = random.random()

        new_node = {
            'id': generate_id('node'),
            'size': lerp(node1.get('size', 0.5), node2.get('size', 0.5), t),
            'friction': lerp(node1.get('friction', 0.5), node2.get('friction', 0.5), t),
            'position': lerp_vector3(
                node1.get('position', {'x': 0, 'y': 0.5, 'z': 0}),
                node2.get('position', {'x': 0, 'y': 0.5, 'z': 0}),
                t * 0.5  # Less position mixing for stability
            ),
        }
        child_nodes.append(new_node)
        old_to_new_id[node1['id']] = new_node['id']

    # Create child muscles with interpolated values
    child_muscles = []

    for i in range(len(muscles1)):
        if len(child_muscles) >= constraints.max_muscles:
            break

        muscle1 = muscles1[i]
        muscle2 = muscles2[i % len(muscles2)]
        t = random.random()

        # Get node references
        old_a = muscle1.get('nodeA') or muscle1.get('node_a', '')
        old_b = muscle1.get('nodeB') or muscle1.get('node_b', '')
        node_a = old_to_new_id.get(old_a)
        node_b = old_to_new_id.get(old_b)

        # Skip if either node wasn't included
        if not node_a or not node_b:
            continue

        # Calculate new rest length based on actual positions
        node_a_data = next((n for n in child_nodes if n['id'] == node_a), None)
        node_b_data = next((n for n in child_nodes if n['id'] == node_b), None)
        if node_a_data and node_b_data:
            actual_distance = distance(node_a_data['position'], node_b_data['position'])
        else:
            actual_distance = lerp(
                muscle1.get('restLength', 1.0),
                muscle2.get('restLength', 1.0),
                t
            )

        # v1: Interpolate direction bias
        dir1 = muscle1.get('directionBias') or muscle1.get('direction_bias') or {'x': 0, 'y': 1, 'z': 0}
        dir2 = muscle2.get('directionBias') or muscle2.get('direction_bias') or {'x': 0, 'y': 1, 'z': 0}
        lerped_dir = normalize(lerp_vector3(dir1, dir2, t))

        # v2: Interpolate velocity bias
        vel1 = muscle1.get('velocityBias') or muscle1.get('velocity_bias') or {'x': 0, 'y': 1, 'z': 0}
        vel2 = muscle2.get('velocityBias') or muscle2.get('velocity_bias') or {'x': 0, 'y': 1, 'z': 0}
        lerped_vel = normalize(lerp_vector3(vel1, vel2, t))

        child_muscles.append({
            'id': generate_id('muscle'),
            'nodeA': node_a,
            'nodeB': node_b,
            'restLength': max(0.1, actual_distance * lerp(0.9, 1.1, random.random())),
            'stiffness': lerp(muscle1.get('stiffness', 100), muscle2.get('stiffness', 100), t),
            'damping': lerp(muscle1.get('damping', 0.5), muscle2.get('damping', 0.5), t),
            'frequency': lerp(muscle1.get('frequency', 1.0), muscle2.get('frequency', 1.0), t),
            'amplitude': lerp(muscle1.get('amplitude', 0.3), muscle2.get('amplitude', 0.3), t),
            'phase': clamp_phase(lerp(muscle1.get('phase', 0), muscle2.get('phase', 0), t)),
            # v1: Direction sensing
            'directionBias': lerped_dir,
            'biasStrength': lerp(
                muscle1.get('biasStrength') or muscle1.get('bias_strength') or 0,
                muscle2.get('biasStrength') or muscle2.get('bias_strength') or 0,
                t
            ),
            # v2: Velocity sensing
            'velocityBias': lerped_vel,
            'velocityStrength': lerp(
                muscle1.get('velocityStrength') or muscle1.get('velocity_strength') or 0,
                muscle2.get('velocityStrength') or muscle2.get('velocity_strength') or 0,
                t
            ),
            # v2: Distance awareness
            'distanceBias': lerp(
                muscle1.get('distanceBias') or muscle1.get('distance_bias') or 0,
                muscle2.get('distanceBias') or muscle2.get('distance_bias') or 0,
                t
            ),
            'distanceStrength': lerp(
                muscle1.get('distanceStrength') or muscle1.get('distance_strength') or 0,
                muscle2.get('distanceStrength') or muscle2.get('distance_strength') or 0,
                t
            ),
        })

    # Handle neural genome crossover
    neural_genome = None
    neural1 = parent1.get('neuralGenome') or parent1.get('neural_genome')
    neural2 = parent2.get('neuralGenome') or parent2.get('neural_genome')

    if neural1 and neural2:
        # Use configured crossover method for neural weights
        if neural_crossover_method == 'uniform':
            neural_genome = uniform_crossover_neural_weights(neural1, neural2)
        elif neural_crossover_method == 'sbx':
            neural_genome = sbx_crossover_neural_weights(neural1, neural2, sbx_eta)
        else:  # 'interpolation' (default)
            neural_genome = crossover_neural_weights(neural1, neural2)
        # Adapt if muscle count changed
        if get_output_size(neural_genome) != len(child_muscles):
            neural_genome = adapt_neural_topology(neural_genome, len(child_muscles))
    elif neural1:
        neural_genome = clone_neural_genome(neural1)
        if get_output_size(neural_genome) != len(child_muscles):
            neural_genome = adapt_neural_topology(neural_genome, len(child_muscles))

    gen1 = parent1.get('generation', 0)
    gen2 = parent2.get('generation', 0)

    return {
        'id': generate_id('creature'),
        'generation': max(gen1, gen2) + 1,
        'survivalStreak': 0,
        'parentIds': [parent1['id'], parent2['id']],
        'nodes': child_nodes,
        'muscles': child_muscles,
        'globalFrequencyMultiplier': lerp(
            parent1.get('globalFrequencyMultiplier', parent1.get('global_frequency_multiplier', 1.0)),
            parent2.get('globalFrequencyMultiplier', parent2.get('global_frequency_multiplier', 1.0)),
            random.random()
        ),
        'controllerType': parent1.get('controllerType', parent1.get('controller_type', 'oscillator')),
        'neuralGenome': neural_genome,
        'color': lerp_hsl(parent1.get('color'), parent2.get('color'), random.random()),
    }


def uniform_crossover(
    parent1: dict,
    parent2: dict,
    constraints: GenomeConstraints | None = None,
) -> dict:
    """
    Uniform crossover - randomly pick each gene from either parent.

    Args:
        parent1: First parent genome
        parent2: Second parent genome
        constraints: Genome constraints

    Returns:
        Child genome
    """
    if constraints is None:
        constraints = GenomeConstraints()

    # Randomly choose which parent provides the structure
    if random.random() < 0.5:
        structure_parent, other_parent = parent1, parent2
    else:
        structure_parent, other_parent = parent2, parent1

    nodes_s = structure_parent.get('nodes', [])
    nodes_o = other_parent.get('nodes', [])
    muscles_s = structure_parent.get('muscles', [])
    muscles_o = other_parent.get('muscles', [])

    # Limit nodes
    effective_max_nodes = min(constraints.max_nodes, constraints.max_muscles + 1)
    node_count = min(len(nodes_s), effective_max_nodes)

    child_nodes = []
    old_to_new_id: dict[str, str] = {}

    for i in range(node_count):
        node_s = nodes_s[i]
        node_o = nodes_o[i % len(nodes_o)] if nodes_o else node_s

        # Randomly pick each property from either parent
        new_node = {
            'id': generate_id('node'),
            'size': node_s.get('size', 0.5) if random.random() < 0.5 else node_o.get('size', 0.5),
            'friction': node_s.get('friction', 0.5) if random.random() < 0.5 else node_o.get('friction', 0.5),
            'position': dict(node_s.get('position', {'x': 0, 'y': 0.5, 'z': 0})),
        }
        child_nodes.append(new_node)
        old_to_new_id[node_s['id']] = new_node['id']

    # Create child muscles
    child_muscles = []

    for i in range(len(muscles_s)):
        if len(child_muscles) >= constraints.max_muscles:
            break

        muscle_s = muscles_s[i]
        muscle_o = muscles_o[i % len(muscles_o)] if muscles_o else muscle_s

        old_a = muscle_s.get('nodeA') or muscle_s.get('node_a', '')
        old_b = muscle_s.get('nodeB') or muscle_s.get('node_b', '')
        node_a = old_to_new_id.get(old_a)
        node_b = old_to_new_id.get(old_b)

        if not node_a or not node_b:
            continue

        # Pick each property randomly
        child_muscles.append({
            'id': generate_id('muscle'),
            'nodeA': node_a,
            'nodeB': node_b,
            'restLength': muscle_s.get('restLength', 1.0) if random.random() < 0.5 else muscle_o.get('restLength', 1.0),
            'stiffness': muscle_s.get('stiffness', 100) if random.random() < 0.5 else muscle_o.get('stiffness', 100),
            'damping': muscle_s.get('damping', 0.5) if random.random() < 0.5 else muscle_o.get('damping', 0.5),
            'frequency': muscle_s.get('frequency', 1.0) if random.random() < 0.5 else muscle_o.get('frequency', 1.0),
            'amplitude': muscle_s.get('amplitude', 0.3) if random.random() < 0.5 else muscle_o.get('amplitude', 0.3),
            'phase': clamp_phase(muscle_s.get('phase', 0) if random.random() < 0.5 else muscle_o.get('phase', 0)),
            # v1
            'directionBias': (muscle_s.get('directionBias') or {'x': 0, 'y': 1, 'z': 0}) if random.random() < 0.5 else (muscle_o.get('directionBias') or {'x': 0, 'y': 1, 'z': 0}),
            'biasStrength': (muscle_s.get('biasStrength') or 0) if random.random() < 0.5 else (muscle_o.get('biasStrength') or 0),
            # v2
            'velocityBias': (muscle_s.get('velocityBias') or {'x': 0, 'y': 1, 'z': 0}) if random.random() < 0.5 else (muscle_o.get('velocityBias') or {'x': 0, 'y': 1, 'z': 0}),
            'velocityStrength': (muscle_s.get('velocityStrength') or 0) if random.random() < 0.5 else (muscle_o.get('velocityStrength') or 0),
            'distanceBias': (muscle_s.get('distanceBias') or 0) if random.random() < 0.5 else (muscle_o.get('distanceBias') or 0),
            'distanceStrength': (muscle_s.get('distanceStrength') or 0) if random.random() < 0.5 else (muscle_o.get('distanceStrength') or 0),
        })

    # Handle neural genome
    neural_genome = None
    neural1 = parent1.get('neuralGenome') or parent1.get('neural_genome')
    neural2 = parent2.get('neuralGenome') or parent2.get('neural_genome')

    if neural1 and neural2:
        neural_genome = uniform_crossover_neural_weights(neural1, neural2)
        if get_output_size(neural_genome) != len(child_muscles):
            neural_genome = adapt_neural_topology(neural_genome, len(child_muscles))
    elif neural1:
        neural_genome = clone_neural_genome(neural1)
        if get_output_size(neural_genome) != len(child_muscles):
            neural_genome = adapt_neural_topology(neural_genome, len(child_muscles))

    gen1 = parent1.get('generation', 0)
    gen2 = parent2.get('generation', 0)

    return {
        'id': generate_id('creature'),
        'generation': max(gen1, gen2) + 1,
        'survivalStreak': 0,
        'parentIds': [parent1['id'], parent2['id']],
        'nodes': child_nodes,
        'muscles': child_muscles,
        'globalFrequencyMultiplier': parent1.get('globalFrequencyMultiplier', 1.0) if random.random() < 0.5 else parent2.get('globalFrequencyMultiplier', 1.0),
        'controllerType': parent1.get('controllerType', 'oscillator'),
        'neuralGenome': neural_genome,
        'color': lerp_hsl(parent1.get('color'), parent2.get('color'), 0.5),
    }


def clone_genome(
    genome: dict,
    constraints: GenomeConstraints | None = None,
) -> dict:
    """
    Clone a genome (no crossover, increment generation).

    Args:
        genome: Genome to clone
        constraints: Genome constraints

    Returns:
        Cloned genome with new IDs
    """
    if constraints is None:
        constraints = GenomeConstraints()

    nodes = genome.get('nodes', [])
    muscles = genome.get('muscles', [])

    effective_max_nodes = min(constraints.max_nodes, constraints.max_muscles + 1)
    node_count = min(len(nodes), effective_max_nodes)

    # Clone nodes with new IDs
    new_nodes = []
    old_to_new_id: dict[str, str] = {}

    for i in range(node_count):
        node = nodes[i]
        new_node = {
            'id': generate_id('node'),
            'size': node.get('size', 0.5),
            'friction': node.get('friction', 0.5),
            'position': dict(node.get('position', {'x': 0, 'y': 0.5, 'z': 0})),
        }
        new_nodes.append(new_node)
        old_to_new_id[node['id']] = new_node['id']

    # Clone muscles
    new_muscles = []
    for muscle in muscles:
        if len(new_muscles) >= constraints.max_muscles:
            break

        old_a = muscle.get('nodeA') or muscle.get('node_a', '')
        old_b = muscle.get('nodeB') or muscle.get('node_b', '')
        node_a = old_to_new_id.get(old_a)
        node_b = old_to_new_id.get(old_b)

        if not node_a or not node_b:
            continue

        new_muscles.append({
            'id': generate_id('muscle'),
            'nodeA': node_a,
            'nodeB': node_b,
            'restLength': muscle.get('restLength', 1.0),
            'stiffness': muscle.get('stiffness', 100),
            'damping': muscle.get('damping', 0.5),
            'frequency': muscle.get('frequency', 1.0),
            'amplitude': muscle.get('amplitude', 0.3),
            'phase': muscle.get('phase', 0),
            'directionBias': dict(muscle.get('directionBias') or {'x': 0, 'y': 1, 'z': 0}),
            'biasStrength': muscle.get('biasStrength') or 0,
            'velocityBias': dict(muscle.get('velocityBias') or {'x': 0, 'y': 1, 'z': 0}),
            'velocityStrength': muscle.get('velocityStrength') or 0,
            'distanceBias': muscle.get('distanceBias') or 0,
            'distanceStrength': muscle.get('distanceStrength') or 0,
        })

    # Clone neural genome if present
    neural_genome = genome.get('neuralGenome') or genome.get('neural_genome')
    if neural_genome:
        neural_genome = clone_neural_genome(neural_genome)

    return {
        'id': generate_id('creature'),
        'generation': genome.get('generation', 0) + 1,
        'survivalStreak': 0,
        'parentIds': [genome['id']],
        'nodes': new_nodes,
        'muscles': new_muscles,
        'globalFrequencyMultiplier': genome.get('globalFrequencyMultiplier', genome.get('global_frequency_multiplier', 1.0)),
        'controllerType': genome.get('controllerType', genome.get('controller_type', 'oscillator')),
        'neuralGenome': neural_genome,
        'color': dict(genome.get('color') or {'h': 0.5, 's': 0.7, 'l': 0.5}),
    }


# =============================================================================
# NEURAL GENOME OPERATIONS
# =============================================================================


def get_output_size(neural_genome: dict) -> int:
    """Get the output size from a neural genome."""
    # Check new format (separate arrays)
    if 'output_size' in neural_genome:
        return neural_genome['output_size']
    # Check old format (topology dict)
    if 'topology' in neural_genome:
        return neural_genome['topology'].get('outputSize', neural_genome['topology'].get('output_size', 0))
    return 0


def get_hidden_size(neural_genome: dict) -> int:
    """Get the hidden size from a neural genome."""
    if 'hidden_size' in neural_genome:
        return neural_genome['hidden_size']
    if 'topology' in neural_genome:
        return neural_genome['topology'].get('hiddenSize', neural_genome['topology'].get('hidden_size', 8))
    return 8


def get_input_size(neural_genome: dict) -> int:
    """Get the input size from a neural genome."""
    if 'input_size' in neural_genome:
        return neural_genome['input_size']
    if 'topology' in neural_genome:
        return neural_genome['topology'].get('inputSize', neural_genome['topology'].get('input_size', 8))
    return 8


def clone_neural_genome(neural_genome: dict) -> dict:
    """Deep clone a neural genome."""
    result = {}

    # Copy basic fields
    for key in ['input_size', 'hidden_size', 'output_size', 'activation']:
        if key in neural_genome:
            result[key] = neural_genome[key]

    # Copy weight arrays
    for key in ['weights_ih', 'weights_ho', 'biases_h', 'biases_o', 'weights']:
        if key in neural_genome:
            result[key] = list(neural_genome[key])

    # Copy topology if present (old format)
    if 'topology' in neural_genome:
        result['topology'] = dict(neural_genome['topology'])

    return result


def crossover_neural_weights(
    parent1: dict,
    parent2: dict,
) -> dict:
    """
    Crossover neural network weights using interpolation.

    Args:
        parent1: First parent's neural genome
        parent2: Second parent's neural genome

    Returns:
        New neural genome with crossed-over weights
    """
    result = clone_neural_genome(parent1)

    # Handle new format (separate weight arrays)
    for key in ['weights_ih', 'weights_ho', 'biases_h', 'biases_o']:
        if key in parent1 and key in parent2:
            w1 = parent1[key]
            w2 = parent2[key]
            min_len = min(len(w1), len(w2))
            new_weights = []
            for i in range(min_len):
                t = random.random()
                new_weights.append(lerp(w1[i], w2[i], t))
            # If parent1 has more, copy them
            for i in range(min_len, len(w1)):
                new_weights.append(w1[i])
            result[key] = new_weights

    # Handle old format (flat weights array)
    if 'weights' in parent1 and 'weights' in parent2:
        w1 = parent1['weights']
        w2 = parent2['weights']
        min_len = min(len(w1), len(w2))
        new_weights = []
        for i in range(min_len):
            t = random.random()
            new_weights.append(lerp(w1[i], w2[i], t))
        for i in range(min_len, len(w1)):
            new_weights.append(w1[i])
        result['weights'] = new_weights

    return result


def uniform_crossover_neural_weights(
    parent1: dict,
    parent2: dict,
) -> dict:
    """
    Uniform crossover for neural weights - randomly pick from either parent.

    Args:
        parent1: First parent's neural genome
        parent2: Second parent's neural genome

    Returns:
        New neural genome with crossed-over weights
    """
    result = clone_neural_genome(parent1)

    # Handle new format
    for key in ['weights_ih', 'weights_ho', 'biases_h', 'biases_o']:
        if key in parent1 and key in parent2:
            w1 = parent1[key]
            w2 = parent2[key]
            min_len = min(len(w1), len(w2))
            new_weights = []
            for i in range(min_len):
                new_weights.append(w1[i] if random.random() < 0.5 else w2[i])
            for i in range(min_len, len(w1)):
                new_weights.append(w1[i])
            result[key] = new_weights

    # Handle old format
    if 'weights' in parent1 and 'weights' in parent2:
        w1 = parent1['weights']
        w2 = parent2['weights']
        min_len = min(len(w1), len(w2))
        new_weights = []
        for i in range(min_len):
            new_weights.append(w1[i] if random.random() < 0.5 else w2[i])
        for i in range(min_len, len(w1)):
            new_weights.append(w1[i])
        result['weights'] = new_weights

    return result


def sbx_crossover_neural_weights(
    parent1: dict,
    parent2: dict,
    eta: float = 2.0,
) -> dict:
    """
    Simulated Binary Crossover (SBX) for neural weights.

    SBX simulates single-point crossover on binary strings but for real-valued
    parameters. It produces offspring that are statistically centered around
    the parents, with the spread controlled by the eta parameter.

    Reference: Deb & Agrawal (1995) - "Simulated Binary Crossover for
    Continuous Search Space"

    Args:
        parent1: First parent's neural genome
        parent2: Second parent's neural genome
        eta: Distribution index (0.5-5.0). Lower = more spread, higher = closer to parents.
             eta=2 is a common default providing balanced exploration.

    Returns:
        New neural genome with SBX crossed-over weights
    """
    result = clone_neural_genome(parent1)

    def sbx_single(p1: float, p2: float, eta_c: float) -> float:
        """Apply SBX to a single pair of values, returning one child."""
        # If parents are identical, no crossover needed
        if abs(p1 - p2) < 1e-14:
            return p1

        u = random.random()

        # Calculate beta (spread factor) based on random u
        if u <= 0.5:
            beta = (2.0 * u) ** (1.0 / (eta_c + 1.0))
        else:
            beta = (1.0 / (2.0 * (1.0 - u))) ** (1.0 / (eta_c + 1.0))

        # Generate two children, randomly pick one
        child1 = 0.5 * ((1 + beta) * p1 + (1 - beta) * p2)
        child2 = 0.5 * ((1 - beta) * p1 + (1 + beta) * p2)

        return child1 if random.random() < 0.5 else child2

    # Handle new format (separate arrays)
    for key in ['weights_ih', 'weights_ho', 'biases_h', 'biases_o']:
        if key in parent1 and key in parent2:
            w1 = parent1[key]
            w2 = parent2[key]
            min_len = min(len(w1), len(w2))
            new_weights = []
            for i in range(min_len):
                new_weights.append(sbx_single(w1[i], w2[i], eta))
            # If parent1 has more, copy them
            for i in range(min_len, len(w1)):
                new_weights.append(w1[i])
            result[key] = new_weights

    # Handle old format (flat weights array)
    if 'weights' in parent1 and 'weights' in parent2:
        w1 = parent1['weights']
        w2 = parent2['weights']
        min_len = min(len(w1), len(w2))
        new_weights = []
        for i in range(min_len):
            new_weights.append(sbx_single(w1[i], w2[i], eta))
        for i in range(min_len, len(w1)):
            new_weights.append(w1[i])
        result['weights'] = new_weights

    return result


def adapt_neural_topology(
    neural_genome: dict,
    new_muscle_count: int,
    output_bias: float = DEFAULT_OUTPUT_BIAS,
) -> dict:
    """
    Adapt neural genome topology when muscle count changes.

    Args:
        neural_genome: Current neural genome
        new_muscle_count: Target number of output neurons
        output_bias: Bias for new output neurons

    Returns:
        Adapted neural genome
    """
    result = clone_neural_genome(neural_genome)

    input_size = get_input_size(neural_genome)
    hidden_size = get_hidden_size(neural_genome)
    old_output_size = get_output_size(neural_genome)

    # Handle new format (separate arrays)
    if 'weights_ho' in neural_genome:
        old_weights_ho = neural_genome['weights_ho']
        old_biases_o = neural_genome.get('biases_o', [output_bias] * old_output_size)

        new_weights_ho = []
        new_biases_o = []

        for o in range(new_muscle_count):
            if o < old_output_size:
                # Copy existing weights
                start = o * hidden_size
                end = start + hidden_size
                new_weights_ho.extend(old_weights_ho[start:end])
                new_biases_o.append(old_biases_o[o] if o < len(old_biases_o) else output_bias)
            else:
                # Initialize new neurons with uniform random weights
                for _ in range(hidden_size):
                    new_weights_ho.append((random.random() - 0.5) * 1.0)
                new_biases_o.append(output_bias)

        result['weights_ho'] = new_weights_ho
        result['biases_o'] = new_biases_o
        result['output_size'] = new_muscle_count

    # Handle old format (flat weights with topology)
    elif 'weights' in neural_genome and 'topology' in neural_genome:
        weights = neural_genome['weights']
        input_to_hidden_count = input_size * hidden_size + hidden_size

        # Keep input->hidden weights
        input_to_hidden = weights[:input_to_hidden_count]

        # Adapt hidden->output
        old_ho_start = input_to_hidden_count
        old_ho_count = hidden_size * old_output_size + old_output_size

        new_ho_weights = []
        for o in range(new_muscle_count):
            if o < old_output_size:
                # Copy weights for this output
                for h in range(hidden_size):
                    idx = old_ho_start + o * hidden_size + h
                    if idx < len(weights):
                        new_ho_weights.append(weights[idx])
                    else:
                        new_ho_weights.append((random.random() - 0.5) * 1.0)
            else:
                # New neurons
                for _ in range(hidden_size):
                    new_ho_weights.append((random.random() - 0.5) * 1.0)

        # Add biases
        bias_start = old_ho_start + hidden_size * old_output_size
        for o in range(new_muscle_count):
            if o < old_output_size and (bias_start + o) < len(weights):
                new_ho_weights.append(weights[bias_start + o])
            else:
                new_ho_weights.append(output_bias)

        result['weights'] = input_to_hidden + new_ho_weights
        result['topology'] = {
            'inputSize': input_size,
            'hiddenSize': hidden_size,
            'outputSize': new_muscle_count,
        }

    return result


def initialize_neural_genome(
    num_muscles: int,
    hidden_size: int = 8,
    input_size: int = 8,
    output_bias: float = DEFAULT_OUTPUT_BIAS,
    activation: str = 'tanh',
) -> dict:
    """
    Initialize a new neural genome with random weights.

    Args:
        num_muscles: Number of output neurons (muscles)
        hidden_size: Number of hidden neurons
        input_size: Number of input neurons
        output_bias: Initial bias for output neurons
        activation: Activation function name

    Returns:
        New neural genome
    """
    # Input->Hidden weights (Xavier init)
    weights_ih = []
    for _ in range(input_size * hidden_size):
        weights_ih.append((random.random() - 0.5) * 2 * (1 / math.sqrt(input_size)))

    # Hidden biases
    biases_h = [0.0] * hidden_size

    # Hidden->Output weights (GA-optimized uniform)
    weights_ho = []
    for _ in range(hidden_size * num_muscles):
        weights_ho.append((random.random() - 0.5) * 1.0)

    # Output biases (negative to encourage efficiency)
    biases_o = [output_bias] * num_muscles

    return {
        'input_size': input_size,
        'hidden_size': hidden_size,
        'output_size': num_muscles,
        'weights_ih': weights_ih,
        'weights_ho': weights_ho,
        'biases_h': biases_h,
        'biases_o': biases_o,
        'activation': activation,
    }

"""
Tests for NEAT crossover integration with the main crossover system.

Tests that crossover functions correctly:
- Use NEAT crossover when use_neat=True and genomes have neatGenome
- Fall back to standard crossover when use_neat=False
- Handle mixed scenarios (one parent with NEAT, one without)
- Preserve body crossover behavior
"""

import random
import pytest

from app.genetics.crossover import (
    single_point_crossover,
    uniform_crossover,
    clone_genome,
    has_neat_genome,
    get_neat_genome,
    crossover_neat_genomes,
)
from app.neural.neat_network import create_minimal_neat_genome
from app.schemas.neat import NEATGenome


def create_test_genome_with_neat(
    input_size: int = 7,
    output_size: int = 3,
    creature_id: str = 'test-creature-1',
) -> dict:
    """Create a test creature genome with NEAT neural network."""
    neat_genome = create_minimal_neat_genome(input_size, output_size)

    return {
        'id': creature_id,
        'generation': 0,
        'parentIds': [],
        'survivalStreak': 0,
        'nodes': [
            {'id': 'node-1', 'size': 0.5, 'friction': 0.5, 'position': {'x': 0, 'y': 0.5, 'z': 0}},
            {'id': 'node-2', 'size': 0.5, 'friction': 0.5, 'position': {'x': 1, 'y': 0.5, 'z': 0}},
            {'id': 'node-3', 'size': 0.5, 'friction': 0.5, 'position': {'x': 0.5, 'y': 1, 'z': 0}},
        ],
        'muscles': [
            {
                'id': 'muscle-1',
                'nodeA': 'node-1',
                'nodeB': 'node-2',
                'restLength': 1.0,
                'stiffness': 100,
                'damping': 0.5,
                'frequency': 1.0,
                'amplitude': 0.3,
                'phase': 0,
            },
            {
                'id': 'muscle-2',
                'nodeA': 'node-2',
                'nodeB': 'node-3',
                'restLength': 1.0,
                'stiffness': 100,
                'damping': 0.5,
                'frequency': 1.0,
                'amplitude': 0.3,
                'phase': 0,
            },
            {
                'id': 'muscle-3',
                'nodeA': 'node-1',
                'nodeB': 'node-3',
                'restLength': 1.0,
                'stiffness': 100,
                'damping': 0.5,
                'frequency': 1.0,
                'amplitude': 0.3,
                'phase': 0,
            },
        ],
        'globalFrequencyMultiplier': 1.0,
        'controllerType': 'neural',
        'neatGenome': neat_genome.model_dump(),
        'color': {'h': 0.5, 's': 0.7, 'l': 0.5},
    }


def create_test_genome_with_fixed_neural(creature_id: str = 'test-creature-fixed') -> dict:
    """Create a test creature genome with fixed-topology neural network."""
    return {
        'id': creature_id,
        'generation': 0,
        'parentIds': [],
        'survivalStreak': 0,
        'nodes': [
            {'id': 'node-1', 'size': 0.5, 'friction': 0.5, 'position': {'x': 0, 'y': 0.5, 'z': 0}},
            {'id': 'node-2', 'size': 0.5, 'friction': 0.5, 'position': {'x': 1, 'y': 0.5, 'z': 0}},
        ],
        'muscles': [
            {
                'id': 'muscle-1',
                'nodeA': 'node-1',
                'nodeB': 'node-2',
                'restLength': 1.0,
                'stiffness': 100,
                'damping': 0.5,
                'frequency': 1.0,
                'amplitude': 0.3,
                'phase': 0,
            },
        ],
        'globalFrequencyMultiplier': 1.0,
        'controllerType': 'neural',
        'neuralGenome': {
            'input_size': 8,
            'hidden_size': 4,
            'output_size': 1,
            'weights_ih': [0.1] * 32,
            'weights_ho': [0.2] * 4,
            'biases_h': [0.0] * 4,
            'biases_o': [-0.5],
            'activation': 'tanh',
        },
        'color': {'h': 0.3, 's': 0.7, 'l': 0.5},
    }


class TestHasNeatGenome:
    """Tests for has_neat_genome helper."""

    def test_detects_neat_genome_camel_case(self):
        """Should detect neatGenome key."""
        genome = create_test_genome_with_neat()
        assert has_neat_genome(genome) is True

    def test_detects_neat_genome_snake_case(self):
        """Should detect neat_genome key."""
        genome = create_test_genome_with_neat()
        genome['neat_genome'] = genome.pop('neatGenome')
        assert has_neat_genome(genome) is True

    def test_returns_false_for_fixed_neural(self):
        """Should return False for fixed-topology genome."""
        genome = create_test_genome_with_fixed_neural()
        assert has_neat_genome(genome) is False

    def test_returns_false_for_no_neural(self):
        """Should return False for genome without neural network."""
        genome = {'id': 'test', 'nodes': [], 'muscles': []}
        assert has_neat_genome(genome) is False

    def test_returns_false_for_none_value(self):
        """Should return False if neatGenome is None."""
        genome = {'id': 'test', 'neatGenome': None}
        assert has_neat_genome(genome) is False


class TestGetNeatGenome:
    """Tests for get_neat_genome helper."""

    def test_extracts_neat_genome_from_dict(self):
        """Should extract and convert dict to NEATGenome."""
        genome = create_test_genome_with_neat()
        neat = get_neat_genome(genome)
        assert neat is not None
        assert isinstance(neat, NEATGenome)
        assert len(neat.neurons) > 0
        assert len(neat.connections) > 0

    def test_returns_none_for_missing(self):
        """Should return None if no NEAT genome."""
        genome = create_test_genome_with_fixed_neural()
        neat = get_neat_genome(genome)
        assert neat is None

    def test_handles_neat_genome_object(self):
        """Should handle NEATGenome object directly."""
        neat_obj = create_minimal_neat_genome(5, 3)
        genome = {'id': 'test', 'neatGenome': neat_obj}
        neat = get_neat_genome(genome)
        assert neat is not None
        assert neat is neat_obj  # Should return same object


class TestCrossoverNeatGenomes:
    """Tests for crossover_neat_genomes helper."""

    def test_crossover_two_neat_genomes(self):
        """Should crossover two NEAT genomes."""
        random.seed(42)
        parent1 = create_test_genome_with_neat(creature_id='parent1')
        parent2 = create_test_genome_with_neat(creature_id='parent2')

        child = crossover_neat_genomes(parent1, parent2)

        assert child is not None
        assert 'neurons' in child
        assert 'connections' in child

    def test_crossover_with_fitness(self):
        """Should use fitness for NEAT crossover."""
        random.seed(42)
        parent1 = create_test_genome_with_neat(creature_id='parent1')
        parent2 = create_test_genome_with_neat(creature_id='parent2')

        child = crossover_neat_genomes(parent1, parent2, fitness1=100.0, fitness2=50.0)

        assert child is not None

    def test_crossover_equal_fitness(self):
        """Should use equal fitness mode when fitnesses are close."""
        random.seed(42)
        parent1 = create_test_genome_with_neat(creature_id='parent1')
        parent2 = create_test_genome_with_neat(creature_id='parent2')

        child = crossover_neat_genomes(
            parent1, parent2,
            fitness1=100.0,
            fitness2=100.0 + 1e-10,  # Essentially equal
        )

        assert child is not None

    def test_crossover_one_neat_parent(self):
        """Should clone if only one parent has NEAT."""
        parent1 = create_test_genome_with_neat(creature_id='parent1')
        parent2 = create_test_genome_with_fixed_neural()

        child = crossover_neat_genomes(parent1, parent2)

        assert child is not None
        # Should clone from NEAT parent
        assert 'neurons' in child

    def test_crossover_no_neat_parents(self):
        """Should return None if neither parent has NEAT."""
        parent1 = create_test_genome_with_fixed_neural()
        parent2 = create_test_genome_with_fixed_neural()

        child = crossover_neat_genomes(parent1, parent2)

        assert child is None


class TestSinglePointCrossoverNeat:
    """Tests for single_point_crossover with NEAT."""

    def test_uses_neat_crossover_when_enabled(self):
        """Should use NEAT crossover when use_neat=True."""
        random.seed(42)
        parent1 = create_test_genome_with_neat(creature_id='parent1')
        parent2 = create_test_genome_with_neat(creature_id='parent2')

        child = single_point_crossover(parent1, parent2, use_neat=True)

        assert 'neatGenome' in child
        assert 'neuralGenome' not in child
        assert child['neatGenome'] is not None

    def test_falls_back_to_standard_when_disabled(self):
        """Should use standard crossover when use_neat=False."""
        random.seed(42)
        parent1 = create_test_genome_with_fixed_neural()
        parent2 = create_test_genome_with_fixed_neural()

        child = single_point_crossover(parent1, parent2, use_neat=False)

        assert 'neuralGenome' in child
        assert child.get('neatGenome') is None

    def test_uses_fitness_for_neat_crossover(self):
        """Should pass fitness to NEAT crossover."""
        random.seed(42)
        parent1 = create_test_genome_with_neat(creature_id='parent1')
        parent2 = create_test_genome_with_neat(creature_id='parent2')

        child = single_point_crossover(
            parent1, parent2,
            use_neat=True,
            fitness1=100.0,
            fitness2=50.0,
        )

        assert 'neatGenome' in child

    def test_preserves_body_crossover(self):
        """Body crossover should work independently of NEAT."""
        random.seed(42)
        parent1 = create_test_genome_with_neat(creature_id='parent1')
        parent2 = create_test_genome_with_neat(creature_id='parent2')

        # Modify one parent to have different body
        parent2['nodes'][0]['size'] = 0.8

        child = single_point_crossover(parent1, parent2, use_neat=True)

        # Child should have nodes and muscles
        assert len(child['nodes']) > 0
        assert len(child['muscles']) > 0

    def test_handles_mixed_parents_neat_and_fixed(self):
        """Should handle one NEAT parent and one fixed-topology parent."""
        random.seed(42)
        parent1 = create_test_genome_with_neat(creature_id='parent1')
        parent2 = create_test_genome_with_fixed_neural()

        child = single_point_crossover(parent1, parent2, use_neat=True)

        # Should have NEAT genome (cloned from parent1)
        assert 'neatGenome' in child


class TestUniformCrossoverNeat:
    """Tests for uniform_crossover with NEAT."""

    def test_uses_neat_crossover_when_enabled(self):
        """Should use NEAT crossover when use_neat=True."""
        random.seed(42)
        parent1 = create_test_genome_with_neat(creature_id='parent1')
        parent2 = create_test_genome_with_neat(creature_id='parent2')

        child = uniform_crossover(parent1, parent2, use_neat=True)

        assert 'neatGenome' in child
        assert child.get('neuralGenome') is None

    def test_uses_fitness_for_neat_crossover(self):
        """Should pass fitness to NEAT crossover."""
        random.seed(42)
        parent1 = create_test_genome_with_neat(creature_id='parent1')
        parent2 = create_test_genome_with_neat(creature_id='parent2')

        child = uniform_crossover(
            parent1, parent2,
            use_neat=True,
            fitness1=100.0,
            fitness2=50.0,
        )

        assert 'neatGenome' in child


class TestCloneGenome:
    """Tests for clone_genome with NEAT."""

    def test_clones_neat_genome(self):
        """Should deep clone NEAT genome."""
        genome = create_test_genome_with_neat()

        cloned = clone_genome(genome)

        assert 'neatGenome' in cloned
        assert cloned['neatGenome'] is not genome['neatGenome']  # Different object
        assert cloned['neatGenome']['neurons'] == genome['neatGenome']['neurons']

    def test_clones_fixed_neural_genome(self):
        """Should clone fixed-topology genome."""
        genome = create_test_genome_with_fixed_neural()

        cloned = clone_genome(genome)

        assert 'neuralGenome' in cloned
        assert cloned['neuralGenome'] is not genome['neuralGenome']
        assert cloned['neuralGenome']['weights_ih'] == genome['neuralGenome']['weights_ih']

    def test_modifying_clone_doesnt_affect_original(self):
        """Modifications to clone shouldn't affect original."""
        genome = create_test_genome_with_neat()
        original_weights = [c['weight'] for c in genome['neatGenome']['connections']]

        cloned = clone_genome(genome)
        # Modify cloned genome
        cloned['neatGenome']['connections'][0]['weight'] = 999.0

        # Original should be unchanged
        new_weights = [c['weight'] for c in genome['neatGenome']['connections']]
        assert new_weights == original_weights


class TestBackwardCompatibility:
    """Tests ensuring backward compatibility."""

    def test_standard_crossover_still_works(self):
        """Standard crossover should work without NEAT."""
        random.seed(42)
        parent1 = create_test_genome_with_fixed_neural()
        parent2 = create_test_genome_with_fixed_neural()

        child = single_point_crossover(parent1, parent2, use_neat=False)

        assert 'neuralGenome' in child
        assert child.get('neatGenome') is None

    def test_no_neat_flag_defaults_to_standard(self):
        """Without use_neat flag, should use standard crossover."""
        random.seed(42)
        parent1 = create_test_genome_with_fixed_neural()
        parent2 = create_test_genome_with_fixed_neural()

        child = single_point_crossover(parent1, parent2)

        assert 'neuralGenome' in child

    def test_genome_without_neural_still_works(self):
        """Crossover should work even without any neural network."""
        parent1 = {
            'id': 'p1',
            'nodes': [{'id': 'n1', 'size': 0.5, 'friction': 0.5, 'position': {'x': 0, 'y': 0.5, 'z': 0}}],
            'muscles': [],
            'generation': 0,
        }
        parent2 = {
            'id': 'p2',
            'nodes': [{'id': 'n2', 'size': 0.5, 'friction': 0.5, 'position': {'x': 1, 'y': 0.5, 'z': 0}}],
            'muscles': [],
            'generation': 0,
        }

        child = single_point_crossover(parent1, parent2)

        assert child['id'].startswith('creature_')
        assert len(child['nodes']) > 0


class TestMultipleGenerations:
    """Tests for stability across multiple generations."""

    def test_neat_crossover_stability(self):
        """NEAT crossover should remain stable over generations."""
        random.seed(42)

        population = [
            create_test_genome_with_neat(creature_id=f'creature-{i}')
            for i in range(10)
        ]

        # Simulate 20 generations
        for gen in range(20):
            new_population = []
            for i in range(len(population)):
                p1 = random.choice(population)
                p2 = random.choice(population)

                child = single_point_crossover(
                    p1, p2,
                    use_neat=True,
                    fitness1=random.random() * 100,
                    fitness2=random.random() * 100,
                )

                assert 'neatGenome' in child
                assert len(child['neatGenome']['neurons']) > 0
                new_population.append(child)

            population = new_population

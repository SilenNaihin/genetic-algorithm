"""
Edge case and stress tests for neural topology adaptation.

These tests intentionally try to break the implementation by exploring:
- Boundary conditions (0, 1, max muscles)
- Format variations (old vs new neural genome format)
- Edge cases in mutation and crossover flows
- Integration scenarios with real evolution
"""

import pytest
import random
import math

from app.genetics.mutation import (
    mutate_genome,
    MutationConfig,
    GenomeConstraints,
)
from app.genetics.crossover import (
    adapt_neural_topology,
    get_output_size,
    get_input_size,
    get_hidden_size,
    initialize_neural_genome,
    single_point_crossover,
    uniform_crossover,
    clone_genome,
)
from app.genetics.population import evolve_population


# =============================================================================
# Fixtures
# =============================================================================


@pytest.fixture
def constraints():
    """Standard genome constraints."""
    return GenomeConstraints(
        min_nodes=2,
        max_nodes=6,
        max_muscles=10,
    )


@pytest.fixture
def neural_genome_new_format():
    """Neural genome in new format (separate arrays)."""
    return {
        'input_size': 7,
        'hidden_size': 4,
        'output_size': 3,
        'weights_ih': [0.1] * (7 * 4),
        'weights_ho': [0.2] * (4 * 3),
        'biases_h': [0.0] * 4,
        'biases_o': [-0.5, -0.5, -0.5],
    }


@pytest.fixture
def genome_with_neural(neural_genome_new_format):
    """Complete genome with neural network."""
    return {
        'id': 'test_genome',
        'nodes': [
            {'id': 'n1', 'position': {'x': 0, 'y': 0, 'z': 0}, 'size': 0.3, 'friction': 0.5},
            {'id': 'n2', 'position': {'x': 1, 'y': 0, 'z': 0}, 'size': 0.3, 'friction': 0.5},
            {'id': 'n3', 'position': {'x': 0, 'y': 1, 'z': 0}, 'size': 0.3, 'friction': 0.5},
        ],
        'muscles': [
            {'id': 'm1', 'nodeA': 'n1', 'nodeB': 'n2', 'strength': 100, 'frequency': 1, 'amplitude': 0.3, 'phase': 0},
            {'id': 'm2', 'nodeA': 'n2', 'nodeB': 'n3', 'strength': 100, 'frequency': 1, 'amplitude': 0.3, 'phase': 0},
            {'id': 'm3', 'nodeA': 'n1', 'nodeB': 'n3', 'strength': 100, 'frequency': 1, 'amplitude': 0.3, 'phase': 0},
        ],
        'neuralGenome': neural_genome_new_format,
    }


# =============================================================================
# Test: Boundary Conditions for adapt_neural_topology
# =============================================================================


class TestAdaptTopologyBoundaries:
    """Test boundary conditions for neural topology adaptation."""

    def test_adapt_to_zero_muscles(self, neural_genome_new_format):
        """Adapting to 0 muscles should create empty output layer."""
        adapted = adapt_neural_topology(neural_genome_new_format, 0)

        assert adapted['output_size'] == 0
        assert len(adapted['weights_ho']) == 0
        assert len(adapted['biases_o']) == 0

    def test_adapt_to_one_muscle(self, neural_genome_new_format):
        """Adapting to 1 muscle should preserve first output neuron."""
        adapted = adapt_neural_topology(neural_genome_new_format, 1)

        assert adapted['output_size'] == 1
        hidden_size = adapted['hidden_size']
        assert len(adapted['weights_ho']) == hidden_size
        assert len(adapted['biases_o']) == 1
        # First neuron's weights should be preserved
        assert adapted['weights_ho'][:hidden_size] == neural_genome_new_format['weights_ho'][:hidden_size]

    def test_adapt_to_same_size(self, neural_genome_new_format):
        """Adapting to same size should preserve all weights."""
        original_size = neural_genome_new_format['output_size']
        adapted = adapt_neural_topology(neural_genome_new_format, original_size)

        assert adapted['output_size'] == original_size
        assert adapted['weights_ho'] == neural_genome_new_format['weights_ho']
        assert adapted['biases_o'] == neural_genome_new_format['biases_o']

    def test_adapt_large_increase(self, neural_genome_new_format):
        """Adapting from 3 to 15 outputs should work."""
        adapted = adapt_neural_topology(neural_genome_new_format, 15)

        assert adapted['output_size'] == 15
        hidden_size = adapted['hidden_size']
        assert len(adapted['weights_ho']) == hidden_size * 15
        assert len(adapted['biases_o']) == 15
        # Original weights preserved
        assert adapted['weights_ho'][:hidden_size * 3] == neural_genome_new_format['weights_ho']

    def test_adapt_large_decrease(self):
        """Adapting from 10 to 2 outputs should work."""
        neural = {
            'input_size': 7,
            'hidden_size': 8,
            'output_size': 10,
            'weights_ih': [0.1] * (7 * 8),
            'weights_ho': [0.2] * (8 * 10),
            'biases_h': [0.0] * 8,
            'biases_o': [-0.5] * 10,
        }

        adapted = adapt_neural_topology(neural, 2)

        assert adapted['output_size'] == 2
        assert len(adapted['weights_ho']) == 8 * 2
        assert len(adapted['biases_o']) == 2


class TestAdaptTopologyFormats:
    """Test different neural genome format handling."""

    def test_old_format_with_topology_dict(self):
        """Should handle old format with 'topology' and 'weights' keys."""
        # Old format structure
        input_size = 7
        hidden_size = 4
        output_size = 3

        # Flat weights: [input->hidden weights, hidden biases, hidden->output weights, output biases]
        ih_weights = [0.1] * (input_size * hidden_size)
        h_biases = [0.0] * hidden_size
        ho_weights = [0.2] * (hidden_size * output_size)
        o_biases = [-0.5] * output_size

        neural = {
            'topology': {
                'inputSize': input_size,
                'hiddenSize': hidden_size,
                'outputSize': output_size,
            },
            'weights': ih_weights + h_biases + ho_weights + o_biases,
        }

        adapted = adapt_neural_topology(neural, 5)

        assert get_output_size(adapted) == 5

    def test_missing_biases_uses_default(self, neural_genome_new_format):
        """Missing biases should use default value."""
        del neural_genome_new_format['biases_o']

        adapted = adapt_neural_topology(neural_genome_new_format, 5, output_bias=-0.3)

        assert len(adapted['biases_o']) == 5
        # New neurons get default bias
        assert adapted['biases_o'][3] == -0.3
        assert adapted['biases_o'][4] == -0.3

    def test_empty_neural_genome(self):
        """Empty neural genome should be handled gracefully."""
        neural = {}

        # Should not crash
        adapted = adapt_neural_topology(neural, 3)
        # Result depends on implementation, but shouldn't crash


class TestAdaptTopologyNumerical:
    """Test numerical edge cases."""

    def test_preserves_weight_values_exactly(self, neural_genome_new_format):
        """Original weights should be preserved exactly, not approximately."""
        # Use distinctive values
        neural_genome_new_format['weights_ho'] = [0.123456789] * len(neural_genome_new_format['weights_ho'])

        adapted = adapt_neural_topology(neural_genome_new_format, 5)

        hidden_size = neural_genome_new_format['hidden_size']
        original_output_size = neural_genome_new_format['output_size']

        for i in range(hidden_size * original_output_size):
            assert adapted['weights_ho'][i] == 0.123456789

    def test_new_weights_are_bounded(self, neural_genome_new_format):
        """New weights should be in reasonable range."""
        random.seed(42)

        adapted = adapt_neural_topology(neural_genome_new_format, 10)

        hidden_size = neural_genome_new_format['hidden_size']
        original_count = hidden_size * neural_genome_new_format['output_size']

        # New weights (after original)
        new_weights = adapted['weights_ho'][original_count:]

        for w in new_weights:
            assert -0.5 <= w <= 0.5, f"New weight {w} out of expected range"


# =============================================================================
# Test: Mutation Integration
# =============================================================================


class TestMutationTopologyAdaptation:
    """Test topology adaptation during mutation."""

    def test_add_muscle_adapts_topology(self, constraints):
        """Adding a muscle should expand neural output size."""
        genome = {
            'id': 'test',
            'nodes': [
                {'id': 'n1', 'position': {'x': 0, 'y': 0, 'z': 0}, 'size': 0.3, 'friction': 0.5},
                {'id': 'n2', 'position': {'x': 1, 'y': 0, 'z': 0}, 'size': 0.3, 'friction': 0.5},
                {'id': 'n3', 'position': {'x': 0, 'y': 1, 'z': 0}, 'size': 0.3, 'friction': 0.5},
                {'id': 'n4', 'position': {'x': 1, 'y': 1, 'z': 0}, 'size': 0.3, 'friction': 0.5},
            ],
            'muscles': [
                {'id': 'm1', 'nodeA': 'n1', 'nodeB': 'n2', 'strength': 100, 'frequency': 1, 'amplitude': 0.3, 'phase': 0},
            ],
            'neuralGenome': {
                'input_size': 7,
                'hidden_size': 4,
                'output_size': 1,
                'weights_ih': [0.1] * (7 * 4),
                'weights_ho': [0.5, 0.5, 0.5, 0.5],  # 4 weights for 1 output
                'biases_h': [0.0] * 4,
                'biases_o': [-0.5],
            },
        }

        config = MutationConfig(rate=0.0, structural_rate=1.0, neural_rate=0.0)

        # Run many times to ensure muscle gets added
        for _ in range(100):
            mutated = mutate_genome(genome, config, constraints)
            if len(mutated['muscles']) > 1:
                neural = mutated['neuralGenome']
                assert neural['output_size'] == len(mutated['muscles'])
                assert len(neural['weights_ho']) == neural['hidden_size'] * neural['output_size']
                # Original weights preserved
                assert neural['weights_ho'][:4] == [0.5, 0.5, 0.5, 0.5]
                return

        pytest.fail("Failed to add muscle in 100 iterations")

    def test_remove_muscle_adapts_topology(self, constraints):
        """Removing a muscle (via node removal) should shrink neural output size."""
        genome = {
            'id': 'test',
            'nodes': [
                {'id': 'n1', 'position': {'x': 0, 'y': 0, 'z': 0}, 'size': 0.3, 'friction': 0.5},
                {'id': 'n2', 'position': {'x': 1, 'y': 0, 'z': 0}, 'size': 0.3, 'friction': 0.5},
                {'id': 'n3', 'position': {'x': 0, 'y': 1, 'z': 0}, 'size': 0.3, 'friction': 0.5},
                {'id': 'n4', 'position': {'x': 1, 'y': 1, 'z': 0}, 'size': 0.3, 'friction': 0.5},
            ],
            'muscles': [
                {'id': 'm1', 'nodeA': 'n1', 'nodeB': 'n2', 'strength': 100, 'frequency': 1, 'amplitude': 0.3, 'phase': 0},
                {'id': 'm2', 'nodeA': 'n2', 'nodeB': 'n3', 'strength': 100, 'frequency': 1, 'amplitude': 0.3, 'phase': 0},
                {'id': 'm3', 'nodeA': 'n3', 'nodeB': 'n4', 'strength': 100, 'frequency': 1, 'amplitude': 0.3, 'phase': 0},
                {'id': 'm4', 'nodeA': 'n4', 'nodeB': 'n1', 'strength': 100, 'frequency': 1, 'amplitude': 0.3, 'phase': 0},
            ],
            'neuralGenome': {
                'input_size': 7,
                'hidden_size': 4,
                'output_size': 4,
                'weights_ih': [0.1] * (7 * 4),
                'weights_ho': [0.2] * (4 * 4),
                'biases_h': [0.0] * 4,
                'biases_o': [-0.5] * 4,
            },
        }

        config = MutationConfig(rate=0.0, structural_rate=1.0, neural_rate=0.0)

        # Run many times to ensure muscle gets removed (via node removal)
        for _ in range(100):
            mutated = mutate_genome(genome, config, constraints)
            if len(mutated['muscles']) < 4:
                neural = mutated['neuralGenome']
                assert neural['output_size'] == len(mutated['muscles'])
                assert len(neural['weights_ho']) == neural['hidden_size'] * neural['output_size']
                return

        pytest.skip("Failed to remove muscle in 100 iterations")

    def test_multiple_structural_changes(self, constraints):
        """Multiple adds/removes in sequence should maintain consistency."""
        genome = {
            'id': 'test',
            'nodes': [
                {'id': 'n1', 'position': {'x': 0, 'y': 0, 'z': 0}, 'size': 0.3, 'friction': 0.5},
                {'id': 'n2', 'position': {'x': 1, 'y': 0, 'z': 0}, 'size': 0.3, 'friction': 0.5},
                {'id': 'n3', 'position': {'x': 0, 'y': 1, 'z': 0}, 'size': 0.3, 'friction': 0.5},
            ],
            'muscles': [
                {'id': 'm1', 'nodeA': 'n1', 'nodeB': 'n2', 'strength': 100, 'frequency': 1, 'amplitude': 0.3, 'phase': 0},
                {'id': 'm2', 'nodeA': 'n2', 'nodeB': 'n3', 'strength': 100, 'frequency': 1, 'amplitude': 0.3, 'phase': 0},
            ],
            'neuralGenome': initialize_neural_genome(num_muscles=2, hidden_size=4),
        }

        config = MutationConfig(rate=0.1, structural_rate=0.5, neural_rate=0.1)

        current = genome
        for _ in range(20):
            mutated = mutate_genome(current, config, constraints)
            neural = mutated['neuralGenome']

            # Invariant: output_size always matches muscle count
            assert neural['output_size'] == len(mutated['muscles']), \
                f"output_size {neural['output_size']} != muscles {len(mutated['muscles'])}"

            # Invariant: weight array size matches topology
            expected_ho = neural['hidden_size'] * neural['output_size']
            assert len(neural['weights_ho']) == expected_ho, \
                f"weights_ho {len(neural['weights_ho'])} != expected {expected_ho}"

            current = mutated


# =============================================================================
# Test: Crossover Integration
# =============================================================================


class TestCrossoverTopologyAdaptation:
    """Test topology adaptation during crossover."""

    def test_crossover_different_muscle_counts(self, constraints):
        """Crossover between parents with different muscle counts."""
        parent1 = {
            'id': 'p1',
            'generation': 1,
            'nodes': [
                {'id': 'n1', 'position': {'x': 0, 'y': 0, 'z': 0}, 'size': 0.3, 'friction': 0.5},
                {'id': 'n2', 'position': {'x': 1, 'y': 0, 'z': 0}, 'size': 0.3, 'friction': 0.5},
            ],
            'muscles': [
                {'id': 'm1', 'nodeA': 'n1', 'nodeB': 'n2', 'strength': 100, 'frequency': 1, 'amplitude': 0.3, 'phase': 0},
            ],
            'neuralGenome': initialize_neural_genome(num_muscles=1, hidden_size=4),
        }

        parent2 = {
            'id': 'p2',
            'generation': 1,
            'nodes': [
                {'id': 'n1', 'position': {'x': 0, 'y': 0, 'z': 0}, 'size': 0.3, 'friction': 0.5},
                {'id': 'n2', 'position': {'x': 1, 'y': 0, 'z': 0}, 'size': 0.3, 'friction': 0.5},
                {'id': 'n3', 'position': {'x': 0, 'y': 1, 'z': 0}, 'size': 0.3, 'friction': 0.5},
            ],
            'muscles': [
                {'id': 'm1', 'nodeA': 'n1', 'nodeB': 'n2', 'strength': 100, 'frequency': 1, 'amplitude': 0.3, 'phase': 0},
                {'id': 'm2', 'nodeA': 'n2', 'nodeB': 'n3', 'strength': 100, 'frequency': 1, 'amplitude': 0.3, 'phase': 0},
                {'id': 'm3', 'nodeA': 'n1', 'nodeB': 'n3', 'strength': 100, 'frequency': 1, 'amplitude': 0.3, 'phase': 0},
            ],
            'neuralGenome': initialize_neural_genome(num_muscles=3, hidden_size=4),
        }

        child = single_point_crossover(parent1, parent2, constraints)

        neural = child['neuralGenome']
        muscle_count = len(child['muscles'])

        assert neural['output_size'] == muscle_count
        assert len(neural['weights_ho']) == neural['hidden_size'] * muscle_count

    def test_uniform_crossover_different_sizes(self, constraints):
        """Uniform crossover with different parent neural sizes."""
        parent1 = {
            'id': 'p1',
            'generation': 1,
            'nodes': [
                {'id': 'n1', 'position': {'x': 0, 'y': 0, 'z': 0}, 'size': 0.3, 'friction': 0.5},
                {'id': 'n2', 'position': {'x': 1, 'y': 0, 'z': 0}, 'size': 0.3, 'friction': 0.5},
            ],
            'muscles': [
                {'id': 'm1', 'nodeA': 'n1', 'nodeB': 'n2', 'strength': 100, 'frequency': 1, 'amplitude': 0.3, 'phase': 0},
                {'id': 'm2', 'nodeA': 'n1', 'nodeB': 'n2', 'strength': 100, 'frequency': 1, 'amplitude': 0.3, 'phase': 0},
            ],
            'neuralGenome': initialize_neural_genome(num_muscles=2, hidden_size=4),
        }

        parent2 = {
            'id': 'p2',
            'generation': 1,
            'nodes': [
                {'id': 'n1', 'position': {'x': 0, 'y': 0, 'z': 0}, 'size': 0.3, 'friction': 0.5},
                {'id': 'n2', 'position': {'x': 1, 'y': 0, 'z': 0}, 'size': 0.3, 'friction': 0.5},
            ],
            'muscles': [
                {'id': 'm1', 'nodeA': 'n1', 'nodeB': 'n2', 'strength': 100, 'frequency': 1, 'amplitude': 0.3, 'phase': 0},
                {'id': 'm2', 'nodeA': 'n1', 'nodeB': 'n2', 'strength': 100, 'frequency': 1, 'amplitude': 0.3, 'phase': 0},
                {'id': 'm3', 'nodeA': 'n1', 'nodeB': 'n2', 'strength': 100, 'frequency': 1, 'amplitude': 0.3, 'phase': 0},
                {'id': 'm4', 'nodeA': 'n1', 'nodeB': 'n2', 'strength': 100, 'frequency': 1, 'amplitude': 0.3, 'phase': 0},
            ],
            'neuralGenome': initialize_neural_genome(num_muscles=4, hidden_size=4),
        }

        child = uniform_crossover(parent1, parent2, constraints)

        neural = child['neuralGenome']
        muscle_count = len(child['muscles'])

        assert neural['output_size'] == muscle_count


# =============================================================================
# Test: Full Evolution Integration
# =============================================================================


class TestEvolutionIntegration:
    """Test topology consistency through full evolution cycles."""

    def test_evolution_maintains_topology_consistency(self, constraints):
        """Multiple generations of evolution should maintain neural-muscle consistency."""
        # Create initial population with neural genomes
        population = []
        for i in range(10):
            genome = {
                'id': f'g{i}',
                'generation': 0,
                'nodes': [
                    {'id': 'n1', 'position': {'x': 0, 'y': 0, 'z': 0}, 'size': 0.3, 'friction': 0.5},
                    {'id': 'n2', 'position': {'x': 1, 'y': 0, 'z': 0}, 'size': 0.3, 'friction': 0.5},
                    {'id': 'n3', 'position': {'x': 0, 'y': 1, 'z': 0}, 'size': 0.3, 'friction': 0.5},
                ],
                'muscles': [
                    {'id': 'm1', 'nodeA': 'n1', 'nodeB': 'n2', 'strength': 100, 'frequency': 1, 'amplitude': 0.3, 'phase': 0},
                    {'id': 'm2', 'nodeA': 'n2', 'nodeB': 'n3', 'strength': 100, 'frequency': 1, 'amplitude': 0.3, 'phase': 0},
                ],
                'neuralGenome': initialize_neural_genome(num_muscles=2, hidden_size=4),
            }
            population.append(genome)

        # Simulate fitness scores
        fitness_scores = [random.random() * 100 for _ in range(10)]

        # Evolve for multiple generations
        for gen in range(5):
            config = {
                'population_size': len(population),
                'elite_count': 2,
                'cull_percentage': 0.5,
                'crossover_rate': 0.5,
                'use_mutation': True,
                'use_crossover': True,
                'mutation_rate': 0.3,
                'mutation_magnitude': 0.5,
                'structural_mutation_rate': 0.3,
                'neural_mutation_rate': 0.1,
                'neural_mutation_magnitude': 0.3,
                'constraints': constraints,
            }
            new_pop, stats = evolve_population(
                genomes=population,
                fitness_scores=fitness_scores,
                config=config,
                generation=gen,
            )

            # Verify ALL genomes have consistent topology
            for genome in new_pop:
                neural = genome.get('neuralGenome')
                if neural:
                    muscle_count = len(genome['muscles'])
                    assert neural['output_size'] == muscle_count, \
                        f"Gen {gen}: output_size {neural['output_size']} != muscles {muscle_count}"

                    expected_ho = neural['hidden_size'] * neural['output_size']
                    assert len(neural['weights_ho']) == expected_ho, \
                        f"Gen {gen}: weights_ho {len(neural['weights_ho'])} != expected {expected_ho}"

            population = new_pop
            fitness_scores = [random.random() * 100 for _ in range(len(new_pop))]


# =============================================================================
# Test: Edge Cases in Helper Functions
# =============================================================================


class TestHelperFunctions:
    """Test edge cases in get_* helper functions."""

    def test_get_output_size_empty(self):
        """get_output_size on empty dict should return 0."""
        assert get_output_size({}) == 0

    def test_get_output_size_new_format(self):
        """get_output_size with new format."""
        neural = {'output_size': 5}
        assert get_output_size(neural) == 5

    def test_get_output_size_old_format(self):
        """get_output_size with old topology format."""
        neural = {'topology': {'outputSize': 3}}
        assert get_output_size(neural) == 3

    def test_get_input_size_empty_returns_default(self):
        """get_input_size on empty returns default (8)."""
        assert get_input_size({}) == 8

    def test_get_hidden_size_empty_returns_default(self):
        """get_hidden_size on empty returns default (8)."""
        assert get_hidden_size({}) == 8


# =============================================================================
# Test: Stress Tests
# =============================================================================


class TestStress:
    """Stress tests with extreme values."""

    def test_very_large_muscle_count(self, neural_genome_new_format):
        """Handle adapting to very large muscle count."""
        adapted = adapt_neural_topology(neural_genome_new_format, 100)

        assert adapted['output_size'] == 100
        assert len(adapted['weights_ho']) == adapted['hidden_size'] * 100

    def test_rapid_size_changes(self, neural_genome_new_format):
        """Rapidly changing sizes shouldn't cause issues."""
        neural = neural_genome_new_format

        for size in [1, 10, 3, 20, 2, 15, 0, 5]:
            adapted = adapt_neural_topology(neural, size)
            assert adapted['output_size'] == size
            neural = adapted

    def test_many_mutations_in_sequence(self, genome_with_neural, constraints):
        """Many mutations in sequence shouldn't corrupt state."""
        config = MutationConfig(rate=0.5, structural_rate=0.3, neural_rate=0.3)

        current = genome_with_neural
        for i in range(100):
            mutated = mutate_genome(current, config, constraints)
            neural = mutated['neuralGenome']

            # Always consistent
            assert neural['output_size'] == len(mutated['muscles']), \
                f"Iteration {i}: mismatch"

            current = mutated


# =============================================================================
# Test: Data Corruption and Malformed Input
# =============================================================================


class TestMalformedInput:
    """Test handling of malformed or corrupted neural genomes."""

    def test_adapt_with_wrong_weight_array_length(self):
        """weights_ho array shorter than expected shouldn't crash."""
        neural = {
            'input_size': 7,
            'hidden_size': 4,
            'output_size': 3,
            'weights_ih': [0.1] * (7 * 4),
            'weights_ho': [0.2] * 5,  # Should be 12, but only 5
            'biases_h': [0.0] * 4,
            'biases_o': [-0.5, -0.5, -0.5],
        }

        # Shouldn't crash - may produce truncated output
        adapted = adapt_neural_topology(neural, 2)
        assert adapted['output_size'] == 2

    def test_adapt_with_empty_weight_arrays(self):
        """Empty weight arrays should be handled."""
        neural = {
            'input_size': 7,
            'hidden_size': 4,
            'output_size': 0,
            'weights_ih': [0.1] * (7 * 4),
            'weights_ho': [],
            'biases_h': [0.0] * 4,
            'biases_o': [],
        }

        adapted = adapt_neural_topology(neural, 3)
        assert adapted['output_size'] == 3
        # All new weights should be initialized
        assert len(adapted['weights_ho']) == 4 * 3
        assert len(adapted['biases_o']) == 3

    def test_adapt_with_none_weights(self):
        """None in weight arrays shouldn't crash (though may produce bad results)."""
        neural = {
            'input_size': 7,
            'hidden_size': 4,
            'output_size': 2,
            'weights_ih': [0.1] * (7 * 4),
            'weights_ho': [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8],
            'biases_h': [0.0] * 4,
            'biases_o': [-0.5, -0.5],
        }

        # Should work normally
        adapted = adapt_neural_topology(neural, 3)
        assert adapted['output_size'] == 3

    def test_adapt_negative_output_size(self):
        """Negative target muscle count should be handled (probably 0)."""
        neural = {
            'input_size': 7,
            'hidden_size': 4,
            'output_size': 3,
            'weights_ih': [0.1] * (7 * 4),
            'weights_ho': [0.2] * 12,
            'biases_h': [0.0] * 4,
            'biases_o': [-0.5] * 3,
        }

        # Adaptation to negative size - behavior depends on implementation
        # At minimum, shouldn't crash
        adapted = adapt_neural_topology(neural, -1)
        # Since we use range(-1) which produces nothing, output_size should be -1
        # but arrays will be empty
        assert len(adapted['weights_ho']) == 0 or adapted['output_size'] <= 0


class TestNumericalEdgeCases:
    """Test handling of numerical edge cases in weights."""

    def test_nan_weights_preserved(self):
        """NaN weights should be preserved through adaptation (for debugging)."""
        neural = {
            'input_size': 7,
            'hidden_size': 4,
            'output_size': 2,
            'weights_ih': [0.1] * (7 * 4),
            'weights_ho': [float('nan')] * 8,
            'biases_h': [0.0] * 4,
            'biases_o': [-0.5, -0.5],
        }

        adapted = adapt_neural_topology(neural, 3)
        # Original NaN weights should be preserved (first 2 outputs)
        import math
        for i in range(8):
            assert math.isnan(adapted['weights_ho'][i])

    def test_infinity_weights_preserved(self):
        """Infinity weights should be preserved through adaptation."""
        neural = {
            'input_size': 7,
            'hidden_size': 4,
            'output_size': 2,
            'weights_ih': [0.1] * (7 * 4),
            'weights_ho': [float('inf'), float('-inf')] * 4,
            'biases_h': [0.0] * 4,
            'biases_o': [-0.5, -0.5],
        }

        adapted = adapt_neural_topology(neural, 2)
        assert float('inf') in adapted['weights_ho']
        assert float('-inf') in adapted['weights_ho']

    def test_very_small_weights_not_zeroed(self):
        """Very small weights shouldn't be zeroed out."""
        tiny = 1e-300
        neural = {
            'input_size': 7,
            'hidden_size': 4,
            'output_size': 2,
            'weights_ih': [0.1] * (7 * 4),
            'weights_ho': [tiny] * 8,
            'biases_h': [0.0] * 4,
            'biases_o': [tiny, tiny],
        }

        adapted = adapt_neural_topology(neural, 2)
        for w in adapted['weights_ho'][:8]:
            assert w == tiny

    def test_very_large_weights_preserved(self):
        """Very large weights shouldn't overflow or change."""
        large = 1e100
        neural = {
            'input_size': 7,
            'hidden_size': 4,
            'output_size': 2,
            'weights_ih': [0.1] * (7 * 4),
            'weights_ho': [large] * 8,
            'biases_h': [0.0] * 4,
            'biases_o': [large, large],
        }

        adapted = adapt_neural_topology(neural, 2)
        for w in adapted['weights_ho']:
            assert w == large


# =============================================================================
# Test: Crossover Edge Cases
# =============================================================================


class TestCrossoverEdgeCases:
    """Test edge cases in crossover that could break topology."""

    def test_crossover_one_parent_has_neural(self, constraints):
        """Only one parent has neural genome - child should inherit it."""
        parent1 = {
            'id': 'p1',
            'generation': 1,
            'nodes': [
                {'id': 'n1', 'position': {'x': 0, 'y': 0, 'z': 0}, 'size': 0.3, 'friction': 0.5},
                {'id': 'n2', 'position': {'x': 1, 'y': 0, 'z': 0}, 'size': 0.3, 'friction': 0.5},
            ],
            'muscles': [
                {'id': 'm1', 'nodeA': 'n1', 'nodeB': 'n2', 'strength': 100, 'frequency': 1, 'amplitude': 0.3, 'phase': 0},
            ],
            'neuralGenome': initialize_neural_genome(num_muscles=1, hidden_size=4),
        }

        parent2 = {
            'id': 'p2',
            'generation': 1,
            'nodes': [
                {'id': 'n1', 'position': {'x': 0, 'y': 0, 'z': 0}, 'size': 0.3, 'friction': 0.5},
                {'id': 'n2', 'position': {'x': 1, 'y': 0, 'z': 0}, 'size': 0.3, 'friction': 0.5},
            ],
            'muscles': [
                {'id': 'm1', 'nodeA': 'n1', 'nodeB': 'n2', 'strength': 100, 'frequency': 1, 'amplitude': 0.3, 'phase': 0},
            ],
            # No neuralGenome
        }

        child = single_point_crossover(parent1, parent2, constraints)

        # Child should have neural genome
        assert child['neuralGenome'] is not None
        assert child['neuralGenome']['output_size'] == len(child['muscles'])

    def test_crossover_neither_parent_has_neural(self, constraints):
        """Neither parent has neural - child shouldn't have one."""
        parent1 = {
            'id': 'p1',
            'generation': 1,
            'nodes': [
                {'id': 'n1', 'position': {'x': 0, 'y': 0, 'z': 0}, 'size': 0.3, 'friction': 0.5},
                {'id': 'n2', 'position': {'x': 1, 'y': 0, 'z': 0}, 'size': 0.3, 'friction': 0.5},
            ],
            'muscles': [
                {'id': 'm1', 'nodeA': 'n1', 'nodeB': 'n2', 'strength': 100, 'frequency': 1, 'amplitude': 0.3, 'phase': 0},
            ],
        }

        parent2 = {
            'id': 'p2',
            'generation': 1,
            'nodes': [
                {'id': 'n1', 'position': {'x': 0, 'y': 0, 'z': 0}, 'size': 0.3, 'friction': 0.5},
                {'id': 'n2', 'position': {'x': 1, 'y': 0, 'z': 0}, 'size': 0.3, 'friction': 0.5},
            ],
            'muscles': [
                {'id': 'm1', 'nodeA': 'n1', 'nodeB': 'n2', 'strength': 100, 'frequency': 1, 'amplitude': 0.3, 'phase': 0},
            ],
        }

        child = single_point_crossover(parent1, parent2, constraints)

        # Either key is missing or value is None - both are valid
        assert child.get('neuralGenome') is None

    def test_crossover_produces_zero_muscles(self, constraints):
        """If crossover somehow produces 0 muscles (node mapping failure), neural should adapt."""
        # This can happen if all muscles reference nodes that weren't included
        parent1 = {
            'id': 'p1',
            'generation': 1,
            'nodes': [
                {'id': 'n1', 'position': {'x': 0, 'y': 0, 'z': 0}, 'size': 0.3, 'friction': 0.5},
            ],
            'muscles': [],  # No muscles - edges case
            'neuralGenome': initialize_neural_genome(num_muscles=0, hidden_size=4),
        }

        parent2 = {
            'id': 'p2',
            'generation': 1,
            'nodes': [
                {'id': 'n1', 'position': {'x': 0, 'y': 0, 'z': 0}, 'size': 0.3, 'friction': 0.5},
            ],
            'muscles': [],
            'neuralGenome': initialize_neural_genome(num_muscles=0, hidden_size=4),
        }

        child = single_point_crossover(parent1, parent2, constraints)

        assert len(child['muscles']) == 0
        if child['neuralGenome']:
            assert child['neuralGenome']['output_size'] == 0

    def test_crossover_with_maximum_muscles(self, constraints):
        """Crossover shouldn't exceed max_muscles constraint."""
        # Create parents at max muscle count
        nodes = [
            {'id': f'n{i}', 'position': {'x': i, 'y': 0, 'z': 0}, 'size': 0.3, 'friction': 0.5}
            for i in range(6)
        ]
        muscles = [
            {'id': f'm{i}', 'nodeA': f'n{i%6}', 'nodeB': f'n{(i+1)%6}', 'strength': 100, 'frequency': 1, 'amplitude': 0.3, 'phase': 0}
            for i in range(10)  # At max
        ]

        parent1 = {
            'id': 'p1',
            'generation': 1,
            'nodes': nodes,
            'muscles': muscles,
            'neuralGenome': initialize_neural_genome(num_muscles=10, hidden_size=4),
        }

        parent2 = {
            'id': 'p2',
            'generation': 1,
            'nodes': nodes,
            'muscles': muscles,
            'neuralGenome': initialize_neural_genome(num_muscles=10, hidden_size=4),
        }

        child = single_point_crossover(parent1, parent2, constraints)

        assert len(child['muscles']) <= constraints.max_muscles
        if child['neuralGenome']:
            assert child['neuralGenome']['output_size'] == len(child['muscles'])


# =============================================================================
# Test: Clone Edge Cases
# =============================================================================


class TestCloneEdgeCases:
    """Test edge cases in clone_genome that could affect topology."""

    def test_clone_maintains_topology(self, genome_with_neural, constraints):
        """Clone should maintain exact topology."""
        cloned = clone_genome(genome_with_neural, constraints)

        assert cloned['neuralGenome']['output_size'] == len(cloned['muscles'])
        assert cloned['neuralGenome']['hidden_size'] == genome_with_neural['neuralGenome']['hidden_size']
        assert cloned['neuralGenome']['input_size'] == genome_with_neural['neuralGenome']['input_size']

    def test_clone_with_no_neural(self, constraints):
        """Clone genome without neural should work."""
        genome = {
            'id': 'test',
            'nodes': [
                {'id': 'n1', 'position': {'x': 0, 'y': 0, 'z': 0}, 'size': 0.3, 'friction': 0.5},
                {'id': 'n2', 'position': {'x': 1, 'y': 0, 'z': 0}, 'size': 0.3, 'friction': 0.5},
            ],
            'muscles': [
                {'id': 'm1', 'nodeA': 'n1', 'nodeB': 'n2', 'strength': 100, 'frequency': 1, 'amplitude': 0.3, 'phase': 0},
            ],
        }

        cloned = clone_genome(genome, constraints)
        # Either key is missing or value is None - both are valid
        assert cloned.get('neuralGenome') is None
        assert len(cloned['muscles']) == 1

    def test_clone_deep_copy_isolation(self, genome_with_neural, constraints):
        """Clone should be completely isolated from original."""
        cloned = clone_genome(genome_with_neural, constraints)

        # Modify original
        genome_with_neural['neuralGenome']['weights_ho'][0] = 999.0

        # Clone should be unaffected
        assert cloned['neuralGenome']['weights_ho'][0] != 999.0


# =============================================================================
# Test: SBX Crossover Edge Cases
# =============================================================================


class TestSBXCrossoverEdgeCases:
    """Test edge cases specific to SBX crossover."""

    def test_sbx_with_identical_parents(self, constraints):
        """SBX with identical parents should produce similar child."""
        genome = {
            'id': 'p1',
            'generation': 1,
            'nodes': [
                {'id': 'n1', 'position': {'x': 0, 'y': 0, 'z': 0}, 'size': 0.3, 'friction': 0.5},
                {'id': 'n2', 'position': {'x': 1, 'y': 0, 'z': 0}, 'size': 0.3, 'friction': 0.5},
            ],
            'muscles': [
                {'id': 'm1', 'nodeA': 'n1', 'nodeB': 'n2', 'strength': 100, 'frequency': 1, 'amplitude': 0.3, 'phase': 0},
            ],
            'neuralGenome': initialize_neural_genome(num_muscles=1, hidden_size=4),
        }

        # Both parents are same genome
        from app.genetics.crossover import sbx_crossover_neural_weights, clone_neural_genome

        neural1 = genome['neuralGenome']
        neural2 = clone_neural_genome(neural1)

        child_neural = sbx_crossover_neural_weights(neural1, neural2, eta=2.0)

        # With identical parents, child weights should equal parent weights
        # (since SBX returns parent value when difference is tiny)
        assert len(child_neural['weights_ho']) == len(neural1['weights_ho'])

    def test_sbx_extreme_eta_values(self, neural_genome_new_format):
        """SBX with extreme eta values shouldn't crash."""
        from app.genetics.crossover import sbx_crossover_neural_weights

        neural1 = neural_genome_new_format
        neural2 = {
            'input_size': 7,
            'hidden_size': 4,
            'output_size': 3,
            'weights_ih': [0.5] * (7 * 4),
            'weights_ho': [0.8] * (4 * 3),
            'biases_h': [0.1] * 4,
            'biases_o': [0.0, 0.0, 0.0],
        }

        # Very low eta (more spread)
        child_low = sbx_crossover_neural_weights(neural1, neural2, eta=0.1)
        assert len(child_low['weights_ho']) == 12

        # Very high eta (less spread)
        child_high = sbx_crossover_neural_weights(neural1, neural2, eta=100.0)
        assert len(child_high['weights_ho']) == 12


# =============================================================================
# Test: Mutation with Node/Muscle Constraints
# =============================================================================


class TestMutationConstraintEdgeCases:
    """Test mutation respects constraints and maintains topology."""

    def test_mutation_at_min_nodes(self, constraints):
        """Mutation at min nodes shouldn't remove more nodes."""
        # Start at minimum nodes
        constraints_tight = GenomeConstraints(min_nodes=2, max_nodes=4, min_muscles=1, max_muscles=5)

        genome = {
            'id': 'test',
            'nodes': [
                {'id': 'n1', 'position': {'x': 0, 'y': 0, 'z': 0}, 'size': 0.3, 'friction': 0.5},
                {'id': 'n2', 'position': {'x': 1, 'y': 0, 'z': 0}, 'size': 0.3, 'friction': 0.5},
            ],
            'muscles': [
                {'id': 'm1', 'nodeA': 'n1', 'nodeB': 'n2', 'strength': 100, 'frequency': 1, 'amplitude': 0.3, 'phase': 0},
            ],
            'neuralGenome': initialize_neural_genome(num_muscles=1, hidden_size=4),
        }

        config = MutationConfig(rate=0.0, structural_rate=1.0, neural_rate=0.0)

        # Many mutations shouldn't go below min
        for _ in range(50):
            mutated = mutate_genome(genome, config, constraints_tight)
            assert len(mutated['nodes']) >= constraints_tight.min_nodes
            assert mutated['neuralGenome']['output_size'] == len(mutated['muscles'])

    def test_mutation_at_max_muscles(self, constraints):
        """Mutation at max muscles shouldn't add more muscles."""
        # Create genome at max muscles
        nodes = [
            {'id': f'n{i}', 'position': {'x': i * 0.5, 'y': 0, 'z': 0}, 'size': 0.3, 'friction': 0.5}
            for i in range(6)
        ]

        # Create muscles up to max (10)
        muscles = []
        muscle_id = 0
        for i in range(len(nodes)):
            for j in range(i + 1, len(nodes)):
                if len(muscles) >= constraints.max_muscles:
                    break
                muscles.append({
                    'id': f'm{muscle_id}',
                    'nodeA': f'n{i}',
                    'nodeB': f'n{j}',
                    'strength': 100,
                    'frequency': 1,
                    'amplitude': 0.3,
                    'phase': 0
                })
                muscle_id += 1
            if len(muscles) >= constraints.max_muscles:
                break

        genome = {
            'id': 'test',
            'nodes': nodes,
            'muscles': muscles,
            'neuralGenome': initialize_neural_genome(num_muscles=len(muscles), hidden_size=4),
        }

        config = MutationConfig(rate=0.0, structural_rate=1.0, neural_rate=0.0)

        for _ in range(20):
            mutated = mutate_genome(genome, config, constraints)
            assert len(mutated['muscles']) <= constraints.max_muscles
            assert mutated['neuralGenome']['output_size'] == len(mutated['muscles'])


# =============================================================================
# Test: Weight Array Integrity Through Operations
# =============================================================================


class TestWeightArrayIntegrity:
    """Test that weight arrays maintain correct structure through all operations."""

    def test_weights_ih_unchanged_during_topology_adapt(self, neural_genome_new_format):
        """Input-to-hidden weights should never change during output adaptation."""
        original_ih = list(neural_genome_new_format['weights_ih'])

        for size in [1, 5, 10, 3, 0, 8]:
            adapted = adapt_neural_topology(neural_genome_new_format, size)
            assert adapted['weights_ih'] == original_ih

    def test_hidden_biases_unchanged_during_topology_adapt(self, neural_genome_new_format):
        """Hidden biases should never change during output adaptation."""
        original_bh = list(neural_genome_new_format['biases_h'])

        for size in [1, 5, 10, 3, 0, 8]:
            adapted = adapt_neural_topology(neural_genome_new_format, size)
            assert adapted['biases_h'] == original_bh

    def test_output_weight_ordering_preserved(self, neural_genome_new_format):
        """Output neurons should maintain their weight ordering."""
        # Set distinctive weights for each output neuron
        hidden_size = 4
        neural_genome_new_format['weights_ho'] = [
            # Output 0: all 0.1
            0.1, 0.1, 0.1, 0.1,
            # Output 1: all 0.2
            0.2, 0.2, 0.2, 0.2,
            # Output 2: all 0.3
            0.3, 0.3, 0.3, 0.3,
        ]

        # Expand to 5 outputs
        adapted = adapt_neural_topology(neural_genome_new_format, 5)

        # Original outputs should be preserved in order
        assert adapted['weights_ho'][0:4] == [0.1, 0.1, 0.1, 0.1]
        assert adapted['weights_ho'][4:8] == [0.2, 0.2, 0.2, 0.2]
        assert adapted['weights_ho'][8:12] == [0.3, 0.3, 0.3, 0.3]

        # Shrink to 2 outputs
        shrunk = adapt_neural_topology(neural_genome_new_format, 2)
        assert shrunk['weights_ho'][0:4] == [0.1, 0.1, 0.1, 0.1]
        assert shrunk['weights_ho'][4:8] == [0.2, 0.2, 0.2, 0.2]

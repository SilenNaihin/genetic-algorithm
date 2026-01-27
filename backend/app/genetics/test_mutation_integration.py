"""
Tests for NEAT mutation integration with the main mutation system.

Tests that mutate_genome_neat correctly:
- Mutates body (nodes/muscles) using standard mutation
- Mutates neural network using NEAT mutations
- Handles dict/object conversion properly
- Preserves innovation counter state
"""

import random
import pytest

from app.genetics.mutation import (
    mutate_genome_neat,
    NEATMutationConfig,
    MutationConfig,
    GenomeConstraints,
)
from app.neural.neat_network import create_minimal_neat_genome, neat_forward
from app.schemas.neat import InnovationCounter, NEATGenome


def create_test_genome_with_neat(
    input_size: int = 7,
    output_size: int = 3,
) -> dict:
    """Create a test creature genome with NEAT neural network."""
    neat_genome = create_minimal_neat_genome(input_size, output_size)

    return {
        'id': 'test-creature-1',
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


class TestMutateGenomeNeat:
    """Tests for mutate_genome_neat function."""

    def test_mutates_body(self):
        """Body mutations (nodes/muscles) should be applied."""
        random.seed(42)

        genome = create_test_genome_with_neat()
        counter = InnovationCounter()

        mutated = mutate_genome_neat(
            genome,
            counter,
            config=MutationConfig(rate=1.0, magnitude=0.5),  # High mutation rate
        )

        # New ID should be different
        assert mutated['id'] != genome['id']

        # Some body values should have changed (with high mutation rate)
        # Check that at least node positions or muscle values changed
        original_nodes = genome['nodes']
        mutated_nodes = mutated['nodes']

        # Node IDs should be regenerated
        original_ids = {n['id'] for n in original_nodes}
        mutated_ids = {n['id'] for n in mutated_nodes}
        assert original_ids != mutated_ids

    def test_mutates_neat_genome(self):
        """NEAT genome should be mutated."""
        random.seed(12345)

        genome = create_test_genome_with_neat()
        original_neat = genome['neatGenome']
        counter = InnovationCounter()

        # Use high NEAT mutation rates
        neat_config = NEATMutationConfig(
            add_connection_rate=0.5,
            add_node_rate=0.5,
            weight_mutation_rate=1.0,
        )

        mutated = mutate_genome_neat(
            genome,
            counter,
            neat_config=neat_config,
        )

        mutated_neat = mutated['neatGenome']

        # With high mutation rates, something should change
        # Either weights or structure
        original_weights = [c['weight'] for c in original_neat['connections']]
        mutated_weights = [c['weight'] for c in mutated_neat['connections']]

        # Could have different number of connections (structural mutation)
        # Or same number but different weights
        weights_changed = original_weights != mutated_weights
        structure_changed = len(original_neat['connections']) != len(mutated_neat['connections'])

        assert weights_changed or structure_changed

    def test_preserves_neat_genome_validity(self):
        """Mutated NEAT genome should still be valid for forward pass."""
        random.seed(42)

        genome = create_test_genome_with_neat(input_size=5, output_size=2)
        counter = InnovationCounter()

        # Run many mutations
        current = genome
        for i in range(50):
            random.seed(i)
            current = mutate_genome_neat(current, counter)

        # Mutated genome should have valid NEAT structure
        neat_dict = current['neatGenome']
        neat_genome = NEATGenome(**neat_dict)

        # Should be able to run forward pass
        outputs = neat_forward(neat_genome, [0.5] * 5)
        assert len(outputs) == 2
        assert all(-1 <= o <= 1 for o in outputs)

    def test_innovation_counter_updated(self):
        """Innovation counter should be updated by structural mutations."""
        random.seed(42)

        genome = create_test_genome_with_neat()
        counter = InnovationCounter()
        initial_conn = counter.next_connection
        initial_node = counter.next_node

        # Use high structural mutation rates
        neat_config = NEATMutationConfig(
            add_connection_rate=1.0,  # Guaranteed
            add_node_rate=1.0,  # Guaranteed
        )

        # Run several mutations
        current = genome
        for i in range(10):
            random.seed(i * 100)
            current = mutate_genome_neat(current, counter, neat_config=neat_config)

        # Counter should have advanced
        assert counter.next_connection > initial_conn or counter.next_node > initial_node

    def test_accepts_dict_innovation_counter(self):
        """Should accept innovation counter as dict."""
        genome = create_test_genome_with_neat()

        # Pass counter as dict
        counter_dict = {
            'next_connection': 100,
            'next_node': 10,
            'connection_cache': {},
            'node_cache': {},
        }

        mutated = mutate_genome_neat(genome, counter_dict)

        # Should succeed without error
        assert 'neatGenome' in mutated

    def test_accepts_neat_genome_as_dict(self):
        """Should accept NEAT genome stored as dict."""
        genome = create_test_genome_with_neat()
        counter = InnovationCounter()

        # NEAT genome is already a dict in create_test_genome_with_neat
        assert isinstance(genome['neatGenome'], dict)

        mutated = mutate_genome_neat(genome, counter)

        # Should succeed and return dict
        assert isinstance(mutated['neatGenome'], dict)

    def test_neat_config_parameters_applied(self):
        """NEAT config parameters should affect mutation behavior."""
        random.seed(42)

        genome = create_test_genome_with_neat()
        counter = InnovationCounter()

        # Zero mutation rates = no changes
        neat_config = NEATMutationConfig(
            add_connection_rate=0.0,
            add_node_rate=0.0,
            enable_rate=0.0,
            disable_rate=0.0,
            weight_mutation_rate=0.0,
        )

        mutated = mutate_genome_neat(
            genome,
            counter,
            config=MutationConfig(rate=0.0, structural_rate=0.0),  # No body mutations
            neat_config=neat_config,
        )

        # NEAT genome should be unchanged (no mutations)
        original_neat = genome['neatGenome']
        mutated_neat = mutated['neatGenome']

        assert len(original_neat['connections']) == len(mutated_neat['connections'])
        assert len(original_neat['neurons']) == len(mutated_neat['neurons'])

        # Weights should be the same
        original_weights = [c['weight'] for c in original_neat['connections']]
        mutated_weights = [c['weight'] for c in mutated_neat['connections']]
        assert original_weights == mutated_weights


class TestBodyMutationIndependence:
    """Test that body and NEAT mutations are independent."""

    def test_body_mutations_dont_affect_neat(self):
        """High body mutation rate shouldn't affect NEAT genome structure."""
        random.seed(42)

        genome = create_test_genome_with_neat()
        original_neat = genome['neatGenome']
        counter = InnovationCounter()

        # High body mutation, zero NEAT mutation
        mutated = mutate_genome_neat(
            genome,
            counter,
            config=MutationConfig(rate=1.0, magnitude=1.0, structural_rate=0.5),
            neat_config=NEATMutationConfig(
                add_connection_rate=0.0,
                add_node_rate=0.0,
                weight_mutation_rate=0.0,
            ),
        )

        mutated_neat = mutated['neatGenome']

        # NEAT structure should be unchanged
        assert len(original_neat['neurons']) == len(mutated_neat['neurons'])
        assert len(original_neat['connections']) == len(mutated_neat['connections'])

    def test_neat_mutations_dont_affect_body(self):
        """High NEAT mutation rate shouldn't affect body structure."""
        random.seed(42)

        genome = create_test_genome_with_neat()
        original_node_count = len(genome['nodes'])
        original_muscle_count = len(genome['muscles'])
        counter = InnovationCounter()

        # Zero body mutation, high NEAT mutation
        mutated = mutate_genome_neat(
            genome,
            counter,
            config=MutationConfig(rate=0.0, structural_rate=0.0),
            neat_config=NEATMutationConfig(
                add_connection_rate=1.0,
                add_node_rate=1.0,
                weight_mutation_rate=1.0,
            ),
        )

        # Body structure should be unchanged
        assert len(mutated['nodes']) == original_node_count
        assert len(mutated['muscles']) == original_muscle_count


class TestEdgeCases:
    """Edge cases for NEAT mutation integration."""

    def test_genome_without_neat(self):
        """Should handle genome without neatGenome gracefully."""
        genome = {
            'id': 'test',
            'nodes': [
                {'id': 'node-1', 'size': 0.5, 'friction': 0.5, 'position': {'x': 0, 'y': 0.5, 'z': 0}},
            ],
            'muscles': [],
        }
        counter = InnovationCounter()

        mutated = mutate_genome_neat(genome, counter)

        # Should not have neatGenome (wasn't present)
        assert 'neatGenome' not in mutated or mutated.get('neatGenome') is None

    def test_snake_case_neat_genome_key(self):
        """Should handle snake_case 'neat_genome' key."""
        genome = create_test_genome_with_neat()

        # Use snake_case key
        genome['neat_genome'] = genome.pop('neatGenome')

        counter = InnovationCounter()
        mutated = mutate_genome_neat(genome, counter)

        # Should have processed the NEAT genome
        assert 'neatGenome' in mutated

    def test_many_generations_stability(self):
        """Genome should remain valid through many generations."""
        random.seed(12345)

        genome = create_test_genome_with_neat(input_size=5, output_size=2)
        counter = InnovationCounter()

        current = genome
        for gen in range(100):
            random.seed(gen)
            current = mutate_genome_neat(current, counter)
            counter.clear_generation_cache()

            # Verify NEAT genome is still valid
            neat_genome = NEATGenome(**current['neatGenome'])

            # Should be able to forward pass
            outputs = neat_forward(neat_genome, [0.5] * 5)
            assert len(outputs) == 2

            # Should still have input/output neurons
            inputs = neat_genome.get_input_neurons()
            outputs_neurons = neat_genome.get_output_neurons()
            assert len(inputs) == 5
            assert len(outputs_neurons) == 2

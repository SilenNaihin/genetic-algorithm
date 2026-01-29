"""
Tests for NEAT topology adaptation when muscle count changes.

Specifically tests that when a muscle is removed during mutation,
the CORRECT output neuron is removed (the one at the same index),
not just the highest-numbered output.
"""

import pytest

from app.neural.neat_network import adapt_neat_topology, create_minimal_neat_genome
from app.schemas.neat import NEATGenome, NeuronGene, ConnectionGene, InnovationCounter


def create_neat_genome_with_outputs(num_outputs: int, num_inputs: int = 3) -> NEATGenome:
    """Create a simple NEAT genome with specified output count."""
    return create_minimal_neat_genome(
        input_size=num_inputs,
        output_size=num_outputs,
        output_bias=-0.5,
        connectivity='sparse_outputs',
    )


class TestAdaptNeatTopologyRemovalByIndex:
    """Tests for index-based output removal."""

    def test_removes_correct_output_by_single_index(self):
        """When muscle at index 1 is removed, output at index 1 is removed."""
        genome = create_neat_genome_with_outputs(5)

        # Get original output IDs sorted
        original_outputs = sorted(
            [n for n in genome.neurons if n.type == 'output'],
            key=lambda n: n.id
        )
        original_ids = [n.id for n in original_outputs]
        assert len(original_ids) == 5

        # Remove output at index 1
        adapted = adapt_neat_topology(genome, 4, removed_indices=[1])

        # Should have 4 outputs
        adapted_outputs = sorted(
            [n for n in adapted.neurons if n.type == 'output'],
            key=lambda n: n.id
        )
        adapted_ids = [n.id for n in adapted_outputs]
        assert len(adapted_ids) == 4

        # The removed ID should be the one at index 1 (not the highest)
        removed_id = original_ids[1]
        assert removed_id not in adapted_ids

        # Other IDs should be preserved
        assert original_ids[0] in adapted_ids
        assert original_ids[2] in adapted_ids
        assert original_ids[3] in adapted_ids
        assert original_ids[4] in adapted_ids

    def test_removes_first_index(self):
        """Removing index 0 removes the first output."""
        genome = create_neat_genome_with_outputs(4)

        original_outputs = sorted(
            [n for n in genome.neurons if n.type == 'output'],
            key=lambda n: n.id
        )
        original_ids = [n.id for n in original_outputs]

        adapted = adapt_neat_topology(genome, 3, removed_indices=[0])

        adapted_outputs = [n for n in adapted.neurons if n.type == 'output']
        adapted_ids = {n.id for n in adapted_outputs}

        assert len(adapted_ids) == 3
        assert original_ids[0] not in adapted_ids
        assert original_ids[1] in adapted_ids
        assert original_ids[2] in adapted_ids
        assert original_ids[3] in adapted_ids

    def test_removes_last_index(self):
        """Removing the last index removes the last output."""
        genome = create_neat_genome_with_outputs(4)

        original_outputs = sorted(
            [n for n in genome.neurons if n.type == 'output'],
            key=lambda n: n.id
        )
        original_ids = [n.id for n in original_outputs]

        adapted = adapt_neat_topology(genome, 3, removed_indices=[3])

        adapted_outputs = [n for n in adapted.neurons if n.type == 'output']
        adapted_ids = {n.id for n in adapted_outputs}

        assert len(adapted_ids) == 3
        assert original_ids[3] not in adapted_ids
        # First 3 preserved
        assert original_ids[0] in adapted_ids
        assert original_ids[1] in adapted_ids
        assert original_ids[2] in adapted_ids

    def test_removes_multiple_indices(self):
        """Can remove multiple outputs at once."""
        genome = create_neat_genome_with_outputs(5)

        original_outputs = sorted(
            [n for n in genome.neurons if n.type == 'output'],
            key=lambda n: n.id
        )
        original_ids = [n.id for n in original_outputs]

        # Remove indices 1, 3, 4 (keeping 0 and 2)
        adapted = adapt_neat_topology(genome, 2, removed_indices=[1, 3, 4])

        adapted_outputs = [n for n in adapted.neurons if n.type == 'output']
        adapted_ids = {n.id for n in adapted_outputs}

        assert len(adapted_ids) == 2
        assert original_ids[0] in adapted_ids
        assert original_ids[2] in adapted_ids
        assert original_ids[1] not in adapted_ids
        assert original_ids[3] not in adapted_ids
        assert original_ids[4] not in adapted_ids

    def test_handles_out_of_range_index_gracefully(self):
        """Index out of range is skipped, not errored."""
        genome = create_neat_genome_with_outputs(3)

        # Index 10 doesn't exist - should be skipped
        adapted = adapt_neat_topology(genome, 2, removed_indices=[0, 10])

        outputs = [n for n in adapted.neurons if n.type == 'output']
        assert len(outputs) == 2

    def test_handles_empty_removed_indices(self):
        """Empty removed_indices list is treated same as None."""
        genome = create_neat_genome_with_outputs(5)

        # Empty list should behave like no indices specified
        adapted = adapt_neat_topology(genome, 3, removed_indices=[])

        outputs = [n for n in adapted.neurons if n.type == 'output']
        # Should fall back to count-based removal (removes highest IDs)
        assert len(outputs) == 3


class TestAdaptNeatTopologyConnections:
    """Tests for connection handling during adaptation."""

    def test_removes_connections_for_removed_output(self):
        """Connections to removed output are deleted."""
        genome = create_neat_genome_with_outputs(3)

        original_outputs = sorted(
            [n for n in genome.neurons if n.type == 'output'],
            key=lambda n: n.id
        )
        removed_output_id = original_outputs[1].id

        # Count connections to this output before
        conns_before = [c for c in genome.connections if c.to_node == removed_output_id]
        assert len(conns_before) > 0  # Should have at least one connection

        adapted = adapt_neat_topology(genome, 2, removed_indices=[1])

        # No connections should reference the removed output
        for conn in adapted.connections:
            assert conn.to_node != removed_output_id
            assert conn.from_node != removed_output_id

    def test_preserves_connections_for_remaining_outputs(self):
        """Connections to non-removed outputs are preserved."""
        genome = create_neat_genome_with_outputs(3)

        original_outputs = sorted(
            [n for n in genome.neurons if n.type == 'output'],
            key=lambda n: n.id
        )
        remaining_output_id = original_outputs[0].id

        # Get connections to remaining output before
        conns_before = [c for c in genome.connections if c.to_node == remaining_output_id]

        adapted = adapt_neat_topology(genome, 2, removed_indices=[1])

        # Connections to remaining output should still exist
        conns_after = [c for c in adapted.connections if c.to_node == remaining_output_id]
        assert len(conns_after) == len(conns_before)


class TestAdaptNeatTopologyFallback:
    """Tests for fallback count-based removal."""

    def test_fallback_to_count_based_when_no_indices(self):
        """Without removed_indices, falls back to count-based removal (highest IDs)."""
        genome = create_neat_genome_with_outputs(5)

        original_outputs = sorted(
            [n for n in genome.neurons if n.type == 'output'],
            key=lambda n: n.id
        )
        original_ids = [n.id for n in original_outputs]

        # No removed_indices - should remove highest IDs
        adapted = adapt_neat_topology(genome, 3, removed_indices=None)

        adapted_outputs = [n for n in adapted.neurons if n.type == 'output']
        adapted_ids = {n.id for n in adapted_outputs}

        assert len(adapted_ids) == 3
        # Highest IDs (indices 3, 4) should be removed
        assert original_ids[3] not in adapted_ids
        assert original_ids[4] not in adapted_ids
        # Lowest IDs preserved
        assert original_ids[0] in adapted_ids
        assert original_ids[1] in adapted_ids
        assert original_ids[2] in adapted_ids


class TestAdaptNeatTopologyAddingOutputs:
    """Tests for adding outputs (muscle addition)."""

    def test_adding_outputs_after_removal(self):
        """Can add outputs if target > current after removal."""
        genome = create_neat_genome_with_outputs(3)

        # Remove one but target is still 3 - should add one back
        adapted = adapt_neat_topology(genome, 3, removed_indices=[1])

        outputs = [n for n in adapted.neurons if n.type == 'output']
        assert len(outputs) == 3

    def test_adding_outputs_works_independently(self):
        """Adding outputs works without removed_indices."""
        genome = create_neat_genome_with_outputs(3)

        adapted = adapt_neat_topology(genome, 5)

        outputs = [n for n in adapted.neurons if n.type == 'output']
        assert len(outputs) == 5


class TestAdaptNeatTopologyBiasNodeMode:
    """Tests for bias_node mode handling."""

    def test_removes_bias_connections_with_output(self):
        """In bias_node mode, removing output also removes bias→output connection."""
        genome = create_minimal_neat_genome(
            input_size=3,
            output_size=3,
            bias_mode='bias_node',
            connectivity='sparse_outputs',
        )

        # Get bias node
        bias_node = next((n for n in genome.neurons if n.type == 'bias'), None)
        assert bias_node is not None

        original_outputs = sorted(
            [n for n in genome.neurons if n.type == 'output'],
            key=lambda n: n.id
        )
        removed_output_id = original_outputs[1].id

        # Count bias→removed_output connections before
        bias_conns_before = [
            c for c in genome.connections
            if c.from_node == bias_node.id and c.to_node == removed_output_id
        ]
        assert len(bias_conns_before) > 0  # Should have bias connection

        adapted = adapt_neat_topology(genome, 2, removed_indices=[1])

        # No connections from bias to removed output
        for conn in adapted.connections:
            if conn.from_node == bias_node.id:
                assert conn.to_node != removed_output_id


class TestMutationIntegration:
    """Integration tests for mutation with NEAT topology adaptation."""

    def test_muscle_removal_removes_correct_output(self):
        """When remove_node removes a muscle, the correct NEAT output is removed."""
        import random
        from app.genetics.mutation import mutate_genome_neat, MutationConfig, GenomeConstraints, NEATMutationConfig
        from app.schemas.neat import InnovationCounter

        random.seed(42)

        # Create a genome with 4 nodes and 5 muscles
        genome = {
            'id': 'test-creature',
            'generation': 0,
            'parentIds': [],
            'survivalStreak': 0,
            'nodes': [
                {'id': 'node-1', 'size': 0.5, 'friction': 0.5, 'position': {'x': 0, 'y': 0.5, 'z': 0}},
                {'id': 'node-2', 'size': 0.5, 'friction': 0.5, 'position': {'x': 1, 'y': 0.5, 'z': 0}},
                {'id': 'node-3', 'size': 0.5, 'friction': 0.5, 'position': {'x': 0.5, 'y': 1, 'z': 0}},
                {'id': 'node-4', 'size': 0.5, 'friction': 0.5, 'position': {'x': 0.5, 'y': 0.5, 'z': 1}},
            ],
            'muscles': [
                {'id': 'muscle-0', 'nodeA': 'node-1', 'nodeB': 'node-2', 'restLength': 1.0, 'stiffness': 100, 'damping': 0.5, 'frequency': 1.0, 'amplitude': 0.3, 'phase': 0},
                {'id': 'muscle-1', 'nodeA': 'node-1', 'nodeB': 'node-3', 'restLength': 1.0, 'stiffness': 100, 'damping': 0.5, 'frequency': 1.0, 'amplitude': 0.3, 'phase': 0},
                {'id': 'muscle-2', 'nodeA': 'node-2', 'nodeB': 'node-3', 'restLength': 1.0, 'stiffness': 100, 'damping': 0.5, 'frequency': 1.0, 'amplitude': 0.3, 'phase': 0},
                {'id': 'muscle-3', 'nodeA': 'node-1', 'nodeB': 'node-4', 'restLength': 1.0, 'stiffness': 100, 'damping': 0.5, 'frequency': 1.0, 'amplitude': 0.3, 'phase': 0},
                {'id': 'muscle-4', 'nodeA': 'node-2', 'nodeB': 'node-4', 'restLength': 1.0, 'stiffness': 100, 'damping': 0.5, 'frequency': 1.0, 'amplitude': 0.3, 'phase': 0},
            ],
            'globalFrequencyMultiplier': 1.0,
            'controllerType': 'oscillator',
            'neatGenome': create_neat_genome_with_outputs(5, num_inputs=7).model_dump(),
        }

        counter = InnovationCounter()

        # Run mutation with high structural rate to trigger node removal
        # We'll run many times and check that whenever muscle count changes,
        # the output count also changes correctly
        for _ in range(50):
            mutated = mutate_genome_neat(
                genome,
                counter,
                config=MutationConfig(rate=0.0, structural_rate=1.0),  # Force structural mutations
                constraints=GenomeConstraints(min_nodes=2),  # Allow removal
                neat_config=NEATMutationConfig(
                    add_connection_rate=0.0,
                    add_node_rate=0.0,
                    weight_mutation_rate=0.0,
                ),
            )

            # Output count should always equal muscle count
            output_count = len([n for n in mutated['neatGenome']['neurons'] if n['type'] == 'output'])
            muscle_count = len(mutated['muscles'])

            assert output_count == muscle_count, f"Output count {output_count} != muscle count {muscle_count}"

    def test_no_muscles_removed_preserves_neat_structure(self):
        """When no muscles are removed, NEAT structure is preserved."""
        import random
        from app.genetics.mutation import mutate_genome_neat, MutationConfig, GenomeConstraints, NEATMutationConfig
        from app.schemas.neat import InnovationCounter

        random.seed(123)

        genome = {
            'id': 'test-creature',
            'generation': 0,
            'parentIds': [],
            'survivalStreak': 0,
            'nodes': [
                {'id': 'node-1', 'size': 0.5, 'friction': 0.5, 'position': {'x': 0, 'y': 0.5, 'z': 0}},
                {'id': 'node-2', 'size': 0.5, 'friction': 0.5, 'position': {'x': 1, 'y': 0.5, 'z': 0}},
                {'id': 'node-3', 'size': 0.5, 'friction': 0.5, 'position': {'x': 0.5, 'y': 1, 'z': 0}},
            ],
            'muscles': [
                {'id': 'muscle-0', 'nodeA': 'node-1', 'nodeB': 'node-2', 'restLength': 1.0, 'stiffness': 100, 'damping': 0.5, 'frequency': 1.0, 'amplitude': 0.3, 'phase': 0},
                {'id': 'muscle-1', 'nodeA': 'node-1', 'nodeB': 'node-3', 'restLength': 1.0, 'stiffness': 100, 'damping': 0.5, 'frequency': 1.0, 'amplitude': 0.3, 'phase': 0},
                {'id': 'muscle-2', 'nodeA': 'node-2', 'nodeB': 'node-3', 'restLength': 1.0, 'stiffness': 100, 'damping': 0.5, 'frequency': 1.0, 'amplitude': 0.3, 'phase': 0},
            ],
            'globalFrequencyMultiplier': 1.0,
            'controllerType': 'oscillator',
            'neatGenome': create_neat_genome_with_outputs(3, num_inputs=7).model_dump(),
        }

        counter = InnovationCounter()
        original_neat = genome['neatGenome']

        # No mutations at all
        mutated = mutate_genome_neat(
            genome,
            counter,
            config=MutationConfig(rate=0.0, structural_rate=0.0),
            neat_config=NEATMutationConfig(
                add_connection_rate=0.0,
                add_node_rate=0.0,
                weight_mutation_rate=0.0,
            ),
        )

        # NEAT structure should be identical
        assert len(original_neat['neurons']) == len(mutated['neatGenome']['neurons'])
        assert len(original_neat['connections']) == len(mutated['neatGenome']['connections'])

"""
Edge case and stress tests for NEAT output-muscle tracking.

These tests intentionally try to break the implementation by exploring:
- Numerical edge cases (negative indices, zero, large values)
- Empty/missing data (no outputs, no muscles, empty genomes)
- Boundary conditions (all removed, none removed, exact matches)
- Mismatch scenarios (more indices than outputs, duplicate indices)
- Integration stress tests (rapid successive mutations, crossover + mutation)
"""

import random
import pytest
from copy import deepcopy

from app.neural.neat_network import adapt_neat_topology, create_minimal_neat_genome
from app.schemas.neat import NEATGenome, NeuronGene, ConnectionGene, InnovationCounter
from app.genetics.mutation import (
    mutate_genome_neat,
    _mutate_body_only_with_tracking,
    MutationConfig,
    GenomeConstraints,
    NEATMutationConfig,
)


# =============================================================================
# Test Fixtures
# =============================================================================

def create_neat_genome_with_outputs(num_outputs: int, num_inputs: int = 3) -> NEATGenome:
    """Create a simple NEAT genome with specified output count."""
    return create_minimal_neat_genome(
        input_size=num_inputs,
        output_size=num_outputs,
        output_bias=-0.5,
        connectivity='sparse_outputs',
    )


def create_test_creature_genome(num_nodes: int, num_muscles: int, num_inputs: int = 7) -> dict:
    """Create a test creature genome with NEAT."""
    nodes = [
        {'id': f'node-{i}', 'size': 0.5, 'friction': 0.5, 'position': {'x': i * 0.5, 'y': 0.5, 'z': 0}}
        for i in range(num_nodes)
    ]

    # Create muscles connecting consecutive nodes
    muscles = []
    for i in range(min(num_muscles, num_nodes - 1)):
        muscles.append({
            'id': f'muscle-{i}',
            'nodeA': f'node-{i}',
            'nodeB': f'node-{i + 1}',
            'restLength': 1.0,
            'stiffness': 100,
            'damping': 0.5,
            'frequency': 1.0,
            'amplitude': 0.3,
            'phase': 0,
        })

    # Add more muscles if needed by connecting non-consecutive nodes
    muscle_idx = len(muscles)
    for i in range(num_nodes):
        for j in range(i + 2, num_nodes):
            if len(muscles) >= num_muscles:
                break
            muscles.append({
                'id': f'muscle-{muscle_idx}',
                'nodeA': f'node-{i}',
                'nodeB': f'node-{j}',
                'restLength': 1.5,
                'stiffness': 100,
                'damping': 0.5,
                'frequency': 1.0,
                'amplitude': 0.3,
                'phase': 0,
            })
            muscle_idx += 1
        if len(muscles) >= num_muscles:
            break

    return {
        'id': 'test-creature',
        'generation': 0,
        'parentIds': [],
        'survivalStreak': 0,
        'nodes': nodes,
        'muscles': muscles[:num_muscles],
        'globalFrequencyMultiplier': 1.0,
        'controllerType': 'oscillator',
        'neatGenome': create_neat_genome_with_outputs(num_muscles, num_inputs).model_dump(),
    }


# =============================================================================
# Numerical Edge Cases
# =============================================================================

class TestNumericalEdgeCases:
    """Tests for numerical stability and edge cases."""

    def test_negative_index_ignored(self):
        """Negative indices should be ignored (not crash or remove wrong outputs)."""
        genome = create_neat_genome_with_outputs(5)
        original_count = len([n for n in genome.neurons if n.type == 'output'])

        # Negative index should be out of range and ignored
        adapted = adapt_neat_topology(genome, 4, removed_indices=[-1])

        outputs = [n for n in adapted.neurons if n.type == 'output']
        # Should fall back to count-based since -1 is invalid
        assert len(outputs) == 4

    def test_negative_indices_mixed_with_valid(self):
        """Mix of negative and valid indices should only process valid ones."""
        genome = create_neat_genome_with_outputs(5)
        original_outputs = sorted(
            [n for n in genome.neurons if n.type == 'output'],
            key=lambda n: n.id
        )
        original_ids = [n.id for n in original_outputs]

        # -1 should be ignored, only index 2 should be removed
        adapted = adapt_neat_topology(genome, 4, removed_indices=[-1, 2, -5])

        outputs = [n for n in adapted.neurons if n.type == 'output']
        output_ids = {n.id for n in outputs}

        assert len(outputs) == 4
        assert original_ids[2] not in output_ids  # Index 2 removed
        assert original_ids[0] in output_ids  # Others preserved
        assert original_ids[1] in output_ids
        assert original_ids[3] in output_ids
        assert original_ids[4] in output_ids

    def test_very_large_index(self):
        """Very large index should be ignored."""
        genome = create_neat_genome_with_outputs(3)

        adapted = adapt_neat_topology(genome, 2, removed_indices=[999999])

        outputs = [n for n in adapted.neurons if n.type == 'output']
        # Large index ignored, falls back to count-based
        assert len(outputs) == 2

    def test_zero_target_output_count(self):
        """Target of 0 outputs should remove all outputs."""
        genome = create_neat_genome_with_outputs(5)

        adapted = adapt_neat_topology(genome, 0, removed_indices=[0, 1, 2, 3, 4])

        outputs = [n for n in adapted.neurons if n.type == 'output']
        assert len(outputs) == 0

        # Should still have inputs
        inputs = [n for n in adapted.neurons if n.type == 'input']
        assert len(inputs) > 0

    def test_zero_target_count_based_fallback(self):
        """Target of 0 with no indices should remove all outputs."""
        genome = create_neat_genome_with_outputs(3)

        adapted = adapt_neat_topology(genome, 0)

        outputs = [n for n in adapted.neurons if n.type == 'output']
        assert len(outputs) == 0


# =============================================================================
# Empty/Missing Data
# =============================================================================

class TestEmptyAndMissingData:
    """Tests for empty and missing data scenarios."""

    def test_single_output_removal(self):
        """Genome with single output - removal should leave zero outputs."""
        genome = create_neat_genome_with_outputs(1)

        adapted = adapt_neat_topology(genome, 0, removed_indices=[0])

        outputs = [n for n in adapted.neurons if n.type == 'output']
        assert len(outputs) == 0

    def test_no_connections_genome(self):
        """Genome with no connections should still adapt correctly."""
        genome = create_minimal_neat_genome(
            input_size=3,
            output_size=3,
            connectivity='none',  # No initial connections
        )

        adapted = adapt_neat_topology(genome, 2, removed_indices=[1])

        outputs = [n for n in adapted.neurons if n.type == 'output']
        assert len(outputs) == 2

    def test_duplicate_indices_handled(self):
        """Duplicate indices should not cause double-removal or errors."""
        genome = create_neat_genome_with_outputs(5)
        original_outputs = sorted(
            [n for n in genome.neurons if n.type == 'output'],
            key=lambda n: n.id
        )
        original_ids = [n.id for n in original_outputs]

        # Duplicate index 2
        adapted = adapt_neat_topology(genome, 4, removed_indices=[2, 2, 2])

        outputs = [n for n in adapted.neurons if n.type == 'output']
        assert len(outputs) == 4

        # Only index 2 should be removed (not triple-removed)
        output_ids = {n.id for n in outputs}
        assert original_ids[2] not in output_ids

    def test_all_indices_are_duplicates(self):
        """All duplicate indices should only remove one output."""
        genome = create_neat_genome_with_outputs(5)

        # All duplicates of index 0
        adapted = adapt_neat_topology(genome, 4, removed_indices=[0, 0, 0, 0])

        outputs = [n for n in adapted.neurons if n.type == 'output']
        assert len(outputs) == 4


# =============================================================================
# Boundary Conditions
# =============================================================================

class TestBoundaryConditions:
    """Tests for edge values and boundaries."""

    def test_remove_all_outputs_by_index(self):
        """Removing all outputs explicitly should leave none."""
        genome = create_neat_genome_with_outputs(3)

        adapted = adapt_neat_topology(genome, 0, removed_indices=[0, 1, 2])

        outputs = [n for n in adapted.neurons if n.type == 'output']
        assert len(outputs) == 0

        # All connections should be removed (nothing to connect to outputs)
        output_ids = {3, 4, 5}  # Typical output IDs after 3 inputs
        for conn in adapted.connections:
            assert conn.to_node not in output_ids

    def test_remove_no_outputs(self):
        """Empty removal list with matching count should be no-op."""
        genome = create_neat_genome_with_outputs(5)
        original_neurons = len(genome.neurons)
        original_connections = len(genome.connections)

        adapted = adapt_neat_topology(genome, 5, removed_indices=[])

        assert len(adapted.neurons) == original_neurons
        assert len(adapted.connections) == original_connections

    def test_more_indices_than_outputs(self):
        """More removal indices than outputs should remove all valid ones."""
        genome = create_neat_genome_with_outputs(3)

        # Indices 0, 1, 2 valid; 3, 4, 5 invalid
        adapted = adapt_neat_topology(genome, 0, removed_indices=[0, 1, 2, 3, 4, 5])

        outputs = [n for n in adapted.neurons if n.type == 'output']
        assert len(outputs) == 0

    def test_target_equals_current_with_indices(self):
        """Target equals current but with removal + addition needed."""
        genome = create_neat_genome_with_outputs(3)

        # Remove index 1, but target is still 3 - should remove then add
        adapted = adapt_neat_topology(genome, 3, removed_indices=[1])

        outputs = [n for n in adapted.neurons if n.type == 'output']
        assert len(outputs) == 3

    def test_indices_in_reverse_order(self):
        """Indices provided in reverse order should work correctly."""
        genome = create_neat_genome_with_outputs(5)
        original_outputs = sorted(
            [n for n in genome.neurons if n.type == 'output'],
            key=lambda n: n.id
        )
        original_ids = [n.id for n in original_outputs]

        # Reverse order: [4, 3, 1]
        adapted = adapt_neat_topology(genome, 2, removed_indices=[4, 3, 1])

        outputs = [n for n in adapted.neurons if n.type == 'output']
        output_ids = {n.id for n in outputs}

        assert len(outputs) == 2
        assert original_ids[0] in output_ids
        assert original_ids[2] in output_ids
        assert original_ids[1] not in output_ids
        assert original_ids[3] not in output_ids
        assert original_ids[4] not in output_ids


# =============================================================================
# Mismatch Scenarios
# =============================================================================

class TestMismatchScenarios:
    """Tests for mismatched counts and indices."""

    def test_indices_dont_match_target_reduction(self):
        """Indices remove fewer than needed - should continue to count-based removal."""
        genome = create_neat_genome_with_outputs(5)

        # Only remove 1 by index, but target is 3 (need to remove 2 total)
        # After index removal: 4 outputs
        # Then falls back to count-based for 1 more removal
        adapted = adapt_neat_topology(genome, 3, removed_indices=[2])

        outputs = [n for n in adapted.neurons if n.type == 'output']
        # Index 2 removed = 4 outputs, target 3 = count-based removes 1 more
        assert len(outputs) == 3  # Removes by index, then count-based to reach target

    def test_indices_remove_more_than_target_suggests(self):
        """Indices remove more than target difference - should add back."""
        genome = create_neat_genome_with_outputs(5)

        # Remove 3 indices, but target is 4 (should only remove 1)
        # After removal: 2 outputs, but target is 4, so should add 2
        adapted = adapt_neat_topology(genome, 4, removed_indices=[0, 1, 2])

        outputs = [n for n in adapted.neurons if n.type == 'output']
        assert len(outputs) == 4  # Should add back to reach target


# =============================================================================
# Integration with Mutation
# =============================================================================

class TestMutationTracking:
    """Tests for _mutate_body_only_with_tracking function."""

    def test_tracking_with_no_structural_mutations(self):
        """With structural_rate=0, no indices should be tracked as removed."""
        random.seed(42)
        genome = create_test_creature_genome(4, 5)

        new_genome, removed_indices = _mutate_body_only_with_tracking(
            genome,
            MutationConfig(rate=0.0, structural_rate=0.0),
            GenomeConstraints(),
        )

        assert removed_indices == []
        assert len(new_genome['muscles']) == 5

    def test_tracking_cleans_up_internal_field(self):
        """_original_index field should be removed from final genome."""
        random.seed(42)
        genome = create_test_creature_genome(4, 5)

        new_genome, _ = _mutate_body_only_with_tracking(
            genome,
            MutationConfig(rate=0.0, structural_rate=0.0),
            GenomeConstraints(),
        )

        for muscle in new_genome['muscles']:
            assert '_original_index' not in muscle

    def test_tracking_with_added_muscle(self):
        """Added muscles should not appear in removed indices."""
        random.seed(42)
        genome = create_test_creature_genome(4, 3)

        # Run many times to trigger add_muscle
        for _ in range(50):
            new_genome, removed_indices = _mutate_body_only_with_tracking(
                genome,
                MutationConfig(rate=0.0, structural_rate=1.0),
                GenomeConstraints(max_muscles=10),
            )

            # Removed indices should only be from original muscles
            for idx in removed_indices:
                assert 0 <= idx < 3  # Original had 3 muscles


# =============================================================================
# Stress Tests
# =============================================================================

class TestStressScenarios:
    """Stress tests for robustness."""

    def test_rapid_successive_mutations(self):
        """Many successive mutations should maintain output=muscle invariant."""
        random.seed(42)
        genome = create_test_creature_genome(5, 6)
        counter = InnovationCounter()

        for i in range(100):
            genome = mutate_genome_neat(
                genome,
                counter,
                config=MutationConfig(rate=0.3, structural_rate=0.3),
                constraints=GenomeConstraints(min_nodes=3, max_nodes=8, min_muscles=2, max_muscles=10),
                neat_config=NEATMutationConfig(
                    add_connection_rate=0.2,
                    add_node_rate=0.1,
                    weight_mutation_rate=0.5,
                ),
            )

            # INVARIANT: output count must always equal muscle count
            output_count = len([n for n in genome['neatGenome']['neurons'] if n['type'] == 'output'])
            muscle_count = len(genome['muscles'])

            assert output_count == muscle_count, f"Iteration {i}: {output_count} outputs != {muscle_count} muscles"

    def test_many_removals_in_sequence(self):
        """Sequential single removals should work correctly."""
        genome = create_neat_genome_with_outputs(10)

        for i in range(10):
            current_count = len([n for n in genome.neurons if n.type == 'output'])
            if current_count <= 1:
                break

            genome = adapt_neat_topology(genome, current_count - 1, removed_indices=[0])

            new_count = len([n for n in genome.neurons if n.type == 'output'])
            assert new_count == current_count - 1

    def test_alternating_add_remove(self):
        """Alternating additions and removals should work correctly."""
        genome = create_neat_genome_with_outputs(5)

        for i in range(20):
            current_count = len([n for n in genome.neurons if n.type == 'output'])

            if i % 2 == 0 and current_count > 1:
                # Remove
                genome = adapt_neat_topology(genome, current_count - 1, removed_indices=[0])
            else:
                # Add
                genome = adapt_neat_topology(genome, current_count + 1)

            new_count = len([n for n in genome.neurons if n.type == 'output'])
            expected = current_count - 1 if (i % 2 == 0 and current_count > 1) else current_count + 1
            assert new_count == expected

    def test_large_genome(self):
        """Large genome with many outputs should handle adaptation."""
        genome = create_neat_genome_with_outputs(50, num_inputs=20)

        # Remove half by indices
        removed = list(range(0, 50, 2))  # Even indices
        adapted = adapt_neat_topology(genome, 25, removed_indices=removed)

        outputs = [n for n in adapted.neurons if n.type == 'output']
        assert len(outputs) == 25


# =============================================================================
# Real-World Scenarios
# =============================================================================

class TestRealWorldScenarios:
    """Tests simulating realistic evolution scenarios."""

    def test_node_removal_cascades_correctly(self):
        """When a node is removed, all connected muscles (and their outputs) go."""
        random.seed(123)

        # Create a genome where removing one node removes multiple muscles
        genome = {
            'id': 'test-creature',
            'generation': 0,
            'parentIds': [],
            'survivalStreak': 0,
            'nodes': [
                {'id': 'center', 'size': 0.5, 'friction': 0.5, 'position': {'x': 0, 'y': 0.5, 'z': 0}},
                {'id': 'n1', 'size': 0.5, 'friction': 0.5, 'position': {'x': 1, 'y': 0.5, 'z': 0}},
                {'id': 'n2', 'size': 0.5, 'friction': 0.5, 'position': {'x': -1, 'y': 0.5, 'z': 0}},
                {'id': 'n3', 'size': 0.5, 'friction': 0.5, 'position': {'x': 0, 'y': 1.5, 'z': 0}},
            ],
            'muscles': [
                # All muscles connected to 'center'
                {'id': 'm0', 'nodeA': 'center', 'nodeB': 'n1', 'restLength': 1.0, 'stiffness': 100, 'damping': 0.5, 'frequency': 1.0, 'amplitude': 0.3, 'phase': 0},
                {'id': 'm1', 'nodeA': 'center', 'nodeB': 'n2', 'restLength': 1.0, 'stiffness': 100, 'damping': 0.5, 'frequency': 1.0, 'amplitude': 0.3, 'phase': 0},
                {'id': 'm2', 'nodeA': 'center', 'nodeB': 'n3', 'restLength': 1.0, 'stiffness': 100, 'damping': 0.5, 'frequency': 1.0, 'amplitude': 0.3, 'phase': 0},
                # One muscle not connected to center
                {'id': 'm3', 'nodeA': 'n1', 'nodeB': 'n2', 'restLength': 2.0, 'stiffness': 100, 'damping': 0.5, 'frequency': 1.0, 'amplitude': 0.3, 'phase': 0},
            ],
            'globalFrequencyMultiplier': 1.0,
            'controllerType': 'oscillator',
            'neatGenome': create_neat_genome_with_outputs(4, num_inputs=7).model_dump(),
        }

        counter = InnovationCounter()

        # Run mutations that might remove the center node
        for _ in range(100):
            mutated = mutate_genome_neat(
                genome,
                counter,
                config=MutationConfig(rate=0.0, structural_rate=1.0),
                constraints=GenomeConstraints(min_nodes=2),
                neat_config=NEATMutationConfig(
                    add_connection_rate=0.0,
                    add_node_rate=0.0,
                    weight_mutation_rate=0.0,
                ),
            )

            # INVARIANT always holds
            output_count = len([n for n in mutated['neatGenome']['neurons'] if n['type'] == 'output'])
            muscle_count = len(mutated['muscles'])
            assert output_count == muscle_count

    def test_crossover_then_mutation(self):
        """Crossover followed by mutation should maintain invariant."""
        from app.genetics.crossover import single_point_crossover

        random.seed(42)

        parent1 = create_test_creature_genome(4, 4)
        parent2 = create_test_creature_genome(5, 6)

        counter = InnovationCounter()

        for _ in range(50):
            # Crossover
            child = single_point_crossover(parent1, parent2, use_neat=True)

            # Mutation
            mutated = mutate_genome_neat(
                child,
                counter,
                config=MutationConfig(rate=0.3, structural_rate=0.3),
                constraints=GenomeConstraints(min_nodes=3, max_nodes=8),
                neat_config=NEATMutationConfig(
                    add_connection_rate=0.2,
                    add_node_rate=0.1,
                    weight_mutation_rate=0.5,
                ),
            )

            # INVARIANT
            output_count = len([n for n in mutated['neatGenome']['neurons'] if n['type'] == 'output'])
            muscle_count = len(mutated['muscles'])
            assert output_count == muscle_count


# =============================================================================
# Connection Integrity Tests
# =============================================================================

class TestConnectionIntegrity:
    """Tests ensuring connections remain valid after adaptation."""

    def test_no_dangling_connections_after_removal(self):
        """All connections should reference existing neurons after removal."""
        genome = create_minimal_neat_genome(
            input_size=5,
            output_size=5,
            connectivity='full',
        )

        adapted = adapt_neat_topology(genome, 2, removed_indices=[1, 3, 4])

        neuron_ids = {n.id for n in adapted.neurons}

        for conn in adapted.connections:
            assert conn.from_node in neuron_ids, f"Dangling from_node: {conn.from_node}"
            assert conn.to_node in neuron_ids, f"Dangling to_node: {conn.to_node}"

    def test_no_connections_to_removed_outputs(self):
        """After removal, no connections should reference removed outputs."""
        genome = create_minimal_neat_genome(
            input_size=3,
            output_size=5,
            connectivity='full',
        )

        original_outputs = sorted(
            [n for n in genome.neurons if n.type == 'output'],
            key=lambda n: n.id
        )
        removed_ids = {original_outputs[i].id for i in [1, 2, 3]}

        adapted = adapt_neat_topology(genome, 2, removed_indices=[1, 2, 3])

        for conn in adapted.connections:
            assert conn.from_node not in removed_ids
            assert conn.to_node not in removed_ids

    def test_hidden_neuron_connections_preserved(self):
        """Connections involving hidden neurons should be preserved."""
        # Create genome with hidden neurons
        genome = create_minimal_neat_genome(
            input_size=3,
            output_size=3,
            connectivity='full',
        )

        # Manually add a hidden neuron and connections
        hidden_id = max(n.id for n in genome.neurons) + 1
        genome.neurons.append(NeuronGene(
            id=hidden_id,
            type='hidden',
            bias=0.0,
            innovation=None,
        ))
        genome.connections.append(ConnectionGene(
            from_node=0,  # Input
            to_node=hidden_id,
            weight=0.5,
            enabled=True,
            innovation=100,
        ))
        output_id = [n.id for n in genome.neurons if n.type == 'output'][0]
        genome.connections.append(ConnectionGene(
            from_node=hidden_id,
            to_node=output_id,
            weight=0.5,
            enabled=True,
            innovation=101,
        ))

        # Remove different output (not the one connected to hidden)
        adapted = adapt_neat_topology(genome, 2, removed_indices=[1])

        # Hidden neuron and its connections should still exist
        hidden_neurons = [n for n in adapted.neurons if n.type == 'hidden']
        assert len(hidden_neurons) == 1

        hidden_connections = [
            c for c in adapted.connections
            if c.from_node == hidden_id or c.to_node == hidden_id
        ]
        assert len(hidden_connections) >= 1

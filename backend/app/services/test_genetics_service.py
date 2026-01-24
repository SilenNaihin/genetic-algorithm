"""
Tests for GeneticsService.

These tests specifically cover the service methods that perform
genome manipulation, particularly structural mutations that have
had bugs in the past.
"""

import pytest
from app.services.genetics import GeneticsService


class TestGeneticsServiceAddMuscle:
    """Test GeneticsService._add_muscle method."""

    @pytest.fixture
    def service(self):
        return GeneticsService()

    @pytest.fixture
    def genome_with_unconnected_nodes(self):
        """Create a genome with nodes that are not fully connected."""
        return {
            'id': 'test_genome',
            'generation': 0,
            'survival_streak': 0,
            'parent_ids': [],
            'nodes': [
                {'id': 'n1', 'position': {'x': 0, 'y': 0.5, 'z': 0}, 'size': 0.3, 'friction': 0.5},
                {'id': 'n2', 'position': {'x': 1, 'y': 0.5, 'z': 0}, 'size': 0.3, 'friction': 0.5},
                {'id': 'n3', 'position': {'x': 0.5, 'y': 1, 'z': 0}, 'size': 0.3, 'friction': 0.5},
                {'id': 'n4', 'position': {'x': 0.5, 'y': 0, 'z': 1}, 'size': 0.3, 'friction': 0.5},
            ],
            'muscles': [
                # Only n1-n2 connected, others unconnected
                {'id': 'm1', 'node_a': 'n1', 'node_b': 'n2', 'rest_length': 1.0,
                 'stiffness': 100, 'damping': 0.5, 'frequency': 1.0, 'amplitude': 0.3, 'phase': 0},
            ],
            'global_frequency_multiplier': 1.0,
            'controller_type': 'oscillator',
            'color': {'h': 0.5, 's': 0.7, 'l': 0.5},
        }

    def test_add_muscle_does_not_crash_on_set_iteration(self, service, genome_with_unconnected_nodes):
        """
        Test that _add_muscle doesn't crash when building the connected set.

        This catches the bug where we had:
            connected.update((b, a) for a, b in connected)
        which would crash with "Set changed size during iteration".

        The fix is:
            connected.update((b, a) for a, b in list(connected))
        """
        # Run multiple times to ensure it doesn't crash
        for _ in range(100):
            genome = dict(genome_with_unconnected_nodes)
            genome['muscles'] = list(genome_with_unconnected_nodes['muscles'])
            service._add_muscle(genome)

        # If we get here without RuntimeError, the test passes
        assert True

    def test_add_muscle_adds_new_connection(self, service, genome_with_unconnected_nodes):
        """Test that _add_muscle actually adds a new muscle."""
        genome = dict(genome_with_unconnected_nodes)
        genome['muscles'] = list(genome_with_unconnected_nodes['muscles'])

        original_count = len(genome['muscles'])
        service._add_muscle(genome)

        # Should have added one muscle
        assert len(genome['muscles']) == original_count + 1

        # New muscle should connect unconnected nodes
        new_muscle = genome['muscles'][-1]
        assert new_muscle['node_a'] in ['n1', 'n2', 'n3', 'n4']
        assert new_muscle['node_b'] in ['n1', 'n2', 'n3', 'n4']

    def test_add_muscle_does_not_duplicate_connection(self, service):
        """Test that _add_muscle doesn't add duplicate connections."""
        # Genome with all nodes connected
        genome = {
            'nodes': [
                {'id': 'n1', 'position': {'x': 0, 'y': 0, 'z': 0}},
                {'id': 'n2', 'position': {'x': 1, 'y': 0, 'z': 0}},
            ],
            'muscles': [
                {'id': 'm1', 'node_a': 'n1', 'node_b': 'n2'},
            ],
        }

        original_count = len(genome['muscles'])
        service._add_muscle(genome)

        # Should not add muscle since all nodes are connected
        assert len(genome['muscles']) == original_count

    def test_add_muscle_with_many_connected_pairs(self, service):
        """
        Test _add_muscle with a larger genome that has many connected pairs.

        This is a stress test to ensure the set iteration fix works
        with more complex data.
        """
        # Create a genome with many muscles
        nodes = [{'id': f'n{i}', 'position': {'x': i, 'y': 0, 'z': 0}} for i in range(10)]
        muscles = []
        # Create a chain of muscles: n0-n1, n1-n2, n2-n3, etc.
        for i in range(9):
            muscles.append({
                'id': f'm{i}',
                'node_a': f'n{i}',
                'node_b': f'n{i+1}',
                'rest_length': 1.0,
                'stiffness': 100,
                'damping': 0.5,
                'frequency': 1.0,
                'amplitude': 0.3,
                'phase': 0,
            })

        genome = {
            'nodes': nodes,
            'muscles': muscles,
        }

        # Run many times - this would crash before the fix
        for _ in range(50):
            service._add_muscle(genome)

        # If we get here, the test passes
        assert True


class TestGeneticsServiceRemoveMuscle:
    """Test GeneticsService._remove_muscle method."""

    @pytest.fixture
    def service(self):
        return GeneticsService()

    def test_remove_muscle_removes_one(self, service):
        """Test that _remove_muscle removes exactly one muscle."""
        genome = {
            'muscles': [
                {'id': 'm1', 'node_a': 'n1', 'node_b': 'n2'},
                {'id': 'm2', 'node_a': 'n2', 'node_b': 'n3'},
                {'id': 'm3', 'node_a': 'n3', 'node_b': 'n1'},
            ],
        }

        service._remove_muscle(genome)
        assert len(genome['muscles']) == 2

    def test_remove_muscle_keeps_at_least_one(self, service):
        """Test that _remove_muscle keeps at least one muscle."""
        genome = {
            'muscles': [
                {'id': 'm1', 'node_a': 'n1', 'node_b': 'n2'},
            ],
        }

        service._remove_muscle(genome)
        assert len(genome['muscles']) == 1  # Keeps the last one


class TestGeneticsServiceGenomeFormat:
    """Test that generated genomes have all required fields for frontend."""

    @pytest.fixture
    def service(self):
        return GeneticsService()

    def test_generate_random_genome_has_required_fields(self, service):
        """Test that generate_random_genome includes all fields needed by frontend."""
        constraints = {
            'min_nodes': 2,
            'max_nodes': 5,
            'max_muscles': 10,
        }

        genome = service.generate_random_genome(constraints)

        # Required fields for frontend CreatureGenome type
        assert 'id' in genome
        assert 'generation' in genome
        assert 'nodes' in genome
        assert 'muscles' in genome
        assert 'parent_ids' in genome
        assert 'survival_streak' in genome
        assert 'global_frequency_multiplier' in genome
        assert 'controller_type' in genome
        assert 'color' in genome
        assert 'ancestry_chain' in genome

        # Color should have h, s, l
        assert 'h' in genome['color']
        assert 's' in genome['color']
        assert 'l' in genome['color']

    def test_clone_genome_preserves_required_fields(self, service):
        """Test that _clone_genome preserves all required fields."""
        constraints = {'min_nodes': 2, 'max_nodes': 5, 'max_muscles': 10}
        original = service.generate_random_genome(constraints)

        clone = service._clone_genome(original)

        # Should have all required fields
        assert 'color' in clone
        assert 'controller_type' in clone
        assert 'ancestry_chain' in clone

        # Color should be preserved
        assert clone['color'] == original['color']

    def test_clone_genome_adds_defaults_for_missing_fields(self, service):
        """Test that _clone_genome adds defaults for legacy genomes without color."""
        # Simulate legacy genome without color/controller_type
        legacy_genome = {
            'id': 'legacy_genome',
            'generation': 5,
            'nodes': [{'id': 'n1', 'position': {'x': 0, 'y': 0.5, 'z': 0}}],
            'muscles': [],
            'parent_ids': [],
            'survival_streak': 0,
            'global_frequency_multiplier': 1.0,
        }

        clone = service._clone_genome(legacy_genome)

        # Should have added defaults
        assert 'color' in clone
        assert 'h' in clone['color']
        assert 'controller_type' in clone
        assert clone['controller_type'] == 'oscillator'
        assert 'ancestry_chain' in clone


class TestGeneticsServiceAddNode:
    """Test GeneticsService._add_node method."""

    @pytest.fixture
    def service(self):
        return GeneticsService()

    def test_add_node_creates_valid_node(self, service):
        """Test that _add_node creates a valid node and muscle."""
        genome = {
            'nodes': [
                {'id': 'n1', 'position': {'x': 0, 'y': 0.5, 'z': 0}, 'size': 0.3, 'friction': 0.5},
                {'id': 'n2', 'position': {'x': 1, 'y': 0.5, 'z': 0}, 'size': 0.3, 'friction': 0.5},
            ],
            'muscles': [],
        }

        constraints = {'max_nodes': 10}
        service._add_node(genome, constraints)

        assert len(genome['nodes']) == 3
        assert len(genome['muscles']) == 1  # New muscle connecting new node

    def test_add_node_many_times_does_not_crash(self, service):
        """Test that _add_node can be called many times without crashing."""
        genome = {
            'nodes': [
                {'id': 'n1', 'position': {'x': 0, 'y': 0.5, 'z': 0}, 'size': 0.3, 'friction': 0.5},
                {'id': 'n2', 'position': {'x': 1, 'y': 0.5, 'z': 0}, 'size': 0.3, 'friction': 0.5},
            ],
            'muscles': [],
        }

        constraints = {'max_nodes': 100}

        # Run many times without crashing
        for _ in range(50):
            service._add_node(genome, constraints)

        # Should have added nodes
        assert len(genome['nodes']) > 2

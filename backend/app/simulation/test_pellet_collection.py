"""
Tests for pellet collection and fitness calculation.

These tests verify:
1. Pellets spawn at correct heights (above ground)
2. Collection detection works when creature is near pellet
3. Fitness increases when pellets are collected
"""

import pytest
import torch
import math

from app.simulation.tensors import CreatureBatch, creature_genomes_to_batch
from app.simulation.fitness import (
    FitnessConfig,
    PelletBatch,
    initialize_pellets,
    generate_pellet_positions,
    calculate_creature_xz_radius,
    check_pellet_collisions,
    update_pellets,
    compute_edge_distances,
)


def create_test_genome(nodes: list[dict], muscles: list[dict] = None) -> dict:
    """Create a minimal test genome."""
    if muscles is None:
        # Create a muscle connecting first two nodes if we have at least 2
        if len(nodes) >= 2:
            muscles = [{
                'id': 'muscle_0',
                'nodeA': nodes[0]['id'],
                'nodeB': nodes[1]['id'],
                'restLength': 1.0,
                'stiffness': 100.0,
                'damping': 0.5,
                'frequency': 1.0,
                'amplitude': 0.3,
                'phase': 0.0,
                'directionBias': {'x': 1, 'y': 0, 'z': 0},
                'biasStrength': 0.0,
            }]
        else:
            muscles = []

    return {
        'id': 'test_creature',
        'generation': 0,
        'survivalStreak': 0,
        'parentIds': [],
        'nodes': nodes,
        'muscles': muscles,
        'globalFrequencyMultiplier': 1.0,
        'controllerType': 'oscillator',
        'color': {'h': 0.5, 's': 0.7, 'l': 0.5},
    }


class TestPelletSpawnHeight:
    """Test that pellets spawn above ground level."""

    def test_pellets_spawn_above_ground(self):
        """Pellets must spawn at Y > 0 to be reachable."""
        # Create a simple creature at origin
        genome = create_test_genome([
            {'id': 'node_0', 'position': {'x': 0, 'y': 0.5, 'z': 0}, 'size': 0.5, 'friction': 0.5},
            {'id': 'node_1', 'position': {'x': 1, 'y': 0.5, 'z': 0}, 'size': 0.5, 'friction': 0.5},
        ])

        batch = creature_genomes_to_batch([genome])
        pellets = initialize_pellets(batch, arena_size=50.0, seed=42)

        # Pellet Y position should be > 0 (above ground)
        pellet_y = pellets.positions[0, 1].item()
        assert pellet_y > 0, f"Pellet Y={pellet_y} is at or below ground"
        assert pellet_y >= 0.5, f"Pellet Y={pellet_y} is below minimum spawn height 0.5"

    def test_pellets_reachable_distance(self):
        """First pellet should spawn 7-8 units from creature edge."""
        genome = create_test_genome([
            {'id': 'node_0', 'position': {'x': 0, 'y': 0.5, 'z': 0}, 'size': 0.5, 'friction': 0.5},
            {'id': 'node_1', 'position': {'x': 1, 'y': 0.5, 'z': 0}, 'size': 0.5, 'friction': 0.5},
        ])

        batch = creature_genomes_to_batch([genome])
        creature_radius = calculate_creature_xz_radius(batch)[0].item()

        pellets = initialize_pellets(batch, arena_size=50.0, seed=42)

        # Initial distance should be pellet distance from creature edge
        initial_dist = pellets.initial_distances[0].item()

        # First pellet spawns 7-8 units from edge
        assert 6.5 <= initial_dist <= 8.5, f"Initial pellet distance {initial_dist} not in expected range [7, 8]"


class TestPelletCollection:
    """Test pellet collection detection."""

    def test_collection_when_node_touches_pellet(self):
        """Collection should trigger when node is within collection radius of pellet."""
        # Create creature with known position
        genome = create_test_genome([
            {'id': 'node_0', 'position': {'x': 5, 'y': 0.5, 'z': 0}, 'size': 0.5, 'friction': 0.5},
            {'id': 'node_1', 'position': {'x': 6, 'y': 0.5, 'z': 0}, 'size': 0.5, 'friction': 0.5},
        ])

        batch = creature_genomes_to_batch([genome])

        # Create a pellet right on top of node_0
        # Collection radius = size * 0.5 + 0.35 = 0.25 + 0.35 = 0.6
        pellets = PelletBatch(
            device=batch.device,
            batch_size=1,
            positions=torch.tensor([[5.0, 0.5, 0.0]]),  # Right at node_0 position
            initial_distances=torch.tensor([0.1]),
            pellet_indices=torch.tensor([0]),
            collected=torch.tensor([False]),
            total_collected=torch.tensor([0]),
            last_pellet_angles=torch.tensor([0.0]),
        )

        # Check collision
        collected = check_pellet_collisions(batch, pellets)
        assert collected[0].item() == True, "Should detect collection when pellet is at node position"

    def test_no_collection_when_pellet_far(self):
        """No collection when pellet is beyond collection radius."""
        genome = create_test_genome([
            {'id': 'node_0', 'position': {'x': 0, 'y': 0.5, 'z': 0}, 'size': 0.5, 'friction': 0.5},
            {'id': 'node_1', 'position': {'x': 1, 'y': 0.5, 'z': 0}, 'size': 0.5, 'friction': 0.5},
        ])

        batch = creature_genomes_to_batch([genome])

        # Create pellet 2 units away (beyond collection radius of ~0.6)
        pellets = PelletBatch(
            device=batch.device,
            batch_size=1,
            positions=torch.tensor([[2.0, 0.5, 0.0]]),
            initial_distances=torch.tensor([2.0]),
            pellet_indices=torch.tensor([0]),
            collected=torch.tensor([False]),
            total_collected=torch.tensor([0]),
            last_pellet_angles=torch.tensor([0.0]),
        )

        collected = check_pellet_collisions(batch, pellets)
        assert collected[0].item() == False, "Should NOT detect collection when pellet is far away"

    def test_collection_increments_total(self):
        """Collecting a pellet should increment total_collected."""
        genome = create_test_genome([
            {'id': 'node_0', 'position': {'x': 0, 'y': 0.5, 'z': 0}, 'size': 0.5, 'friction': 0.5},
            {'id': 'node_1', 'position': {'x': 1, 'y': 0.5, 'z': 0}, 'size': 0.5, 'friction': 0.5},
        ])

        batch = creature_genomes_to_batch([genome])

        # Create pellet right at node position
        pellets = PelletBatch(
            device=batch.device,
            batch_size=1,
            positions=torch.tensor([[0.0, 0.5, 0.0]]),  # At node_0
            initial_distances=torch.tensor([7.0]),
            pellet_indices=torch.tensor([0]),
            collected=torch.tensor([False]),
            total_collected=torch.tensor([0]),
            last_pellet_angles=torch.tensor([0.0]),
        )

        assert pellets.total_collected[0].item() == 0, "Should start with 0 pellets"

        # Update pellets (checks collision and respawns)
        update_pellets(batch, pellets, arena_size=50.0)

        assert pellets.total_collected[0].item() == 1, "Should have 1 pellet after collection"

        # New pellet should have spawned somewhere else
        new_pellet_pos = pellets.positions[0]
        assert not torch.allclose(new_pellet_pos, torch.tensor([0.0, 0.5, 0.0])), "New pellet should spawn at different position"


class TestCreatureSpawnHeight:
    """Test that creatures spawn above ground."""

    def test_all_nodes_above_ground(self):
        """All creature nodes should be above ground level."""
        # Use the population generator to create random genomes
        from app.genetics.population import generate_random_genome

        for _ in range(10):  # Test multiple random creatures
            genome = generate_random_genome(use_neural_net=False)

            for node in genome['nodes']:
                y_pos = node['position']['y']
                assert y_pos > 0, f"Node spawned at or below ground: Y={y_pos}"
                # With spawn_radius=1.5, min Y should be 0.3
                assert y_pos >= 0.3, f"Node Y={y_pos} below minimum spawn height"


class TestFitnessWithPellets:
    """Test fitness calculation with pellet collection."""

    def test_fitness_increases_with_pellet_collection(self):
        """Collecting a pellet should increase fitness significantly."""
        from app.simulation.fitness import (
            initialize_fitness_state,
            calculate_fitness,
        )

        genome = create_test_genome([
            {'id': 'node_0', 'position': {'x': 0, 'y': 0.5, 'z': 0}, 'size': 0.5, 'friction': 0.5},
            {'id': 'node_1', 'position': {'x': 1, 'y': 0.5, 'z': 0}, 'size': 0.5, 'friction': 0.5},
        ])

        batch = creature_genomes_to_batch([genome])

        # Create pellet NOT collectable (far away)
        pellets_no_collect = PelletBatch(
            device=batch.device,
            batch_size=1,
            positions=torch.tensor([[10.0, 0.5, 0.0]]),
            initial_distances=torch.tensor([9.0]),
            pellet_indices=torch.tensor([0]),
            collected=torch.tensor([False]),
            total_collected=torch.tensor([0]),
            last_pellet_angles=torch.tensor([0.0]),
        )

        fitness_state_no = initialize_fitness_state(batch, pellets_no_collect)
        fitness_no_collect = calculate_fitness(
            batch, pellets_no_collect, fitness_state_no,
            simulation_time=10.0, config=FitnessConfig()
        )

        # Create pellet with 1 already collected
        pellets_collected = PelletBatch(
            device=batch.device,
            batch_size=1,
            positions=torch.tensor([[10.0, 0.5, 0.0]]),
            initial_distances=torch.tensor([9.0]),
            pellet_indices=torch.tensor([1]),  # Already on pellet 1
            collected=torch.tensor([False]),
            total_collected=torch.tensor([1]),  # 1 collected!
            last_pellet_angles=torch.tensor([0.0]),
        )

        fitness_state_col = initialize_fitness_state(batch, pellets_collected)
        fitness_collected = calculate_fitness(
            batch, pellets_collected, fitness_state_col,
            simulation_time=10.0, config=FitnessConfig()
        )

        # Collecting a pellet should add 100 points (default pellet_points)
        fitness_diff = fitness_collected[0].item() - fitness_no_collect[0].item()
        assert fitness_diff >= 95, f"Pellet collection should add ~100 fitness, got {fitness_diff}"


if __name__ == '__main__':
    pytest.main([__file__, '-v'])

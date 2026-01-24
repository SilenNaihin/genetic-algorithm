"""
Parity Tests: Verify Python matches TypeScript behavior.

These tests verify that the Python simulation produces the same behavior
as the TypeScript frontend for key fitness and pellet mechanics.

Key parity requirements:
1. Edge-based distance calculation (from creature edge, not center)
2. Regression penalty (only after first pellet, penalty for moving away)
3. Opposite-half pellet spawning
4. Variable collection radius (node.size * 0.5 + 0.35)
5. Settling period (displacement bonus only after 0.5s)
6. Multi-pellet collection during simulation
7. Minimum fitness clamp to 0
"""

import math
import pytest
import torch

from app.simulation.tensors import (
    creature_genomes_to_batch,
    CreatureBatch,
    MAX_NODES,
)
from app.simulation.fitness import (
    FitnessConfig,
    PelletBatch,
    FitnessState,
    initialize_pellets,
    initialize_fitness_state,
    calculate_fitness,
    generate_pellet_positions,
    check_pellet_collisions,
    update_pellets,
    compute_edge_distances,
    calculate_creature_xz_radius,
)
from app.simulation.physics import (
    simulate_with_fitness,
    simulate_with_fitness_neural,
    get_center_of_mass,
    TIME_STEP,
)


def make_test_creature(creature_id: str = "test", node_size: float = 0.5) -> dict:
    """Create a simple 3-node creature for testing."""
    return {
        "id": creature_id,
        "nodes": [
            {"id": "n1", "position": {"x": 0, "y": 0.5, "z": 0}, "size": node_size, "friction": 0.5},
            {"id": "n2", "position": {"x": 1, "y": 0.5, "z": 0}, "size": node_size, "friction": 0.5},
            {"id": "n3", "position": {"x": 0.5, "y": 0.5, "z": 0.866}, "size": node_size, "friction": 0.5},
        ],
        "muscles": [
            {
                "id": "m1",
                "nodeA": "n1",
                "nodeB": "n2",
                "restLength": 1.0,
                "stiffness": 500,
                "damping": 10,
                "frequency": 1.0,
                "amplitude": 0.2,
                "phase": 0,
            },
            {
                "id": "m2",
                "nodeA": "n2",
                "nodeB": "n3",
                "restLength": 1.0,
                "stiffness": 500,
                "damping": 10,
                "frequency": 1.0,
                "amplitude": 0.2,
                "phase": 2.094,
            },
            {
                "id": "m3",
                "nodeA": "n3",
                "nodeB": "n1",
                "restLength": 1.0,
                "stiffness": 500,
                "damping": 10,
                "frequency": 1.0,
                "amplitude": 0.2,
                "phase": 4.189,
            },
        ],
        "globalFrequencyMultiplier": 1.0,
        "controllerType": "oscillator",
    }


class TestEdgeBasedDistance:
    """Verify edge-based distance calculation matches TypeScript."""

    def test_distance_from_edge_not_center(self):
        """Distance should be from creature's edge, not center."""
        genome = make_test_creature()
        batch = creature_genomes_to_batch([genome])

        com = get_center_of_mass(batch)
        radii = calculate_creature_xz_radius(batch)

        # Place pellet 10 units from center
        pellet_pos = com.clone()
        pellet_pos[0, 0] += 10.0  # 10 units in X direction

        edge_dist = compute_edge_distances(com, radii, pellet_pos)

        # Edge distance should be 10 - radius, not 10
        radius = radii[0].item()
        expected_edge_dist = 10.0 - radius

        assert abs(edge_dist[0].item() - expected_edge_dist) < 0.01

    def test_edge_distance_never_negative(self):
        """Edge distance should be clamped to 0 when pellet is inside creature."""
        genome = make_test_creature()
        batch = creature_genomes_to_batch([genome])

        com = get_center_of_mass(batch)
        radii = calculate_creature_xz_radius(batch)

        # Place pellet at center (inside creature)
        pellet_pos = com.clone()

        edge_dist = compute_edge_distances(com, radii, pellet_pos)

        assert edge_dist[0].item() == 0


class TestRegressionPenalty:
    """Verify regression penalty matches TypeScript behavior."""

    def test_no_penalty_before_first_collection(self):
        """Regression penalty should not apply before collecting any pellets."""
        genome = make_test_creature()
        batch = creature_genomes_to_batch([genome])
        pellets = initialize_pellets(batch, seed=42)
        state = initialize_fitness_state(batch, pellets)

        config = FitnessConfig(regression_penalty=20.0)

        # total_collected is 0, so no penalty should apply
        assert pellets.total_collected[0].item() == 0

        # Move creature away from pellet
        batch.positions[0, :, 0] -= 5.0

        fitness1 = calculate_fitness(batch, pellets, state, simulation_time=1.0, config=config)

        # Move back toward pellet
        batch.positions[0, :, 0] += 5.0

        fitness2 = calculate_fitness(batch, pellets, state, simulation_time=1.0, config=config)

        # No regression penalty should have been applied (total_collected == 0)
        # Fitness should be purely progress-based

    def test_penalty_after_first_collection(self):
        """Regression penalty should apply after collecting first pellet."""
        genome = make_test_creature()
        batch = creature_genomes_to_batch([genome])
        pellets = initialize_pellets(batch, seed=42)
        state = initialize_fitness_state(batch, pellets)

        config = FitnessConfig(regression_penalty=20.0, pellet_points=100.0)

        # Simulate collecting first pellet
        pellets.total_collected[0] = 1

        # Move toward new pellet first to set closest distance
        direction = pellets.positions[0, [0, 2]] - get_center_of_mass(batch)[0, [0, 2]]
        direction = direction / torch.norm(direction)
        batch.positions[0, :, 0] += direction[0] * 3.0
        batch.positions[0, :, 2] += direction[1] * 3.0

        # Update state to track closest distance
        from app.simulation.fitness import update_fitness_state
        update_fitness_state(batch, state, pellets, config)

        closest_after_approach = state.closest_edge_distance[0].item()

        # Get fitness at closest point
        fitness_at_closest = calculate_fitness(batch, pellets, state, simulation_time=1.0, config=config)

        # Now move AWAY from pellet (regression)
        batch.positions[0, :, 0] -= direction[0] * 4.0
        batch.positions[0, :, 2] -= direction[1] * 4.0
        update_fitness_state(batch, state, pellets, config)

        # closest_edge_distance should NOT change (only gets smaller)
        assert state.closest_edge_distance[0].item() == closest_after_approach

        # Get fitness after regression
        fitness_after_regression = calculate_fitness(batch, pellets, state, simulation_time=1.0, config=config)

        # Fitness should be LOWER due to regression penalty
        assert fitness_after_regression[0].item() < fitness_at_closest[0].item()


class TestOppositePelletSpawning:
    """Verify opposite-half pellet spawning matches TypeScript."""

    def test_first_pellet_random_angle(self):
        """First pellet can spawn at any angle."""
        genome = make_test_creature()
        batch = creature_genomes_to_batch([genome])
        radii = calculate_creature_xz_radius(batch)
        indices = torch.zeros(1, dtype=torch.long)

        # First pellet (no last angle)
        positions1, angle1 = generate_pellet_positions(batch, indices, radii, seed=42)

        # Angle can be anything
        assert 0 <= angle1[0].item() < 2 * math.pi

    def test_subsequent_pellet_opposite_half(self):
        """Subsequent pellets should spawn in opposite 180° arc."""
        genome = make_test_creature()
        batch = creature_genomes_to_batch([genome])
        radii = calculate_creature_xz_radius(batch)
        indices = torch.ones(1, dtype=torch.long)  # Second pellet

        # Set last angle to 0 (pointing in +X direction)
        last_angles = torch.tensor([0.0])

        # Generate second pellet multiple times
        angles = []
        for seed in range(10):
            _, angle = generate_pellet_positions(batch, indices, radii, last_angles, seed=seed)
            angles.append(angle[0].item())

        # All angles should be in the opposite half (π ± π/2 = [π/2, 3π/2])
        for angle in angles:
            # Normalize to [0, 2π)
            normalized = angle % (2 * math.pi)

            # Should be in range [π/2, 3π/2] (opposite of 0)
            # That means: normalized > π/2 and normalized < 3π/2
            assert math.pi / 2 <= normalized <= 3 * math.pi / 2, f"Angle {normalized} not in opposite half"


class TestCollectionRadius:
    """Verify collection radius is variable based on node size."""

    def test_collection_radius_varies_with_node_size(self):
        """Collection radius should be node.size * 0.5 + 0.35."""
        # Use single-node creatures to avoid other nodes interfering
        small_genome = {
            "id": "small",
            "nodes": [{"id": "n1", "position": {"x": 0, "y": 0.5, "z": 0}, "size": 0.4, "friction": 0.5}],
            "muscles": [],
            "globalFrequencyMultiplier": 1.0,
            "controllerType": "oscillator",
        }
        large_genome = {
            "id": "large",
            "nodes": [{"id": "n1", "position": {"x": 0, "y": 0.5, "z": 0}, "size": 1.0, "friction": 0.5}],
            "muscles": [],
            "globalFrequencyMultiplier": 1.0,
            "controllerType": "oscillator",
        }

        small_batch = creature_genomes_to_batch([small_genome])
        small_pellets = initialize_pellets(small_batch, seed=42)

        large_batch = creature_genomes_to_batch([large_genome])
        large_pellets = initialize_pellets(large_batch, seed=42)

        # Expected radii:
        # Small: 0.4 * 0.5 + 0.35 = 0.55
        # Large: 1.0 * 0.5 + 0.35 = 0.85

        # Place pellet at distance 0.7 from the node
        # Small (radius 0.55) should NOT collect, Large (radius 0.85) should collect
        small_pellets.positions[0] = small_batch.positions[0, 0].clone()
        small_pellets.positions[0, 0] += 0.7

        large_pellets.positions[0] = large_batch.positions[0, 0].clone()
        large_pellets.positions[0, 0] += 0.7

        small_collected = check_pellet_collisions(small_batch, small_pellets)
        large_collected = check_pellet_collisions(large_batch, large_pellets)

        # Large should collect, small should not
        assert large_collected[0].item() == True, "Large node (radius 0.85) should collect at distance 0.7"
        assert small_collected[0].item() == False, "Small node (radius 0.55) should not collect at distance 0.7"


class TestDisplacementBonus:
    """Verify displacement bonus is calculated from distance, not rate."""

    def test_displacement_bonus_is_distance_based(self):
        """Displacement bonus should be the same at different times for same movement."""
        genome = make_test_creature()
        batch = creature_genomes_to_batch([genome])
        pellets = initialize_pellets(batch, seed=42)
        state = initialize_fitness_state(batch, pellets)

        config = FitnessConfig(distance_traveled_max=20.0, distance_per_unit=3.0)

        # Move creature significantly
        batch.positions[0, :, 0] += 5.0
        from app.simulation.fitness import update_fitness_state
        update_fitness_state(batch, state, pellets)

        # Fitness at t=0.3 (early)
        fitness_early = calculate_fitness(batch, pellets, state, simulation_time=0.3, config=config)

        # Fitness at t=0.6 (later)
        fitness_late = calculate_fitness(batch, pellets, state, simulation_time=0.6, config=config)

        # Distance bonus should be the same at different times - it's based on distance, not time
        assert abs(fitness_late[0].item() - fitness_early[0].item()) < 0.1


class TestMinimumFitness:
    """Verify fitness is clamped to minimum 0."""

    def test_fitness_never_negative(self):
        """Fitness should never be negative even with heavy penalties."""
        genome = make_test_creature()
        batch = creature_genomes_to_batch([genome])
        pellets = initialize_pellets(batch, seed=42)
        state = initialize_fitness_state(batch, pellets)

        # Very high efficiency penalty
        config = FitnessConfig(efficiency_penalty=1000.0)
        state.total_activation[0] = 1000.0  # Massive activation

        fitness = calculate_fitness(batch, pellets, state, simulation_time=1.0, config=config)

        # Should be clamped to 0, not negative
        assert fitness[0].item() == 0


class TestPelletCollectionDuringSimulation:
    """Verify pellets are collected during simulation loop."""

    def test_pellet_collection_increments_count(self):
        """Creatures should be able to collect multiple pellets during simulation."""
        genome = make_test_creature()
        batch = creature_genomes_to_batch([genome])
        pellets = initialize_pellets(batch, seed=42)
        state = initialize_fitness_state(batch, pellets)
        config = FitnessConfig()

        # Move creature to collect pellet
        pellets.positions[0] = batch.positions[0, 0].clone()  # Put pellet at node

        # Run short simulation
        result = simulate_with_fitness(
            batch=batch,
            pellets=pellets,
            fitness_state=state,
            num_steps=10,
            fitness_config=config,
        )

        # Should have collected at least one pellet
        assert pellets.total_collected[0].item() >= 1

    def test_new_pellet_spawns_after_collection(self):
        """New pellet should spawn in opposite half after collection."""
        genome = make_test_creature()
        batch = creature_genomes_to_batch([genome])
        pellets = initialize_pellets(batch, seed=42)
        state = initialize_fitness_state(batch, pellets)
        config = FitnessConfig()

        # Record first pellet angle (from creature's perspective)
        first_angle = pellets.last_pellet_angles[0].item()

        # Move pellet to creature to force collection
        pellets.positions[0] = batch.positions[0, 0].clone()

        # Check for collision and update pellets
        collected = check_pellet_collisions(batch, pellets)
        assert collected[0].item(), "Pellet at node position should be collected"

        # Update pellets (spawns new one)
        update_pellets(batch, pellets)

        # Verify collection count increased
        assert pellets.total_collected[0].item() == 1, "Should have collected 1 pellet"

        # Get new pellet angle
        second_angle = pellets.last_pellet_angles[0].item()

        # Second angle should be in opposite half of first angle
        # Opposite half: first_angle + π ± π/2
        # So: |second_angle - (first_angle + π)| should be <= π/2 (normalized)
        expected_center = first_angle + math.pi
        angle_diff = second_angle - expected_center

        # Normalize to [-π, π]
        while angle_diff > math.pi:
            angle_diff -= 2 * math.pi
        while angle_diff < -math.pi:
            angle_diff += 2 * math.pi

        assert abs(angle_diff) <= math.pi / 2 + 0.01, \
            f"Second pellet angle {second_angle} not in opposite half of {first_angle}"


class TestFitnessComponents:
    """Verify all fitness components match TypeScript."""

    def test_pellet_points(self):
        """Each collected pellet should add pellet_points to fitness."""
        genome = make_test_creature()
        batch = creature_genomes_to_batch([genome])
        pellets = initialize_pellets(batch, seed=42)
        state = initialize_fitness_state(batch, pellets)

        config = FitnessConfig(pellet_points=100.0)

        # 0 pellets
        pellets.total_collected[0] = 0
        fitness0 = calculate_fitness(batch, pellets, state, simulation_time=1.0, config=config)

        # 1 pellet
        pellets.total_collected[0] = 1
        fitness1 = calculate_fitness(batch, pellets, state, simulation_time=1.0, config=config)

        # 3 pellets
        pellets.total_collected[0] = 3
        fitness3 = calculate_fitness(batch, pellets, state, simulation_time=1.0, config=config)

        # Differences should be exactly pellet_points
        diff_01 = fitness1[0].item() - fitness0[0].item()
        diff_13 = fitness3[0].item() - fitness1[0].item()

        assert abs(diff_01 - 100.0) < 0.01
        assert abs(diff_13 - 200.0) < 0.01


if __name__ == "__main__":
    pytest.main([__file__, "-v"])

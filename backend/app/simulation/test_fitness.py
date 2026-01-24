"""
Comprehensive tests for fitness calculation and pellet collision detection.

Tests cover:
- Creature XZ radius calculation
- Pellet generation
- Pellet collision detection
- Disqualification detection
- Fitness calculation
- Edge cases
"""

import pytest
import torch
import math

from app.simulation.tensors import creature_genomes_to_batch, get_center_of_mass, MAX_NODES
from app.simulation.fitness import (
    FitnessConfig,
    PelletBatch,
    FitnessState,
    calculate_creature_xz_radius,
    generate_pellet_positions,
    initialize_pellets,
    check_pellet_collisions,
    update_pellets,
    check_disqualifications,
    check_frequency_violations,
    initialize_fitness_state,
    update_fitness_state,
    calculate_fitness,
    compute_edge_distances,
)


# =============================================================================
# Test Fixtures
# =============================================================================


def make_simple_creature(genome_id: str = "test"):
    """Create a simple creature for testing."""
    return {
        "id": genome_id,
        "nodes": [
            {"id": "n0", "position": {"x": -0.5, "y": 0.5, "z": 0}, "size": 0.5, "friction": 0.5},
            {"id": "n1", "position": {"x": 0.5, "y": 0.5, "z": 0}, "size": 0.5, "friction": 0.5},
        ],
        "muscles": [
            {
                "id": "m0",
                "nodeA": "n0",
                "nodeB": "n1",
                "restLength": 1.0,
                "stiffness": 100.0,
                "damping": 0.1,
                "frequency": 1.0,
                "amplitude": 0.2,
                "phase": 0.0,
            }
        ],
        "globalFrequencyMultiplier": 1.0,
    }


def make_spread_creature():
    """Create a creature with nodes spread out in XZ plane."""
    return {
        "id": "spread",
        "nodes": [
            {"id": "n0", "position": {"x": -2.0, "y": 0.5, "z": -2.0}, "size": 0.5},
            {"id": "n1", "position": {"x": 2.0, "y": 0.5, "z": -2.0}, "size": 0.5},
            {"id": "n2", "position": {"x": 2.0, "y": 0.5, "z": 2.0}, "size": 0.5},
            {"id": "n3", "position": {"x": -2.0, "y": 0.5, "z": 2.0}, "size": 0.5},
        ],
        "muscles": [
            {"id": "m0", "nodeA": "n0", "nodeB": "n1", "restLength": 4.0, "stiffness": 100, "damping": 0.1, "frequency": 1.0, "amplitude": 0.2, "phase": 0},
            {"id": "m1", "nodeA": "n1", "nodeB": "n2", "restLength": 4.0, "stiffness": 100, "damping": 0.1, "frequency": 1.0, "amplitude": 0.2, "phase": 0},
            {"id": "m2", "nodeA": "n2", "nodeB": "n3", "restLength": 4.0, "stiffness": 100, "damping": 0.1, "frequency": 1.0, "amplitude": 0.2, "phase": 0},
            {"id": "m3", "nodeA": "n3", "nodeB": "n0", "restLength": 4.0, "stiffness": 100, "damping": 0.1, "frequency": 1.0, "amplitude": 0.2, "phase": 0},
        ],
    }


def make_high_frequency_creature():
    """Create a creature with frequency exceeding max allowed."""
    return {
        "id": "high-freq",
        "nodes": [
            {"id": "n0", "position": {"x": -0.5, "y": 0.5, "z": 0}, "size": 0.5},
            {"id": "n1", "position": {"x": 0.5, "y": 0.5, "z": 0}, "size": 0.5},
        ],
        "muscles": [
            {
                "id": "m0",
                "nodeA": "n0",
                "nodeB": "n1",
                "restLength": 1.0,
                "stiffness": 100.0,
                "damping": 0.1,
                "frequency": 5.0,  # Exceeds default max of 3.0
                "amplitude": 0.2,
                "phase": 0.0,
            }
        ],
        "globalFrequencyMultiplier": 1.0,
    }


# =============================================================================
# Test: Creature XZ Radius Calculation
# =============================================================================


class TestCreatureXZRadius:
    """Tests for calculate_creature_xz_radius function."""

    def test_simple_creature_radius(self):
        """Simple creature should have small radius."""
        genome = make_simple_creature()
        batch = creature_genomes_to_batch([genome])

        radii = calculate_creature_xz_radius(batch)

        assert radii.shape == (1,)
        # With nodes at x=-0.5 and x=0.5, center is at x=0
        # Max distance from center to node edge = 0.5 + 0.25 (radius) = 0.75
        # With 1.3x buffer = 0.975, but minimum is 1.0
        assert radii[0].item() >= 1.0

    def test_spread_creature_larger_radius(self):
        """Spread creature should have larger radius."""
        genome = make_spread_creature()
        batch = creature_genomes_to_batch([genome])

        radii = calculate_creature_xz_radius(batch)

        # Nodes at corners of 4x4 square, distance from center = sqrt(8) ≈ 2.83
        # Plus node radius 0.25, with 1.3x buffer
        assert radii[0].item() > 2.0

    def test_minimum_radius(self):
        """Radius should not be less than 1.0."""
        genome = {
            "id": "tiny",
            "nodes": [
                {"id": "n0", "position": {"x": 0, "y": 0.5, "z": 0}, "size": 0.1},
            ],
            "muscles": [],
        }
        batch = creature_genomes_to_batch([genome])

        radii = calculate_creature_xz_radius(batch)

        assert radii[0].item() >= 1.0

    def test_batched_radii(self):
        """Should handle multiple creatures."""
        genomes = [make_simple_creature("g1"), make_spread_creature()]
        genomes[1]["id"] = "g2"
        batch = creature_genomes_to_batch(genomes)

        radii = calculate_creature_xz_radius(batch)

        assert radii.shape == (2,)
        # Spread creature should have larger radius
        assert radii[1].item() > radii[0].item()


# =============================================================================
# Test: Pellet Generation
# =============================================================================


class TestPelletGeneration:
    """Tests for pellet generation functions."""

    def test_generate_pellet_positions_shape(self):
        """Generated positions should have correct shape."""
        genome = make_simple_creature()
        batch = creature_genomes_to_batch([genome])
        radii = calculate_creature_xz_radius(batch)
        indices = torch.zeros(1, dtype=torch.long)

        positions, angles = generate_pellet_positions(batch, indices, radii, seed=42)

        assert positions.shape == (1, 3)
        assert angles.shape == (1,)

    def test_pellet_distance_from_creature(self):
        """Pellet should spawn at appropriate distance from creature edge."""
        genome = make_simple_creature()
        batch = creature_genomes_to_batch([genome])
        radii = calculate_creature_xz_radius(batch)
        indices = torch.zeros(1, dtype=torch.long)

        positions, _ = generate_pellet_positions(batch, indices, radii, seed=42)

        # Get creature COM
        com = get_center_of_mass(batch)

        # Calculate XZ distance from COM to pellet
        dx = positions[0, 0] - com[0, 0]
        dz = positions[0, 2] - com[0, 2]
        dist = torch.sqrt(dx**2 + dz**2).item()

        # Distance should be radius + 7-8 units for first pellet
        min_dist = radii[0].item() + 7.0
        max_dist = radii[0].item() + 8.0

        assert dist >= min_dist - 0.1  # Small tolerance
        assert dist <= max_dist + 0.1

    def test_pellet_height_increases(self):
        """Pellet height should increase with index."""
        genome = make_simple_creature()
        batch = creature_genomes_to_batch([genome])
        radii = calculate_creature_xz_radius(batch)

        heights = []
        for idx in range(5):
            indices = torch.tensor([idx], dtype=torch.long)
            positions, _ = generate_pellet_positions(batch, indices, radii, seed=42+idx)
            heights.append(positions[0, 1].item())

        # Heights should increase
        for i in range(1, len(heights)):
            assert heights[i] > heights[i-1]

    def test_initialize_pellets(self):
        """Initialize pellets should create valid pellet batch."""
        genome = make_simple_creature()
        batch = creature_genomes_to_batch([genome])

        pellets = initialize_pellets(batch, seed=42)

        assert pellets.batch_size == 1
        assert pellets.positions.shape == (1, 3)
        assert pellets.pellet_indices[0].item() == 0
        assert not pellets.collected[0].item()
        assert pellets.total_collected[0].item() == 0
        assert pellets.initial_distances[0].item() > 0
        # Last pellet angles should be set (not NaN after first spawn)
        assert not torch.isnan(pellets.last_pellet_angles[0])


# =============================================================================
# Test: Edge Distance Calculation
# =============================================================================


class TestEdgeDistances:
    """Tests for compute_edge_distances function."""

    def test_edge_distance_basic(self):
        """Basic edge distance calculation."""
        com = torch.tensor([[0.0, 0.0, 0.0]])
        radii = torch.tensor([1.0])
        target = torch.tensor([[5.0, 0.0, 0.0]])

        dist = compute_edge_distances(com, radii, target)

        # Distance from center = 5, minus radius 1 = 4
        assert abs(dist[0].item() - 4.0) < 0.01

    def test_edge_distance_inside_creature(self):
        """Distance should be 0 if target is inside creature."""
        com = torch.tensor([[0.0, 0.0, 0.0]])
        radii = torch.tensor([2.0])
        target = torch.tensor([[1.0, 0.0, 0.0]])  # Inside radius

        dist = compute_edge_distances(com, radii, target)

        assert dist[0].item() == 0

    def test_edge_distance_ignores_y(self):
        """Edge distance should only consider XZ plane."""
        com = torch.tensor([[0.0, 0.0, 0.0]])
        radii = torch.tensor([1.0])
        target = torch.tensor([[5.0, 10.0, 0.0]])  # High Y

        dist = compute_edge_distances(com, radii, target)

        # Distance in XZ = 5, minus radius 1 = 4
        assert abs(dist[0].item() - 4.0) < 0.01


# =============================================================================
# Test: Pellet Collision Detection
# =============================================================================


class TestPelletCollision:
    """Tests for check_pellet_collisions function."""

    def test_no_collision_far_pellet(self):
        """Pellet far from creature should not be collected."""
        genome = make_simple_creature()
        batch = creature_genomes_to_batch([genome])
        pellets = initialize_pellets(batch, seed=42)

        # Pellet is spawned far away by default
        collected = check_pellet_collisions(batch, pellets)

        assert not collected[0].item()

    def test_collision_when_close(self):
        """Pellet very close to node should be collected."""
        genome = make_simple_creature()
        batch = creature_genomes_to_batch([genome])
        pellets = initialize_pellets(batch, seed=42)

        # Move pellet to very close to first node
        pellets.positions[0] = batch.positions[0, 0].clone()

        # Collection radius is now based on node size: size*0.5 + 0.35
        # For size 0.5: 0.25 + 0.35 = 0.6
        collected = check_pellet_collisions(batch, pellets)

        assert collected[0].item()

    def test_update_pellets_increments_count(self):
        """Collecting pellet should increment total count."""
        genome = make_simple_creature()
        batch = creature_genomes_to_batch([genome])
        pellets = initialize_pellets(batch, seed=42)

        initial_count = pellets.total_collected[0].item()

        # Move pellet to node position
        pellets.positions[0] = batch.positions[0, 0].clone()

        update_pellets(batch, pellets)

        assert pellets.total_collected[0].item() == initial_count + 1

    def test_update_pellets_spawns_new(self):
        """Collecting pellet should spawn new one."""
        genome = make_simple_creature()
        batch = creature_genomes_to_batch([genome])
        pellets = initialize_pellets(batch, seed=42)

        old_pellet_idx = pellets.pellet_indices[0].item()

        # Collect pellet
        pellets.positions[0] = batch.positions[0, 0].clone()
        update_pellets(batch, pellets)

        # Pellet index should increment
        assert pellets.pellet_indices[0].item() == old_pellet_idx + 1


# =============================================================================
# Test: Disqualification Detection
# =============================================================================


class TestDisqualification:
    """Tests for disqualification detection functions."""

    def test_normal_creature_not_disqualified(self):
        """Normal creature should not be disqualified."""
        genome = make_simple_creature()
        batch = creature_genomes_to_batch([genome])

        disqualified = check_disqualifications(batch)

        assert not disqualified[0].item()

    def test_nan_position_disqualified(self):
        """Creature with NaN position should be disqualified."""
        genome = make_simple_creature()
        batch = creature_genomes_to_batch([genome])

        # Inject NaN
        batch.positions[0, 0, 0] = float('nan')

        disqualified = check_disqualifications(batch)

        assert disqualified[0].item()

    def test_far_position_disqualified(self):
        """Creature far from origin should be disqualified."""
        genome = make_simple_creature()
        batch = creature_genomes_to_batch([genome])
        config = FitnessConfig(position_threshold=50.0)

        # Move creature far away
        batch.positions[0, 0, 0] = 100.0

        disqualified = check_disqualifications(batch, config)

        assert disqualified[0].item()

    def test_high_position_disqualified(self):
        """Creature too high should be disqualified."""
        genome = make_simple_creature()
        batch = creature_genomes_to_batch([genome])
        config = FitnessConfig(height_threshold=30.0)

        # Move creature high
        batch.positions[0, 0, 1] = 50.0

        disqualified = check_disqualifications(batch, config)

        assert disqualified[0].item()


# =============================================================================
# Test: Frequency Violation
# =============================================================================


class TestFrequencyViolation:
    """Tests for frequency violation detection."""

    def test_normal_frequency_ok(self):
        """Normal frequency should not be flagged."""
        genome = make_simple_creature()
        batch = creature_genomes_to_batch([genome])

        violated = check_frequency_violations(batch)

        assert not violated[0].item()

    def test_high_frequency_flagged(self):
        """High frequency should be flagged."""
        genome = make_high_frequency_creature()
        batch = creature_genomes_to_batch([genome])
        config = FitnessConfig(max_allowed_frequency=3.0)

        violated = check_frequency_violations(batch, config)

        assert violated[0].item()

    def test_frequency_multiplier_included(self):
        """Global frequency multiplier should affect check."""
        genome = make_simple_creature()
        genome["muscles"][0]["frequency"] = 2.0  # 2 Hz base
        genome["globalFrequencyMultiplier"] = 2.0  # 2x = 4 Hz effective
        batch = creature_genomes_to_batch([genome])
        config = FitnessConfig(max_allowed_frequency=3.0)

        violated = check_frequency_violations(batch, config)

        assert violated[0].item()  # 4 Hz > 3.0 max


# =============================================================================
# Test: Fitness State
# =============================================================================


class TestFitnessState:
    """Tests for fitness state management."""

    def test_initialize_fitness_state(self):
        """Initialize fitness state should set up tracking."""
        genome = make_simple_creature()
        batch = creature_genomes_to_batch([genome])
        pellets = initialize_pellets(batch, seed=42)

        state = initialize_fitness_state(batch, pellets)

        assert state.batch_size == 1
        assert state.distance_traveled[0].item() == 0
        assert not state.disqualified[0].item()
        # Closest edge distance should be initialized
        assert state.closest_edge_distance[0].item() > 0

    def test_update_fitness_state_tracks_distance(self):
        """Update should track distance traveled."""
        genome = make_simple_creature()
        batch = creature_genomes_to_batch([genome])
        pellets = initialize_pellets(batch, seed=42)
        state = initialize_fitness_state(batch, pellets)

        # Move creature
        batch.positions[0, :, 0] += 5.0  # Move in X
        update_fitness_state(batch, state, pellets)

        # Distance should increase
        assert state.distance_traveled[0].item() > 0


# =============================================================================
# Test: Fitness Calculation
# =============================================================================


class TestFitnessCalculation:
    """Tests for calculate_fitness function."""

    def test_initial_fitness_zero(self):
        """Initial fitness should be zero (no pellets, no movement)."""
        genome = make_simple_creature()
        batch = creature_genomes_to_batch([genome])
        pellets = initialize_pellets(batch, seed=42)
        state = initialize_fitness_state(batch, pellets)

        fitness = calculate_fitness(batch, pellets, state, simulation_time=0.0)

        # Should be 0 at start (no progress, no movement)
        assert abs(fitness[0].item()) < 0.1

    def test_fitness_increases_with_progress(self):
        """Fitness should increase when moving toward pellet."""
        genome = make_simple_creature()
        batch = creature_genomes_to_batch([genome])
        pellets = initialize_pellets(batch, seed=42)
        state = initialize_fitness_state(batch, pellets)

        # Get initial fitness
        initial_fitness = calculate_fitness(batch, pellets, state, simulation_time=1.0)

        # Move creature toward pellet
        direction = pellets.positions[0, [0, 2]] - get_center_of_mass(batch)[0, [0, 2]]
        direction = direction / torch.norm(direction)
        batch.positions[0, :, 0] += direction[0] * 3.0
        batch.positions[0, :, 2] += direction[1] * 3.0

        # Update state
        update_fitness_state(batch, state, pellets)

        # Get new fitness
        new_fitness = calculate_fitness(batch, pellets, state, simulation_time=1.0)

        assert new_fitness[0].item() > initial_fitness[0].item()

    def test_fitness_from_collected_pellet(self):
        """Collecting pellet should add points."""
        genome = make_simple_creature()
        batch = creature_genomes_to_batch([genome])
        pellets = initialize_pellets(batch, seed=42)
        state = initialize_fitness_state(batch, pellets)
        config = FitnessConfig(pellet_points=100.0)

        # Collect pellet
        pellets.total_collected[0] = 1

        fitness = calculate_fitness(batch, pellets, state, simulation_time=1.0, config=config)

        # Should have at least pellet points
        assert fitness[0].item() >= 100.0

    def test_disqualified_gets_zero(self):
        """Disqualified creature should get 0 fitness."""
        genome = make_simple_creature()
        batch = creature_genomes_to_batch([genome])
        pellets = initialize_pellets(batch, seed=42)
        state = initialize_fitness_state(batch, pellets)

        # Collect a pellet first
        pellets.total_collected[0] = 3

        # Then disqualify
        state.disqualified[0] = True

        fitness = calculate_fitness(batch, pellets, state, simulation_time=1.0)

        assert fitness[0].item() == 0

    def test_regression_penalty_on_moving_away(self):
        """Should penalize moving away from pellet after approaching it."""
        genome = make_simple_creature()
        batch = creature_genomes_to_batch([genome])
        pellets = initialize_pellets(batch, seed=42)
        state = initialize_fitness_state(batch, pellets)
        config = FitnessConfig(regression_penalty=20.0)

        # Move toward pellet first to set closest distance
        direction = pellets.positions[0, [0, 2]] - get_center_of_mass(batch)[0, [0, 2]]
        direction = direction / torch.norm(direction)
        batch.positions[0, :, 0] += direction[0] * 2.0
        batch.positions[0, :, 2] += direction[1] * 2.0
        update_fitness_state(batch, state, pellets)

        fitness_at_closest = calculate_fitness(batch, pellets, state, simulation_time=1.0, config=config)

        # Now move away from pellet
        batch.positions[0, :, 0] -= direction[0] * 3.0
        batch.positions[0, :, 2] -= direction[1] * 3.0
        update_fitness_state(batch, state, pellets)

        fitness_after_regression = calculate_fitness(batch, pellets, state, simulation_time=1.0, config=config)

        # Fitness should be lower due to regression penalty
        assert fitness_after_regression[0].item() < fitness_at_closest[0].item()

    def test_distance_traveled_bonus_from_movement(self):
        """Distance traveled bonus is based on cumulative distance moved."""
        genome = make_simple_creature()
        batch = creature_genomes_to_batch([genome])
        pellets = initialize_pellets(batch, seed=42)
        state = initialize_fitness_state(batch, pellets)
        config = FitnessConfig(distance_traveled_max=20.0, distance_per_unit=3.0)

        # Get fitness before moving
        fitness_before = calculate_fitness(batch, pellets, state, simulation_time=1.0, config=config)

        # Move creature and accumulate distance traveled
        batch.positions[0, :, 0] += 5.0
        update_fitness_state(batch, state, pellets)

        # Get fitness after moving
        fitness_after = calculate_fitness(batch, pellets, state, simulation_time=1.0, config=config)

        # Fitness should increase due to distance traveled bonus
        assert fitness_after[0].item() > fitness_before[0].item()


# =============================================================================
# Test: Edge Cases
# =============================================================================


class TestEdgeCases:
    """Test edge cases and boundary conditions."""

    def test_empty_batch_radius(self):
        """Empty batch should return empty radii."""
        batch = creature_genomes_to_batch([])
        radii = calculate_creature_xz_radius(batch)
        assert radii.shape == (0,)

    def test_empty_batch_pellets(self):
        """Empty batch should create empty pellet batch."""
        batch = creature_genomes_to_batch([])
        pellets = initialize_pellets(batch)
        assert pellets.batch_size == 0

    def test_empty_batch_fitness(self):
        """Empty batch should return empty fitness."""
        batch = creature_genomes_to_batch([])
        pellets = initialize_pellets(batch)
        state = initialize_fitness_state(batch, pellets)
        fitness = calculate_fitness(batch, pellets, state, simulation_time=1.0)
        assert fitness.shape == (0,)

    def test_multiple_creatures_independent(self):
        """Each creature should have independent fitness tracking."""
        genomes = [make_simple_creature("g1"), make_simple_creature("g2")]
        batch = creature_genomes_to_batch(genomes)
        pellets = initialize_pellets(batch, seed=42)
        state = initialize_fitness_state(batch, pellets)

        # Collect pellet for first creature only
        pellets.total_collected[0] = 1

        fitness = calculate_fitness(batch, pellets, state, simulation_time=1.0)

        # First creature should have higher fitness
        assert fitness[0].item() > fitness[1].item()


# =============================================================================
# Run tests
# =============================================================================

if __name__ == "__main__":
    pytest.main([__file__, "-v"])

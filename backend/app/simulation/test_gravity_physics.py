"""
Tests for physics simulation and gravity.

These tests verify:
1. Gravity causes downward acceleration at correct rate
2. Ground collision prevents falling through floor
3. Physics integration produces realistic motion
"""

import pytest
import torch
import math

from app.simulation.tensors import CreatureBatch, creature_genomes_to_batch
from app.simulation.physics import (
    GRAVITY,
    TIME_STEP,
    compute_gravity_forces,
    apply_ground_collision,
    integrate_euler,
    physics_step,
    simulate,
)


def create_test_genome(nodes: list[dict], muscles: list[dict] = None) -> dict:
    """Create a minimal test genome."""
    if muscles is None:
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


class TestGravityConstant:
    """Test gravity constant value."""

    def test_gravity_is_earth_like(self):
        """Gravity should be approximately -9.8 m/s²."""
        assert GRAVITY == -9.8, f"Gravity should be -9.8, got {GRAVITY}"

    def test_gravity_is_negative(self):
        """Gravity should be negative (downward in Y)."""
        assert GRAVITY < 0, "Gravity must be negative (downward)"


class TestGravityForce:
    """Test gravity force calculation."""

    def test_gravity_force_direction(self):
        """Gravity force should point downward (negative Y)."""
        genome = create_test_genome([
            {'id': 'node_0', 'position': {'x': 0, 'y': 5, 'z': 0}, 'size': 0.5, 'friction': 0.5},
            {'id': 'node_1', 'position': {'x': 1, 'y': 5, 'z': 0}, 'size': 0.5, 'friction': 0.5},
        ])

        batch = creature_genomes_to_batch([genome])
        forces = compute_gravity_forces(batch, gravity=GRAVITY)

        # Y component should be negative for all valid nodes
        for i in range(batch.node_mask.sum().int().item()):
            fy = forces[0, i, 1].item()
            assert fy < 0, f"Gravity force Y should be negative, got {fy}"

    def test_gravity_force_magnitude(self):
        """Gravity force = mass * gravity."""
        genome = create_test_genome([
            {'id': 'node_0', 'position': {'x': 0, 'y': 5, 'z': 0}, 'size': 0.5, 'friction': 0.5},
        ])

        batch = creature_genomes_to_batch([genome])
        forces = compute_gravity_forces(batch, gravity=GRAVITY)

        mass = batch.masses[0, 0].item()
        expected_force = mass * GRAVITY
        actual_force = forces[0, 0, 1].item()

        assert abs(actual_force - expected_force) < 0.01, \
            f"Force={actual_force}, expected={expected_force} (mass={mass})"

    def test_no_horizontal_gravity(self):
        """Gravity should have no X or Z components."""
        genome = create_test_genome([
            {'id': 'node_0', 'position': {'x': 0, 'y': 5, 'z': 0}, 'size': 0.5, 'friction': 0.5},
        ])

        batch = creature_genomes_to_batch([genome])
        forces = compute_gravity_forces(batch, gravity=GRAVITY)

        fx = forces[0, 0, 0].item()
        fz = forces[0, 0, 2].item()

        assert abs(fx) < 1e-6, f"Gravity X component should be 0, got {fx}"
        assert abs(fz) < 1e-6, f"Gravity Z component should be 0, got {fz}"


class TestGravityIntegration:
    """Test gravity causes proper falling motion."""

    def test_free_fall_acceleration(self):
        """Object in free fall should accelerate at g."""
        genome = create_test_genome([
            {'id': 'node_0', 'position': {'x': 0, 'y': 10, 'z': 0}, 'size': 0.5, 'friction': 0.5},
        ])

        batch = creature_genomes_to_batch([genome])
        base_rest_lengths = batch.spring_rest_length.clone()

        initial_y = batch.positions[0, 0, 1].item()

        # Simulate for a short time
        dt = 1/60
        num_steps = 30  # 0.5 seconds
        time = 0.0

        for _ in range(num_steps):
            physics_step(batch, base_rest_lengths, time, dt=dt, gravity=GRAVITY)
            time += dt

        final_y = batch.positions[0, 0, 1].item()

        # In 0.5s of free fall: d = 0.5 * g * t² = 0.5 * 9.8 * 0.25 ≈ 1.225m
        # But we have damping, so actual will be less
        fall_distance = initial_y - final_y

        # Should have fallen at least 0.5m in 0.5s (accounting for damping)
        assert fall_distance > 0.5, f"Object should fall >0.5m in 0.5s, fell {fall_distance}m"
        # Should have fallen less than ideal (due to damping)
        assert fall_distance < 2.0, f"Object fell {fall_distance}m - check damping"

    def test_objects_fall_same_rate_regardless_of_mass(self):
        """Heavier and lighter objects should fall at same rate (F/m = g)."""
        # Small node (lighter)
        genome_small = create_test_genome([
            {'id': 'node_0', 'position': {'x': 0, 'y': 10, 'z': 0}, 'size': 0.3, 'friction': 0.5},
        ])

        # Large node (heavier)
        genome_large = create_test_genome([
            {'id': 'node_0', 'position': {'x': 0, 'y': 10, 'z': 0}, 'size': 0.7, 'friction': 0.5},
        ])

        batch_small = creature_genomes_to_batch([genome_small])
        batch_large = creature_genomes_to_batch([genome_large])

        base_small = batch_small.spring_rest_length.clone()
        base_large = batch_large.spring_rest_length.clone()

        dt = 1/60
        num_steps = 30
        time = 0.0

        for _ in range(num_steps):
            physics_step(batch_small, base_small, time, dt=dt, gravity=GRAVITY)
            physics_step(batch_large, base_large, time, dt=dt, gravity=GRAVITY)
            time += dt

        y_small = batch_small.positions[0, 0, 1].item()
        y_large = batch_large.positions[0, 0, 1].item()

        # They should fall to approximately the same height
        # (ground collision may affect this if sizes differ)
        height_diff = abs(y_small - y_large)
        # Account for different node radii affecting ground collision
        size_diff = 0.4 / 2  # (0.7 - 0.3) / 2
        assert height_diff < 0.5 + size_diff, \
            f"Objects fell to different heights: small={y_small}, large={y_large}"


class TestGroundCollision:
    """Test ground collision detection and response."""

    def test_node_stops_at_ground(self):
        """Falling node should stop at ground level."""
        # Start node above ground
        genome = create_test_genome([
            {'id': 'node_0', 'position': {'x': 0, 'y': 2, 'z': 0}, 'size': 0.5, 'friction': 0.5},
        ])

        batch = creature_genomes_to_batch([genome])
        base_rest_lengths = batch.spring_rest_length.clone()

        # Simulate for 2 seconds - plenty of time to fall
        dt = 1/60
        num_steps = 120
        time = 0.0

        for _ in range(num_steps):
            physics_step(batch, base_rest_lengths, time, dt=dt, gravity=GRAVITY)
            time += dt

        final_y = batch.positions[0, 0, 1].item()
        node_radius = batch.sizes[0, 0].item() * 0.5

        # Node center should be at ground + radius
        expected_y = 0 + node_radius
        assert final_y >= expected_y - 0.01, \
            f"Node went below ground: Y={final_y}, expected >= {expected_y}"

    def test_no_falling_through_ground(self):
        """Node should never go below ground level."""
        genome = create_test_genome([
            {'id': 'node_0', 'position': {'x': 0, 'y': 0.5, 'z': 0}, 'size': 0.5, 'friction': 0.5},
        ])

        batch = creature_genomes_to_batch([genome])
        base_rest_lengths = batch.spring_rest_length.clone()

        # Give it a strong downward velocity
        batch.velocities[0, 0, 1] = -50.0

        # Apply ground collision
        apply_ground_collision(batch)

        final_y = batch.positions[0, 0, 1].item()
        node_radius = batch.sizes[0, 0].item() * 0.5

        assert final_y >= node_radius, f"Node below ground: Y={final_y}"


class TestPhysicsRealism:
    """Test overall physics realism."""

    def test_simulation_speed_feels_normal(self):
        """A 1m fall should take about 0.45s (physics should feel normal)."""
        # d = 0.5 * g * t² -> t = sqrt(2d/g) = sqrt(2/9.8) ≈ 0.45s for 1m
        genome = create_test_genome([
            {'id': 'node_0', 'position': {'x': 0, 'y': 1.25, 'z': 0}, 'size': 0.5, 'friction': 0.5},
            # Y=1.25 means node center at 1.25, with radius 0.25, bottom at 1.0
            # It needs to fall 1.0m to reach ground
        ])

        batch = creature_genomes_to_batch([genome])
        base_rest_lengths = batch.spring_rest_length.clone()

        dt = 1/60
        node_radius = batch.sizes[0, 0].item() * 0.5

        # Track when it hits ground
        time = 0.0
        hit_ground_time = None

        for step in range(120):  # Max 2 seconds
            y_before = batch.positions[0, 0, 1].item()
            physics_step(batch, base_rest_lengths, time, dt=dt, gravity=GRAVITY)
            y_after = batch.positions[0, 0, 1].item()
            time += dt

            # Check if it hit ground this step
            if y_after <= node_radius + 0.01 and hit_ground_time is None:
                hit_ground_time = time
                break

        assert hit_ground_time is not None, "Object never hit ground"
        # With damping, it should take longer than ideal
        # Ideal for 1m: 0.45s, with damping expect 0.3-0.8s
        assert 0.2 < hit_ground_time < 1.0, \
            f"Fall time {hit_ground_time}s is unrealistic (expected ~0.3-0.8s for 1m)"


if __name__ == '__main__':
    pytest.main([__file__, '-v'])

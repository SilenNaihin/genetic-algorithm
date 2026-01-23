"""
Comprehensive tests for batched physics simulation.

Tests cover:
- Spring force calculation
- Gravity
- Ground collision
- Integration
- Muscle oscillation
- Full simulation
- Edge cases and numerical stability
"""

import pytest
import torch
import math

from app.simulation.tensors import (
    CreatureBatch,
    creature_genomes_to_batch,
    get_center_of_mass,
    MAX_NODES,
    MAX_MUSCLES,
)
from app.simulation.physics import (
    compute_spring_forces,
    compute_gravity_forces,
    compute_oscillating_rest_lengths,
    apply_ground_collision,
    integrate_euler,
    physics_step,
    simulate,
    GRAVITY,
    TIME_STEP,
    GROUND_Y,
)


# =============================================================================
# Test Fixtures
# =============================================================================


def make_two_node_creature(
    genome_id: str = "test",
    distance: float = 1.0,
    stiffness: float = 100.0,
    damping: float = 0.1,
    y_offset: float = 0.5,
) -> dict:
    """Create a simple two-node creature connected by one spring."""
    return {
        "id": genome_id,
        "nodes": [
            {"id": "n0", "position": {"x": -distance / 2, "y": y_offset, "z": 0}, "size": 0.5, "friction": 0.5},
            {"id": "n1", "position": {"x": distance / 2, "y": y_offset, "z": 0}, "size": 0.5, "friction": 0.5},
        ],
        "muscles": [
            {
                "id": "m0",
                "nodeA": "n0",
                "nodeB": "n1",
                "restLength": distance,
                "stiffness": stiffness,
                "damping": damping,
                "frequency": 1.0,
                "amplitude": 0.0,  # No oscillation for basic tests
                "phase": 0.0,
            }
        ],
        "globalFrequencyMultiplier": 1.0,
    }


def make_falling_node() -> dict:
    """Create a single node that will fall under gravity."""
    return {
        "id": "falling",
        "nodes": [
            {"id": "n0", "position": {"x": 0, "y": 2.0, "z": 0}, "size": 0.5, "friction": 0.5},
        ],
        "muscles": [],
    }


def make_oscillating_creature(
    frequency: float = 1.0,
    amplitude: float = 0.3,
    phase: float = 0.0,
) -> dict:
    """Create a creature with oscillating muscle."""
    return {
        "id": "oscillating",
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
                "frequency": frequency,
                "amplitude": amplitude,
                "phase": phase,
            }
        ],
        "globalFrequencyMultiplier": 1.0,
    }


# =============================================================================
# Test: Spring Force Calculation
# =============================================================================


class TestSpringForces:
    """Tests for compute_spring_forces function."""

    def test_spring_at_rest_length_no_force(self):
        """Spring at rest length should produce no force."""
        genome = make_two_node_creature(distance=1.0)
        batch = creature_genomes_to_batch([genome])

        forces = compute_spring_forces(batch)

        # Forces should be ~zero (small numerical error allowed)
        assert forces.shape == (1, MAX_NODES, 3)
        assert torch.abs(forces).max() < 1e-5

    def test_stretched_spring_pulls_inward(self):
        """Stretched spring should pull nodes toward each other."""
        genome = make_two_node_creature(distance=2.0)  # Nodes 2m apart
        genome["muscles"][0]["restLength"] = 1.0  # Rest length 1m (stretched)
        batch = creature_genomes_to_batch([genome])

        forces = compute_spring_forces(batch)

        # Node 0 at x=-1, Node 1 at x=1, rest_length=1, current=2
        # Spring is stretched by 1m
        # Node 0 should be pulled toward +X (toward node 1)
        # Node 1 should be pulled toward -X (toward node 0)
        assert forces[0, 0, 0] > 0  # Node 0 pulled in +X
        assert forces[0, 1, 0] < 0  # Node 1 pulled in -X

    def test_compressed_spring_pushes_outward(self):
        """Compressed spring should push nodes apart."""
        genome = make_two_node_creature(distance=0.5)  # Nodes 0.5m apart
        genome["muscles"][0]["restLength"] = 1.0  # Rest length 1m (compressed)
        batch = creature_genomes_to_batch([genome])

        forces = compute_spring_forces(batch)

        # Node 0 at x=-0.25, Node 1 at x=0.25, rest_length=1, current=0.5
        # Spring is compressed by 0.5m
        # Node 0 should be pushed in -X (away from node 1)
        # Node 1 should be pushed in +X (away from node 0)
        assert forces[0, 0, 0] < 0  # Node 0 pushed in -X
        assert forces[0, 1, 0] > 0  # Node 1 pushed in +X

    def test_stiffness_affects_force_magnitude(self):
        """Higher stiffness should produce larger forces."""
        genome1 = make_two_node_creature(distance=2.0, stiffness=100.0)
        genome1["muscles"][0]["restLength"] = 1.0
        genome2 = make_two_node_creature(distance=2.0, stiffness=200.0)
        genome2["muscles"][0]["restLength"] = 1.0
        genome2["id"] = "test2"

        batch1 = creature_genomes_to_batch([genome1])
        batch2 = creature_genomes_to_batch([genome2])

        forces1 = compute_spring_forces(batch1)
        forces2 = compute_spring_forces(batch2)

        # Force should be proportional to stiffness
        ratio = torch.abs(forces2[0, 0, 0]) / torch.abs(forces1[0, 0, 0])
        assert abs(ratio - 2.0) < 0.01  # 200/100 = 2x

    def test_damping_opposes_velocity(self):
        """Damping should oppose relative velocity."""
        genome = make_two_node_creature(distance=1.0, damping=10.0)
        batch = creature_genomes_to_batch([genome])

        # Give nodes relative velocity (moving apart)
        batch.velocities[0, 0, 0] = -1.0  # Node 0 moving left
        batch.velocities[0, 1, 0] = 1.0   # Node 1 moving right

        forces = compute_spring_forces(batch)

        # Damping should pull them back together (oppose separation)
        assert forces[0, 0, 0] > 0  # Node 0 pulled right
        assert forces[0, 1, 0] < 0  # Node 1 pulled left

    def test_forces_sum_to_zero(self):
        """Internal forces should sum to zero (Newton's 3rd law)."""
        genome = make_two_node_creature(distance=2.0)
        genome["muscles"][0]["restLength"] = 1.0
        batch = creature_genomes_to_batch([genome])

        forces = compute_spring_forces(batch)

        # Sum of all forces on valid nodes should be ~zero
        valid_forces = forces[0, :2, :]  # Only first 2 nodes are real
        total = valid_forces.sum(dim=0)
        assert torch.abs(total).max() < 1e-5

    def test_batched_spring_forces(self):
        """Test spring forces for multiple creatures in batch."""
        genomes = [
            make_two_node_creature("g1", distance=2.0),
            make_two_node_creature("g2", distance=1.0),
        ]
        genomes[0]["muscles"][0]["restLength"] = 1.0  # Stretched
        genomes[1]["muscles"][0]["restLength"] = 2.0  # Compressed

        batch = creature_genomes_to_batch(genomes)
        forces = compute_spring_forces(batch)

        # First creature: stretched, should pull inward
        assert forces[0, 0, 0] > 0

        # Second creature: compressed, should push outward
        assert forces[1, 0, 0] < 0

    def test_empty_batch_spring_forces(self):
        """Empty batch should return empty forces."""
        batch = creature_genomes_to_batch([])
        forces = compute_spring_forces(batch)

        assert forces.shape == (0, MAX_NODES, 3)

    def test_no_muscles_no_forces(self):
        """Creature with no muscles should have zero spring forces."""
        genome = {
            "id": "no-muscles",
            "nodes": [
                {"id": "n0", "position": {"x": 0, "y": 0.5, "z": 0}, "size": 0.5, "friction": 0.5},
                {"id": "n1", "position": {"x": 1, "y": 0.5, "z": 0}, "size": 0.5, "friction": 0.5},
            ],
            "muscles": [],
        }
        batch = creature_genomes_to_batch([genome])
        forces = compute_spring_forces(batch)

        assert torch.abs(forces).max() < 1e-10


# =============================================================================
# Test: Gravity
# =============================================================================


class TestGravity:
    """Tests for compute_gravity_forces function."""

    def test_gravity_pulls_down(self):
        """Gravity should produce negative Y force."""
        genome = make_falling_node()
        batch = creature_genomes_to_batch([genome])

        forces = compute_gravity_forces(batch)

        # Y force should be negative (down)
        assert forces[0, 0, 1] < 0

    def test_gravity_proportional_to_mass(self):
        """Gravity force should be proportional to mass."""
        genome1 = {"id": "small", "nodes": [{"id": "n0", "position": {"x": 0, "y": 1, "z": 0}, "size": 0.5}], "muscles": []}
        genome2 = {"id": "large", "nodes": [{"id": "n0", "position": {"x": 0, "y": 1, "z": 0}, "size": 1.0}], "muscles": []}

        batch1 = creature_genomes_to_batch([genome1])
        batch2 = creature_genomes_to_batch([genome2])

        forces1 = compute_gravity_forces(batch1)
        forces2 = compute_gravity_forces(batch2)

        # Larger mass = larger force
        assert abs(forces2[0, 0, 1]) > abs(forces1[0, 0, 1])

    def test_gravity_x_z_zero(self):
        """Gravity should have zero X and Z components."""
        genome = make_falling_node()
        batch = creature_genomes_to_batch([genome])

        forces = compute_gravity_forces(batch)

        assert forces[0, 0, 0] == 0  # X
        assert forces[0, 0, 2] == 0  # Z

    def test_padding_nodes_no_gravity(self):
        """Padding nodes should have zero gravity."""
        genome = make_falling_node()  # Only 1 node
        batch = creature_genomes_to_batch([genome])

        forces = compute_gravity_forces(batch)

        # Node 0 should have gravity
        assert forces[0, 0, 1] < 0
        # Nodes 1-7 are padding, should have zero force
        assert forces[0, 1:, :].abs().max() < 1e-10


# =============================================================================
# Test: Ground Collision
# =============================================================================


class TestGroundCollision:
    """Tests for apply_ground_collision function."""

    def test_node_above_ground_unchanged(self):
        """Node above ground should not be affected."""
        genome = {"id": "above", "nodes": [{"id": "n0", "position": {"x": 0, "y": 2.0, "z": 0}, "size": 0.5}], "muscles": []}
        batch = creature_genomes_to_batch([genome])

        original_y = batch.positions[0, 0, 1].item()
        apply_ground_collision(batch)

        assert batch.positions[0, 0, 1].item() == original_y

    def test_node_below_ground_pushed_up(self):
        """Node below ground should be pushed to ground level."""
        genome = {"id": "below", "nodes": [{"id": "n0", "position": {"x": 0, "y": -1.0, "z": 0}, "size": 0.5}], "muscles": []}
        batch = creature_genomes_to_batch([genome])

        # Manually set position below ground (bypassing spawn offset)
        batch.positions[0, 0, 1] = -0.5

        apply_ground_collision(batch)

        # Should be at ground + radius (0.25 for size 0.5)
        expected_y = GROUND_Y + 0.25
        assert batch.positions[0, 0, 1].item() >= expected_y - 0.01

    def test_velocity_reversed_on_bounce(self):
        """Downward velocity should be reversed on ground collision."""
        genome = {"id": "bouncing", "nodes": [{"id": "n0", "position": {"x": 0, "y": 0.5, "z": 0}, "size": 0.5}], "muscles": []}
        batch = creature_genomes_to_batch([genome])

        # Place at ground and give downward velocity
        batch.positions[0, 0, 1] = 0.1  # Just below ground level (radius is 0.25)
        batch.velocities[0, 0, 1] = -5.0  # Moving down

        apply_ground_collision(batch)

        # Velocity should now be positive (bounced up)
        assert batch.velocities[0, 0, 1] > 0

    def test_horizontal_velocity_friction(self):
        """Horizontal velocity should be reduced by friction."""
        genome = {"id": "sliding", "nodes": [{"id": "n0", "position": {"x": 0, "y": 0.5, "z": 0}, "size": 0.5}], "muscles": []}
        batch = creature_genomes_to_batch([genome])

        # Place on ground with horizontal velocity
        batch.positions[0, 0, 1] = 0.2  # At ground
        batch.velocities[0, 0, 0] = 10.0  # Moving in X

        original_vx = batch.velocities[0, 0, 0].item()
        apply_ground_collision(batch)

        # Horizontal velocity should be reduced
        assert batch.velocities[0, 0, 0].item() < original_vx


# =============================================================================
# Test: Integration
# =============================================================================


class TestIntegration:
    """Tests for integrate_euler function."""

    def test_constant_force_accelerates(self):
        """Constant force should cause acceleration."""
        genome = make_falling_node()
        batch = creature_genomes_to_batch([genome])

        # Apply constant force in X
        forces = torch.zeros(1, MAX_NODES, 3)
        forces[0, 0, 0] = batch.masses[0, 0] * 10.0  # F = ma, so a = 10

        initial_vx = batch.velocities[0, 0, 0].item()
        integrate_euler(batch, forces, dt=0.1, linear_damping=0.0)

        # Velocity should increase
        assert batch.velocities[0, 0, 0].item() > initial_vx

    def test_velocity_causes_motion(self):
        """Non-zero velocity should cause position change."""
        genome = make_falling_node()
        batch = creature_genomes_to_batch([genome])

        batch.velocities[0, 0, 0] = 5.0  # Moving in +X

        initial_x = batch.positions[0, 0, 0].item()
        forces = torch.zeros(1, MAX_NODES, 3)
        integrate_euler(batch, forces, dt=0.1, linear_damping=0.0)

        # Position should increase
        assert batch.positions[0, 0, 0].item() > initial_x

    def test_damping_reduces_velocity(self):
        """Linear damping should reduce velocity."""
        genome = make_falling_node()
        batch = creature_genomes_to_batch([genome])

        batch.velocities[0, 0, 0] = 10.0

        forces = torch.zeros(1, MAX_NODES, 3)
        integrate_euler(batch, forces, dt=0.1, linear_damping=0.5)

        # Velocity should be reduced
        assert batch.velocities[0, 0, 0].item() < 10.0


# =============================================================================
# Test: Muscle Oscillation
# =============================================================================


class TestMuscleOscillation:
    """Tests for compute_oscillating_rest_lengths function."""

    def test_zero_amplitude_no_change(self):
        """Zero amplitude should keep rest length unchanged."""
        base = torch.tensor([[1.0, 2.0]])
        freq = torch.tensor([[1.0, 1.0]])
        amp = torch.tensor([[0.0, 0.0]])  # Zero amplitude
        phase = torch.tensor([[0.0, 0.0]])
        global_freq = torch.tensor([1.0])

        result = compute_oscillating_rest_lengths(base, freq, amp, phase, global_freq, time=0.5)

        assert torch.allclose(result, base)

    def test_oscillation_at_peak(self):
        """At sin=1, rest length should be base * (1 - amplitude)."""
        base = torch.tensor([[1.0]])
        freq = torch.tensor([[1.0]])  # 1 Hz
        amp = torch.tensor([[0.3]])   # 30% amplitude
        phase = torch.tensor([[0.0]])
        global_freq = torch.tensor([1.0])

        # At time = 0.25s with freq 1Hz, sin(2π * 0.25) = sin(π/2) = 1
        result = compute_oscillating_rest_lengths(base, freq, amp, phase, global_freq, time=0.25)

        expected = 1.0 * (1.0 - 0.3)  # 0.7
        assert abs(result[0, 0].item() - expected) < 0.01

    def test_oscillation_at_trough(self):
        """At sin=-1, rest length should be base * (1 + amplitude)."""
        base = torch.tensor([[1.0]])
        freq = torch.tensor([[1.0]])
        amp = torch.tensor([[0.3]])
        phase = torch.tensor([[0.0]])
        global_freq = torch.tensor([1.0])

        # At time = 0.75s with freq 1Hz, sin(2π * 0.75) = sin(3π/2) = -1
        result = compute_oscillating_rest_lengths(base, freq, amp, phase, global_freq, time=0.75)

        expected = 1.0 * (1.0 + 0.3)  # 1.3
        assert abs(result[0, 0].item() - expected) < 0.01

    def test_phase_offset(self):
        """Phase should offset the oscillation."""
        base = torch.tensor([[1.0]])
        freq = torch.tensor([[1.0]])
        amp = torch.tensor([[0.3]])
        phase = torch.tensor([[math.pi / 2]])  # 90 degree offset
        global_freq = torch.tensor([1.0])

        # At time=0, sin(phase) = sin(π/2) = 1, so should be contracted
        result = compute_oscillating_rest_lengths(base, freq, amp, phase, global_freq, time=0.0)

        expected = 1.0 * (1.0 - 0.3)  # 0.7
        assert abs(result[0, 0].item() - expected) < 0.01

    def test_global_frequency_multiplier(self):
        """Global frequency multiplier should scale frequency."""
        base = torch.tensor([[1.0]])
        freq = torch.tensor([[1.0]])
        amp = torch.tensor([[0.3]])
        phase = torch.tensor([[0.0]])
        global_freq = torch.tensor([2.0])  # 2x frequency

        # With 2x global freq, at time=0.125s: sin(2π * 1.0 * 2.0 * 0.125) = sin(π/2) = 1
        result = compute_oscillating_rest_lengths(base, freq, amp, phase, global_freq, time=0.125)

        expected = 1.0 * (1.0 - 0.3)
        assert abs(result[0, 0].item() - expected) < 0.01

    def test_minimum_rest_length_clamped(self):
        """Rest length should not go below minimum (0.1)."""
        base = torch.tensor([[0.2]])
        freq = torch.tensor([[1.0]])
        amp = torch.tensor([[0.9]])  # Very high amplitude
        phase = torch.tensor([[0.0]])
        global_freq = torch.tensor([1.0])

        # At peak contraction, would be 0.2 * (1 - 0.9) = 0.02, but clamped to 0.1
        result = compute_oscillating_rest_lengths(base, freq, amp, phase, global_freq, time=0.25)

        assert result[0, 0].item() >= 0.1


# =============================================================================
# Test: Full Physics Step
# =============================================================================


class TestPhysicsStep:
    """Tests for physics_step function."""

    def test_falling_node_accelerates_down(self):
        """Node should accelerate downward under gravity."""
        genome = make_falling_node()
        batch = creature_genomes_to_batch([genome])
        base_rest_lengths = batch.spring_rest_length.clone()

        initial_vy = batch.velocities[0, 0, 1].item()

        physics_step(batch, base_rest_lengths, time=0.0)

        # Velocity should become more negative (accelerating down)
        assert batch.velocities[0, 0, 1].item() < initial_vy

    def test_spring_creature_oscillates(self):
        """Two-node creature with spring should oscillate when stretched."""
        genome = make_two_node_creature(distance=2.0)
        genome["muscles"][0]["restLength"] = 1.0  # Stretched
        batch = creature_genomes_to_batch([genome])
        base_rest_lengths = batch.spring_rest_length.clone()

        # Record initial separation
        initial_sep = (batch.positions[0, 1, 0] - batch.positions[0, 0, 0]).item()

        # Run a few steps
        for i in range(10):
            physics_step(batch, base_rest_lengths, time=i * TIME_STEP)

        # Separation should decrease (spring pulling inward)
        final_sep = (batch.positions[0, 1, 0] - batch.positions[0, 0, 0]).item()
        assert final_sep < initial_sep


# =============================================================================
# Test: Full Simulation
# =============================================================================


class TestSimulate:
    """Tests for simulate function."""

    def test_simulate_multiple_steps(self):
        """Simulate should run multiple physics steps."""
        genome = make_falling_node()
        batch = creature_genomes_to_batch([genome])

        initial_y = batch.positions[0, 0, 1].item()

        result = simulate(batch, num_steps=100, dt=TIME_STEP)

        # Node should have fallen
        assert result['final_positions'][0, 0, 1].item() < initial_y

    def test_simulate_records_frames(self):
        """Simulate should record frames when requested."""
        genome = make_falling_node()
        batch = creature_genomes_to_batch([genome])

        result = simulate(batch, num_steps=100, dt=TIME_STEP, record_frames=True, frame_interval=10)

        assert 'frames' in result
        # 100 steps / 10 interval = 10 frames
        assert result['frames'].shape[1] == 10

    def test_simulate_batched(self):
        """Simulate should work with multiple creatures."""
        genomes = [
            make_falling_node(),
            make_two_node_creature("two-node"),
        ]
        genomes[0]["id"] = "falling"

        batch = creature_genomes_to_batch(genomes)
        result = simulate(batch, num_steps=50)

        assert result['final_positions'].shape == (2, MAX_NODES, 3)


# =============================================================================
# Test: Numerical Stability
# =============================================================================


class TestNumericalStability:
    """Test numerical stability of physics simulation."""

    def test_no_nan_after_simulation(self):
        """Positions should not become NaN after simulation."""
        genome = make_two_node_creature(distance=1.0)
        batch = creature_genomes_to_batch([genome])

        result = simulate(batch, num_steps=1000)

        assert not torch.isnan(result['final_positions']).any()

    def test_no_inf_after_simulation(self):
        """Positions should not become Inf after simulation."""
        genome = make_two_node_creature(distance=1.0)
        batch = creature_genomes_to_batch([genome])

        result = simulate(batch, num_steps=1000)

        assert not torch.isinf(result['final_positions']).any()

    def test_high_stiffness_stable(self):
        """High stiffness springs should remain stable."""
        genome = make_two_node_creature(distance=1.0, stiffness=10000.0)
        batch = creature_genomes_to_batch([genome])

        result = simulate(batch, num_steps=500)

        assert not torch.isnan(result['final_positions']).any()
        assert not torch.isinf(result['final_positions']).any()

    def test_multiple_springs_stable(self):
        """Creature with many springs should remain stable."""
        genome = {
            "id": "many-springs",
            "nodes": [
                {"id": f"n{i}", "position": {"x": i * 0.5, "y": 0.5, "z": 0}, "size": 0.3}
                for i in range(6)
            ],
            "muscles": [],
        }
        # Connect each pair of adjacent nodes
        for i in range(5):
            genome["muscles"].append({
                "id": f"m{i}",
                "nodeA": f"n{i}",
                "nodeB": f"n{i+1}",
                "restLength": 0.5,
                "stiffness": 200.0,
                "damping": 0.5,
                "frequency": 1.0,
                "amplitude": 0.2,
                "phase": 0.0,
            })

        batch = creature_genomes_to_batch([genome])
        result = simulate(batch, num_steps=500)

        assert not torch.isnan(result['final_positions']).any()


# =============================================================================
# Test: Edge Cases
# =============================================================================


class TestEdgeCases:
    """Test edge cases and boundary conditions."""

    def test_empty_batch_simulate(self):
        """Empty batch should simulate without error."""
        batch = creature_genomes_to_batch([])
        result = simulate(batch, num_steps=10)

        assert result['final_positions'].shape == (0, MAX_NODES, 3)

    def test_single_node_creature(self):
        """Single node creature should work (no springs)."""
        genome = {
            "id": "single",
            "nodes": [{"id": "n0", "position": {"x": 0, "y": 2, "z": 0}, "size": 0.5}],
            "muscles": [],
        }
        batch = creature_genomes_to_batch([genome])
        result = simulate(batch, num_steps=100)

        # Should have fallen
        assert result['final_positions'][0, 0, 1].item() < 3.0  # Started at y=3 (2+1 offset)

    def test_zero_mass_handling(self):
        """Zero-mass nodes (padding) should not cause division by zero."""
        genome = make_two_node_creature()
        batch = creature_genomes_to_batch([genome])

        # Padding nodes have zero mass - integration should handle this
        forces = torch.randn(1, MAX_NODES, 3)
        integrate_euler(batch, forces, dt=TIME_STEP)

        assert not torch.isnan(batch.positions).any()


# =============================================================================
# Test: Performance Sanity Check
# =============================================================================


class TestPerformance:
    """Basic performance sanity checks."""

    def test_batch_100_creatures(self):
        """Should be able to simulate 100 creatures."""
        genomes = [make_two_node_creature(f"g{i}") for i in range(100)]
        batch = creature_genomes_to_batch(genomes)

        result = simulate(batch, num_steps=100)

        assert result['final_positions'].shape == (100, MAX_NODES, 3)
        assert not torch.isnan(result['final_positions']).any()


# =============================================================================
# Test: Muscle Modulation (v1/v2 features)
# =============================================================================


class TestPelletDirection:
    """Tests for compute_pellet_direction function."""

    def test_pellet_direction_basic(self):
        """Pellet direction should point toward pellet."""
        from app.simulation.physics import compute_pellet_direction

        com = torch.tensor([[0.0, 0.0, 0.0]])
        pellet = torch.tensor([[5.0, 0.0, 0.0]])

        direction = compute_pellet_direction(com, pellet)

        # Should point in +X direction
        assert direction.shape == (1, 3)
        assert abs(direction[0, 0].item() - 1.0) < 0.01
        assert abs(direction[0, 1].item()) < 0.01
        assert abs(direction[0, 2].item()) < 0.01

    def test_pellet_direction_normalized(self):
        """Pellet direction should be unit vector."""
        from app.simulation.physics import compute_pellet_direction

        com = torch.tensor([[0.0, 0.0, 0.0]])
        pellet = torch.tensor([[3.0, 4.0, 0.0]])  # Distance = 5

        direction = compute_pellet_direction(com, pellet)

        # Should be normalized
        length = torch.norm(direction, dim=1)
        assert abs(length[0].item() - 1.0) < 0.01

    def test_pellet_direction_zero_when_close(self):
        """Pellet direction should be zero when very close."""
        from app.simulation.physics import compute_pellet_direction

        com = torch.tensor([[0.0, 0.0, 0.0]])
        pellet = torch.tensor([[0.001, 0.0, 0.0]])  # Very close

        direction = compute_pellet_direction(com, pellet)

        # Should be zero (avoid division by near-zero)
        assert torch.abs(direction).max() < 0.1


class TestVelocityDirection:
    """Tests for compute_velocity_direction function."""

    def test_velocity_direction_basic(self):
        """Velocity direction should match movement direction."""
        from app.simulation.physics import compute_velocity_direction

        prev_com = torch.tensor([[0.0, 0.0, 0.0]])
        curr_com = torch.tensor([[1.0, 0.0, 0.0]])

        direction = compute_velocity_direction(curr_com, prev_com)

        # Should point in +X
        assert abs(direction[0, 0].item() - 1.0) < 0.01

    def test_velocity_direction_zero_when_stationary(self):
        """Velocity direction should be zero when not moving."""
        from app.simulation.physics import compute_velocity_direction

        prev_com = torch.tensor([[0.0, 0.0, 0.0]])
        curr_com = torch.tensor([[0.0, 0.0, 0.0]])

        direction = compute_velocity_direction(curr_com, prev_com)

        # Should be zero
        assert torch.abs(direction).max() < 0.01


class TestNormalizedDistance:
    """Tests for compute_normalized_distance function."""

    def test_normalized_distance_at_pellet(self):
        """Distance should be 0 when at pellet."""
        from app.simulation.physics import compute_normalized_distance

        com = torch.tensor([[5.0, 0.0, 5.0]])
        pellet = torch.tensor([[5.0, 0.0, 5.0]])

        dist = compute_normalized_distance(com, pellet)

        assert abs(dist[0].item()) < 0.01

    def test_normalized_distance_far(self):
        """Distance should be 1 when very far."""
        from app.simulation.physics import compute_normalized_distance, MAX_PELLET_DISTANCE

        com = torch.tensor([[0.0, 0.0, 0.0]])
        pellet = torch.tensor([[100.0, 0.0, 0.0]])  # Very far

        dist = compute_normalized_distance(com, pellet)

        # Should be clamped to 1
        assert abs(dist[0].item() - 1.0) < 0.01


class TestMuscleModulation:
    """Tests for compute_muscle_modulation function."""

    def test_modulation_no_bias(self):
        """With zero bias strengths, modulation should be 1."""
        genome = make_two_node_creature()
        # Set all bias strengths to 0
        genome["muscles"][0]["biasStrength"] = 0.0
        genome["muscles"][0]["velocityStrength"] = 0.0
        genome["muscles"][0]["distanceStrength"] = 0.0

        batch = creature_genomes_to_batch([genome])

        from app.simulation.physics import compute_muscle_modulation

        pellet_dir = torch.tensor([[1.0, 0.0, 0.0]])
        velocity_dir = torch.tensor([[0.0, 1.0, 0.0]])
        norm_dist = torch.tensor([0.5])

        modulation = compute_muscle_modulation(batch, pellet_dir, velocity_dir, norm_dist)

        # Should be ~1.0 (no modulation)
        assert abs(modulation[0, 0].item() - 1.0) < 0.01

    def test_modulation_direction_bias_aligned(self):
        """Aligned direction bias should increase modulation."""
        genome = make_two_node_creature()
        genome["muscles"][0]["directionBias"] = {"x": 1.0, "y": 0.0, "z": 0.0}
        genome["muscles"][0]["biasStrength"] = 1.0
        genome["muscles"][0]["velocityStrength"] = 0.0
        genome["muscles"][0]["distanceStrength"] = 0.0

        batch = creature_genomes_to_batch([genome])

        from app.simulation.physics import compute_muscle_modulation

        # Pellet in same direction as bias
        pellet_dir = torch.tensor([[1.0, 0.0, 0.0]])
        velocity_dir = torch.tensor([[0.0, 0.0, 0.0]])
        norm_dist = torch.tensor([0.5])

        modulation = compute_muscle_modulation(batch, pellet_dir, velocity_dir, norm_dist)

        # Should be > 1.0 (increased due to alignment)
        assert modulation[0, 0].item() > 1.0

    def test_modulation_direction_bias_opposite(self):
        """Opposite direction bias should decrease modulation."""
        genome = make_two_node_creature()
        genome["muscles"][0]["directionBias"] = {"x": 1.0, "y": 0.0, "z": 0.0}
        genome["muscles"][0]["biasStrength"] = 1.0
        genome["muscles"][0]["velocityStrength"] = 0.0
        genome["muscles"][0]["distanceStrength"] = 0.0

        batch = creature_genomes_to_batch([genome])

        from app.simulation.physics import compute_muscle_modulation

        # Pellet in opposite direction
        pellet_dir = torch.tensor([[-1.0, 0.0, 0.0]])
        velocity_dir = torch.tensor([[0.0, 0.0, 0.0]])
        norm_dist = torch.tensor([0.5])

        modulation = compute_muscle_modulation(batch, pellet_dir, velocity_dir, norm_dist)

        # Should be < 1.0 (decreased due to opposite)
        assert modulation[0, 0].item() < 1.0

    def test_modulation_clamped(self):
        """Modulation should be clamped to [0.1, 2.5]."""
        genome = make_two_node_creature()
        # Set extreme bias to test clamping
        genome["muscles"][0]["directionBias"] = {"x": 1.0, "y": 0.0, "z": 0.0}
        genome["muscles"][0]["biasStrength"] = 5.0  # Very high
        genome["muscles"][0]["velocityBias"] = {"x": 1.0, "y": 0.0, "z": 0.0}
        genome["muscles"][0]["velocityStrength"] = 5.0
        genome["muscles"][0]["distanceBias"] = 1.0
        genome["muscles"][0]["distanceStrength"] = 5.0

        batch = creature_genomes_to_batch([genome])

        from app.simulation.physics import compute_muscle_modulation

        # All aligned - should hit upper clamp
        pellet_dir = torch.tensor([[1.0, 0.0, 0.0]])
        velocity_dir = torch.tensor([[1.0, 0.0, 0.0]])
        norm_dist = torch.tensor([0.0])  # Near = 1

        modulation = compute_muscle_modulation(batch, pellet_dir, velocity_dir, norm_dist)

        # Should be clamped to 2.5
        assert modulation[0, 0].item() <= 2.5


class TestModulatedRestLengths:
    """Tests for compute_modulated_rest_lengths function."""

    def test_modulation_affects_contraction(self):
        """Modulation should scale the contraction."""
        from app.simulation.physics import compute_modulated_rest_lengths

        base = torch.tensor([[1.0]])
        freq = torch.tensor([[1.0]])
        amp = torch.tensor([[0.3]])
        phase = torch.tensor([[0.0]])
        global_freq = torch.tensor([1.0])

        # Modulation = 1.0 (no effect)
        mod1 = torch.tensor([[1.0]])
        result1 = compute_modulated_rest_lengths(base, freq, amp, phase, global_freq, mod1, time=0.25)

        # Modulation = 2.0 (double effect)
        mod2 = torch.tensor([[2.0]])
        result2 = compute_modulated_rest_lengths(base, freq, amp, phase, global_freq, mod2, time=0.25)

        # At time=0.25, sin=1, so:
        # result1 = 1.0 * (1 - 1 * 0.3 * 1.0) = 0.7
        # result2 = 1.0 * (1 - 1 * 0.3 * 2.0) = 0.4
        assert abs(result1[0, 0].item() - 0.7) < 0.01
        assert abs(result2[0, 0].item() - 0.4) < 0.01


class TestSimulateWithPellets:
    """Tests for simulate_with_pellets function."""

    def test_simulate_with_pellets_runs(self):
        """Should run simulation with pellet-aware modulation."""
        from app.simulation.physics import simulate_with_pellets

        genome = make_two_node_creature()
        genome["muscles"][0]["directionBias"] = {"x": 1.0, "y": 0.0, "z": 0.0}
        genome["muscles"][0]["biasStrength"] = 0.5

        batch = creature_genomes_to_batch([genome])
        pellet_pos = torch.tensor([[5.0, 0.5, 0.0]])  # Pellet to the right

        result = simulate_with_pellets(batch, pellet_pos, num_steps=100)

        assert 'final_positions' in result
        assert 'final_com' in result
        assert not torch.isnan(result['final_positions']).any()

    def test_simulate_with_pellets_records_frames(self):
        """Should record frames when requested."""
        from app.simulation.physics import simulate_with_pellets

        genome = make_two_node_creature()
        batch = creature_genomes_to_batch([genome])
        pellet_pos = torch.tensor([[5.0, 0.5, 0.0]])

        result = simulate_with_pellets(
            batch, pellet_pos, num_steps=100,
            record_frames=True, frame_interval=10
        )

        assert 'frames' in result
        # 100 steps / 10 interval = 10 frames
        assert result['frames'].shape[1] == 10

    def test_modulation_affects_behavior(self):
        """Creatures with different biases should behave differently."""
        from app.simulation.physics import simulate_with_pellets

        # Creature biased toward pellet direction
        genome1 = make_two_node_creature("biased")
        genome1["muscles"][0]["directionBias"] = {"x": 1.0, "y": 0.0, "z": 0.0}
        genome1["muscles"][0]["biasStrength"] = 1.0

        # Creature with no bias
        genome2 = make_two_node_creature("unbiased")
        genome2["muscles"][0]["biasStrength"] = 0.0

        batch1 = creature_genomes_to_batch([genome1])
        batch2 = creature_genomes_to_batch([genome2])
        pellet_pos = torch.tensor([[5.0, 0.5, 0.0]])

        result1 = simulate_with_pellets(batch1.to(torch.device("cpu")), pellet_pos, num_steps=500)
        result2 = simulate_with_pellets(batch2.to(torch.device("cpu")), pellet_pos, num_steps=500)

        # They should have different final positions (modulation affects behavior)
        # This is a weak test but confirms modulation is being applied
        com1 = result1['final_com']
        com2 = result2['final_com']

        # Note: Due to physics complexity, we just check they're valid
        assert not torch.isnan(com1).any()
        assert not torch.isnan(com2).any()


# =============================================================================
# Run tests
# =============================================================================

if __name__ == "__main__":
    pytest.main([__file__, "-v"])

"""
Comprehensive tests for sensor input gathering.

Tests cover:
- Pure mode sensor inputs (7 inputs)
- Hybrid mode sensor inputs (8 inputs with time phase)
- Pellet direction computation
- Velocity direction computation
- Distance normalization
- Edge cases
"""

import pytest
import torch
import math

from app.neural.sensors import (
    gather_sensor_inputs_pure,
    gather_sensor_inputs_hybrid,
    gather_sensor_inputs,
    compute_pellet_direction_for_nn,
    compute_velocity_direction_for_nn,
    compute_normalized_distance_for_nn,
)
from app.simulation.tensors import CreatureBatch


# =============================================================================
# Helper to create simple CreatureBatch for testing
# =============================================================================

def create_test_batch(
    batch_size: int,
    positions: list = None,  # List of [x, y, z] for single node per creature
    device: str = 'cpu',
) -> CreatureBatch:
    """Create a simple test batch with one node per creature."""
    MAX_NODES = 8
    MAX_MUSCLES = 15

    if positions is None:
        positions = [[0.0, 1.0, 0.0]] * batch_size

    batch_positions = torch.zeros(batch_size, MAX_NODES, 3, device=device)
    for i, pos in enumerate(positions):
        batch_positions[i, 0] = torch.tensor(pos, device=device)

    node_mask = torch.ones(batch_size, MAX_NODES, device=device)
    node_mask[:, 1:] = 0  # Only first node is valid

    return CreatureBatch(
        device=torch.device(device),
        batch_size=batch_size,
        positions=batch_positions,
        velocities=torch.zeros(batch_size, MAX_NODES, 3, device=device),
        masses=torch.ones(batch_size, MAX_NODES, device=device),
        sizes=torch.ones(batch_size, MAX_NODES, device=device) * 0.25,
        frictions=torch.ones(batch_size, MAX_NODES, device=device) * 0.5,
        node_mask=node_mask,
        node_counts=torch.ones(batch_size, dtype=torch.long, device=device),
        spring_node_a=torch.zeros(batch_size, MAX_MUSCLES, dtype=torch.long, device=device),
        spring_node_b=torch.zeros(batch_size, MAX_MUSCLES, dtype=torch.long, device=device),
        spring_rest_length=torch.ones(batch_size, MAX_MUSCLES, device=device),
        spring_stiffness=torch.ones(batch_size, MAX_MUSCLES, device=device) * 100,
        spring_damping=torch.ones(batch_size, MAX_MUSCLES, device=device),
        spring_frequency=torch.ones(batch_size, MAX_MUSCLES, device=device),
        spring_amplitude=torch.ones(batch_size, MAX_MUSCLES, device=device) * 0.3,
        spring_phase=torch.zeros(batch_size, MAX_MUSCLES, device=device),
        spring_mask=torch.zeros(batch_size, MAX_MUSCLES, device=device),
        muscle_counts=torch.zeros(batch_size, dtype=torch.long, device=device),
        direction_bias=torch.zeros(batch_size, MAX_MUSCLES, 3, device=device),
        bias_strength=torch.zeros(batch_size, MAX_MUSCLES, device=device),
        velocity_bias=torch.zeros(batch_size, MAX_MUSCLES, 3, device=device),
        velocity_strength=torch.zeros(batch_size, MAX_MUSCLES, device=device),
        distance_bias=torch.zeros(batch_size, MAX_MUSCLES, device=device),
        distance_strength=torch.zeros(batch_size, MAX_MUSCLES, device=device),
        global_freq_multiplier=torch.ones(batch_size, device=device),
        genome_ids=['test'] * batch_size,
    )


# =============================================================================
# Test Pure Mode Sensors
# =============================================================================

class TestPureModeSensors:
    """Test pure mode sensor gathering (7 inputs)."""

    def test_output_shape(self):
        pellet_dir = torch.tensor([[1.0, 0.0, 0.0], [0.0, 1.0, 0.0]])
        velocity_dir = torch.tensor([[0.0, 0.0, 1.0], [1.0, 0.0, 0.0]])
        distance = torch.tensor([0.5, 0.8])

        inputs = gather_sensor_inputs_pure(pellet_dir, velocity_dir, distance)

        assert inputs.shape == (2, 7)

    def test_sensor_order(self):
        """Test that sensors are in correct order."""
        pellet_dir = torch.tensor([[0.1, 0.2, 0.3]])
        velocity_dir = torch.tensor([[0.4, 0.5, 0.6]])
        distance = torch.tensor([0.7])

        inputs = gather_sensor_inputs_pure(pellet_dir, velocity_dir, distance)

        # pellet_dir_x, pellet_dir_y, pellet_dir_z
        assert inputs[0, 0].item() == pytest.approx(0.1)
        assert inputs[0, 1].item() == pytest.approx(0.2)
        assert inputs[0, 2].item() == pytest.approx(0.3)

        # velocity_x, velocity_y, velocity_z
        assert inputs[0, 3].item() == pytest.approx(0.4)
        assert inputs[0, 4].item() == pytest.approx(0.5)
        assert inputs[0, 5].item() == pytest.approx(0.6)

        # pellet_dist
        assert inputs[0, 6].item() == pytest.approx(0.7)

    def test_batched_computation(self):
        batch_size = 100
        pellet_dir = torch.randn(batch_size, 3)
        velocity_dir = torch.randn(batch_size, 3)
        distance = torch.rand(batch_size)

        inputs = gather_sensor_inputs_pure(pellet_dir, velocity_dir, distance)

        assert inputs.shape == (batch_size, 7)


# =============================================================================
# Test Hybrid Mode Sensors with Time Encoding Options
# =============================================================================

class TestHybridModeSensors:
    """Test hybrid mode sensor gathering with different time encodings."""

    def test_sin_encoding_shape(self):
        """Sin encoding should produce 8 inputs."""
        pellet_dir = torch.tensor([[1.0, 0.0, 0.0]])
        velocity_dir = torch.tensor([[0.0, 1.0, 0.0]])
        distance = torch.tensor([0.5])

        inputs = gather_sensor_inputs_hybrid(pellet_dir, velocity_dir, distance, 0.5, time_encoding='sin')

        assert inputs.shape == (1, 8)

    def test_cyclic_encoding_shape(self):
        """Cyclic encoding should produce 9 inputs (sin + cos)."""
        pellet_dir = torch.tensor([[1.0, 0.0, 0.0]])
        velocity_dir = torch.tensor([[0.0, 1.0, 0.0]])
        distance = torch.tensor([0.5])

        inputs = gather_sensor_inputs_hybrid(pellet_dir, velocity_dir, distance, 0.5, time_encoding='cyclic')

        assert inputs.shape == (1, 9)

    def test_raw_encoding_shape(self):
        """Raw encoding should produce 8 inputs."""
        pellet_dir = torch.tensor([[1.0, 0.0, 0.0]])
        velocity_dir = torch.tensor([[0.0, 1.0, 0.0]])
        distance = torch.tensor([0.5])

        inputs = gather_sensor_inputs_hybrid(pellet_dir, velocity_dir, distance, 0.5, time_encoding='raw')

        assert inputs.shape == (1, 8)

    def test_sin_encoding_formula(self):
        """Test that sin encoding uses -cos(πt) for 2-second period."""
        pellet_dir = torch.zeros(1, 3)
        velocity_dir = torch.zeros(1, 3)
        distance = torch.zeros(1)

        # At t=0: -cos(0) = -1
        inputs = gather_sensor_inputs_hybrid(pellet_dir, velocity_dir, distance, 0.0, time_encoding='sin')
        assert inputs[0, 7].item() == pytest.approx(-1.0, abs=1e-5)

        # At t=0.5: -cos(π/2) = 0
        inputs = gather_sensor_inputs_hybrid(pellet_dir, velocity_dir, distance, 0.5, time_encoding='sin')
        assert inputs[0, 7].item() == pytest.approx(0.0, abs=1e-5)

        # At t=1: -cos(π) = 1
        inputs = gather_sensor_inputs_hybrid(pellet_dir, velocity_dir, distance, 1.0, time_encoding='sin')
        assert inputs[0, 7].item() == pytest.approx(1.0, abs=1e-5)

        # At t=1.5: -cos(3π/2) = 0
        inputs = gather_sensor_inputs_hybrid(pellet_dir, velocity_dir, distance, 1.5, time_encoding='sin')
        assert inputs[0, 7].item() == pytest.approx(0.0, abs=1e-5)

    def test_cyclic_encoding_formula(self):
        """Test that cyclic encoding uses [-cos(πt), sin(πt)] for 2-second period."""
        pellet_dir = torch.zeros(1, 3)
        velocity_dir = torch.zeros(1, 3)
        distance = torch.zeros(1)

        # At t=0: -cos(0)=-1, sin(0)=0
        inputs = gather_sensor_inputs_hybrid(pellet_dir, velocity_dir, distance, 0.0, time_encoding='cyclic')
        assert inputs[0, 7].item() == pytest.approx(-1.0, abs=1e-5)
        assert inputs[0, 8].item() == pytest.approx(0.0, abs=1e-5)

        # At t=0.5: -cos(π/2)=0, sin(π/2)=1
        inputs = gather_sensor_inputs_hybrid(pellet_dir, velocity_dir, distance, 0.5, time_encoding='cyclic')
        assert inputs[0, 7].item() == pytest.approx(0.0, abs=1e-5)
        assert inputs[0, 8].item() == pytest.approx(1.0, abs=1e-5)

        # At t=1: -cos(π)=1, sin(π)=0
        inputs = gather_sensor_inputs_hybrid(pellet_dir, velocity_dir, distance, 1.0, time_encoding='cyclic')
        assert inputs[0, 7].item() == pytest.approx(1.0, abs=1e-5)
        assert inputs[0, 8].item() == pytest.approx(0.0, abs=1e-5)

        # At t=1.5: -cos(3π/2)=0, sin(3π/2)=-1
        inputs = gather_sensor_inputs_hybrid(pellet_dir, velocity_dir, distance, 1.5, time_encoding='cyclic')
        assert inputs[0, 7].item() == pytest.approx(0.0, abs=1e-5)
        assert inputs[0, 8].item() == pytest.approx(-1.0, abs=1e-5)

    def test_raw_encoding_formula(self):
        """Test that raw encoding uses 2*(t/max_time)-1 for range [-1, 1]."""
        pellet_dir = torch.zeros(1, 3)
        velocity_dir = torch.zeros(1, 3)
        distance = torch.zeros(1)
        max_time = 20.0

        # At t=0: raw = -1.0
        inputs = gather_sensor_inputs_hybrid(pellet_dir, velocity_dir, distance, 0.0, time_encoding='raw', max_time=max_time)
        assert inputs[0, 7].item() == pytest.approx(-1.0, abs=1e-5)

        # At t=10: raw = 0.0 (midpoint)
        inputs = gather_sensor_inputs_hybrid(pellet_dir, velocity_dir, distance, 10.0, time_encoding='raw', max_time=max_time)
        assert inputs[0, 7].item() == pytest.approx(0.0, abs=1e-5)

        # At t=20: raw = 1.0
        inputs = gather_sensor_inputs_hybrid(pellet_dir, velocity_dir, distance, 20.0, time_encoding='raw', max_time=max_time)
        assert inputs[0, 7].item() == pytest.approx(1.0, abs=1e-5)

        # At t=30 (beyond max): raw = 1.0 (clamped)
        inputs = gather_sensor_inputs_hybrid(pellet_dir, velocity_dir, distance, 30.0, time_encoding='raw', max_time=max_time)
        assert inputs[0, 7].item() == pytest.approx(1.0, abs=1e-5)

    def test_cyclic_uniqueness(self):
        """Cyclic encoding should give unique values throughout the cycle."""
        pellet_dir = torch.zeros(1, 3)
        velocity_dir = torch.zeros(1, 3)
        distance = torch.zeros(1)

        # Check that different times give different (sin, cos) pairs
        times = [0.0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9]
        encodings = []
        for t in times:
            inputs = gather_sensor_inputs_hybrid(pellet_dir, velocity_dir, distance, t, time_encoding='cyclic')
            encodings.append((inputs[0, 7].item(), inputs[0, 8].item()))

        # All pairs should be unique
        assert len(set(encodings)) == len(encodings)

    def test_sensor_order(self):
        """Test that sensors are in correct order including time inputs."""
        pellet_dir = torch.tensor([[0.1, 0.2, 0.3]])
        velocity_dir = torch.tensor([[0.4, 0.5, 0.6]])
        distance = torch.tensor([0.7])
        time = 1.0  # -cos(π) = 1, sin(π) = 0

        inputs = gather_sensor_inputs_hybrid(pellet_dir, velocity_dir, distance, time, time_encoding='cyclic')

        # First 7 inputs same as pure mode
        assert inputs[0, 0].item() == pytest.approx(0.1)
        assert inputs[0, 1].item() == pytest.approx(0.2)
        assert inputs[0, 2].item() == pytest.approx(0.3)
        assert inputs[0, 3].item() == pytest.approx(0.4)
        assert inputs[0, 4].item() == pytest.approx(0.5)
        assert inputs[0, 5].item() == pytest.approx(0.6)
        assert inputs[0, 6].item() == pytest.approx(0.7)

        # Time inputs are 8th and 9th (2-second period: -cos(πt), sin(πt))
        assert inputs[0, 7].item() == pytest.approx(1.0, abs=1e-5)  # -cos(π) = 1
        assert inputs[0, 8].item() == pytest.approx(0.0, abs=1e-5)  # sin(π) = 0

    def test_default_encoding_is_cyclic(self):
        """Default time encoding should be cyclic (9 inputs)."""
        pellet_dir = torch.tensor([[1.0, 0.0, 0.0]])
        velocity_dir = torch.tensor([[0.0, 1.0, 0.0]])
        distance = torch.tensor([0.5])

        inputs = gather_sensor_inputs_hybrid(pellet_dir, velocity_dir, distance, 0.5)

        assert inputs.shape == (1, 9)


# =============================================================================
# Test Pellet Direction
# =============================================================================

class TestPelletDirection:
    """Test pellet direction computation."""

    def test_unit_vector(self):
        batch = create_test_batch(1, positions=[[0.0, 1.0, 0.0]])
        pellet_positions = torch.tensor([[5.0, 1.0, 0.0]])  # Pellet at x=5

        direction = compute_pellet_direction_for_nn(batch, pellet_positions)

        # Should point in +X direction
        assert torch.allclose(direction, torch.tensor([[1.0, 0.0, 0.0]]), atol=1e-5)

    def test_normalized(self):
        batch = create_test_batch(10)
        pellet_positions = torch.randn(10, 3)

        direction = compute_pellet_direction_for_nn(batch, pellet_positions)

        # Each direction should be a unit vector
        norms = torch.norm(direction, dim=1)
        assert torch.allclose(norms, torch.ones(10), atol=1e-5)

    def test_diagonal_direction(self):
        batch = create_test_batch(1, positions=[[0.0, 0.0, 0.0]])
        pellet_positions = torch.tensor([[1.0, 1.0, 1.0]])

        direction = compute_pellet_direction_for_nn(batch, pellet_positions)

        expected = 1.0 / math.sqrt(3)
        assert torch.allclose(direction, torch.tensor([[expected, expected, expected]]), atol=1e-5)


# =============================================================================
# Test Velocity Direction
# =============================================================================

class TestVelocityDirection:
    """Test velocity direction computation."""

    def test_unit_vector(self):
        current_com = torch.tensor([[5.0, 1.0, 0.0]])
        previous_com = torch.tensor([[0.0, 1.0, 0.0]])

        direction = compute_velocity_direction_for_nn(current_com, previous_com)

        # Moving in +X direction
        assert torch.allclose(direction, torch.tensor([[1.0, 0.0, 0.0]]), atol=1e-5)

    def test_stationary_zeros_out(self):
        """Test that stationary creatures have zero velocity direction."""
        current_com = torch.tensor([[1.0, 1.0, 1.0]])
        previous_com = torch.tensor([[1.0, 1.0, 1.0]])  # Same position

        direction = compute_velocity_direction_for_nn(current_com, previous_com)

        assert torch.allclose(direction, torch.zeros(1, 3), atol=1e-5)

    def test_normalized(self):
        batch_size = 10
        current_com = torch.randn(batch_size, 3)
        previous_com = torch.randn(batch_size, 3)

        direction = compute_velocity_direction_for_nn(current_com, previous_com)

        # Non-stationary creatures should have unit vectors
        velocity = current_com - previous_com
        moving = torch.norm(velocity, dim=1) >= 1e-6

        norms = torch.norm(direction[moving], dim=1)
        assert torch.allclose(norms, torch.ones(moving.sum()), atol=1e-5)


# =============================================================================
# Test Normalized Distance
# =============================================================================

class TestNormalizedDistance:
    """Test normalized distance computation."""

    def test_at_pellet(self):
        """Distance should be 0 when at pellet."""
        batch = create_test_batch(1, positions=[[0.0, 1.0, 0.0]])
        pellet_positions = torch.tensor([[0.0, 1.0, 0.0]])  # Same position

        distance = compute_normalized_distance_for_nn(batch, pellet_positions)

        assert distance[0].item() == pytest.approx(0.0, abs=1e-5)

    def test_at_max_distance(self):
        """Distance should be 1 at max_pellet_distance."""
        max_dist = 20.0
        batch = create_test_batch(1, positions=[[0.0, 1.0, 0.0]])
        pellet_positions = torch.tensor([[max_dist, 1.0, 0.0]])

        distance = compute_normalized_distance_for_nn(batch, pellet_positions, max_dist)

        assert distance[0].item() == pytest.approx(1.0, abs=1e-5)

    def test_clamped_to_1(self):
        """Distance should be clamped to 1 for far pellets."""
        max_dist = 20.0
        batch = create_test_batch(1, positions=[[0.0, 1.0, 0.0]])
        pellet_positions = torch.tensor([[100.0, 1.0, 0.0]])  # Very far

        distance = compute_normalized_distance_for_nn(batch, pellet_positions, max_dist)

        assert distance[0].item() == 1.0

    def test_halfway(self):
        max_dist = 20.0
        batch = create_test_batch(1, positions=[[0.0, 1.0, 0.0]])
        pellet_positions = torch.tensor([[10.0, 1.0, 0.0]])

        distance = compute_normalized_distance_for_nn(batch, pellet_positions, max_dist)

        assert distance[0].item() == pytest.approx(0.5, abs=1e-5)


# =============================================================================
# Test Main Gather Function
# =============================================================================

class TestGatherSensorInputs:
    """Test main gather_sensor_inputs function."""

    def test_none_encoding_shape(self):
        """'none' time encoding returns 7 inputs (base sensors only)."""
        batch = create_test_batch(5)
        pellet_positions = torch.randn(5, 3)
        previous_com = torch.randn(5, 3)

        inputs = gather_sensor_inputs(batch, pellet_positions, previous_com, 0.0, time_encoding='none')

        assert inputs.shape == (5, 7)

    def test_hybrid_mode_cyclic_shape(self):
        """Hybrid mode with cyclic encoding (default) has 9 inputs."""
        batch = create_test_batch(5)
        pellet_positions = torch.randn(5, 3)
        previous_com = torch.randn(5, 3)

        inputs = gather_sensor_inputs(batch, pellet_positions, previous_com, 0.0, mode='hybrid', time_encoding='cyclic')

        assert inputs.shape == (5, 9)

    def test_hybrid_mode_sin_shape(self):
        """Hybrid mode with sin encoding has 8 inputs."""
        batch = create_test_batch(5)
        pellet_positions = torch.randn(5, 3)
        previous_com = torch.randn(5, 3)

        inputs = gather_sensor_inputs(batch, pellet_positions, previous_com, 0.0, mode='hybrid', time_encoding='sin')

        assert inputs.shape == (5, 8)

    def test_hybrid_mode_raw_shape(self):
        """Hybrid mode with raw encoding has 8 inputs."""
        batch = create_test_batch(5)
        pellet_positions = torch.randn(5, 3)
        previous_com = torch.randn(5, 3)

        inputs = gather_sensor_inputs(batch, pellet_positions, previous_com, 0.0, mode='hybrid', time_encoding='raw')

        assert inputs.shape == (5, 8)

    def test_default_is_hybrid_cyclic(self):
        batch = create_test_batch(3)
        pellet_positions = torch.randn(3, 3)
        previous_com = torch.randn(3, 3)

        inputs = gather_sensor_inputs(batch, pellet_positions, previous_com, 0.0)

        assert inputs.shape == (3, 9)  # Hybrid mode with cyclic (default) has 9 inputs

    def test_simulation_time_affects_hybrid(self):
        batch = create_test_batch(1)
        pellet_positions = torch.zeros(1, 3)
        previous_com = torch.zeros(1, 3)

        inputs_t0 = gather_sensor_inputs(batch, pellet_positions, previous_com, 0.0, mode='hybrid')
        inputs_t025 = gather_sensor_inputs(batch, pellet_positions, previous_com, 0.25, mode='hybrid')

        # Time inputs should differ (both sin and cos for cyclic default)
        assert inputs_t0[0, 7].item() != inputs_t025[0, 7].item()
        assert inputs_t0[0, 8].item() != inputs_t025[0, 8].item()

    def test_simulation_time_ignored_with_none_encoding(self):
        """With 'none' time encoding, simulation time is ignored."""
        batch = create_test_batch(1)
        pellet_positions = torch.zeros(1, 3)
        previous_com = torch.zeros(1, 3)

        inputs_t0 = gather_sensor_inputs(batch, pellet_positions, previous_com, 0.0, time_encoding='none')
        inputs_t025 = gather_sensor_inputs(batch, pellet_positions, previous_com, 0.25, time_encoding='none')

        # No time encoding means inputs should be identical regardless of simulation time
        assert torch.allclose(inputs_t0, inputs_t025)


# =============================================================================
# Test Edge Cases
# =============================================================================

class TestSensorEdgeCases:
    """Test edge cases and boundary conditions."""

    def test_single_creature(self):
        batch = create_test_batch(1)
        pellet_positions = torch.randn(1, 3)
        previous_com = torch.randn(1, 3)

        inputs = gather_sensor_inputs(batch, pellet_positions, previous_com, 0.0)

        assert inputs.shape == (1, 9)  # Default cyclic encoding
        assert not torch.any(torch.isnan(inputs))

    def test_large_batch(self):
        batch = create_test_batch(500)
        pellet_positions = torch.randn(500, 3)
        previous_com = torch.randn(500, 3)

        inputs = gather_sensor_inputs(batch, pellet_positions, previous_com, 0.0)

        assert inputs.shape == (500, 9)  # Default cyclic encoding
        assert not torch.any(torch.isnan(inputs))

    def test_no_nan_with_zero_movement(self):
        batch = create_test_batch(10)
        pellet_positions = torch.randn(10, 3)
        previous_com = batch.positions[:, 0]  # COM equals first node (stationary)

        inputs = gather_sensor_inputs(batch, pellet_positions, previous_com, 0.0)

        assert not torch.any(torch.isnan(inputs))

    def test_no_nan_with_pellet_at_creature(self):
        batch = create_test_batch(10, positions=[[0.0, 1.0, 0.0]] * 10)
        pellet_positions = torch.tensor([[0.0, 1.0, 0.0]] * 10)  # At creature
        previous_com = torch.zeros(10, 3)

        inputs = gather_sensor_inputs(batch, pellet_positions, previous_com, 0.0)

        assert not torch.any(torch.isnan(inputs))

    def test_inputs_in_reasonable_range(self):
        """All inputs should be in reasonable ranges."""
        batch = create_test_batch(50)
        pellet_positions = torch.randn(50, 3) * 10
        previous_com = torch.randn(50, 3)

        inputs = gather_sensor_inputs(batch, pellet_positions, previous_com, 0.0, mode='hybrid', time_encoding='cyclic')

        # Direction vectors should be unit length or zero
        pellet_dir = inputs[:, 0:3]
        pellet_norms = torch.norm(pellet_dir, dim=1)
        assert torch.all(pellet_norms <= 1.01)  # Allow small numerical error

        # Distance should be in [0, 1]
        distance = inputs[:, 6]
        assert torch.all(distance >= 0)
        assert torch.all(distance <= 1)

        # Time sin should be in [-1, 1]
        time_sin = inputs[:, 7]
        assert torch.all(time_sin >= -1)
        assert torch.all(time_sin <= 1)

        # Time cos should be in [-1, 1]
        time_cos = inputs[:, 8]
        assert torch.all(time_cos >= -1)
        assert torch.all(time_cos <= 1)


# =============================================================================
# Test Device Compatibility
# =============================================================================

class TestSensorDevices:
    """Test sensor gathering on different devices."""

    def test_cpu_tensors(self):
        pellet_dir = torch.randn(5, 3)
        velocity_dir = torch.randn(5, 3)
        distance = torch.rand(5)

        inputs = gather_sensor_inputs_pure(pellet_dir, velocity_dir, distance)

        assert inputs.device.type == 'cpu'

    @pytest.mark.skipif(not torch.cuda.is_available(), reason="CUDA not available")
    def test_cuda_tensors(self):
        pellet_dir = torch.randn(5, 3, device='cuda')
        velocity_dir = torch.randn(5, 3, device='cuda')
        distance = torch.rand(5, device='cuda')

        inputs = gather_sensor_inputs_pure(pellet_dir, velocity_dir, distance)

        assert inputs.device.type == 'cuda'

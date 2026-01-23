"""
Comprehensive tests for neural network integration with physics.

Tests cover:
- Neural rest length computation
- Pure mode vs hybrid mode
- Physics step with neural control
- Full simulation with neural network
- Efficiency penalty tracking
- Edge cases
"""

import pytest
import torch
import math

from app.simulation.physics import (
    compute_neural_rest_lengths,
    physics_step_neural,
    simulate_with_neural,
    TIME_STEP,
    GRAVITY,
)
from app.simulation.tensors import CreatureBatch, creature_genomes_to_batch
from app.neural.network import BatchedNeuralNetwork, NeuralConfig


# =============================================================================
# Helper Functions
# =============================================================================

def create_simple_genome():
    """Create a simple genome for testing."""
    return {
        'id': 'test',
        'nodes': [
            {'id': 'n0', 'x': 0.0, 'y': 1.0, 'z': 0.0, 'size': 0.25, 'friction': 0.5},
            {'id': 'n1', 'x': 1.0, 'y': 1.0, 'z': 0.0, 'size': 0.25, 'friction': 0.5},
        ],
        'muscles': [
            {
                'id': 'm0',
                'nodeA': 'n0',
                'nodeB': 'n1',
                'restLength': 1.0,
                'stiffness': 100.0,
                'damping': 1.0,
                'frequency': 1.0,
                'amplitude': 0.3,
                'phase': 0.0,
                'directionBias': {'x': 1.0, 'y': 0.0, 'z': 0.0},
                'biasStrength': 0.5,
            },
        ],
    }


def create_test_batch(num_creatures=5) -> CreatureBatch:
    """Create a test batch from genomes."""
    genomes = [create_simple_genome() for _ in range(num_creatures)]
    for i, g in enumerate(genomes):
        g['id'] = f'test_{i}'
    return creature_genomes_to_batch(genomes)


def create_test_network(batch_size: int, mode: str = 'hybrid') -> BatchedNeuralNetwork:
    """Create a test neural network."""
    config = NeuralConfig(neural_mode=mode)
    return BatchedNeuralNetwork.initialize_random(
        batch_size=batch_size,
        num_muscles=[1] * batch_size,  # One muscle per creature
        config=config,
    )


# =============================================================================
# Test Neural Rest Length Computation
# =============================================================================

class TestNeuralRestLengths:
    """Test compute_neural_rest_lengths function."""

    def test_pure_mode_zero_output_no_contraction(self):
        """In pure mode, zero NN output means no contraction."""
        batch = create_test_batch(5)
        base_rest_lengths = batch.spring_rest_length.clone()

        nn_outputs = torch.zeros(5, 15)  # MAX_MUSCLES = 15
        rest_lengths = compute_neural_rest_lengths(
            batch, base_rest_lengths, nn_outputs, time=0.0, mode='pure'
        )

        # No contraction, rest lengths should be preserved
        assert torch.allclose(rest_lengths, base_rest_lengths, atol=1e-5)

    def test_pure_mode_positive_output_contracts(self):
        """In pure mode, positive NN output contracts muscle."""
        batch = create_test_batch(5)
        base_rest_lengths = batch.spring_rest_length.clone()
        amplitude = batch.spring_amplitude

        nn_outputs = torch.ones(5, 15)  # All outputs = 1
        rest_lengths = compute_neural_rest_lengths(
            batch, base_rest_lengths, nn_outputs, time=0.0, mode='pure'
        )

        # Contraction = nn_output * amplitude = 1.0 * 0.3 = 0.3
        # rest_length = base * (1 - 0.3) = base * 0.7
        expected = base_rest_lengths * (1 - amplitude)
        # Only compare valid muscles
        valid_mask = batch.spring_mask.bool()
        assert torch.allclose(rest_lengths[valid_mask], expected[valid_mask], atol=1e-5)

    def test_pure_mode_negative_output_extends(self):
        """In pure mode, negative NN output extends muscle."""
        batch = create_test_batch(5)
        base_rest_lengths = batch.spring_rest_length.clone()
        amplitude = batch.spring_amplitude

        nn_outputs = -torch.ones(5, 15)  # All outputs = -1
        rest_lengths = compute_neural_rest_lengths(
            batch, base_rest_lengths, nn_outputs, time=0.0, mode='pure'
        )

        # Contraction = -1.0 * 0.3 = -0.3
        # rest_length = base * (1 - (-0.3)) = base * 1.3
        expected = base_rest_lengths * (1 + amplitude)
        valid_mask = batch.spring_mask.bool()
        assert torch.allclose(rest_lengths[valid_mask], expected[valid_mask], atol=1e-5)

    def test_hybrid_mode_zero_output_half_modulation(self):
        """In hybrid mode, zero NN output gives 1.0 modulation."""
        batch = create_test_batch(5)
        base_rest_lengths = batch.spring_rest_length.clone()

        nn_outputs = torch.zeros(5, 15)  # All outputs = 0
        rest_lengths = compute_neural_rest_lengths(
            batch, base_rest_lengths, nn_outputs, time=0.0, mode='hybrid'
        )

        # At time=0, base_contraction = sin(0) = 0
        # nn_modulation = 0.5 + (0 + 1) * 0.5 = 1.0
        # contraction = 0 * amplitude * 1.0 = 0
        # So rest lengths should equal base
        assert torch.allclose(rest_lengths, base_rest_lengths, atol=1e-5)

    def test_hybrid_mode_modulation_range(self):
        """In hybrid mode, NN output maps [-1, 1] to modulation [0.5, 1.5]."""
        batch = create_test_batch(1)
        base_rest_lengths = batch.spring_rest_length.clone()

        # Test with time where base_contraction = 1 (max positive)
        # At time = 0.25 / frequency, sin(0.25 * 2 * pi) = 1
        time = 0.25

        # Test NN output = -1 -> modulation = 0.5
        nn_outputs = -torch.ones(1, 15)
        rest_lengths = compute_neural_rest_lengths(
            batch, base_rest_lengths, nn_outputs, time=time, mode='hybrid'
        )
        # contraction = 1 * amplitude * 0.5 = 0.3 * 0.5 = 0.15
        # rest_length = base * (1 - 0.15) = base * 0.85
        valid = batch.spring_mask[0, 0].item() == 1.0
        if valid:
            expected_rest = base_rest_lengths[0, 0] * (1 - 0.3 * 0.5)
            assert rest_lengths[0, 0].item() == pytest.approx(expected_rest.item(), rel=0.01)

    def test_rest_length_clamped_positive(self):
        """Rest lengths for valid muscles should never go below minimum."""
        batch = create_test_batch(5)
        base_rest_lengths = batch.spring_rest_length.clone()

        # Extreme positive outputs should clamp rest length
        nn_outputs = torch.ones(5, 15) * 10  # Very high output
        rest_lengths = compute_neural_rest_lengths(
            batch, base_rest_lengths, nn_outputs, time=0.0, mode='pure'
        )

        # Valid muscle rest lengths should be at least 0.01
        valid_mask = batch.spring_mask.bool()
        assert torch.all(rest_lengths[valid_mask] >= 0.01)

    def test_empty_batch(self):
        """Should handle empty batch."""
        genomes = []
        batch = creature_genomes_to_batch(genomes)
        base_rest_lengths = batch.spring_rest_length.clone()
        nn_outputs = torch.zeros(0, 15)

        rest_lengths = compute_neural_rest_lengths(
            batch, base_rest_lengths, nn_outputs, time=0.0, mode='pure'
        )

        assert rest_lengths.shape[0] == 0


# =============================================================================
# Test Physics Step with Neural Control
# =============================================================================

class TestPhysicsStepNeural:
    """Test physics_step_neural function."""

    def test_returns_com_and_activation(self):
        """Should return center of mass and muscle activation."""
        batch = create_test_batch(5)
        base_rest_lengths = batch.spring_rest_length.clone()
        nn_outputs = torch.randn(5, 15)

        com, activation = physics_step_neural(
            batch, base_rest_lengths, nn_outputs, time=0.0, mode='hybrid'
        )

        assert com.shape == (5, 3)
        assert activation.shape == (5,)

    def test_activation_is_sum_of_abs_outputs(self):
        """Muscle activation should be sum of |NN outputs| for valid muscles."""
        batch = create_test_batch(3)
        base_rest_lengths = batch.spring_rest_length.clone()

        # Set known NN outputs
        nn_outputs = torch.tensor([
            [0.5] + [0.0] * 14,  # First muscle has 0.5
            [-0.8] + [0.0] * 14,  # First muscle has -0.8
            [0.3] + [0.0] * 14,  # First muscle has 0.3
        ])

        com, activation = physics_step_neural(
            batch, base_rest_lengths, nn_outputs, time=0.0, mode='hybrid'
        )

        # Activation should be |output| for valid muscles
        # Each test creature has 1 muscle
        assert activation[0].item() == pytest.approx(0.5, abs=1e-5)
        assert activation[1].item() == pytest.approx(0.8, abs=1e-5)
        assert activation[2].item() == pytest.approx(0.3, abs=1e-5)

    def test_positions_change(self):
        """Positions should change after physics step."""
        batch = create_test_batch(5)
        initial_positions = batch.positions.clone()
        base_rest_lengths = batch.spring_rest_length.clone()
        nn_outputs = torch.randn(5, 15)

        physics_step_neural(
            batch, base_rest_lengths, nn_outputs, time=0.0, mode='hybrid'
        )

        # Positions should have changed
        assert not torch.allclose(batch.positions, initial_positions)

    def test_empty_batch(self):
        """Should handle empty batch."""
        batch = creature_genomes_to_batch([])
        base_rest_lengths = batch.spring_rest_length.clone()
        nn_outputs = torch.zeros(0, 15)

        com, activation = physics_step_neural(
            batch, base_rest_lengths, nn_outputs, time=0.0, mode='hybrid'
        )

        assert com.shape == (0, 3)
        assert activation.shape == (0,)


# =============================================================================
# Test Full Neural Simulation
# =============================================================================

class TestSimulateWithNeural:
    """Test simulate_with_neural function."""

    def test_basic_simulation(self):
        """Basic simulation should run without errors."""
        batch = create_test_batch(5)
        network = create_test_network(5, mode='hybrid')
        pellet_positions = torch.randn(5, 3)

        result = simulate_with_neural(
            batch, network, pellet_positions,
            num_steps=60, mode='hybrid'
        )

        assert 'final_positions' in result
        assert 'final_com' in result
        assert 'total_activation' in result

    def test_output_shapes(self):
        """Output shapes should be correct."""
        batch = create_test_batch(10)
        network = create_test_network(10, mode='hybrid')
        pellet_positions = torch.randn(10, 3)

        result = simulate_with_neural(
            batch, network, pellet_positions,
            num_steps=60, mode='hybrid'
        )

        assert result['final_positions'].shape == (10, 8, 3)  # [B, MAX_NODES, 3]
        assert result['final_com'].shape == (10, 3)
        assert result['total_activation'].shape == (10,)

    def test_pure_mode(self):
        """Pure mode should run without errors."""
        batch = create_test_batch(5)
        network = create_test_network(5, mode='pure')
        pellet_positions = torch.randn(5, 3)

        result = simulate_with_neural(
            batch, network, pellet_positions,
            num_steps=60, mode='pure', dead_zone=0.1
        )

        assert 'final_positions' in result
        assert 'total_activation' in result

    def test_hybrid_mode(self):
        """Hybrid mode should run without errors."""
        batch = create_test_batch(5)
        network = create_test_network(5, mode='hybrid')
        pellet_positions = torch.randn(5, 3)

        result = simulate_with_neural(
            batch, network, pellet_positions,
            num_steps=60, mode='hybrid'
        )

        assert 'final_positions' in result
        assert 'total_activation' in result

    def test_records_frames(self):
        """Should record frames when requested."""
        batch = create_test_batch(5)
        network = create_test_network(5, mode='hybrid')
        pellet_positions = torch.randn(5, 3)

        result = simulate_with_neural(
            batch, network, pellet_positions,
            num_steps=60, mode='hybrid',
            record_frames=True, frame_interval=10
        )

        assert 'frames' in result
        # 60 steps / 10 interval = 6 frames (plus step 0)
        assert result['frames'].shape[1] == 6

    def test_activation_accumulates(self):
        """Total activation should accumulate over simulation."""
        batch = create_test_batch(5)
        network = create_test_network(5, mode='hybrid')
        pellet_positions = torch.randn(5, 3)

        result = simulate_with_neural(
            batch, network, pellet_positions,
            num_steps=60, mode='hybrid'
        )

        # Total activation should be positive (unless all outputs are exactly 0)
        assert torch.all(result['total_activation'] >= 0)

    def test_no_nan_in_outputs(self):
        """Simulation should not produce NaN values."""
        batch = create_test_batch(10)
        network = create_test_network(10, mode='hybrid')
        pellet_positions = torch.randn(10, 3)

        result = simulate_with_neural(
            batch, network, pellet_positions,
            num_steps=120, mode='hybrid'
        )

        assert not torch.any(torch.isnan(result['final_positions']))
        assert not torch.any(torch.isnan(result['final_com']))
        assert not torch.any(torch.isnan(result['total_activation']))

    def test_empty_batch(self):
        """Should handle empty batch."""
        batch = creature_genomes_to_batch([])
        # Can't create network for empty batch, so skip
        pellet_positions = torch.zeros(0, 3)

        # Create minimal network
        config = NeuralConfig()
        network = BatchedNeuralNetwork(
            batch_size=0,
            input_size=8,
            hidden_size=8,
            max_muscles=15,
        )

        result = simulate_with_neural(
            batch, network, pellet_positions,
            num_steps=60, mode='hybrid'
        )

        assert result['final_positions'].shape[0] == 0
        assert result['final_com'].shape[0] == 0
        assert result['total_activation'].shape[0] == 0


# =============================================================================
# Test Mode Differences
# =============================================================================

class TestModeDifferences:
    """Test differences between pure and hybrid modes."""

    def test_pure_mode_no_base_oscillation(self):
        """In pure mode, there should be no base oscillation effect."""
        batch = create_test_batch(1)
        base_rest_lengths = batch.spring_rest_length.clone()

        # Same NN output at different times
        nn_outputs = torch.tensor([[0.5] + [0.0] * 14])

        rest_t0 = compute_neural_rest_lengths(
            batch, base_rest_lengths, nn_outputs, time=0.0, mode='pure'
        )
        rest_t1 = compute_neural_rest_lengths(
            batch, base_rest_lengths, nn_outputs, time=0.5, mode='pure'
        )

        # In pure mode, time shouldn't affect rest lengths (same NN output)
        assert torch.allclose(rest_t0, rest_t1)

    def test_hybrid_mode_time_affects_rest_lengths(self):
        """In hybrid mode, time affects rest lengths through base oscillation."""
        batch = create_test_batch(1)
        base_rest_lengths = batch.spring_rest_length.clone()

        # Same NN output at different times
        nn_outputs = torch.tensor([[0.5] + [0.0] * 14])

        rest_t0 = compute_neural_rest_lengths(
            batch, base_rest_lengths, nn_outputs, time=0.0, mode='hybrid'
        )
        # At time=0.25, base oscillation = sin(0.25 * 2 * pi) = 1
        rest_t025 = compute_neural_rest_lengths(
            batch, base_rest_lengths, nn_outputs, time=0.25, mode='hybrid'
        )

        # In hybrid mode, time should affect rest lengths
        valid = batch.spring_mask[0, 0].item() == 1.0
        if valid:
            assert not torch.allclose(rest_t0[0, 0], rest_t025[0, 0])


# =============================================================================
# Test Efficiency Penalty
# =============================================================================

class TestEfficiencyPenalty:
    """Test efficiency penalty tracking."""

    def test_zero_output_zero_activation(self):
        """Zero NN outputs should give zero activation."""
        batch = create_test_batch(5)
        base_rest_lengths = batch.spring_rest_length.clone()

        nn_outputs = torch.zeros(5, 15)

        com, activation = physics_step_neural(
            batch, base_rest_lengths, nn_outputs, time=0.0, mode='hybrid'
        )

        assert torch.allclose(activation, torch.zeros(5))

    def test_activation_scales_with_output(self):
        """Activation should scale with NN output magnitude."""
        batch = create_test_batch(3)
        base_rest_lengths = batch.spring_rest_length.clone()

        # Different output magnitudes
        nn_outputs = torch.zeros(3, 15)
        nn_outputs[0, 0] = 0.2
        nn_outputs[1, 0] = 0.5
        nn_outputs[2, 0] = 1.0

        com, activation = physics_step_neural(
            batch, base_rest_lengths, nn_outputs, time=0.0, mode='hybrid'
        )

        # Activations should be proportional to output magnitudes
        assert activation[0].item() < activation[1].item() < activation[2].item()

    def test_negative_outputs_contribute_positive_activation(self):
        """Negative outputs should contribute positive activation (absolute value)."""
        batch = create_test_batch(2)
        base_rest_lengths = batch.spring_rest_length.clone()

        nn_outputs = torch.zeros(2, 15)
        nn_outputs[0, 0] = 0.5   # Positive
        nn_outputs[1, 0] = -0.5  # Negative

        com, activation = physics_step_neural(
            batch, base_rest_lengths, nn_outputs, time=0.0, mode='hybrid'
        )

        # Both should have same activation (absolute value)
        assert torch.allclose(activation[0], activation[1])


# =============================================================================
# Test Device Compatibility
# =============================================================================

class TestNeuralDevices:
    """Test neural integration on different devices."""

    def test_cpu_simulation(self):
        """Simulation should work on CPU."""
        batch = create_test_batch(5)
        network = create_test_network(5, mode='hybrid')
        pellet_positions = torch.randn(5, 3)

        result = simulate_with_neural(
            batch, network, pellet_positions,
            num_steps=60, mode='hybrid'
        )

        assert result['final_positions'].device.type == 'cpu'

    @pytest.mark.skipif(not torch.cuda.is_available(), reason="CUDA not available")
    def test_cuda_simulation(self):
        """Simulation should work on CUDA."""
        batch = create_test_batch(5).to(torch.device('cuda'))
        config = NeuralConfig(neural_mode='hybrid')
        network = BatchedNeuralNetwork.initialize_random(
            batch_size=5,
            num_muscles=[1] * 5,
            config=config,
            device='cuda',
        )
        pellet_positions = torch.randn(5, 3, device='cuda')

        result = simulate_with_neural(
            batch, network, pellet_positions,
            num_steps=60, mode='hybrid'
        )

        assert result['final_positions'].device.type == 'cuda'

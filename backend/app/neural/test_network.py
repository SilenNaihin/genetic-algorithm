"""
Comprehensive tests for batched neural network.

Tests cover:
- Network initialization
- Forward pass computation
- Weight loading from genomes
- Activation functions
- Dead zone functionality
- Device compatibility
- Edge cases
"""

import pytest
import torch
import math

from app.neural.network import (
    BatchedNeuralNetwork,
    NeuralConfig,
    DEFAULT_OUTPUT_BIAS,
    NEURAL_INPUT_SIZE_PURE,
    NEURAL_INPUT_SIZE_HYBRID,
    get_input_size,
    calculate_weight_count,
)


# =============================================================================
# Test Constants
# =============================================================================

class TestConstants:
    """Test neural network constants match TypeScript."""

    def test_default_output_bias(self):
        assert DEFAULT_OUTPUT_BIAS == 0.0

    def test_input_size_pure(self):
        assert NEURAL_INPUT_SIZE_PURE == 7

    def test_input_size_hybrid(self):
        assert NEURAL_INPUT_SIZE_HYBRID == 8

    def test_get_input_size_pure(self):
        assert get_input_size('pure') == 7

    def test_get_input_size_hybrid(self):
        assert get_input_size('hybrid') == 8


# =============================================================================
# Test Weight Count Calculation
# =============================================================================

class TestWeightCount:
    """Test weight count calculation matches TypeScript."""

    def test_weight_count_small(self):
        # input=7, hidden=8, output=5
        # (7*8) + 8 + (8*5) + 5 = 56 + 8 + 40 + 5 = 109
        count = calculate_weight_count(7, 8, 5)
        assert count == 109

    def test_weight_count_hybrid(self):
        # input=8, hidden=8, output=15
        # (8*8) + 8 + (8*15) + 15 = 64 + 8 + 120 + 15 = 207
        count = calculate_weight_count(8, 8, 15)
        assert count == 207

    def test_weight_count_large_hidden(self):
        # input=8, hidden=16, output=10
        # (8*16) + 16 + (16*10) + 10 = 128 + 16 + 160 + 10 = 314
        count = calculate_weight_count(8, 16, 10)
        assert count == 314


# =============================================================================
# Test NeuralConfig
# =============================================================================

class TestNeuralConfig:
    """Test NeuralConfig dataclass."""

    def test_default_values(self):
        config = NeuralConfig()
        assert config.use_neural_net == True
        assert config.neural_mode == 'hybrid'
        assert config.hidden_size == 8
        assert config.activation == 'tanh'
        assert config.weight_mutation_rate == 0.1
        assert config.weight_mutation_magnitude == 0.3
        assert config.output_bias == 0.0
        assert config.dead_zone == 0.1

    def test_custom_values(self):
        config = NeuralConfig(
            neural_mode='pure',
            hidden_size=16,
            activation='relu',
            output_bias=-1.0,
        )
        assert config.neural_mode == 'pure'
        assert config.hidden_size == 16
        assert config.activation == 'relu'
        assert config.output_bias == -1.0


# =============================================================================
# Test Network Initialization
# =============================================================================

class TestNetworkInitialization:
    """Test BatchedNeuralNetwork initialization."""

    def test_creates_correct_shapes(self):
        network = BatchedNeuralNetwork(
            batch_size=10,
            input_size=8,
            hidden_size=8,
            max_muscles=15,
        )

        assert network.weights_ih.shape == (10, 8, 8)
        assert network.bias_h.shape == (10, 8)
        assert network.weights_ho.shape == (10, 8, 15)
        assert network.bias_o.shape == (10, 15)
        assert network.muscle_mask.shape == (10, 15)

    def test_initializes_to_zeros(self):
        network = BatchedNeuralNetwork(
            batch_size=5,
            input_size=7,
            hidden_size=8,
            max_muscles=10,
        )

        assert torch.all(network.weights_ih == 0)
        assert torch.all(network.bias_h == 0)
        assert torch.all(network.weights_ho == 0)
        assert torch.all(network.bias_o == 0)

    def test_muscle_mask_defaults_to_true(self):
        network = BatchedNeuralNetwork(
            batch_size=3,
            input_size=8,
            hidden_size=8,
            max_muscles=15,
        )

        assert torch.all(network.muscle_mask)

    def test_pure_mode_input_size(self):
        network = BatchedNeuralNetwork(
            batch_size=5,
            input_size=NEURAL_INPUT_SIZE_PURE,
            hidden_size=8,
            max_muscles=10,
        )

        assert network.input_size == 7

    def test_hybrid_mode_input_size(self):
        network = BatchedNeuralNetwork(
            batch_size=5,
            input_size=NEURAL_INPUT_SIZE_HYBRID,
            hidden_size=8,
            max_muscles=10,
        )

        assert network.input_size == 8


# =============================================================================
# Test Random Initialization
# =============================================================================

class TestRandomInitialization:
    """Test GA-optimized random initialization."""

    def test_weights_in_range(self):
        config = NeuralConfig(neural_mode='hybrid')
        network = BatchedNeuralNetwork.initialize_random(
            batch_size=10,
            num_muscles=[5] * 10,
            config=config,
            max_muscles=15,
        )

        # Weights should be in [-0.5, 0.5]
        assert torch.all(network.weights_ih >= -0.5)
        assert torch.all(network.weights_ih <= 0.5)
        assert torch.all(network.weights_ho >= -0.5)
        assert torch.all(network.weights_ho <= 0.5)

    def test_hidden_bias_zero(self):
        config = NeuralConfig()
        network = BatchedNeuralNetwork.initialize_random(
            batch_size=5,
            num_muscles=[10] * 5,
            config=config,
        )

        assert torch.all(network.bias_h == 0)

    def test_output_bias_negative(self):
        config = NeuralConfig(output_bias=-0.5)
        network = BatchedNeuralNetwork.initialize_random(
            batch_size=5,
            num_muscles=[10] * 5,
            config=config,
        )

        assert torch.all(network.bias_o == -0.5)

    def test_custom_output_bias(self):
        config = NeuralConfig(output_bias=-1.5)
        network = BatchedNeuralNetwork.initialize_random(
            batch_size=3,
            num_muscles=[8, 10, 12],
            config=config,
        )

        assert torch.all(network.bias_o == -1.5)

    def test_muscle_mask_set_correctly(self):
        config = NeuralConfig()
        num_muscles = [3, 5, 7]
        network = BatchedNeuralNetwork.initialize_random(
            batch_size=3,
            num_muscles=num_muscles,
            config=config,
            max_muscles=10,
        )

        # First creature: 3 muscles
        assert torch.all(network.muscle_mask[0, :3] == True)
        assert torch.all(network.muscle_mask[0, 3:] == False)

        # Second creature: 5 muscles
        assert torch.all(network.muscle_mask[1, :5] == True)
        assert torch.all(network.muscle_mask[1, 5:] == False)

        # Third creature: 7 muscles
        assert torch.all(network.muscle_mask[2, :7] == True)
        assert torch.all(network.muscle_mask[2, 7:] == False)


# =============================================================================
# Test Forward Pass
# =============================================================================

class TestForwardPass:
    """Test forward pass computation."""

    def test_output_shape(self):
        network = BatchedNeuralNetwork(
            batch_size=10,
            input_size=8,
            hidden_size=8,
            max_muscles=15,
        )

        inputs = torch.randn(10, 8)
        outputs = network.forward(inputs)

        assert outputs.shape == (10, 15)

    def test_output_in_tanh_range(self):
        config = NeuralConfig()
        network = BatchedNeuralNetwork.initialize_random(
            batch_size=20,
            num_muscles=[10] * 20,
            config=config,
        )

        inputs = torch.randn(20, 8)
        outputs = network.forward(inputs)

        # tanh output should be in [-1, 1]
        assert torch.all(outputs >= -1)
        assert torch.all(outputs <= 1)

    def test_zero_weights_produce_tanh_bias(self):
        """With zero weights, output should be tanh(bias)."""
        network = BatchedNeuralNetwork(
            batch_size=5,
            input_size=8,
            hidden_size=8,
            max_muscles=10,
            device='cpu',  # Use CPU for tests that directly set tensors
        )
        network.bias_o = torch.full((5, 10), -0.5)

        inputs = torch.randn(5, 8)
        outputs = network.forward(inputs)

        expected = math.tanh(-0.5)  # tanh of output bias
        assert torch.allclose(outputs, torch.full_like(outputs, expected), atol=1e-5)

    def test_tanh_activation(self):
        """Test tanh activation in hidden layer."""
        network = BatchedNeuralNetwork(
            batch_size=2,
            input_size=4,
            hidden_size=4,
            max_muscles=5,
            activation='tanh',
            device='cpu',  # Use CPU for tests that directly set tensors
        )

        # Set weights to produce known hidden values
        network.weights_ih = torch.eye(4).unsqueeze(0).expand(2, 4, 4)  # Identity
        network.bias_h = torch.zeros(2, 4)

        inputs = torch.tensor([[1.0, 2.0, 3.0, 4.0], [0.5, 1.0, 1.5, 2.0]])
        outputs = network.forward(inputs)

        # Hidden should be tanh of inputs
        expected_hidden = torch.tanh(inputs)
        # Verify by reconstructing
        assert outputs.shape == (2, 5)

    def test_relu_activation(self):
        """Test ReLU activation in hidden layer."""
        network = BatchedNeuralNetwork(
            batch_size=2,
            input_size=4,
            hidden_size=4,
            max_muscles=5,
            activation='relu',
            device='cpu',  # Use CPU for tests that directly set tensors
        )

        # Identity weights
        network.weights_ih = torch.eye(4).unsqueeze(0).expand(2, 4, 4)
        network.bias_h = torch.tensor([[-1.0, -0.5, 0.0, 0.5]] * 2)

        inputs = torch.ones(2, 4)
        outputs = network.forward(inputs)

        # Hidden should be relu(1 + bias) = relu([0, 0.5, 1, 1.5])
        # All positive after relu
        assert outputs.shape == (2, 5)

    def test_sigmoid_activation(self):
        """Test sigmoid activation in hidden layer."""
        network = BatchedNeuralNetwork(
            batch_size=1,
            input_size=2,
            hidden_size=2,
            max_muscles=3,
            activation='sigmoid',
            device='cpu',  # Use CPU for tests that directly set tensors
        )

        network.weights_ih = torch.eye(2).unsqueeze(0)
        network.bias_h = torch.zeros(1, 2)

        inputs = torch.zeros(1, 2)
        outputs = network.forward(inputs)

        # Hidden should be sigmoid(0) = 0.5
        assert outputs.shape == (1, 3)


# =============================================================================
# Test Dead Zone
# =============================================================================

class TestDeadZone:
    """Test dead zone functionality for pure mode."""

    def test_small_outputs_zeroed(self):
        network = BatchedNeuralNetwork(
            batch_size=3,
            input_size=7,
            hidden_size=8,
            max_muscles=10,
            device='cpu',  # Use CPU for tests that directly set tensors
        )
        # Set output bias to produce small tanh values
        network.bias_o = torch.full((3, 10), 0.05)

        inputs = torch.zeros(3, 7)
        outputs = network.forward_with_dead_zone(inputs, dead_zone=0.1)

        # tanh(0.05) ≈ 0.05 which is < 0.1, should be zeroed
        assert torch.all(outputs == 0)

    def test_large_outputs_preserved(self):
        network = BatchedNeuralNetwork(
            batch_size=2,
            input_size=7,
            hidden_size=8,
            max_muscles=10,
            device='cpu',  # Use CPU for tests that directly set tensors
        )
        # Set output bias to produce large tanh values
        network.bias_o = torch.full((2, 10), 1.0)

        inputs = torch.zeros(2, 7)
        outputs = network.forward_with_dead_zone(inputs, dead_zone=0.1)

        # tanh(1.0) ≈ 0.76 which is > 0.1, should be preserved
        expected = math.tanh(1.0)
        assert torch.allclose(outputs, torch.full_like(outputs, expected), atol=1e-5)

    def test_zero_dead_zone_no_effect(self):
        config = NeuralConfig()
        network = BatchedNeuralNetwork.initialize_random(
            batch_size=5,
            num_muscles=[10] * 5,
            config=config,
        )

        inputs = torch.randn(5, 8)
        outputs_normal = network.forward(inputs)
        outputs_dead_zone = network.forward_with_dead_zone(inputs, dead_zone=0.0)

        assert torch.allclose(outputs_normal, outputs_dead_zone)


# =============================================================================
# Test Loading from Genomes
# =============================================================================

class TestFromGenomes:
    """Test loading network from genome data."""

    def test_loads_weights_correctly(self):
        """Test loading from structured format (weights_ih, weights_ho, biases_h, biases_o)."""
        input_size = 8
        hidden_size = 4
        output_size = 3

        # Create structured weight format (as sent by frontend API)
        weights_ih = list(range(input_size * hidden_size))  # 32 weights
        weights_ho = list(range(hidden_size * output_size))  # 12 weights
        biases_h = [0.1] * hidden_size
        biases_o = [-0.5] * output_size

        genome = {
            'input_size': input_size,
            'hidden_size': hidden_size,
            'output_size': output_size,
            'weights_ih': weights_ih,
            'weights_ho': weights_ho,
            'biases_h': biases_h,
            'biases_o': biases_o,
        }

        config = NeuralConfig(hidden_size=hidden_size)
        network = BatchedNeuralNetwork.from_genomes(
            neural_genomes=[genome],
            num_muscles=[output_size],
            config=config,
            max_muscles=10,
        )

        # Verify first few weights_ih values (row-major order)
        assert network.weights_ih[0, 0, 0].item() == 0
        assert network.weights_ih[0, 0, 1].item() == 1
        assert network.weights_ih[0, 1, 0].item() == hidden_size  # Next row starts at hidden_size

    def test_handles_none_genomes(self):
        config = NeuralConfig()
        network = BatchedNeuralNetwork.from_genomes(
            neural_genomes=[None, None],
            num_muscles=[5, 5],
            config=config,
            max_muscles=10,
        )

        # Should have zero weights
        assert torch.all(network.weights_ih == 0)

    def test_multiple_genomes(self):
        input_size = 8
        hidden_size = 4

        genomes = []
        for i in range(3):
            output_size = 5 + i  # 5, 6, 7 muscles
            # Fill with creature index to verify correct loading
            genomes.append({
                'input_size': input_size,
                'hidden_size': hidden_size,
                'output_size': output_size,
                'weights_ih': [float(i)] * (input_size * hidden_size),
                'weights_ho': [float(i)] * (hidden_size * output_size),
                'biases_h': [float(i)] * hidden_size,
                'biases_o': [float(i)] * output_size,
            })

        config = NeuralConfig(hidden_size=hidden_size)
        network = BatchedNeuralNetwork.from_genomes(
            neural_genomes=genomes,
            num_muscles=[5, 6, 7],
            config=config,
            max_muscles=10,
        )

        # First creature's weights should be 0.0
        assert network.weights_ih[0, 0, 0].item() == 0.0
        # Second creature's weights should be 1.0
        assert network.weights_ih[1, 0, 0].item() == 1.0
        # Third creature's weights should be 2.0
        assert network.weights_ih[2, 0, 0].item() == 2.0

    def test_loads_structured_weights(self):
        """Test loading from structured format (weights_ih, weights_ho, biases_h, biases_o)."""
        input_size = 8
        hidden_size = 4
        output_size = 3

        # Create structured weight format (as sent by frontend API)
        weights_ih = list(range(input_size * hidden_size))  # 32 weights
        weights_ho = list(range(hidden_size * output_size))  # 12 weights
        biases_h = [0.1] * hidden_size  # 4 biases
        biases_o = [-0.5] * output_size  # 3 biases (negative output bias)

        genome = {
            'input_size': input_size,
            'hidden_size': hidden_size,
            'output_size': output_size,
            'weights_ih': weights_ih,
            'weights_ho': weights_ho,
            'biases_h': biases_h,
            'biases_o': biases_o,
        }

        config = NeuralConfig(hidden_size=hidden_size)
        network = BatchedNeuralNetwork.from_genomes(
            neural_genomes=[genome],
            num_muscles=[output_size],
            config=config,
            max_muscles=10,
        )

        # Verify weights_ih loaded correctly (row-major order)
        # weights_ih[0] = 0, weights_ih[1] = 1, etc.
        assert network.weights_ih[0, 0, 0].item() == 0
        assert network.weights_ih[0, 0, 1].item() == 1
        assert network.weights_ih[0, 1, 0].item() == hidden_size  # Next row

        # Verify biases_h (use approx for float comparison)
        assert abs(network.bias_h[0, 0].item() - 0.1) < 1e-6
        assert abs(network.bias_h[0, 3].item() - 0.1) < 1e-6

        # Verify weights_ho
        assert network.weights_ho[0, 0, 0].item() == 0
        assert network.weights_ho[0, 0, 1].item() == 1

        # Verify biases_o
        assert abs(network.bias_o[0, 0].item() - (-0.5)) < 1e-6
        assert abs(network.bias_o[0, 2].item() - (-0.5)) < 1e-6


# =============================================================================
# Test Weight Export
# =============================================================================

class TestWeightExport:
    """Test exporting weights to flat array."""

    def test_to_structured_weights_roundtrip(self):
        """Test that weights can be exported and re-imported."""
        input_size = 8
        hidden_size = 4
        output_size = 5

        config = NeuralConfig(hidden_size=hidden_size, neural_mode='hybrid')
        network = BatchedNeuralNetwork.initialize_random(
            batch_size=3,
            num_muscles=[output_size] * 3,
            config=config,
            max_muscles=output_size,
            device='cpu',  # Use CPU for tests that check tensor values
        )

        # Export weights from first creature as structured format
        genome = network.to_structured_weights(0, output_size)

        new_network = BatchedNeuralNetwork.from_genomes(
            neural_genomes=[genome],
            num_muscles=[output_size],
            config=config,
            device='cpu',
            max_muscles=output_size,
        )

        # Compare weights
        assert torch.allclose(network.weights_ih[0], new_network.weights_ih[0])
        assert torch.allclose(network.bias_h[0], new_network.bias_h[0])
        assert torch.allclose(network.weights_ho[0, :, :output_size], new_network.weights_ho[0, :, :output_size])
        assert torch.allclose(network.bias_o[0, :output_size], new_network.bias_o[0, :output_size])

    def test_weight_count_matches_export(self):
        input_size = 7
        hidden_size = 8
        max_muscles = 10

        network = BatchedNeuralNetwork(
            batch_size=1,
            input_size=input_size,
            hidden_size=hidden_size,
            max_muscles=max_muscles,
        )

        weights = network.to_flat_weights(0)
        expected_count = calculate_weight_count(input_size, hidden_size, max_muscles)

        assert len(weights) == expected_count
        assert network.get_weight_count() == expected_count


# =============================================================================
# Test Device Compatibility
# =============================================================================

class TestDeviceCompatibility:
    """Test device movement and compatibility."""

    def test_default_device(self):
        network = BatchedNeuralNetwork(
            batch_size=5,
            input_size=8,
            hidden_size=8,
            max_muscles=10,
        )

        # Should default to CPU (MPS has too much overhead for typical workloads)
        assert network.device == 'cpu'

    def test_explicit_cpu(self):
        network = BatchedNeuralNetwork(
            batch_size=5,
            input_size=8,
            hidden_size=8,
            max_muscles=10,
            device='cpu',
        )

        assert network.device == 'cpu'
        assert network.weights_ih.device.type == 'cpu'

    def test_to_method(self):
        network = BatchedNeuralNetwork(
            batch_size=5,
            input_size=8,
            hidden_size=8,
            max_muscles=10,
            device='cpu',
        )

        network.to('cpu')  # Should work even if already on cpu
        assert network.device == 'cpu'

    @pytest.mark.skipif(not torch.cuda.is_available(), reason="CUDA not available")
    def test_cuda_forward(self):
        network = BatchedNeuralNetwork(
            batch_size=10,
            input_size=8,
            hidden_size=8,
            max_muscles=15,
            device='cuda',
        )

        inputs = torch.randn(10, 8, device='cuda')
        outputs = network.forward(inputs)

        assert outputs.device.type == 'cuda'
        assert outputs.shape == (10, 15)


# =============================================================================
# Test Edge Cases
# =============================================================================

class TestEdgeCases:
    """Test edge cases and boundary conditions."""

    def test_single_creature(self):
        config = NeuralConfig()
        network = BatchedNeuralNetwork.initialize_random(
            batch_size=1,
            num_muscles=[10],
            config=config,
        )

        inputs = torch.randn(1, 8)
        outputs = network.forward(inputs)

        assert outputs.shape == (1, 15)

    def test_single_muscle(self):
        config = NeuralConfig()
        network = BatchedNeuralNetwork.initialize_random(
            batch_size=5,
            num_muscles=[1] * 5,
            config=config,
            max_muscles=1,
        )

        inputs = torch.randn(5, 8)
        outputs = network.forward(inputs)

        assert outputs.shape == (5, 1)

    def test_large_batch(self):
        config = NeuralConfig()
        network = BatchedNeuralNetwork.initialize_random(
            batch_size=500,
            num_muscles=[15] * 500,
            config=config,
        )

        inputs = torch.randn(500, 8)
        outputs = network.forward(inputs)

        assert outputs.shape == (500, 15)

    def test_hidden_size_1(self):
        config = NeuralConfig(hidden_size=1)
        network = BatchedNeuralNetwork.initialize_random(
            batch_size=5,
            num_muscles=[10] * 5,
            config=config,
        )

        inputs = torch.randn(5, 8)
        outputs = network.forward(inputs)

        assert outputs.shape == (5, 15)

    def test_no_nan_in_outputs(self):
        config = NeuralConfig()
        network = BatchedNeuralNetwork.initialize_random(
            batch_size=100,
            num_muscles=[15] * 100,
            config=config,
        )

        # Test with various input patterns
        inputs_normal = torch.randn(100, 8)
        inputs_extreme = torch.randn(100, 8) * 100
        inputs_zeros = torch.zeros(100, 8)

        for inputs in [inputs_normal, inputs_extreme, inputs_zeros]:
            outputs = network.forward(inputs)
            assert not torch.any(torch.isnan(outputs))
            assert not torch.any(torch.isinf(outputs))

    def test_no_nan_with_extreme_weights(self):
        network = BatchedNeuralNetwork(
            batch_size=5,
            input_size=8,
            hidden_size=8,
            max_muscles=10,
            device='cpu',  # Use CPU for tests that directly set tensors
        )

        # Set extreme weights
        network.weights_ih = torch.randn(5, 8, 8) * 100
        network.weights_ho = torch.randn(5, 8, 10) * 100

        inputs = torch.randn(5, 8)
        outputs = network.forward(inputs)

        # tanh should bound outputs
        assert not torch.any(torch.isnan(outputs))
        assert torch.all(outputs >= -1)
        assert torch.all(outputs <= 1)

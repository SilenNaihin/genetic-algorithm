"""
Batched neural network for creature control.

Each creature has its own neural network weights. Forward passes are batched
across all creatures using einsum for efficient matrix multiplication.

Architecture matches TypeScript: Input -> Hidden (configurable activation) -> Output (tanh)
Weights are evolved through genetic algorithms, NOT trained with gradients.
"""

import torch
from typing import Literal, Optional
from dataclasses import dataclass

# Constants matching TypeScript
DEFAULT_OUTPUT_BIAS = -0.5
NEURAL_INPUT_SIZE_PURE = 7
NEURAL_INPUT_SIZE_HYBRID = 8


@dataclass
class NeuralConfig:
    """Configuration for neural network evolution."""
    use_neural_net: bool = True
    neural_mode: Literal['hybrid', 'pure'] = 'hybrid'
    hidden_size: int = 8
    activation: Literal['tanh', 'relu', 'sigmoid'] = 'tanh'
    weight_mutation_rate: float = 0.1
    weight_mutation_magnitude: float = 0.3
    output_bias: float = DEFAULT_OUTPUT_BIAS
    dead_zone: float = 0.1  # Pure mode only


def get_input_size(mode: Literal['hybrid', 'pure']) -> int:
    """Get input size based on neural mode."""
    return NEURAL_INPUT_SIZE_PURE if mode == 'pure' else NEURAL_INPUT_SIZE_HYBRID


def calculate_weight_count(input_size: int, hidden_size: int, output_size: int) -> int:
    """
    Calculate total number of weights for a given topology.

    Weight order: [weightsIH, biasH, weightsHO, biasO]
    """
    return (input_size * hidden_size) + hidden_size + (hidden_size * output_size) + output_size


class BatchedNeuralNetwork:
    """
    Batched neural network for multiple creatures.

    Each creature has its own set of weights stored as tensors.
    Forward pass is batched across all creatures using einsum.

    Architecture: Input -> Hidden (configurable) -> Output (tanh)

    Weight storage format matches TypeScript:
    - weights_ih: [B, input_size, hidden_size]
    - bias_h: [B, hidden_size]
    - weights_ho: [B, hidden_size, max_muscles]
    - bias_o: [B, max_muscles]
    """

    def __init__(
        self,
        batch_size: int,
        input_size: int,
        hidden_size: int,
        max_muscles: int,
        activation: Literal['tanh', 'relu', 'sigmoid'] = 'tanh',
        device: Optional[str] = None,
    ):
        if device is None:
            device = 'cuda' if torch.cuda.is_available() else 'cpu'

        self.batch_size = batch_size
        self.input_size = input_size
        self.hidden_size = hidden_size
        self.max_muscles = max_muscles
        self.activation_name = activation
        self.device = device

        # Initialize weight matrices (will be populated from genomes)
        self.weights_ih = torch.zeros(batch_size, input_size, hidden_size, device=device)
        self.bias_h = torch.zeros(batch_size, hidden_size, device=device)
        self.weights_ho = torch.zeros(batch_size, hidden_size, max_muscles, device=device)
        self.bias_o = torch.zeros(batch_size, max_muscles, device=device)

        # Muscle mask for variable-size creatures
        self.muscle_mask = torch.ones(batch_size, max_muscles, dtype=torch.bool, device=device)

        # Get activation function
        self._activation = self._get_activation_fn(activation)

    def _get_activation_fn(self, name: str):
        """Get activation function by name."""
        if name == 'tanh':
            return torch.tanh
        elif name == 'relu':
            return torch.relu
        elif name == 'sigmoid':
            return torch.sigmoid
        else:
            return torch.tanh

    def to(self, device: str) -> 'BatchedNeuralNetwork':
        """Move all tensors to specified device."""
        self.device = device
        self.weights_ih = self.weights_ih.to(device)
        self.bias_h = self.bias_h.to(device)
        self.weights_ho = self.weights_ho.to(device)
        self.bias_o = self.bias_o.to(device)
        self.muscle_mask = self.muscle_mask.to(device)
        return self

    @torch.no_grad()
    def forward(self, inputs: torch.Tensor) -> torch.Tensor:
        """
        Batched forward pass through all creature networks.

        Args:
            inputs: [B, input_size] sensor inputs for each creature

        Returns:
            outputs: [B, max_muscles] neural network outputs in [-1, 1] range
        """
        # Hidden layer: h = activation(x @ W_ih + b_h)
        # [B, input_size] @ [B, input_size, hidden_size] -> [B, hidden_size]
        hidden = torch.einsum('bi,bih->bh', inputs, self.weights_ih) + self.bias_h
        hidden = self._activation(hidden)

        # Output layer: y = tanh(h @ W_ho + b_o)
        # [B, hidden_size] @ [B, hidden_size, max_muscles] -> [B, max_muscles]
        output = torch.einsum('bh,bho->bo', hidden, self.weights_ho) + self.bias_o
        output = torch.tanh(output)  # Always tanh for output [-1, 1]

        return output

    @torch.no_grad()
    def forward_with_dead_zone(self, inputs: torch.Tensor, dead_zone: float = 0.1) -> torch.Tensor:
        """
        Forward pass with dead zone applied (pure mode).

        Small outputs (abs < dead_zone) are zeroed out.
        """
        output = self.forward(inputs)

        if dead_zone > 0:
            # Zero out small outputs
            mask = torch.abs(output) < dead_zone
            output = output.masked_fill(mask, 0.0)

        return output

    @classmethod
    def from_genomes(
        cls,
        neural_genomes: list,  # List of NeuralGenomeData dicts
        num_muscles: list,     # Number of muscles per creature
        config: NeuralConfig,
        max_muscles: int = 15,
        device: Optional[str] = None,
    ) -> 'BatchedNeuralNetwork':
        """
        Create batched network from list of neural genome data.

        Args:
            neural_genomes: List of dicts with 'weights', 'topology', 'activation'
            num_muscles: List of actual muscle counts per creature
            config: Neural configuration
            max_muscles: Maximum number of muscles (for padding)
            device: Target device
        """
        batch_size = len(neural_genomes)
        input_size = get_input_size(config.neural_mode)
        hidden_size = config.hidden_size

        network = cls(
            batch_size=batch_size,
            input_size=input_size,
            hidden_size=hidden_size,
            max_muscles=max_muscles,
            activation=config.activation,
            device=device,
        )

        # Extract weights from each genome
        for i, genome in enumerate(neural_genomes):
            if genome is None:
                continue

            weights = genome.get('weights', [])
            topology = genome.get('topology', {})

            # Get topology info
            g_input_size = topology.get('inputSize', input_size)
            g_hidden_size = topology.get('hiddenSize', hidden_size)
            g_output_size = topology.get('outputSize', num_muscles[i])

            # Parse flat weight array (matching TypeScript order)
            idx = 0

            # Input -> Hidden weights: [input_size, hidden_size]
            for inp in range(g_input_size):
                for hid in range(g_hidden_size):
                    if idx < len(weights) and inp < input_size and hid < hidden_size:
                        network.weights_ih[i, inp, hid] = weights[idx]
                    idx += 1

            # Hidden biases: [hidden_size]
            for hid in range(g_hidden_size):
                if idx < len(weights) and hid < hidden_size:
                    network.bias_h[i, hid] = weights[idx]
                idx += 1

            # Hidden -> Output weights: [hidden_size, output_size]
            for hid in range(g_hidden_size):
                for out in range(g_output_size):
                    if idx < len(weights) and hid < hidden_size and out < max_muscles:
                        network.weights_ho[i, hid, out] = weights[idx]
                    idx += 1

            # Output biases: [output_size]
            for out in range(g_output_size):
                if idx < len(weights) and out < max_muscles:
                    network.bias_o[i, out] = weights[idx]
                idx += 1

            # Set muscle mask (valid muscles only)
            network.muscle_mask[i, :num_muscles[i]] = True
            network.muscle_mask[i, num_muscles[i]:] = False

        return network

    @classmethod
    def initialize_random(
        cls,
        batch_size: int,
        num_muscles: list,
        config: NeuralConfig,
        max_muscles: int = 15,
        device: Optional[str] = None,
    ) -> 'BatchedNeuralNetwork':
        """
        Create batched network with GA-optimized random initialization.

        Initialization matches TypeScript:
        - Weights: Uniform [-0.5, 0.5]
        - Hidden biases: 0
        - Output biases: DEFAULT_OUTPUT_BIAS (-0.5)
        """
        input_size = get_input_size(config.neural_mode)
        hidden_size = config.hidden_size

        network = cls(
            batch_size=batch_size,
            input_size=input_size,
            hidden_size=hidden_size,
            max_muscles=max_muscles,
            activation=config.activation,
            device=device,
        )

        # GA-optimized initialization
        weight_range = 0.5

        # Uniform initialization for weights
        network.weights_ih = (torch.rand(batch_size, input_size, hidden_size, device=device) - 0.5) * 2 * weight_range
        network.weights_ho = (torch.rand(batch_size, hidden_size, max_muscles, device=device) - 0.5) * 2 * weight_range

        # Hidden biases start at 0
        network.bias_h = torch.zeros(batch_size, hidden_size, device=device)

        # Output biases start negative (muscles default to "off")
        network.bias_o = torch.full((batch_size, max_muscles), config.output_bias, device=device)

        # Set muscle mask
        for i, n_muscles in enumerate(num_muscles):
            network.muscle_mask[i, :n_muscles] = True
            network.muscle_mask[i, n_muscles:] = False

        return network

    def get_weight_count(self) -> int:
        """Get total number of weights per creature."""
        return calculate_weight_count(self.input_size, self.hidden_size, self.max_muscles)

    def to_flat_weights(self, creature_idx: int) -> list:
        """
        Export weights for a single creature as flat array.
        Matches TypeScript weight order for compatibility.
        """
        weights = []

        # Input -> Hidden weights
        for inp in range(self.input_size):
            for hid in range(self.hidden_size):
                weights.append(self.weights_ih[creature_idx, inp, hid].item())

        # Hidden biases
        for hid in range(self.hidden_size):
            weights.append(self.bias_h[creature_idx, hid].item())

        # Hidden -> Output weights
        for hid in range(self.hidden_size):
            for out in range(self.max_muscles):
                weights.append(self.weights_ho[creature_idx, hid, out].item())

        # Output biases
        for out in range(self.max_muscles):
            weights.append(self.bias_o[creature_idx, out].item())

        return weights

"""
Utility functions for Evolution Lab notebooks.
"""

import random
import numpy as np
import torch


def set_seed(seed: int = 42) -> None:
    """Set random seed for reproducibility across all libraries."""
    random.seed(seed)
    np.random.seed(seed)
    torch.manual_seed(seed)
    if torch.cuda.is_available():
        torch.cuda.manual_seed(seed)
        torch.cuda.manual_seed_all(seed)
        torch.backends.cudnn.deterministic = True
        torch.backends.cudnn.benchmark = False
    print(f"Random seed set to {seed}")


def print_tensor_info(t: torch.Tensor, name: str = "tensor") -> None:
    """Print useful information about a tensor."""
    print(f"{name}:")
    print(f"  shape: {t.shape}")
    print(f"  dtype: {t.dtype}")
    print(f"  min: {t.min().item():.4f}, max: {t.max().item():.4f}, mean: {t.mean().item():.4f}")


def visualize_weights(weights: torch.Tensor, title: str = "Weights") -> None:
    """Visualize a weight matrix as a heatmap."""
    import matplotlib.pyplot as plt

    plt.figure(figsize=(8, 6))
    plt.imshow(weights.detach().numpy(), cmap='RdBu', aspect='auto')
    plt.colorbar(label='Weight value')
    plt.title(title)
    plt.xlabel('Output neuron')
    plt.ylabel('Input neuron')
    plt.show()

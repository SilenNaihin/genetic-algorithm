"""
Device detection utilities for PyTorch tensors.

MPS (Apple Silicon) is intentionally excluded - benchmarks show it's 20x slower
than CPU for typical batch sizes (< 200 creatures) due to kernel launch overhead.
CUDA is preferred for large batches on NVIDIA GPUs.
"""

import torch


def get_best_device() -> torch.device:
    """
    Get the best available device for tensor computation.

    Priority: CUDA > CPU
    MPS is excluded due to poor performance on small batches.

    Returns:
        torch.device for optimal computation
    """
    if torch.cuda.is_available():
        return torch.device("cuda")
    return torch.device("cpu")


def get_device_str() -> str:
    """
    Get the best available device as a string.

    Returns:
        Device string ('cuda' or 'cpu')
    """
    if torch.cuda.is_available():
        return 'cuda'
    return 'cpu'

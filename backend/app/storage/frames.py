"""
Frame storage utilities.

Handles selective frame storage based on storage mode:
- 'none': No frames stored (default for CLI)
- 'all': All frames stored (UI mode, --store flag)
- 'sparse': Top N + Bottom N stored (--sparse-store flag)
"""

from typing import Literal


def select_creatures_for_frames(
    creature_ids: list[str],
    fitness_scores: list[float],
    mode: Literal['none', 'all', 'sparse'],
    top_count: int = 10,
    bottom_count: int = 10,
) -> set[str]:
    """
    Select which creatures should have their frames stored.

    Args:
        creature_ids: List of creature IDs
        fitness_scores: Corresponding fitness scores (same order)
        mode: Storage mode ('none', 'all', 'sparse')
        top_count: Number of top performers to store (for sparse mode)
        bottom_count: Number of bottom performers to store (for sparse mode)

    Returns:
        Set of creature IDs that should have frames stored
    """
    if mode == 'none':
        return set()

    if mode == 'all':
        return set(creature_ids)

    # Sparse mode: top N + bottom N
    if len(creature_ids) == 0:
        return set()

    # Sort by fitness (descending)
    sorted_pairs = sorted(
        zip(creature_ids, fitness_scores),
        key=lambda x: x[1],
        reverse=True
    )

    selected = set()

    # Top N
    for creature_id, _ in sorted_pairs[:top_count]:
        selected.add(creature_id)

    # Bottom N
    for creature_id, _ in sorted_pairs[-bottom_count:]:
        selected.add(creature_id)

    return selected


def should_record_frames(mode: Literal['none', 'all', 'sparse']) -> bool:
    """Check if frames should be recorded during simulation."""
    return mode != 'none'

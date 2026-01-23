"""
Selection algorithms for genetic evolution.

Ported from TypeScript src/genetics/Selection.ts.
Works with genome dicts and fitness scores.
"""

import random
from dataclasses import dataclass
from typing import TypeVar

T = TypeVar('T')


@dataclass
class SelectionResult:
    """Result of selection operation."""

    survivors: list[dict]
    culled: list[dict]


def truncation_selection(
    genomes: list[dict],
    fitness_scores: list[float],
    survival_rate: float = 0.5,
) -> SelectionResult:
    """
    Truncation selection - keep top percentage of creatures by fitness.

    Args:
        genomes: List of genome dicts
        fitness_scores: Fitness values corresponding to each genome
        survival_rate: Fraction to keep (0.5 = top 50%)

    Returns:
        SelectionResult with survivors and culled lists
    """
    if len(genomes) != len(fitness_scores):
        raise ValueError("genomes and fitness_scores must have same length")

    # Create pairs and sort by fitness descending
    pairs = list(zip(genomes, fitness_scores))
    sorted_pairs = sorted(pairs, key=lambda x: x[1], reverse=True)

    survivor_count = max(1, int(len(sorted_pairs) * survival_rate))

    survivors = [p[0] for p in sorted_pairs[:survivor_count]]
    culled = [p[0] for p in sorted_pairs[survivor_count:]]

    return SelectionResult(survivors=survivors, culled=culled)


def tournament_selection(
    genomes: list[dict],
    fitness_scores: list[float],
    num_survivors: int,
    tournament_size: int = 3,
) -> list[dict]:
    """
    Tournament selection - randomly select creatures and keep the best.

    Args:
        genomes: List of genome dicts
        fitness_scores: Fitness values for each genome
        num_survivors: Number of survivors to select
        tournament_size: Number of contestants per tournament

    Returns:
        List of selected survivor genomes
    """
    if len(genomes) != len(fitness_scores):
        raise ValueError("genomes and fitness_scores must have same length")

    survivors: list[dict] = []
    # Create index pairs to track which genomes are available
    available_indices = list(range(len(genomes)))

    while len(survivors) < num_survivors and available_indices:
        # Select tournament participants
        tournament_indices = random.sample(
            available_indices,
            min(tournament_size, len(available_indices))
        )

        # Find winner (highest fitness)
        winner_idx = max(tournament_indices, key=lambda i: fitness_scores[i])
        survivors.append(genomes[winner_idx])

        # Remove winner from available pool
        available_indices.remove(winner_idx)

    return survivors


def get_elites(
    genomes: list[dict],
    fitness_scores: list[float],
    count: int,
) -> list[dict]:
    """
    Elitism - get top N performers (unchanged).

    Args:
        genomes: List of genome dicts
        fitness_scores: Fitness values for each genome
        count: Number of elites to return

    Returns:
        List of top N genomes by fitness
    """
    if len(genomes) != len(fitness_scores):
        raise ValueError("genomes and fitness_scores must have same length")

    pairs = list(zip(genomes, fitness_scores))
    sorted_pairs = sorted(pairs, key=lambda x: x[1], reverse=True)

    return [p[0] for p in sorted_pairs[:min(count, len(sorted_pairs))]]


def rank_based_probabilities(
    genomes: list[dict],
    fitness_scores: list[float],
) -> dict[str, float]:
    """
    Calculate selection probabilities based on rank (not raw fitness).

    Higher ranked creatures get higher probability.
    Rank-based selection is more stable than fitness-proportional
    when fitness values have high variance.

    Args:
        genomes: List of genome dicts
        fitness_scores: Fitness values for each genome

    Returns:
        Dict mapping genome_id to selection probability
    """
    if len(genomes) != len(fitness_scores):
        raise ValueError("genomes and fitness_scores must have same length")

    # Sort by fitness descending
    pairs = list(zip(genomes, fitness_scores))
    sorted_pairs = sorted(pairs, key=lambda x: x[1], reverse=True)

    n = len(sorted_pairs)
    total_rank = sum(range(1, n + 1))  # 1 + 2 + ... + n

    probabilities: dict[str, float] = {}
    for i, (genome, _) in enumerate(sorted_pairs):
        rank = n - i  # Best has rank n, worst has rank 1
        genome_id = genome.get('id', f'genome_{i}')
        probabilities[genome_id] = rank / total_rank

    return probabilities


def weighted_random_select(
    genomes: list[dict],
    probabilities: dict[str, float],
) -> dict:
    """
    Weighted random selection (roulette wheel).

    Args:
        genomes: List of genome dicts
        probabilities: Dict mapping genome_id to probability

    Returns:
        Selected genome
    """
    random_val = random.random()
    cumulative = 0.0

    for genome in genomes:
        genome_id = genome.get('id', '')
        cumulative += probabilities.get(genome_id, 0.0)
        if random_val <= cumulative:
            return genome

    # Fallback to last genome
    return genomes[-1]


def select_parents(
    genomes: list[dict],
    fitness_scores: list[float],
    count: int,
    method: str = 'rank',
) -> list[dict]:
    """
    Select parents for breeding using specified method.

    Args:
        genomes: List of survivor genomes
        fitness_scores: Fitness values for survivors
        count: Number of parents to select (with replacement)
        method: Selection method ('rank', 'tournament', 'random')

    Returns:
        List of selected parent genomes
    """
    if method == 'tournament':
        # Tournament selection without removal (allows same parent multiple times)
        parents = []
        for _ in range(count):
            # Small tournament for each parent selection
            indices = random.sample(range(len(genomes)), min(3, len(genomes)))
            winner_idx = max(indices, key=lambda i: fitness_scores[i])
            parents.append(genomes[winner_idx])
        return parents

    elif method == 'rank':
        probabilities = rank_based_probabilities(genomes, fitness_scores)
        return [weighted_random_select(genomes, probabilities) for _ in range(count)]

    else:  # random
        return [random.choice(genomes) for _ in range(count)]

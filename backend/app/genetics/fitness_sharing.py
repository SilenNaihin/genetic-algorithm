"""
Fitness sharing for diversity maintenance.

Implements fitness sharing (Goldberg & Richardson, 1987) to penalize
creatures that are too similar, encouraging population diversity.

The idea: if many creatures occupy the same "niche" (similar genomes),
they share the fitness reward, reducing their effective fitness.
This prevents the population from converging to a single solution.
"""

import math

import numpy as np


def neural_genome_distance(genome1: dict, genome2: dict) -> float:
    """
    Calculate distance between two neural genomes.

    Uses normalized Euclidean distance across all weight matrices.
    Returns a value typically in range [0, 2+] where:
    - 0 = identical genomes
    - ~0.5 = moderately different
    - 1+ = very different

    Args:
        genome1: First creature genome (must have neuralGenome)
        genome2: Second creature genome (must have neuralGenome)

    Returns:
        Distance between genomes (0 = identical)
    """
    ng1 = genome1.get('neuralGenome')
    ng2 = genome2.get('neuralGenome')

    # If either lacks neural genome, fall back to body distance
    if ng1 is None or ng2 is None:
        return body_genome_distance(genome1, genome2)

    total_squared_diff = 0.0
    total_weights = 0

    # Compare weight matrices
    # Support both camelCase (frontend) and snake_case (backend) keys
    keys_to_check = [
        ('weights_ih', 'inputWeights'),      # input->hidden weights
        ('weights_ho', 'outputWeights'),     # hidden->output weights
        ('biases_h', 'hiddenBiases'),        # hidden biases
        ('biases_o', 'outputBiases'),        # output biases
    ]

    for snake_key, camel_key in keys_to_check:
        w1 = ng1.get(snake_key) or ng1.get(camel_key, [])
        w2 = ng2.get(snake_key) or ng2.get(camel_key, [])

        # Flatten nested lists
        flat1 = _flatten(w1)
        flat2 = _flatten(w2)

        # Handle different sizes (topology mismatch)
        min_len = min(len(flat1), len(flat2))
        if min_len == 0:
            continue

        # Sum squared differences for matching elements
        for i in range(min_len):
            diff = flat1[i] - flat2[i]
            total_squared_diff += diff * diff
            total_weights += 1

        # Penalize size mismatch
        size_diff = abs(len(flat1) - len(flat2))
        if size_diff > 0:
            # Assume missing weights are maximally different (diff of 2 for tanh range)
            total_squared_diff += size_diff * 4.0
            total_weights += size_diff

    if total_weights == 0:
        return body_genome_distance(genome1, genome2)

    # Root mean squared distance, normalized by weight range
    # tanh weights typically in [-2, 2], so max diff ~4, squared ~16
    # Normalize to get distance roughly in [0, 1] range for similar topologies
    rms = math.sqrt(total_squared_diff / total_weights)
    return rms


def body_genome_distance(genome1: dict, genome2: dict) -> float:
    """
    Calculate distance between two genomes based on body structure.

    Used as fallback when neural genomes aren't available.
    Compares node count, muscle count, and structural properties.

    Args:
        genome1: First creature genome
        genome2: Second creature genome

    Returns:
        Distance between genomes (0 = identical structure)
    """
    nodes1 = genome1.get('nodes', [])
    nodes2 = genome2.get('nodes', [])
    muscles1 = genome1.get('muscles', [])
    muscles2 = genome2.get('muscles', [])

    # Structural differences
    node_diff = abs(len(nodes1) - len(nodes2))
    muscle_diff = abs(len(muscles1) - len(muscles2))

    # Frequency multiplier difference
    freq1 = genome1.get('globalFrequencyMultiplier', 1.0)
    freq2 = genome2.get('globalFrequencyMultiplier', 1.0)
    freq_diff = abs(freq1 - freq2)

    # Combine with weights (node/muscle differences more significant)
    distance = (node_diff * 0.3) + (muscle_diff * 0.2) + (freq_diff * 0.5)

    return distance


def _flatten(nested: list) -> list[float]:
    """Flatten a potentially nested list to 1D."""
    result = []
    for item in nested:
        if isinstance(item, list):
            result.extend(_flatten(item))
        else:
            result.append(float(item))
    return result


def sharing_function(distance: float, radius: float, alpha: float = 1.0) -> float:
    """
    Calculate sharing value based on distance.

    Returns 1 if distance is 0 (identical), decreasing to 0 at radius.
    Uses a triangular sharing function (standard choice).

    Args:
        distance: Distance between two genomes
        radius: Sharing radius (sigma_share)
        alpha: Shape parameter (1.0 = linear, 2.0 = quadratic)

    Returns:
        Sharing value in [0, 1]
    """
    if distance >= radius:
        return 0.0
    return 1.0 - (distance / radius) ** alpha


def apply_fitness_sharing(
    genomes: list[dict],
    fitness_scores: list[float],
    sharing_radius: float = 0.5,
    alpha: float = 1.0,
) -> list[float]:
    """
    Apply fitness sharing to a population.

    For each creature, divides fitness by its niche count (number of
    similar creatures). This penalizes crowded regions of the search
    space, encouraging diversity.

    Shared fitness = raw_fitness / niche_count
    niche_count = sum of sharing values with all other creatures

    Args:
        genomes: List of creature genomes
        fitness_scores: Raw fitness values
        sharing_radius: Distance threshold for sharing (sigma_share)
        alpha: Sharing function shape (1.0 = linear decay)

    Returns:
        List of shared (adjusted) fitness values
    """
    n = len(genomes)
    if n == 0:
        return []

    if n != len(fitness_scores):
        raise ValueError("genomes and fitness_scores must have same length")

    # Build distance matrix (symmetric, so only compute upper triangle)
    distances = np.zeros((n, n))
    for i in range(n):
        for j in range(i + 1, n):
            d = neural_genome_distance(genomes[i], genomes[j])
            distances[i, j] = d
            distances[j, i] = d

    # Calculate niche counts
    niche_counts = np.ones(n)  # Start at 1 (self)
    for i in range(n):
        for j in range(n):
            if i != j:
                share_val = sharing_function(distances[i, j], sharing_radius, alpha)
                niche_counts[i] += share_val

    # Apply sharing: shared_fitness = raw_fitness / niche_count
    shared_fitness = [
        fitness_scores[i] / niche_counts[i]
        for i in range(n)
    ]

    return shared_fitness

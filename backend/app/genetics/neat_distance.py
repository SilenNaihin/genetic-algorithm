"""
NEAT compatibility distance for speciation.

Measures how different two NEAT genomes are based on their structural
differences (excess/disjoint genes) and weight differences of matching genes.

Formula: δ = (c1 × E / N) + (c2 × D / N) + (c3 × W̄)

Where:
- E = excess genes (beyond other genome's max innovation)
- D = disjoint genes (within range but not matching)
- N = genes in larger genome (normalization factor)
- W̄ = average weight difference of matching genes
- c1, c2, c3 = coefficients to tune relative importance

See docs/NEAT.md for technical details.
"""

from app.schemas.neat import NEATGenome


def neat_genome_distance(
    genome_a: NEATGenome,
    genome_b: NEATGenome,
    excess_coefficient: float = 1.0,
    disjoint_coefficient: float = 1.0,
    weight_coefficient: float = 0.4,
    normalize_by_size: bool = True,
) -> float:
    """
    Calculate NEAT compatibility distance between two genomes.

    This distance is used for speciation - genomes with distance below
    a threshold are considered the same species.

    Args:
        genome_a: First NEAT genome
        genome_b: Second NEAT genome
        excess_coefficient: Weight for excess gene term (c1)
        disjoint_coefficient: Weight for disjoint gene term (c2)
        weight_coefficient: Weight for weight difference term (c3)
        normalize_by_size: If True, divide E and D by N (larger genome size).
                          Set False for small genomes per NEAT paper.

    Returns:
        Compatibility distance (0 = identical structure and weights)
    """
    # Get innovation numbers from both genomes
    a_innovations = {c.innovation: c for c in genome_a.connections}
    b_innovations = {c.innovation: c for c in genome_b.connections}

    a_inn_set = set(a_innovations.keys())
    b_inn_set = set(b_innovations.keys())

    # Handle empty genomes
    if not a_inn_set and not b_inn_set:
        # Both empty - compare biases only
        return _bias_distance(genome_a, genome_b)

    if not a_inn_set:
        # A is empty, all B genes are excess
        return excess_coefficient * len(b_inn_set)

    if not b_inn_set:
        # B is empty, all A genes are excess
        return excess_coefficient * len(a_inn_set)

    # Find max innovation in each genome
    max_a = max(a_inn_set)
    max_b = max(b_inn_set)

    # Classify genes
    matching = a_inn_set & b_inn_set
    only_in_a = a_inn_set - b_inn_set
    only_in_b = b_inn_set - a_inn_set

    # Count excess genes (beyond other genome's max innovation)
    excess_a = sum(1 for inn in only_in_a if inn > max_b)
    excess_b = sum(1 for inn in only_in_b if inn > max_a)
    excess_count = excess_a + excess_b

    # Count disjoint genes (within range but not matching)
    disjoint_count = (len(only_in_a) - excess_a) + (len(only_in_b) - excess_b)

    # Calculate average weight difference for matching genes
    if matching:
        weight_diff_sum = sum(
            abs(a_innovations[inn].weight - b_innovations[inn].weight)
            for inn in matching
        )
        avg_weight_diff = weight_diff_sum / len(matching)
    else:
        avg_weight_diff = 0.0

    # Normalization factor N (size of larger genome)
    # Per NEAT paper, N can be set to 1 for small genomes (< 20 genes)
    if normalize_by_size:
        n = max(len(a_inn_set), len(b_inn_set), 1)
    else:
        n = 1

    # Calculate distance
    distance = (
        (excess_coefficient * excess_count / n) +
        (disjoint_coefficient * disjoint_count / n) +
        (weight_coefficient * avg_weight_diff)
    )

    return distance


def _bias_distance(genome_a: NEATGenome, genome_b: NEATGenome) -> float:
    """
    Calculate distance based on neuron biases only.

    Used when both genomes have no connections.
    """
    a_biases = {n.id: n.bias for n in genome_a.neurons}
    b_biases = {n.id: n.bias for n in genome_b.neurons}

    common_ids = set(a_biases.keys()) & set(b_biases.keys())

    if not common_ids:
        return 0.0

    total_diff = sum(abs(a_biases[nid] - b_biases[nid]) for nid in common_ids)
    return total_diff / len(common_ids)


def neat_genome_distance_from_dict(
    genome_a: dict,
    genome_b: dict,
    excess_coefficient: float = 1.0,
    disjoint_coefficient: float = 1.0,
    weight_coefficient: float = 0.4,
) -> float:
    """
    Calculate NEAT distance from genome dictionaries.

    This is a wrapper for neat_genome_distance that accepts dict inputs,
    making it compatible with the speciation system's distance_fn interface.

    The genomes can be either:
    1. Full creature genomes with 'neatGenome' key
    2. Direct NEATGenome dicts

    Args:
        genome_a: First genome (dict or creature with neatGenome)
        genome_b: Second genome (dict or creature with neatGenome)
        excess_coefficient: Weight for excess gene term
        disjoint_coefficient: Weight for disjoint gene term
        weight_coefficient: Weight for weight difference term

    Returns:
        Compatibility distance
    """
    # Extract NEAT genome if wrapped in creature genome
    neat_a = _extract_neat_genome(genome_a)
    neat_b = _extract_neat_genome(genome_b)

    return neat_genome_distance(
        neat_a,
        neat_b,
        excess_coefficient=excess_coefficient,
        disjoint_coefficient=disjoint_coefficient,
        weight_coefficient=weight_coefficient,
    )


def _extract_neat_genome(genome: dict | NEATGenome) -> NEATGenome:
    """
    Extract NEATGenome from various input formats.
    """
    if isinstance(genome, NEATGenome):
        return genome

    # Check for neatGenome key (creature genome wrapper)
    if 'neatGenome' in genome:
        neat_data = genome['neatGenome']
        if isinstance(neat_data, NEATGenome):
            return neat_data
        return NEATGenome(**neat_data)

    # Check for neat_genome key (snake_case variant)
    if 'neat_genome' in genome:
        neat_data = genome['neat_genome']
        if isinstance(neat_data, NEATGenome):
            return neat_data
        return NEATGenome(**neat_data)

    # Assume it's a raw NEAT genome dict
    if 'neurons' in genome and 'connections' in genome:
        return NEATGenome(**genome)

    # Fallback: return empty genome
    return NEATGenome(neurons=[], connections=[])


def create_neat_distance_fn(
    excess_coefficient: float = 1.0,
    disjoint_coefficient: float = 1.0,
    weight_coefficient: float = 0.4,
):
    """
    Create a distance function with specific coefficients.

    This returns a function compatible with the speciation system's
    distance_fn parameter.

    Args:
        excess_coefficient: Weight for excess gene term
        disjoint_coefficient: Weight for disjoint gene term
        weight_coefficient: Weight for weight difference term

    Returns:
        Distance function: (genome_a, genome_b) -> float
    """
    def distance_fn(genome_a: dict, genome_b: dict) -> float:
        return neat_genome_distance_from_dict(
            genome_a,
            genome_b,
            excess_coefficient=excess_coefficient,
            disjoint_coefficient=disjoint_coefficient,
            weight_coefficient=weight_coefficient,
        )

    return distance_fn

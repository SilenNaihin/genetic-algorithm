"""
Speciation for diversity protection.

Groups creatures by genome similarity. Selection happens within each species,
protecting diverse solutions from being outcompeted by a single dominant strategy.

Based on NEAT speciation (Stanley & Miikkulainen, 2002), simplified:
- Species are recreated each generation (no persistence across generations)
- Representative is the first member assigned to the species
- Within-species selection uses truncation

The distance function is pluggable to support different genome types:
- neural_genome_distance: For standard neural genomes (default)
- neat_genome_distance: For NEAT genomes (future, uses innovation numbers)
"""

from dataclasses import dataclass, field
from typing import Callable

from .fitness_sharing import neural_genome_distance

# Type alias for distance functions
DistanceFunction = Callable[[dict, dict], float]


@dataclass
class Species:
    """A species is a group of similar genomes."""

    id: int
    representative: dict  # The genome used for distance comparisons
    members: list[dict] = field(default_factory=list)
    fitness_scores: list[float] = field(default_factory=list)

    @property
    def size(self) -> int:
        """Number of members in this species."""
        return len(self.members)

    @property
    def avg_fitness(self) -> float:
        """Average fitness of species members."""
        if not self.fitness_scores:
            return 0.0
        return sum(self.fitness_scores) / len(self.fitness_scores)

    @property
    def max_fitness(self) -> float:
        """Maximum fitness in this species."""
        if not self.fitness_scores:
            return 0.0
        return max(self.fitness_scores)


def assign_species(
    genomes: list[dict],
    fitness_scores: list[float],
    compatibility_threshold: float,
    distance_fn: DistanceFunction | None = None,
) -> list[Species]:
    """
    Assign genomes to species based on genome distance.

    Genomes are assigned to the first species whose representative they
    are compatible with (distance < threshold). If no compatible species
    exists, a new species is created.

    Args:
        genomes: List of creature genomes
        fitness_scores: Fitness values for each genome
        compatibility_threshold: Distance threshold for species membership
        distance_fn: Function to compute distance between two genomes.
                     Defaults to neural_genome_distance. NEAT can pass
                     neat_genome_distance here.

    Returns:
        List of Species objects with assigned members
    """
    if len(genomes) != len(fitness_scores):
        raise ValueError("genomes and fitness_scores must have same length")

    # Default to neural genome distance
    if distance_fn is None:
        distance_fn = neural_genome_distance

    species_list: list[Species] = []

    for genome, fitness in zip(genomes, fitness_scores):
        assigned = False

        # Try to assign to existing species
        for species in species_list:
            dist = distance_fn(genome, species.representative)
            if dist < compatibility_threshold:
                species.members.append(genome)
                species.fitness_scores.append(fitness)
                assigned = True
                break

        # Create new species if no compatible one found
        if not assigned:
            new_species = Species(
                id=len(species_list),
                representative=genome,
                members=[genome],
                fitness_scores=[fitness],
            )
            species_list.append(new_species)

    return species_list


def select_within_species(
    species_list: list[Species],
    survival_rate: float,
    min_species_size: int,
) -> list[dict]:
    """
    Select survivors from within each species.

    Each species keeps its top N% performers, with a minimum size to
    prevent species extinction. This protects diverse solutions that
    might be outcompeted in global selection.

    Args:
        species_list: List of species with assigned members
        survival_rate: Fraction of each species to keep (0.0-1.0)
        min_species_size: Minimum number of survivors per species

    Returns:
        Combined list of survivors from all species
    """
    all_survivors: list[dict] = []

    for species in species_list:
        if species.size == 0:
            continue

        # Sort members by fitness (descending)
        sorted_pairs = sorted(
            zip(species.members, species.fitness_scores),
            key=lambda x: x[1],
            reverse=True,
        )

        # Calculate how many to keep
        num_keep_by_rate = int(len(sorted_pairs) * survival_rate)
        num_keep = max(min_species_size, num_keep_by_rate)
        # Don't keep more than we have
        num_keep = min(num_keep, len(sorted_pairs))

        # Extract survivors
        survivors = [member for member, _ in sorted_pairs[:num_keep]]
        all_survivors.extend(survivors)

    return all_survivors


def apply_speciation(
    genomes: list[dict],
    fitness_scores: list[float],
    compatibility_threshold: float,
    survival_rate: float,
    min_species_size: int,
    distance_fn: DistanceFunction | None = None,
) -> tuple[list[dict], list[Species]]:
    """
    Apply speciation-based selection to a population.

    This is the main entry point for speciation. It:
    1. Assigns genomes to species based on compatibility
    2. Selects survivors within each species

    Args:
        genomes: List of creature genomes
        fitness_scores: Fitness values for each genome
        compatibility_threshold: Distance threshold for species membership
        survival_rate: Fraction of each species to keep
        min_species_size: Minimum survivors per species
        distance_fn: Function to compute distance between two genomes.
                     Defaults to neural_genome_distance.

    Returns:
        Tuple of (survivors, species_list)
    """
    # Assign to species
    species_list = assign_species(
        genomes, fitness_scores, compatibility_threshold, distance_fn
    )

    # Select within each species
    survivors = select_within_species(species_list, survival_rate, min_species_size)

    return survivors, species_list


def get_species_stats(species_list: list[Species]) -> dict:
    """
    Get statistics about species distribution.

    Args:
        species_list: List of species

    Returns:
        Dictionary with species statistics
    """
    if not species_list:
        return {
            "species_count": 0,
            "avg_species_size": 0,
            "max_species_size": 0,
            "min_species_size": 0,
            "species_sizes": [],
        }

    sizes = [s.size for s in species_list]
    return {
        "species_count": len(species_list),
        "avg_species_size": sum(sizes) / len(sizes),
        "max_species_size": max(sizes),
        "min_species_size": min(sizes),
        "species_sizes": sizes,
    }

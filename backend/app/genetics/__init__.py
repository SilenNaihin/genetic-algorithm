"""
Genetics module for evolutionary algorithms.

Provides selection, mutation, crossover, and population management.
"""

from .selection import (
    SelectionResult,
    truncation_selection,
    tournament_selection,
    get_elites,
    rank_based_probabilities,
    weighted_random_select,
    select_parents,
)

from .mutation import (
    MutationConfig,
    GenomeConstraints,
    generate_id,
    mutate_value,
    mutate_node,
    mutate_muscle,
    mutate_genome,
    mutate_neural_weights,
    mutate_neural_genome,
    add_node,
    remove_node,
    add_muscle,
)

from .crossover import (
    single_point_crossover,
    uniform_crossover,
    clone_genome,
    crossover_neural_weights,
    uniform_crossover_neural_weights,
    adapt_neural_topology,
    initialize_neural_genome,
)

from .population import (
    DecayConfig,
    PopulationStats,
    EvolutionConfig,
    calculate_decayed_rate,
    generate_random_genome,
    generate_population,
    get_population_stats,
    evolve_population,
)

from .speciation import (
    Species,
    DistanceFunction,
    assign_species,
    select_within_species,
    apply_speciation,
    get_species_stats,
)

__all__ = [
    # Selection
    'SelectionResult',
    'truncation_selection',
    'tournament_selection',
    'get_elites',
    'rank_based_probabilities',
    'weighted_random_select',
    'select_parents',
    # Mutation
    'MutationConfig',
    'GenomeConstraints',
    'generate_id',
    'mutate_value',
    'mutate_node',
    'mutate_muscle',
    'mutate_genome',
    'mutate_neural_weights',
    'mutate_neural_genome',
    'add_node',
    'remove_node',
    'add_muscle',
    # Crossover
    'single_point_crossover',
    'uniform_crossover',
    'clone_genome',
    'crossover_neural_weights',
    'uniform_crossover_neural_weights',
    'adapt_neural_topology',
    'initialize_neural_genome',
    # Population
    'DecayConfig',
    'PopulationStats',
    'EvolutionConfig',
    'calculate_decayed_rate',
    'generate_random_genome',
    'generate_population',
    'get_population_stats',
    'evolve_population',
    # Speciation
    'Species',
    'DistanceFunction',
    'assign_species',
    'select_within_species',
    'apply_speciation',
    'get_species_stats',
]

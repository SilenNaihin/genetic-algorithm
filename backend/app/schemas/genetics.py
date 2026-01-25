"""
API schemas for genetics operations.

Matches TypeScript MutationConfig, DecayConfig and evolution parameters.
"""

from typing import Literal

from pydantic import BaseModel, Field

from app.schemas.genome import CreatureGenome, GenomeConstraints


class MutationConfig(BaseModel):
    """Configuration for mutation operations."""

    # Body mutation
    rate: float = Field(default=0.3, ge=0.0, le=1.0)  # Per-gene mutation probability
    magnitude: float = Field(default=0.5, ge=0.0, le=1.0)  # Scale of mutation

    # Structural mutation
    structural_rate: float = Field(default=0.1, ge=0.0, le=1.0)  # Add/remove nodes/muscles

    # Neural mutation
    neural_rate: float = Field(default=0.1, ge=0.0, le=1.0)  # Per-weight mutation probability
    neural_magnitude: float = Field(default=0.3, ge=0.0, le=2.0)  # Std dev of perturbation


class DecayConfig(BaseModel):
    """Configuration for mutation rate decay over generations."""

    mode: Literal['off', 'linear', 'exponential'] = 'off'
    start_rate: float = Field(default=0.5, ge=0.0, le=1.0)
    end_rate: float = Field(default=0.1, ge=0.0, le=1.0)
    decay_generations: int = Field(default=100, ge=1, le=10000)


class SelectionConfig(BaseModel):
    """Configuration for selection algorithm."""

    method: Literal['truncation', 'tournament', 'rank'] = 'truncation'
    survival_rate: float = Field(default=0.5, ge=0.1, le=0.9)  # For truncation
    tournament_size: int = Field(default=3, ge=2, le=10)  # For tournament


class EvolutionConfig(BaseModel):
    """Complete evolution configuration."""

    # Population
    population_size: int = Field(default=100, ge=10, le=10000)
    elite_count: int = Field(default=5, ge=0, le=100)

    # Selection
    cull_percentage: float = Field(default=0.5, ge=0.1, le=0.9)
    selection: SelectionConfig = Field(default_factory=SelectionConfig)

    # Reproduction
    crossover_rate: float = Field(default=0.5, ge=0.0, le=1.0)
    use_mutation: bool = True
    use_crossover: bool = True

    # Mutation
    mutation: MutationConfig = Field(default_factory=MutationConfig)
    decay: DecayConfig = Field(default_factory=DecayConfig)

    # Constraints
    constraints: GenomeConstraints = Field(default_factory=GenomeConstraints)

    # Speciation (diversity protection)
    use_speciation: bool = False
    compatibility_threshold: float = Field(default=1.0, ge=0.1, le=3.0)
    min_species_size: int = Field(default=2, ge=1, le=20)

    # Neural network
    use_neural_net: bool = True
    neural_output_bias: float = Field(default=0.0, ge=-2.0, le=2.0)


class PopulationStats(BaseModel):
    """Statistics about a population."""

    generation: int
    best_fitness: float
    average_fitness: float
    worst_fitness: float
    avg_nodes: float
    avg_muscles: float


class EvolveRequest(BaseModel):
    """Request to evolve a population one generation."""

    genomes: list[CreatureGenome]
    fitness_scores: list[float]  # Fitness for each genome (same order)
    config: EvolutionConfig = Field(default_factory=EvolutionConfig)
    generation: int = 0  # Current generation (for decay calculations)


class EvolveResponse(BaseModel):
    """Response from evolution step."""

    genomes: list[CreatureGenome]
    generation: int
    stats: PopulationStats


class GeneratePopulationRequest(BaseModel):
    """Request to generate an initial population."""

    size: int = Field(default=100, ge=1, le=10000)
    constraints: GenomeConstraints = Field(default_factory=GenomeConstraints)
    use_neural_net: bool = True
    neural_hidden_size: int = Field(default=8, ge=1, le=64)
    neural_output_bias: float = Field(default=0.0, ge=-2.0, le=2.0)
    neural_mode: Literal['pure', 'hybrid'] = 'hybrid'
    time_encoding: Literal['none', 'sin', 'raw', 'cyclic', 'sin_raw'] = 'cyclic'
    use_proprioception: bool = False
    proprioception_inputs: Literal['strain', 'velocity', 'ground', 'all'] = 'all'


class GeneratePopulationResponse(BaseModel):
    """Response from population generation."""

    genomes: list[CreatureGenome]
    count: int

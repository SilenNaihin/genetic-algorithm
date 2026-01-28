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
    use_mutation: bool = False
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

    # NEAT (NeuroEvolution of Augmenting Topologies) - configured when neural_mode == 'neat'
    neat_add_connection_rate: float = Field(default=0.05, ge=0.0, le=1.0)  # Probability to add connection
    neat_add_node_rate: float = Field(default=0.03, ge=0.0, le=1.0)  # Probability to add node
    neat_enable_rate: float = Field(default=0.02, ge=0.0, le=1.0)  # Probability to re-enable connection
    neat_disable_rate: float = Field(default=0.01, ge=0.0, le=1.0)  # Probability to disable connection
    neat_excess_coefficient: float = Field(default=1.0, ge=0.0, le=10.0)  # Weight for excess genes in distance
    neat_disjoint_coefficient: float = Field(default=1.0, ge=0.0, le=10.0)  # Weight for disjoint genes in distance
    neat_weight_coefficient: float = Field(default=0.4, ge=0.0, le=10.0)  # Weight for weight differences in distance
    neat_max_hidden_nodes: int = Field(default=16, ge=1, le=128)  # Maximum hidden neurons to prevent bloat


class PopulationStats(BaseModel):
    """Statistics about a population."""

    generation: int
    best_fitness: float
    average_fitness: float
    worst_fitness: float
    avg_nodes: float
    avg_muscles: float


class InnovationCounterState(BaseModel):
    """State of innovation counters for NEAT (persisted across generations)."""

    next_connection: int = Field(default=0, ge=0)  # Next connection innovation number
    next_node: int = Field(default=0, ge=0)  # Next node innovation number


class EvolveRequest(BaseModel):
    """Request to evolve a population one generation."""

    genomes: list[CreatureGenome]
    fitness_scores: list[float]  # Fitness for each genome (same order)
    config: EvolutionConfig = Field(default_factory=EvolutionConfig)
    generation: int = 0  # Current generation (for decay calculations)
    # NEAT innovation counter state (optional, used to persist counter across generations)
    innovation_counter: InnovationCounterState | None = None


class EvolveResponse(BaseModel):
    """Response from evolution step."""

    genomes: list[CreatureGenome]
    generation: int
    stats: PopulationStats
    # NEAT innovation counter state (returned when neural_mode='neat')
    innovation_counter: InnovationCounterState | None = None


class GeneratePopulationRequest(BaseModel):
    """Request to generate an initial population."""

    size: int = Field(default=100, ge=1, le=10000)
    constraints: GenomeConstraints = Field(default_factory=GenomeConstraints)
    use_neural_net: bool = True
    neural_hidden_size: int = Field(default=8, ge=1, le=64)
    neural_output_bias: float = Field(default=0.0, ge=-2.0, le=2.0)
    neural_mode: Literal['pure', 'hybrid', 'neat'] = 'hybrid'
    bias_mode: Literal['none', 'node', 'bias_node'] = 'node'
    time_encoding: Literal['none', 'sin', 'raw', 'cyclic', 'sin_raw'] = 'cyclic'
    use_proprioception: bool = False
    proprioception_inputs: Literal['strain', 'velocity', 'ground', 'all'] = 'all'
    neat_initial_connectivity: Literal['full', 'sparse_inputs', 'sparse_outputs', 'none'] = 'full'


class GeneratePopulationResponse(BaseModel):
    """Response from population generation."""

    genomes: list[CreatureGenome]
    count: int
    # NEAT innovation counter state (returned when neural_mode='neat')
    innovation_counter: InnovationCounterState | None = None

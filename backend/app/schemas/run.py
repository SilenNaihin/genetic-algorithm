from datetime import datetime

from pydantic import BaseModel, Field

from app.schemas.genome import GenomeConstraints


class FitnessWeights(BaseModel):
    """Weights for fitness calculation."""

    progress_weight: float = Field(default=0.8, ge=0.0, le=1.0)
    collection_weight: float = Field(default=0.2, ge=0.0, le=1.0)
    proximity_weight: float = Field(default=0.0, ge=0.0, le=1.0)


class RunConfig(BaseModel):
    """Configuration for an evolution run."""

    # Population
    population_size: int = Field(default=20, ge=1, le=500)
    elite_count: int = Field(default=2, ge=0, le=50)

    # Simulation
    simulation_duration: float = Field(default=8.0, ge=1.0, le=60.0)
    pellet_count: int = Field(default=5, ge=0, le=50)
    ground_size: float = Field(default=30.0, ge=10.0, le=100.0)

    # Genetics
    mutation_rate: float = Field(default=0.15, ge=0.0, le=1.0)
    structural_mutation_rate: float = Field(default=0.1, ge=0.0, le=1.0)
    crossover_rate: float = Field(default=0.3, ge=0.0, le=1.0)
    use_mutation: bool = True
    use_crossover: bool = True

    # Constraints
    genome_constraints: GenomeConstraints = Field(default_factory=GenomeConstraints)

    # Fitness
    fitness_weights: FitnessWeights = Field(default_factory=FitnessWeights)
    max_allowed_frequency: float = Field(default=3.0, ge=1.0, le=10.0)


class RunCreate(BaseModel):
    """Request to create a new run."""

    name: str = Field(min_length=1, max_length=255)
    config: RunConfig = Field(default_factory=RunConfig)


class RunUpdate(BaseModel):
    """Request to update a run."""

    name: str | None = None
    status: str | None = None  # idle, running, paused, completed


class RunRead(BaseModel):
    """Response with run data."""

    id: str
    name: str
    config: RunConfig
    created_at: datetime
    updated_at: datetime
    generation_count: int
    current_generation: int
    best_fitness: float
    best_creature_id: str | None
    best_creature_generation: int | None
    longest_survivor_id: str | None
    longest_survivor_streak: int
    longest_survivor_generation: int | None
    status: str

    class Config:
        from_attributes = True

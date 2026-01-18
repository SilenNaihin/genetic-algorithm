from datetime import datetime

from pydantic import BaseModel


class GenerationStats(BaseModel):
    """Statistics for a generation."""

    best_fitness: float
    avg_fitness: float
    worst_fitness: float
    median_fitness: float
    creature_types: dict[str, int]  # node_count -> count


class GenerationCreate(BaseModel):
    """Request to create a new generation."""

    generation: int
    stats: GenerationStats
    simulation_time_ms: int = 0


class GenerationRead(BaseModel):
    """Response with generation data."""

    run_id: str
    generation: int
    created_at: datetime
    best_fitness: float
    avg_fitness: float
    worst_fitness: float
    median_fitness: float
    creature_types: dict[str, int]
    simulation_time_ms: int
    creature_count: int = 0

    class Config:
        from_attributes = True

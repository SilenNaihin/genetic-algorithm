from datetime import datetime

from pydantic import BaseModel, Field

from app.schemas.simulation import SimulationConfig


class RunCreate(BaseModel):
    """Request to create a new run."""

    name: str = Field(min_length=1, max_length=255)
    config: SimulationConfig = Field(default_factory=SimulationConfig)


class RunUpdate(BaseModel):
    """Request to update a run."""

    name: str | None = None
    status: str | None = None  # idle, running, paused, completed


class RunRead(BaseModel):
    """Response with run data."""

    id: str
    name: str
    config: dict  # Store as dict for flexibility, convert on frontend
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

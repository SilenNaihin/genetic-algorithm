from pydantic import BaseModel, Field

from app.schemas.genome import CreatureGenome


class SimulationConfig(BaseModel):
    """Configuration for running a simulation."""

    duration: float = Field(default=8.0, ge=1.0, le=60.0)
    frame_rate: int = Field(default=15, ge=1, le=60)
    record_frames: bool = True
    pellet_count: int = Field(default=5, ge=0, le=50)
    ground_size: float = Field(default=30.0, ge=10.0, le=100.0)
    max_allowed_frequency: float = Field(default=3.0, ge=1.0, le=10.0)


class SimulationResult(BaseModel):
    """Result from simulating a single creature."""

    genome_id: str
    fitness: float
    pellets_collected: int
    disqualified: bool
    disqualified_reason: str | None = None

    # Frame data (only if record_frames=True)
    frame_count: int = 0
    # Stored as compressed binary separately


class BatchSimulationRequest(BaseModel):
    """Request to simulate a batch of creatures."""

    genomes: list[CreatureGenome]
    config: SimulationConfig = Field(default_factory=SimulationConfig)


class BatchSimulationResponse(BaseModel):
    """Response from batch simulation."""

    results: list[SimulationResult]
    total_time_ms: int
    creatures_per_second: float

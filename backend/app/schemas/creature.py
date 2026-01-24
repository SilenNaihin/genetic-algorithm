from pydantic import BaseModel

from app.schemas.genome import CreatureGenome


class CreatureCreate(BaseModel):
    """Request to create a creature."""

    genome: CreatureGenome
    fitness: float
    pellets_collected: int = 0
    disqualified: bool = False
    disqualified_reason: str | None = None
    survival_streak: int = 0
    is_elite: bool = False


class CreatureRead(BaseModel):
    """
    Response with creature data (without frames).

    Combines identity from Creature with performance from CreaturePerformance.
    """

    id: str
    run_id: str
    generation: int  # Which generation this performance is from
    genome: CreatureGenome
    fitness: float
    pellets_collected: int
    disqualified: bool
    disqualified_reason: str | None
    survival_streak: int
    is_elite: bool
    parent_ids: list[str]
    has_frames: bool = False
    # Lifecycle fields
    birth_generation: int | None = None
    death_generation: int | None = None

    class Config:
        from_attributes = True


class FrameData(BaseModel):
    """Frame data for replay."""

    frame_count: int
    frame_rate: int
    # Frames as list of node positions per frame
    # Each frame: [[x,y,z,qx,qy,qz,qw], ...] for each node
    node_frames: list[list[list[float]]]
    # Pellet positions per frame (optional)
    pellet_frames: list[list[list[float]]] | None = None


class CreatureWithFrames(CreatureRead):
    """Creature with frame data for replay."""

    frames: FrameData | None = None


class PerformanceRead(BaseModel):
    """Per-generation performance data."""

    creature_id: str
    generation: int
    run_id: str
    fitness: float
    pellets_collected: int
    disqualified: bool
    disqualified_reason: str | None
    has_frames: bool = False

    class Config:
        from_attributes = True

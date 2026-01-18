from pydantic import BaseModel, Field


class Vector3(BaseModel):
    """3D vector for positions."""

    x: float
    y: float
    z: float


class NodeGene(BaseModel):
    """A node (sphere) in the creature's body."""

    id: str
    position: Vector3
    size: float = Field(ge=0.1, le=2.0)
    mass: float = Field(ge=0.1, le=5.0)
    friction: float = Field(ge=0.0, le=1.0)
    restitution: float = Field(ge=0.0, le=1.0)


class MuscleGene(BaseModel):
    """A muscle (spring) connecting two nodes."""

    id: str
    node_a: str  # Node ID
    node_b: str  # Node ID
    strength: float = Field(ge=0.1, le=10.0)
    frequency: float = Field(ge=0.1, le=5.0)
    phase: float = Field(ge=0.0, le=6.283185)  # 0 to 2*PI
    amplitude: float = Field(ge=0.0, le=1.0)
    rest_length: float = Field(ge=0.1, le=5.0)


class CreatureGenome(BaseModel):
    """Complete genome for a creature."""

    id: str
    generation: int = 0
    nodes: list[NodeGene]
    muscles: list[MuscleGene]

    # Evolution metadata
    parent_ids: list[str] = Field(default_factory=list)
    survival_streak: int = 0

    # Global modifiers
    global_frequency_multiplier: float = Field(default=1.0, ge=0.1, le=3.0)
    global_amplitude_multiplier: float = Field(default=1.0, ge=0.1, le=2.0)


class GenomeConstraints(BaseModel):
    """Constraints for genome generation."""

    min_nodes: int = Field(default=3, ge=2, le=20)
    max_nodes: int = Field(default=8, ge=2, le=20)
    min_muscles: int = Field(default=2, ge=1, le=50)
    max_muscles: int = Field(default=15, ge=1, le=50)
    spawn_radius: float = Field(default=1.5, ge=0.5, le=5.0)

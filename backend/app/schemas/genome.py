"""
API schemas for creature genomes.

Matches TypeScript CreatureGenome, NodeGene, MuscleGene interfaces.
Supports both camelCase (from frontend) and snake_case (Python convention).
"""

from typing import Literal

from pydantic import BaseModel, Field


class Vector3(BaseModel):
    """3D vector for positions and directions."""

    x: float
    y: float
    z: float


class NodeGene(BaseModel):
    """A node (sphere) in the creature's body."""

    id: str
    position: Vector3
    size: float = Field(default=0.5, ge=0.1, le=2.0)
    friction: float = Field(default=0.5, ge=0.0, le=1.0)

    class Config:
        # Allow both camelCase and snake_case
        populate_by_name = True


class MuscleGene(BaseModel):
    """
    A muscle (spring) connecting two nodes.

    Supports v1/v2 muscle modulation:
    - v1: Direction bias (muscles respond to pellet direction)
    - v2: Velocity sensing (proprioception - respond to movement)
    - v2: Distance awareness (respond to pellet distance)
    """

    id: str

    # Connection (supports both camelCase and snake_case)
    nodeA: str | None = Field(default=None, alias='node_a')
    nodeB: str | None = Field(default=None, alias='node_b')

    # Spring properties
    restLength: float = Field(default=1.0, ge=0.1, le=10.0, alias='rest_length')
    stiffness: float = Field(default=100.0, ge=1.0, le=1000.0)
    damping: float = Field(default=0.5, ge=0.0, le=10.0)

    # Oscillation
    frequency: float = Field(default=1.0, ge=0.1, le=5.0)
    amplitude: float = Field(default=0.3, ge=0.0, le=1.0)
    phase: float = Field(default=0.0, ge=0.0, le=6.283185)  # 0 to 2*PI

    # v1: Direction bias (muscle responds to pellet direction)
    directionBias: Vector3 | None = Field(default=None, alias='direction_bias')
    biasStrength: float = Field(default=0.0, ge=0.0, le=1.0, alias='bias_strength')

    # v2: Velocity sensing (proprioception)
    velocityBias: Vector3 | None = Field(default=None, alias='velocity_bias')
    velocityStrength: float = Field(default=0.0, ge=0.0, le=1.0, alias='velocity_strength')

    # v2: Distance awareness
    distanceBias: float = Field(default=0.0, ge=-1.0, le=1.0, alias='distance_bias')
    distanceStrength: float = Field(default=0.0, ge=0.0, le=1.0, alias='distance_strength')

    class Config:
        populate_by_name = True

    def model_post_init(self, __context) -> None:
        """Handle both camelCase and snake_case field names."""
        # If nodeA/nodeB are None but we have node_a/node_b from alias, use those
        if self.nodeA is None and hasattr(self, '__pydantic_private__'):
            # Values may come through alias
            pass


class NeuralGenome(BaseModel):
    """
    Neural network weights for creature control.

    Architecture: input -> hidden (tanh) -> output (tanh)
    Weights are flattened for efficient storage.
    """

    input_size: int = Field(default=8)  # 7 for pure mode, 8 for hybrid
    hidden_size: int = Field(default=8)
    output_size: int  # Number of muscles

    # Flattened weight matrices (row-major)
    weights_ih: list[float]  # [input_size * hidden_size]
    weights_ho: list[float]  # [hidden_size * output_size]

    # Biases
    biases_h: list[float]  # [hidden_size]
    biases_o: list[float]  # [output_size]


class CreatureGenome(BaseModel):
    """Complete genome for a creature."""

    id: str
    generation: int = 0
    survivalStreak: int = Field(default=0, alias='survival_streak')
    parentIds: list[str] = Field(default_factory=list, alias='parent_ids')

    nodes: list[NodeGene]
    muscles: list[MuscleGene]

    # Global modifiers
    globalFrequencyMultiplier: float = Field(
        default=1.0, ge=0.1, le=3.0, alias='global_frequency_multiplier'
    )

    # Controller type
    controllerType: Literal['oscillator', 'neural'] = Field(
        default='oscillator', alias='controller_type'
    )

    # Neural network (optional, used when controllerType='neural')
    neuralGenome: NeuralGenome | None = Field(default=None, alias='neural_genome')

    # Color (for visualization, optional)
    color: dict | None = None  # {h, s, l}

    class Config:
        populate_by_name = True


class GenomeConstraints(BaseModel):
    """Constraints for genome generation."""

    minNodes: int = Field(default=3, ge=2, le=20, alias='min_nodes')
    maxNodes: int = Field(default=8, ge=2, le=20, alias='max_nodes')
    minMuscles: int = Field(default=2, ge=1, le=50, alias='min_muscles')
    maxMuscles: int = Field(default=15, ge=1, le=50, alias='max_muscles')
    spawnRadius: float = Field(default=1.5, ge=0.5, le=5.0, alias='spawn_radius')
    minSize: float = Field(default=0.2, ge=0.1, le=1.0, alias='min_size')
    maxSize: float = Field(default=0.6, ge=0.1, le=2.0, alias='max_size')
    minStiffness: float = Field(default=50.0, ge=1.0, le=500.0, alias='min_stiffness')
    maxStiffness: float = Field(default=200.0, ge=1.0, le=1000.0, alias='max_stiffness')
    minFrequency: float = Field(default=0.5, ge=0.1, le=3.0, alias='min_frequency')
    maxFrequency: float = Field(default=2.0, ge=0.1, le=5.0, alias='max_frequency')
    maxAmplitude: float = Field(default=0.5, ge=0.1, le=1.0, alias='max_amplitude')

    class Config:
        populate_by_name = True

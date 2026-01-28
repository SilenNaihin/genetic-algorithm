"""
API schemas for simulation endpoints.

Matches the internal PyTorch simulation config (app/simulation/config.py)
while providing Pydantic validation for API requests.
"""

from typing import Any, Literal

from pydantic import BaseModel, Field, model_validator

from app.schemas.genome import CreatureGenome


class SimulationConfig(BaseModel):
    """
    Configuration for running a simulation.

    Matches TypeScript SimulationConfig interface.
    All fields have sensible defaults so clients can omit most of them.
    """

    # Physics
    gravity: float = Field(default=-9.8, ge=-30.0, le=-1.0)
    ground_friction: float = Field(default=0.5, ge=0.3, le=1.0)
    time_step: float = Field(default=1/30, ge=1/120, le=1/15)  # 15-120 FPS, default 30 FPS for speed
    simulation_duration: float = Field(default=20.0, ge=1.0, le=60.0)

    # Muscle constraints
    muscle_velocity_cap: float = Field(default=5.0, ge=0.1, le=20.0)  # Max muscle length change per second
    muscle_damping_multiplier: float = Field(default=1.0, ge=0.1, le=5.0)  # Global damping scale (higher = more resistance)
    max_extension_ratio: float = Field(default=2.0, ge=1.2, le=5.0)  # Max muscle stretch (2.0 = 50%-200% of rest length)

    # Evolution (not used in simulation, but included for parity)
    population_size: int = Field(default=100, ge=10, le=10000)
    cull_percentage: float = Field(default=0.5, ge=0.1, le=0.9)
    selection_method: Literal['truncation', 'tournament', 'rank', 'speciation'] = 'rank'
    tournament_size: int = Field(default=3, ge=2, le=10)
    mutation_rate: float = Field(default=0.2, ge=0.0, le=1.0)
    mutation_magnitude: float = Field(default=0.3, ge=0.0, le=1.0)
    crossover_rate: float = Field(default=0.5, ge=0.0, le=1.0)
    elite_count: int = Field(default=5, ge=0, le=100)
    use_crossover: bool = True

    # Creature constraints
    min_nodes: int = Field(default=3, ge=2, le=20)
    max_nodes: int = Field(default=8, ge=2, le=20)
    max_muscles: int = Field(default=15, ge=1, le=50)
    max_allowed_frequency: float = Field(default=3.0, ge=0.5, le=10.0)

    # Environment
    pellet_count: int = Field(default=3, ge=0, le=50)
    arena_size: float = Field(default=10.0, ge=5.0, le=100.0)

    # Fitness function weights
    fitness_pellet_points: float = Field(default=20.0, ge=0.0)  # On top of 80 progress = 100 total
    fitness_progress_max: float = Field(default=80.0, ge=0.0)
    fitness_distance_per_unit: float = Field(default=3.0, ge=0.0)
    fitness_distance_traveled_max: float = Field(default=20.0, ge=0.0)
    fitness_regression_penalty: float = Field(default=20.0, ge=0.0)  # Only after first collection

    # Neural network settings
    use_neural_net: bool = True
    neural_mode: Literal['hybrid', 'pure', 'neat'] = 'pure'
    bias_mode: Literal['none', 'node', 'bias_node'] = 'node'  # Bias implementation: none, per-node attribute, or bias input node
    time_encoding: Literal['none', 'cyclic', 'sin', 'raw', 'sin_raw'] = 'none'  # Time encoding (default: none for pure, cyclic recommended for hybrid)
    neural_hidden_size: int = Field(default=8, ge=1, le=64)
    neural_activation: str = Field(default='tanh')
    weight_mutation_rate: float = Field(default=0.2, ge=0.0, le=1.0)
    weight_mutation_magnitude: float = Field(default=0.05, ge=0.0, le=2.0)
    weight_mutation_decay: Literal['off', 'linear', 'exponential'] = 'linear'
    neural_output_bias: float = Field(default=-0.1, ge=-2.0, le=2.0)
    fitness_efficiency_penalty: float = Field(default=0.1, ge=0.0, le=5.0)
    neural_dead_zone: float = Field(default=0.1, ge=0.0, le=1.0)
    neural_update_hz: int = Field(default=10, ge=5, le=60)  # NN update frequency (Hz)
    output_smoothing_alpha: float = Field(default=0.15, ge=0.05, le=1.0)  # Exponential smoothing (1.0 = no smoothing)

    # Adaptive mutation
    use_adaptive_mutation: bool = False
    stagnation_threshold: int = Field(default=20, ge=5, le=100)
    adaptive_mutation_boost: float = Field(default=2.0, ge=1.1, le=5.0)
    max_adaptive_boost: float = Field(default=8.0, ge=2.0, le=32.0)
    improvement_threshold: float = Field(default=5.0, ge=1.0, le=50.0)

    # Crossover method for neural weights
    neural_crossover_method: Literal['interpolation', 'uniform', 'sbx'] = 'sbx'
    sbx_eta: float = Field(default=2.0, ge=0.5, le=5.0)

    # Fitness sharing (diversity maintenance)
    use_fitness_sharing: bool = False
    sharing_radius: float = Field(default=0.5, ge=0.1, le=2.0)

    # Speciation parameters (used when selection_method='speciation')
    compatibility_threshold: float = Field(default=1.0, ge=0.1, le=3.0)
    min_species_size: int = Field(default=2, ge=1, le=20)

    # NEAT (NeuroEvolution of Augmenting Topologies) - configured when neural_mode == 'neat'
    neat_initial_connectivity: Literal['full', 'sparse_inputs', 'sparse_outputs', 'none'] = 'full'  # Initial network connectivity
    neat_add_connection_rate: float = Field(default=0.05, ge=0.0, le=1.0)  # Probability to add connection
    neat_add_node_rate: float = Field(default=0.03, ge=0.0, le=1.0)  # Probability to add node
    neat_enable_rate: float = Field(default=0.02, ge=0.0, le=1.0)  # Probability to re-enable connection
    neat_disable_rate: float = Field(default=0.01, ge=0.0, le=1.0)  # Probability to disable connection
    neat_excess_coefficient: float = Field(default=1.0, ge=0.0, le=10.0)  # Weight for excess genes in distance
    neat_disjoint_coefficient: float = Field(default=1.0, ge=0.0, le=10.0)  # Weight for disjoint genes in distance
    neat_weight_coefficient: float = Field(default=0.4, ge=0.0, le=10.0)  # Weight for weight differences in distance
    neat_max_hidden_nodes: int = Field(default=16, ge=1, le=128)  # Maximum hidden neurons to prevent bloat

    # Proprioception (body-sensing inputs)
    use_proprioception: bool = False
    proprioception_inputs: Literal['strain', 'velocity', 'ground', 'all'] = 'all'

    # Disqualification thresholds
    position_threshold: float = Field(default=50.0, ge=10.0)
    height_threshold: float = Field(default=30.0, ge=5.0)

    # Internal settings
    pellet_collection_radius: float = Field(default=0.75, ge=0.1, le=5.0)
    max_pellet_distance: float = Field(default=20.0, ge=5.0, le=100.0)

    # Frame recording
    # frame_storage_mode: 'none' (default), 'all' (UI/--store), 'sparse' (--sparse-store: top 10 + bottom 10)
    frame_storage_mode: Literal['none', 'all', 'sparse'] = 'none'
    frame_rate: int = Field(default=15, ge=1, le=60)
    sparse_top_count: int = Field(default=10, ge=1, le=50)
    sparse_bottom_count: int = Field(default=10, ge=1, le=50)

    @model_validator(mode='before')
    @classmethod
    def migrate_and_enforce_neat_defaults(cls, data: Any) -> Any:
        """Migrate legacy fields and enforce NEAT defaults."""
        if isinstance(data, dict):
            # Check for legacy use_neat or useNEAT fields
            use_neat = data.pop('use_neat', None) or data.pop('useNEAT', None)
            if use_neat:
                data['neural_mode'] = 'neat'

            # Migrate legacy use_speciation to selection_method
            use_speciation = data.pop('use_speciation', None) or data.pop('useSpeciation', None)
            if use_speciation:
                data['selection_method'] = 'speciation'

            # ENFORCE NEAT defaults - these are REQUIRED for NEAT to work properly
            # Speciation protects structural innovations until weights adapt
            if data.get('neural_mode') == 'neat':
                data['selection_method'] = 'speciation'  # REQUIRED - without this, topology won't evolve
                data['use_fitness_sharing'] = False  # Redundant with speciation
                # Default to bias_node for NEAT (more faithful to original NEAT)
                if 'bias_mode' not in data:
                    data['bias_mode'] = 'bias_node'
        return data

    @property
    def record_frames(self) -> bool:
        """Backwards-compatible property: True if any frame storage is enabled."""
        return self.frame_storage_mode != 'none'

    class Config:
        extra = 'ignore'  # Ignore unknown fields for forward compatibility


class FitnessBreakdown(BaseModel):
    """Detailed breakdown of fitness components."""

    pellet_points: float = 0.0
    progress: float = 0.0
    distance_traveled: float = 0.0
    regression_penalty: float = 0.0
    efficiency_penalty: float = 0.0


class PelletResult(BaseModel):
    """Data about a pellet's position and collection state."""

    id: str
    position: dict  # {x, y, z}
    collected_at_frame: int | None = None
    spawned_at_frame: int
    initial_distance: float


class SimulationResult(BaseModel):
    """Result from simulating a single creature."""

    genome_id: str
    fitness: float
    pellets_collected: int
    disqualified: bool
    disqualified_reason: str | None = None

    # Fitness breakdown (optional, for detailed analysis)
    fitness_breakdown: FitnessBreakdown | None = None

    # Movement metrics
    net_displacement: float = 0.0
    distance_traveled: float = 0.0
    total_activation: float = 0.0  # For neural network efficiency

    # Frame data (only if record_frames=True)
    frame_count: int = 0
    frames: list | None = None  # Flattened frame data if requested

    # Pellet data (for replay visualization)
    pellets: list[PelletResult] | None = None

    # Fitness over time (for graphing actual fitness progression)
    fitness_over_time: list[float] | None = None

    # Neural network activations per frame (full forward pass data)
    # Only populated for neural controller creatures when frames are recorded
    # Each entry: { "inputs": [...], "hidden": [...], "outputs": [...] }
    activations_per_frame: list[dict] | None = None


class BatchSimulationRequest(BaseModel):
    """Request to simulate a batch of creatures."""

    genomes: list[CreatureGenome]
    config: SimulationConfig = Field(default_factory=SimulationConfig)


class BatchSimulationResponse(BaseModel):
    """Response from batch simulation."""

    results: list[SimulationResult]
    total_time_ms: int
    creatures_per_second: float

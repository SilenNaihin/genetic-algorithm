"""
Simulation configuration matching TypeScript SimulationConfig.

All configuration options for physics, evolution, fitness, and neural networks.
Both frontend and backend use snake_case field names.
"""

from dataclasses import dataclass, field
from typing import Literal


@dataclass
class SimulationConfig:
    """
    Configuration for simulation, matching TypeScript SimulationConfig exactly.
    """

    # Physics
    gravity: float = -9.8              # -9.8 to -30
    ground_friction: float = 0.5       # 0.3 to 1.0
    time_step: float = 1 / 30          # Physics timestep (30 FPS)
    simulation_duration: float = 20.0  # Seconds per generation

    # Evolution
    population_size: int = 100
    cull_percentage: float = 0.5       # Bottom 50% culled
    mutation_rate: float = 0.2         # Per-gene mutation rate
    mutation_magnitude: float = 0.3    # How much values change
    crossover_rate: float = 0.5        # Probability of crossover vs mutation
    elite_count: int = 5               # Deprecated - kept for compatibility
    use_crossover: bool = True

    # Creature constraints
    min_nodes: int = 3
    max_nodes: int = 8
    max_muscles: int = 15
    max_allowed_frequency: float = 3.0  # Max muscle frequency before disqualification

    # Environment
    pellet_count: int = 3              # Number of pellets per arena
    arena_size: float = 10.0           # Size of simulation arena

    # Fitness function
    fitness_pellet_points: float = 20.0        # Points per pellet (on top of 80 progress = 100 total)
    fitness_progress_max: float = 80.0         # Max points for progress toward pellet
    fitness_distance_per_unit: float = 3.0     # Points per unit traveled
    fitness_distance_traveled_max: float = 20.0 # Max points for distance traveled
    fitness_regression_penalty: float = 20.0   # Max penalty for moving away (after first collection)

    # Neural network settings
    use_neural_net: bool = True                # Enable neural network control
    neural_mode: Literal['hybrid', 'pure', 'neat'] = 'pure'  # How NN output is used
    neural_hidden_size: int = 8                # Neurons in hidden layer
    neural_activation: str = 'tanh'            # Activation function
    weight_mutation_rate: float = 0.2          # Probability each weight mutates
    weight_mutation_magnitude: float = 0.05    # Std dev of weight perturbation (small for high-dim)
    weight_mutation_decay: Literal['off', 'linear', 'exponential'] = 'linear'
    neural_output_bias: float = -0.1           # Initial output neuron bias (slight negative to require activation)
    fitness_efficiency_penalty: float = 0.1    # Penalty per unit of muscle activation
    neural_dead_zone: float = 0.1              # Dead zone threshold for pure mode
    time_encoding: Literal['none', 'cyclic', 'sin', 'raw', 'sin_raw'] = 'none'  # Time encoding
    use_proprioception: bool = False           # Enable body-sensing inputs
    proprioception_inputs: Literal['strain', 'velocity', 'ground', 'all'] = 'all'

    # Disqualification thresholds
    position_threshold: float = 50.0           # Max distance from origin
    height_threshold: float = 30.0             # Max height before disqualification

    # Internal
    pellet_collection_radius: float = 0.75     # Distance to collect pellet
    max_pellet_distance: float = 20.0          # For normalizing distance

    @classmethod
    def from_dict(cls, data: dict) -> "SimulationConfig":
        """
        Create config from dict (expects snake_case keys).
        """
        # Filter to only valid fields
        valid_fields = {f.name for f in cls.__dataclass_fields__.values()}
        filtered = {k: v for k, v in data.items() if k in valid_fields}

        return cls(**filtered)


# Default config instance
DEFAULT_CONFIG = SimulationConfig()

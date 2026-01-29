"""
Predefined configurations for NAS experiments.

Each config represents a specific hypothesis or search space.
All fields match SimulationConfig in backend/app/schemas/simulation.py
"""

from typing import Any


# Base config with ALL fields from SimulationConfig
# Fields marked CONSTANT should not be varied during NAS
BASE_CONFIG: dict[str, Any] = {
    # === PHYSICS (CONSTANT) ===
    'gravity': -9.8,
    'ground_friction': 0.5,
    'time_step': 1/30,  # 30 FPS physics
    'simulation_duration': 30.0,  # 30 seconds per user request

    # Muscle physics (CONSTANT)
    'muscle_velocity_cap': 5.0,
    'muscle_damping_multiplier': 1.0,
    'max_extension_ratio': 2.0,

    # === ENVIRONMENT (CONSTANT) ===
    'pellet_count': 3,
    'arena_size': 10.0,
    'pellet_collection_radius': 0.75,
    'max_pellet_distance': 20.0,

    # === FITNESS FUNCTION (CONSTANT) ===
    'fitness_pellet_points': 20.0,
    'fitness_progress_max': 80.0,
    'fitness_distance_per_unit': 3.0,
    'fitness_distance_traveled_max': 20.0,
    'fitness_regression_penalty': 20.0,
    'fitness_efficiency_penalty': 0.1,

    # Disqualification thresholds (CONSTANT)
    'position_threshold': 50.0,
    'height_threshold': 30.0,

    # === FRAME RECORDING (CONSTANT - disabled for speed) ===
    'frame_storage_mode': 'none',
    'frame_rate': 15,
    'sparse_top_count': 10,
    'sparse_bottom_count': 10,

    # === EVOLUTION PARAMETERS (VARIABLE) ===
    'population_size': 200,
    # NOTE: elite_count is defined in schema but NEVER USED in evolve_population
    # Selection is controlled by cull_percentage + selection_method
    'cull_percentage': 0.5,
    'selection_method': 'rank',
    'tournament_size': 3,
    'mutation_rate': 0.3,
    'mutation_magnitude': 0.3,
    'crossover_rate': 0.5,
    'use_crossover': True,

    # === NEURAL NETWORK (VARIABLE) ===
    'use_neural_net': True,
    'neural_mode': 'pure',
    'neural_hidden_size': 8,
    'neural_activation': 'tanh',
    'neural_output_bias': -0.1,
    'neural_dead_zone': 0.1,
    'neural_update_hz': 10,
    'output_smoothing_alpha': 0.15,
    'time_encoding': 'none',  # 'none' for pure, 'cyclic' for hybrid
    'bias_mode': 'node',

    # Neural weight mutation
    'weight_mutation_rate': 0.2,
    'weight_mutation_magnitude': 0.3,
    'weight_mutation_decay': 'linear',

    # Neural crossover
    'neural_crossover_method': 'sbx',
    'sbx_eta': 2.0,

    # === ADAPTIVE MUTATION (VARIABLE) ===
    'use_adaptive_mutation': False,
    'stagnation_threshold': 20,
    'adaptive_mutation_boost': 2.0,
    'max_adaptive_boost': 8.0,
    'improvement_threshold': 5.0,

    # === FITNESS SHARING (VARIABLE) ===
    'use_fitness_sharing': False,
    'sharing_radius': 0.5,

    # === SPECIATION (VARIABLE) ===
    'compatibility_threshold': 1.0,
    'min_species_size': 2,

    # === NEAT (VARIABLE - only when neural_mode='neat') ===
    'neat_initial_connectivity': 'full',
    'neat_add_connection_rate': 0.5,
    'neat_add_node_rate': 0.2,
    'neat_enable_rate': 0.02,
    'neat_disable_rate': 0.01,
    'neat_excess_coefficient': 1.0,
    'neat_disjoint_coefficient': 1.0,
    'neat_weight_coefficient': 0.4,
    'neat_max_hidden_nodes': 16,

    # === PROPRIOCEPTION (VARIABLE) ===
    'use_proprioception': False,
    'proprioception_inputs': 'all',

    # === CREATURE CONSTRAINTS (VARIABLE) ===
    'min_nodes': 3,
    'max_nodes': 8,
    'max_muscles': 15,
    'max_allowed_frequency': 3.0,
}


# =============================================================================
# NEAT CONFIGURATIONS
# =============================================================================

NEAT_BASELINE: dict[str, Any] = {
    **BASE_CONFIG,
    'neural_mode': 'neat',
    'selection_method': 'speciation',  # Auto-enforced for NEAT
    'bias_mode': 'bias_node',  # Original NEAT style
    'neat_initial_connectivity': 'full',
    'neat_add_connection_rate': 0.5,
    'neat_add_node_rate': 0.2,
    'neat_max_hidden_nodes': 16,
    'compatibility_threshold': 1.0,
    'use_fitness_sharing': False,  # Auto-disabled for NEAT
}

NEAT_SPARSE: dict[str, Any] = {
    **NEAT_BASELINE,
    'neat_initial_connectivity': 'sparse_inputs',
    'neat_add_connection_rate': 0.7,  # Higher to grow from sparse
    'neat_add_node_rate': 0.1,  # Lower - let connections grow first
}

NEAT_MINIMAL: dict[str, Any] = {
    **NEAT_BASELINE,
    'neat_initial_connectivity': 'none',
    'neat_add_connection_rate': 0.8,  # Very high - needs to build from scratch
    'neat_add_node_rate': 0.05,  # Very low initially
    'neat_max_hidden_nodes': 8,  # Keep small
}

NEAT_AGGRESSIVE: dict[str, Any] = {
    **NEAT_BASELINE,
    'neat_add_connection_rate': 0.7,
    'neat_add_node_rate': 0.4,  # More structural mutation
    'neat_max_hidden_nodes': 32,  # Allow larger networks
    'compatibility_threshold': 2.0,  # Looser speciation
}

NEAT_CONSERVATIVE: dict[str, Any] = {
    **NEAT_BASELINE,
    'neat_add_connection_rate': 0.3,
    'neat_add_node_rate': 0.1,
    'compatibility_threshold': 0.5,  # Tighter speciation
    'neat_max_hidden_nodes': 8,
}

NEAT_HIGH_MUTATION: dict[str, Any] = {
    **NEAT_BASELINE,
    'mutation_rate': 0.5,
    'weight_mutation_rate': 0.4,
    'weight_mutation_magnitude': 0.5,
}

NEAT_LOW_MUTATION: dict[str, Any] = {
    **NEAT_BASELINE,
    'mutation_rate': 0.15,
    'weight_mutation_rate': 0.1,
    'weight_mutation_magnitude': 0.1,
}


# =============================================================================
# PURE NEURAL CONFIGURATIONS (fixed topology)
# =============================================================================

PURE_BASELINE: dict[str, Any] = {
    **BASE_CONFIG,
    'neural_mode': 'pure',
    'neural_hidden_size': 8,
    'time_encoding': 'none',
}

PURE_LARGE: dict[str, Any] = {
    **PURE_BASELINE,
    'neural_hidden_size': 16,
}

PURE_SMALL: dict[str, Any] = {
    **PURE_BASELINE,
    'neural_hidden_size': 4,
}

PURE_HIGH_MUTATION: dict[str, Any] = {
    **PURE_BASELINE,
    'mutation_rate': 0.5,
    'weight_mutation_rate': 0.4,
    'weight_mutation_magnitude': 0.5,
}


# =============================================================================
# HYBRID CONFIGURATIONS (NN modulates oscillation)
# =============================================================================

HYBRID_BASELINE: dict[str, Any] = {
    **BASE_CONFIG,
    'neural_mode': 'hybrid',
    'time_encoding': 'cyclic',  # sin + cos for unique cycle position
    'neural_hidden_size': 8,
}

HYBRID_SIN: dict[str, Any] = {
    **HYBRID_BASELINE,
    'time_encoding': 'sin',
}


# =============================================================================
# POPULATION SIZE EXPERIMENTS
# =============================================================================

POP_SMALL: dict[str, Any] = {
    **NEAT_BASELINE,
    'population_size': 100,
    'elite_count': 3,
}

POP_MEDIUM: dict[str, Any] = {
    **NEAT_BASELINE,
    'population_size': 300,
    'elite_count': 8,
}

POP_LARGE: dict[str, Any] = {
    **NEAT_BASELINE,
    'population_size': 500,
    'elite_count': 12,
}


# =============================================================================
# SELECTION METHOD EXPERIMENTS
# =============================================================================

SELECT_TOURNAMENT: dict[str, Any] = {
    **PURE_BASELINE,
    'selection_method': 'tournament',
    'tournament_size': 3,
}

SELECT_TRUNCATION: dict[str, Any] = {
    **PURE_BASELINE,
    'selection_method': 'truncation',
}


# =============================================================================
# CONFIG REGISTRY
# =============================================================================

CONFIGS: dict[str, dict[str, Any]] = {
    # NEAT variants (primary focus)
    'neat_baseline': NEAT_BASELINE,
    'neat_sparse': NEAT_SPARSE,
    'neat_minimal': NEAT_MINIMAL,
    'neat_aggressive': NEAT_AGGRESSIVE,
    'neat_conservative': NEAT_CONSERVATIVE,
    'neat_high_mutation': NEAT_HIGH_MUTATION,
    'neat_low_mutation': NEAT_LOW_MUTATION,

    # Pure variants (secondary)
    'pure_baseline': PURE_BASELINE,
    'pure_large': PURE_LARGE,
    'pure_small': PURE_SMALL,
    'pure_high_mutation': PURE_HIGH_MUTATION,

    # Hybrid variants (tertiary)
    'hybrid_baseline': HYBRID_BASELINE,
    'hybrid_sin': HYBRID_SIN,

    # Population experiments
    'pop_small': POP_SMALL,
    'pop_medium': POP_MEDIUM,
    'pop_large': POP_LARGE,

    # Selection experiments
    'select_tournament': SELECT_TOURNAMENT,
    'select_truncation': SELECT_TRUNCATION,
}


def get_config(name: str) -> dict[str, Any]:
    """Get a config by name."""
    if name not in CONFIGS:
        available = ', '.join(sorted(CONFIGS.keys()))
        raise ValueError(f"Unknown config '{name}'. Available: {available}")
    return CONFIGS[name].copy()


def list_configs() -> list[str]:
    """List all available config names."""
    return list(CONFIGS.keys())


def create_config(base: str = 'neat_baseline', **overrides) -> dict[str, Any]:
    """Create a config from a base with overrides."""
    config = get_config(base)
    config.update(overrides)
    return config

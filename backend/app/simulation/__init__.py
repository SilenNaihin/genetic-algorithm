# PyTorch-based batched physics simulation
from app.simulation.tensors import CreatureBatch, creature_genomes_to_batch, get_center_of_mass
from app.simulation.config import SimulationConfig, DEFAULT_CONFIG
from app.simulation.physics import (
    # Basic physics
    compute_spring_forces,
    compute_gravity_forces,
    compute_oscillating_rest_lengths,
    apply_ground_collision,
    integrate_euler,
    physics_step,
    simulate,
    # Muscle modulation (v1/v2)
    compute_pellet_direction,
    compute_velocity_direction,
    compute_normalized_distance,
    compute_muscle_modulation,
    compute_modulated_rest_lengths,
    physics_step_modulated,
    simulate_with_pellets,
    # Neural network integration
    compute_neural_rest_lengths,
    physics_step_neural,
    simulate_with_neural,
    # Constants
    GRAVITY,
    TIME_STEP,
    MAX_PELLET_DISTANCE,
)
from app.simulation.fitness import (
    FitnessConfig,
    PelletBatch,
    FitnessState,
    calculate_creature_xz_radius,
    generate_pellet_positions,
    initialize_pellets,
    check_pellet_collisions,
    update_pellets,
    check_disqualifications,
    check_frequency_violations,
    initialize_fitness_state,
    update_fitness_state,
    calculate_fitness,
)

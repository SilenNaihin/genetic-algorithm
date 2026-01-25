# PyTorch batched neural network for creature control

from app.neural.network import (
    # Constants
    DEFAULT_OUTPUT_BIAS,
    NEURAL_INPUT_SIZE_BASE,
    # Config
    NeuralConfig,
    # Functions
    get_input_size,
    get_proprioception_input_count,
    calculate_weight_count,
    # Network class
    BatchedNeuralNetwork,
)

from app.neural.sensors import (
    gather_sensor_inputs_pure,
    gather_sensor_inputs_with_time,
    gather_sensor_inputs_hybrid,  # alias for gather_sensor_inputs_with_time
    gather_sensor_inputs,
    compute_pellet_direction_for_nn,
    compute_velocity_direction_for_nn,
    compute_normalized_distance_for_nn,
    # Proprioception
    compute_muscle_strain,
    compute_node_velocities,
    compute_ground_contact,
    gather_proprioception_inputs,
    get_proprioception_input_size,
    GROUND_CONTACT_THRESHOLD,
)

__all__ = [
    # Constants
    'DEFAULT_OUTPUT_BIAS',
    'NEURAL_INPUT_SIZE_BASE',
    'GROUND_CONTACT_THRESHOLD',
    # Config
    'NeuralConfig',
    # Functions
    'get_input_size',
    'get_proprioception_input_count',
    'calculate_weight_count',
    # Network
    'BatchedNeuralNetwork',
    # Sensors
    'gather_sensor_inputs_pure',
    'gather_sensor_inputs_with_time',
    'gather_sensor_inputs_hybrid',
    'gather_sensor_inputs',
    'compute_pellet_direction_for_nn',
    'compute_velocity_direction_for_nn',
    'compute_normalized_distance_for_nn',
    # Proprioception
    'compute_muscle_strain',
    'compute_node_velocities',
    'compute_ground_contact',
    'gather_proprioception_inputs',
    'get_proprioception_input_size',
]

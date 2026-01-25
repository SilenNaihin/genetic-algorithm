# PyTorch batched neural network for creature control

from app.neural.network import (
    # Constants
    DEFAULT_OUTPUT_BIAS,
    NEURAL_INPUT_SIZE_BASE,
    # Config
    NeuralConfig,
    # Functions
    get_input_size,
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
)

__all__ = [
    # Constants
    'DEFAULT_OUTPUT_BIAS',
    'NEURAL_INPUT_SIZE_BASE',
    # Config
    'NeuralConfig',
    # Functions
    'get_input_size',
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
]

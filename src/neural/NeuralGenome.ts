/**
 * Neural genome data structures and initialization.
 *
 * A neural genome stores the weights of a neural network as a flat array,
 * which can be evolved through genetic algorithms (mutation, crossover).
 */

import { ActivationType } from './activations';

/**
 * Neural network topology specification.
 */
export interface NeuralTopology {
  inputSize: number;   // Number of sensor inputs (8)
  hiddenSize: number;  // Number of hidden neurons
  outputSize: number;  // Number of outputs (one per muscle)
}

/**
 * Complete neural genome data stored with creature.
 */
export interface NeuralGenomeData {
  weights: number[];              // Flat array of all network weights
  topology: NeuralTopology;       // Network shape
  activation: ActivationType;     // Activation function
}

/**
 * Configuration for neural network evolution.
 */
export interface NeuralConfig {
  useNeuralNet: boolean;           // Enable neural network control
  neuralMode: 'hybrid' | 'pure';   // How NN output is used
  hiddenSize: number;              // Neurons in hidden layer
  activation: ActivationType;      // Activation function
  weightMutationRate: number;      // Probability each weight mutates
  weightMutationMagnitude: number; // Std dev of weight perturbation
  outputBias: number;              // Initial output neuron bias (-2 to 0)
}

/**
 * Default neural network configuration.
 */
export const DEFAULT_NEURAL_CONFIG: NeuralConfig = {
  useNeuralNet: false,
  neuralMode: 'hybrid',
  hiddenSize: 8,
  activation: 'tanh',
  weightMutationRate: 0.1,
  weightMutationMagnitude: 0.3,
  outputBias: 0.0
};

/**
 * Number of sensor inputs for creatures.
 *
 * Pure mode (7 inputs): NN has full control, no time phase needed
 * - pellet_dir_x, pellet_dir_y, pellet_dir_z (3)
 * - velocity_x, velocity_y, velocity_z (3)
 * - pellet_distance (1)
 *
 * Hybrid mode (8 inputs): NN modulates base oscillation, time phase helps sync
 * - All of the above + time_phase (1)
 */
export const NEURAL_INPUT_SIZE_PURE = 7;
export const NEURAL_INPUT_SIZE_HYBRID = 8;

/** @deprecated Use NEURAL_INPUT_SIZE_PURE or NEURAL_INPUT_SIZE_HYBRID */
export const NEURAL_INPUT_SIZE = 8;

/**
 * Get input size based on neural mode.
 */
export function getInputSizeForMode(mode: 'pure' | 'hybrid'): number {
  return mode === 'pure' ? NEURAL_INPUT_SIZE_PURE : NEURAL_INPUT_SIZE_HYBRID;
}

/**
 * Sensor input names for pure mode (for visualization).
 */
export const SENSOR_NAMES_PURE = [
  'pellet_dir_x',
  'pellet_dir_y',
  'pellet_dir_z',
  'velocity_x',
  'velocity_y',
  'velocity_z',
  'pellet_dist'
];

/**
 * Sensor input names for hybrid mode (for visualization).
 */
export const SENSOR_NAMES_HYBRID = [
  'pellet_dir_x',
  'pellet_dir_y',
  'pellet_dir_z',
  'velocity_x',
  'velocity_y',
  'velocity_z',
  'pellet_dist',
  'time_phase'
];

/** @deprecated Use SENSOR_NAMES_PURE or SENSOR_NAMES_HYBRID */
export const SENSOR_NAMES = SENSOR_NAMES_HYBRID;

/** Default bias for output neurons - neutral state */
const DEFAULT_OUTPUT_BIAS = 0.0;

/**
 * Create a new neural genome with GA-optimized initialized weights.
 * Generates random weights directly without NeuralNetwork class dependency.
 *
 * Weight initialization for genetic algorithms:
 * - Uniform random weights in [-0.5, 0.5] (simpler search space than Gaussian)
 * - Zero hidden biases
 * - Zero output biases (neutral starting state)
 *
 * @param numMuscles Number of output neurons (one per muscle)
 * @param config Neural network configuration
 * @returns Neural genome data
 */
export function initializeNeuralGenome(
  numMuscles: number,
  config: NeuralConfig = DEFAULT_NEURAL_CONFIG
): NeuralGenomeData {
  const inputSize = getInputSizeForMode(config.neuralMode);
  const hiddenSize = config.hiddenSize;
  const outputSize = numMuscles;

  const topology: NeuralTopology = {
    inputSize,
    hiddenSize,
    outputSize
  };

  // Generate weights as flat array in same order as NeuralNetwork:
  // [input->hidden weights, hidden biases, hidden->output weights, output biases]
  const weights: number[] = [];
  const weightRange = 0.5;

  // Input -> Hidden weights (inputSize * hiddenSize)
  for (let i = 0; i < inputSize * hiddenSize; i++) {
    weights.push((Math.random() - 0.5) * 2 * weightRange);
  }

  // Hidden biases (hiddenSize) - start at 0
  for (let i = 0; i < hiddenSize; i++) {
    weights.push(0);
  }

  // Hidden -> Output weights (hiddenSize * outputSize)
  for (let i = 0; i < hiddenSize * outputSize; i++) {
    weights.push((Math.random() - 0.5) * 2 * weightRange);
  }

  // Output biases (outputSize) - start at 0 (neutral)
  for (let i = 0; i < outputSize; i++) {
    weights.push(DEFAULT_OUTPUT_BIAS);
  }

  return {
    weights,
    topology,
    activation: config.activation
  };
}

/**
 * Clone a neural genome (deep copy).
 */
export function cloneNeuralGenome(data: NeuralGenomeData): NeuralGenomeData {
  return {
    weights: [...data.weights],
    topology: { ...data.topology },
    activation: data.activation
  };
}

/**
 * Calculate the number of weights for a given topology.
 */
export function calculateWeightCount(topology: NeuralTopology): number {
  const { inputSize, hiddenSize, outputSize } = topology;
  return (inputSize * hiddenSize) + hiddenSize +  // input->hidden + hidden bias
         (hiddenSize * outputSize) + outputSize;   // hidden->output + output bias
}

/**
 * Validate that a weight array matches the expected topology.
 */
export function validateNeuralGenome(data: NeuralGenomeData): boolean {
  const expectedCount = calculateWeightCount(data.topology);
  return data.weights.length === expectedCount;
}

/**
 * Gather sensor inputs from simulation state (pure mode - 7 inputs).
 * No time phase since NN has full control over muscle timing.
 */
export function gatherSensorInputsPure(
  pelletDirection: { x: number; y: number; z: number },
  velocityDirection: { x: number; y: number; z: number },
  normalizedDistance: number
): number[] {
  return [
    pelletDirection.x,
    pelletDirection.y,
    pelletDirection.z,
    velocityDirection.x,
    velocityDirection.y,
    velocityDirection.z,
    normalizedDistance
  ];
}

/**
 * Gather sensor inputs from simulation state (hybrid mode - 8 inputs).
 * Includes time phase to help NN sync with base oscillation.
 */
export function gatherSensorInputsHybrid(
  pelletDirection: { x: number; y: number; z: number },
  velocityDirection: { x: number; y: number; z: number },
  normalizedDistance: number,
  simulationTime: number
): number[] {
  return [
    pelletDirection.x,
    pelletDirection.y,
    pelletDirection.z,
    velocityDirection.x,
    velocityDirection.y,
    velocityDirection.z,
    normalizedDistance,
    Math.sin(simulationTime * Math.PI * 2)  // time phase for rhythmic behavior
  ];
}

/**
 * @deprecated Use gatherSensorInputsPure or gatherSensorInputsHybrid
 */
export function gatherSensorInputs(
  pelletDirection: { x: number; y: number; z: number },
  velocityDirection: { x: number; y: number; z: number },
  normalizedDistance: number,
  simulationTime: number
): number[] {
  return gatherSensorInputsHybrid(pelletDirection, velocityDirection, normalizedDistance, simulationTime);
}

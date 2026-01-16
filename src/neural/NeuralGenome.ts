/**
 * Neural genome data structures and initialization.
 *
 * A neural genome stores the weights of a neural network as a flat array,
 * which can be evolved through genetic algorithms (mutation, crossover).
 */

import { ActivationType } from './activations';
import { NeuralNetwork, NeuralNetworkConfig } from './NeuralNetwork';

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
  weightMutationMagnitude: 0.3
};

/**
 * Number of sensor inputs for creatures.
 * - pellet_dir_x, pellet_dir_y, pellet_dir_z (3)
 * - velocity_x, velocity_y, velocity_z (3)
 * - pellet_distance (1)
 * - time_phase (1)
 */
export const NEURAL_INPUT_SIZE = 8;

/**
 * Sensor input names (for visualization).
 */
export const SENSOR_NAMES = [
  'pellet_dir_x',
  'pellet_dir_y',
  'pellet_dir_z',
  'velocity_x',
  'velocity_y',
  'velocity_z',
  'pellet_dist',
  'time_phase'
];

/**
 * Create a new neural genome with Xavier-initialized weights.
 *
 * @param numMuscles Number of output neurons (one per muscle)
 * @param config Neural network configuration
 * @returns Neural genome data
 */
export function initializeNeuralGenome(
  numMuscles: number,
  config: NeuralConfig = DEFAULT_NEURAL_CONFIG
): NeuralGenomeData {
  const topology: NeuralTopology = {
    inputSize: NEURAL_INPUT_SIZE,
    hiddenSize: config.hiddenSize,
    outputSize: numMuscles
  };

  // Create network with Xavier initialization
  const networkConfig: NeuralNetworkConfig = {
    ...topology,
    activation: config.activation
  };
  const network = NeuralNetwork.initialize(networkConfig);

  return {
    weights: network.toWeights(),
    topology,
    activation: config.activation
  };
}

/**
 * Create a neural network from genome data.
 */
export function createNetworkFromGenome(data: NeuralGenomeData): NeuralNetwork {
  const config: NeuralNetworkConfig = {
    ...data.topology,
    activation: data.activation
  };
  return NeuralNetwork.fromWeights(data.weights, config);
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
 * Gather sensor inputs from simulation state.
 * This is the bridge between physics and neural network.
 */
export function gatherSensorInputs(
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

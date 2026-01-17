/**
 * Neural network module for neuroevolution.
 *
 * This module provides neural network control for creatures as an alternative
 * to the oscillator-based control system. Weights are evolved through genetic
 * algorithms (mutation, crossover), not trained with gradients.
 *
 * @see docs/NEURAL.md for full documentation
 */

// Activation functions
export type { ActivationType } from './activations';
export {
  tanh,
  relu,
  sigmoid,
  getActivation,
  applyActivation
} from './activations';

// Neural network class
export { NeuralNetwork, DEFAULT_OUTPUT_BIAS } from './NeuralNetwork';
export type { NeuralNetworkConfig, ForwardResult } from './NeuralNetwork';

// Genome data structures
export type {
  NeuralTopology,
  NeuralGenomeData,
  NeuralConfig
} from './NeuralGenome';
export {
  DEFAULT_NEURAL_CONFIG,
  NEURAL_INPUT_SIZE,
  NEURAL_INPUT_SIZE_PURE,
  NEURAL_INPUT_SIZE_HYBRID,
  SENSOR_NAMES,
  SENSOR_NAMES_PURE,
  SENSOR_NAMES_HYBRID,
  getInputSizeForMode,
  initializeNeuralGenome,
  createNetworkFromGenome,
  cloneNeuralGenome,
  calculateWeightCount,
  validateNeuralGenome,
  gatherSensorInputs,
  gatherSensorInputsPure,
  gatherSensorInputsHybrid
} from './NeuralGenome';

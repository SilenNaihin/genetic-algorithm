/**
 * Neural network module for neuroevolution.
 *
 * This module provides types and utilities for neural network-controlled creatures.
 * The actual neural network forward pass happens on the backend (PyTorch).
 * Frontend only needs:
 * - Types for genome data
 * - Weight initialization for preview creatures
 * - Activation functions for visualization fallback
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

// Genome data structures and utilities
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
  cloneNeuralGenome,
  calculateWeightCount,
  validateNeuralGenome,
  gatherSensorInputs,
  gatherSensorInputsPure,
  gatherSensorInputsHybrid
} from './NeuralGenome';

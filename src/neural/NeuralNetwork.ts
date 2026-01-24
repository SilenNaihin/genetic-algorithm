/**
 * Simple feedforward neural network for neuroevolution.
 *
 * Architecture: Input -> Hidden (tanh) -> Output (tanh)
 *
 * Weights are evolved through genetic algorithms, NOT trained with gradients.
 * Initialization is optimized for GA evolution:
 * - Small uniform weights (not Gaussian - no gradient assumptions)
 * - Zero output biases (neutral state, inside dead zone in pure mode)
 *
 * This class provides:
 * - Forward pass computation
 * - Weight serialization (to/from flat array for evolution)
 * - Activation recording (for visualization)
 */

import { ActivationType, getActivation } from './activations';

/** Default bias for output neurons (0 = neutral, inside dead zone) */
export const DEFAULT_OUTPUT_BIAS = 0.0;

export interface NeuralNetworkConfig {
  inputSize: number;    // Number of sensor inputs (7 for pure mode, 8 for hybrid)
  hiddenSize: number;   // Number of hidden neurons (default: 8)
  outputSize: number;   // Number of outputs (one per muscle)
  activation: ActivationType;  // Activation function (default: 'tanh')
}

export interface ForwardResult {
  inputs: number[];
  hidden: number[];
  outputs: number[];
}

/**
 * Feedforward neural network with one hidden layer.
 * Designed for neuroevolution - weights can be exported/imported as flat arrays.
 */
export class NeuralNetwork {
  private config: NeuralNetworkConfig;

  // Weights stored as 2D arrays for clarity
  // weightsIH[i][j] = weight from input i to hidden j
  private weightsIH: number[][];
  private biasH: number[];

  // weightsHO[i][j] = weight from hidden i to output j
  private weightsHO: number[][];
  private biasO: number[];

  // Activation function
  private activate: (x: number) => number;

  // Last forward pass result (for visualization)
  private lastResult: ForwardResult | null = null;

  constructor(config: NeuralNetworkConfig) {
    this.config = config;
    this.activate = getActivation(config.activation);

    // Initialize weight matrices with zeros (will be set by fromWeights or initialize)
    this.weightsIH = Array(config.inputSize).fill(null)
      .map(() => Array(config.hiddenSize).fill(0));
    this.biasH = Array(config.hiddenSize).fill(0);

    this.weightsHO = Array(config.hiddenSize).fill(null)
      .map(() => Array(config.outputSize).fill(0));
    this.biasO = Array(config.outputSize).fill(0);
  }

  /**
   * Create a new network with GA-optimized initialization.
   *
   * Unlike gradient-based training which uses Xavier/Gaussian init,
   * GA evolution benefits from:
   * - Small uniform weights (simpler search space, no gradient assumptions)
   * - Zero output biases (muscles start neutral, inside dead zone)
   */
  static initialize(config: NeuralNetworkConfig): NeuralNetwork {
    const nn = new NeuralNetwork(config);

    // Uniform initialization for input -> hidden
    // Range [-0.5, 0.5] gives reasonable starting activations
    const weightRange = 0.5;
    for (let i = 0; i < config.inputSize; i++) {
      for (let j = 0; j < config.hiddenSize; j++) {
        nn.weightsIH[i][j] = (Math.random() - 0.5) * 2 * weightRange;
      }
    }
    // Hidden biases start at 0 (no preference)
    nn.biasH.fill(0);

    // Uniform initialization for hidden -> output
    for (let i = 0; i < config.hiddenSize; i++) {
      for (let j = 0; j < config.outputSize; j++) {
        nn.weightsHO[i][j] = (Math.random() - 0.5) * 2 * weightRange;
      }
    }
    // Output biases start at zero (neutral, inside dead zone in pure mode)
    // Muscles are inactive until evolution learns to produce outputs outside dead zone
    nn.biasO.fill(DEFAULT_OUTPUT_BIAS);

    return nn;
  }

  /**
   * Create a network from a flat weight array.
   * Used for evolution - genomes store weights as flat arrays.
   */
  static fromWeights(weights: number[], config: NeuralNetworkConfig): NeuralNetwork {
    const nn = new NeuralNetwork(config);
    const expected = NeuralNetwork.weightCount(config);

    if (weights.length !== expected) {
      throw new Error(`Expected ${expected} weights, got ${weights.length}`);
    }

    let idx = 0;

    // Input -> Hidden weights
    for (let i = 0; i < config.inputSize; i++) {
      for (let j = 0; j < config.hiddenSize; j++) {
        nn.weightsIH[i][j] = weights[idx++];
      }
    }

    // Hidden biases
    for (let j = 0; j < config.hiddenSize; j++) {
      nn.biasH[j] = weights[idx++];
    }

    // Hidden -> Output weights
    for (let i = 0; i < config.hiddenSize; i++) {
      for (let j = 0; j < config.outputSize; j++) {
        nn.weightsHO[i][j] = weights[idx++];
      }
    }

    // Output biases
    for (let j = 0; j < config.outputSize; j++) {
      nn.biasO[j] = weights[idx++];
    }

    return nn;
  }

  /**
   * Export weights to a flat array for evolution.
   */
  toWeights(): number[] {
    const weights: number[] = [];

    // Input -> Hidden weights
    for (let i = 0; i < this.config.inputSize; i++) {
      for (let j = 0; j < this.config.hiddenSize; j++) {
        weights.push(this.weightsIH[i][j]);
      }
    }

    // Hidden biases
    for (let j = 0; j < this.config.hiddenSize; j++) {
      weights.push(this.biasH[j]);
    }

    // Hidden -> Output weights
    for (let i = 0; i < this.config.hiddenSize; i++) {
      for (let j = 0; j < this.config.outputSize; j++) {
        weights.push(this.weightsHO[i][j]);
      }
    }

    // Output biases
    for (let j = 0; j < this.config.outputSize; j++) {
      weights.push(this.biasO[j]);
    }

    return weights;
  }

  /**
   * Calculate total number of weights for a given config.
   */
  static weightCount(config: NeuralNetworkConfig): number {
    const { inputSize, hiddenSize, outputSize } = config;
    return (inputSize * hiddenSize) + hiddenSize +  // input->hidden + hidden bias
           (hiddenSize * outputSize) + outputSize;   // hidden->output + output bias
  }

  /**
   * Forward pass through the network.
   * Returns all layer activations for visualization.
   */
  forward(inputs: number[]): ForwardResult {
    if (inputs.length !== this.config.inputSize) {
      throw new Error(`Expected ${this.config.inputSize} inputs, got ${inputs.length}`);
    }

    // Hidden layer: h = activation(W_ih * x + b_h)
    const hidden: number[] = new Array(this.config.hiddenSize);
    for (let j = 0; j < this.config.hiddenSize; j++) {
      let sum = this.biasH[j];
      for (let i = 0; i < this.config.inputSize; i++) {
        sum += inputs[i] * this.weightsIH[i][j];
      }
      hidden[j] = this.activate(sum);
    }

    // Output layer: y = activation(W_ho * h + b_o)
    const outputs: number[] = new Array(this.config.outputSize);
    for (let j = 0; j < this.config.outputSize; j++) {
      let sum = this.biasO[j];
      for (let i = 0; i < this.config.hiddenSize; i++) {
        sum += hidden[i] * this.weightsHO[i][j];
      }
      // Always use tanh for output to keep in [-1, 1] range
      outputs[j] = Math.tanh(sum);
    }

    this.lastResult = { inputs: [...inputs], hidden, outputs };
    return this.lastResult;
  }

  /**
   * Convenience method: just get outputs (for simulation).
   */
  predict(inputs: number[]): number[] {
    return this.forward(inputs).outputs;
  }

  /**
   * Get the last forward pass result (for visualization).
   */
  getLastResult(): ForwardResult | null {
    return this.lastResult;
  }

  /**
   * Get network configuration.
   */
  getConfig(): NeuralNetworkConfig {
    return { ...this.config };
  }

  /**
   * Get weight matrices (for visualization).
   */
  getWeightMatrices(): {
    weightsIH: number[][];
    biasH: number[];
    weightsHO: number[][];
    biasO: number[];
  } {
    return {
      weightsIH: this.weightsIH.map(row => [...row]),
      biasH: [...this.biasH],
      weightsHO: this.weightsHO.map(row => [...row]),
      biasO: [...this.biasO]
    };
  }
}

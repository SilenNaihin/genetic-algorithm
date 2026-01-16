/**
 * Activation functions for neural networks.
 * Used in neuroevolution - weights are evolved, not learned via gradients.
 */

export type ActivationType = 'tanh' | 'relu' | 'sigmoid';

/**
 * Hyperbolic tangent activation.
 * Output range: [-1, 1]
 * Good for: muscle modulation (naturally bounded)
 */
export function tanh(x: number): number {
  return Math.tanh(x);
}

/**
 * Rectified Linear Unit activation.
 * Output range: [0, +inf)
 * Good for: hidden layers, sparse activations
 */
export function relu(x: number): number {
  return Math.max(0, x);
}

/**
 * Sigmoid activation.
 * Output range: [0, 1]
 * Good for: probability-like outputs
 */
export function sigmoid(x: number): number {
  // Clip to prevent overflow
  const clipped = Math.max(-500, Math.min(500, x));
  return 1 / (1 + Math.exp(-clipped));
}

/**
 * Get activation function by name.
 */
export function getActivation(type: ActivationType): (x: number) => number {
  switch (type) {
    case 'tanh':
      return tanh;
    case 'relu':
      return relu;
    case 'sigmoid':
      return sigmoid;
    default:
      return tanh;
  }
}

/**
 * Apply activation to an array of values.
 */
export function applyActivation(values: number[], type: ActivationType): number[] {
  const fn = getActivation(type);
  return values.map(fn);
}

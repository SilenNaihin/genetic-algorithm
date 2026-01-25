/**
 * Neural Network Visualizer
 *
 * Renders a neural network graph showing:
 * - Input nodes (sensor inputs)
 * - Hidden layer nodes
 * - Output nodes (muscle activations)
 * - Connection weights (color and thickness)
 * - Node activations (color intensity)
 *
 * Note: This is pure UI code. Weights are read directly from genome data
 * (which comes from the backend). No neural network computation happens here.
 */

import type { NeuralGenomeData, NeuralTopology } from '../neural';
import type { FrameActivations } from '../types';
import { getActivation } from '../neural';

/**
 * Weight matrices extracted from flat genome weights array.
 * Used for visualization only - no computation.
 */
interface WeightMatrices {
  weightsIH: number[][];  // input -> hidden
  biasH: number[];
  weightsHO: number[][];  // hidden -> output
  biasO: number[];
}

/** Forward pass result for visualization */
interface ForwardResult {
  inputs: number[];
  hidden: number[];
  outputs: number[];
}

/**
 * Extract weight matrices from flat genome weights array.
 * This is the inverse of NeuralNetwork.toWeights() - pure data transformation.
 */
function extractWeightMatrices(weights: number[], topology: NeuralTopology): WeightMatrices {
  const { inputSize, hiddenSize, outputSize } = topology;
  let idx = 0;

  // Input -> Hidden weights
  const weightsIH: number[][] = [];
  for (let i = 0; i < inputSize; i++) {
    weightsIH[i] = [];
    for (let j = 0; j < hiddenSize; j++) {
      weightsIH[i][j] = weights[idx++];
    }
  }

  // Hidden biases
  const biasH: number[] = [];
  for (let j = 0; j < hiddenSize; j++) {
    biasH[j] = weights[idx++];
  }

  // Hidden -> Output weights
  const weightsHO: number[][] = [];
  for (let i = 0; i < hiddenSize; i++) {
    weightsHO[i] = [];
    for (let j = 0; j < outputSize; j++) {
      weightsHO[i][j] = weights[idx++];
    }
  }

  // Output biases
  const biasO: number[] = [];
  for (let j = 0; j < outputSize; j++) {
    biasO[j] = weights[idx++];
  }

  return { weightsIH, biasH, weightsHO, biasO };
}

/**
 * Simple forward pass for visualization fallback.
 * Used when stored activations from simulation aren't available.
 */
function forwardPass(
  inputs: number[],
  weights: WeightMatrices,
  topology: NeuralTopology,
  activation: (x: number) => number
): ForwardResult {
  const { hiddenSize, outputSize } = topology;
  const { weightsIH, biasH, weightsHO, biasO } = weights;

  // Hidden layer
  const hidden: number[] = new Array(hiddenSize);
  for (let j = 0; j < hiddenSize; j++) {
    let sum = biasH[j];
    for (let i = 0; i < inputs.length; i++) {
      sum += inputs[i] * weightsIH[i][j];
    }
    hidden[j] = activation(sum);
  }

  // Output layer (always tanh for [-1, 1] range)
  const outputs: number[] = new Array(outputSize);
  for (let j = 0; j < outputSize; j++) {
    let sum = biasO[j];
    for (let i = 0; i < hiddenSize; i++) {
      sum += hidden[i] * weightsHO[i][j];
    }
    outputs[j] = Math.tanh(sum);
  }

  return { inputs: [...inputs], hidden, outputs };
}

export interface NeuralVisualizerOptions {
  width: number;
  height: number;
  showLabels: boolean;
  showWeights: boolean;
}

const DEFAULT_OPTIONS: NeuralVisualizerOptions = {
  width: 280,
  height: 200,
  showLabels: true,
  showWeights: true
};

type TimeEncoding = 'none' | 'cyclic' | 'sin' | 'raw' | 'sin_raw';

export class NeuralVisualizer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private options: NeuralVisualizerOptions;
  private weights: WeightMatrices | null = null;
  private topology: NeuralTopology | null = null;
  private activationFn: ((x: number) => number) | null = null;
  private lastResult: ForwardResult | null = null;
  private muscleNames: string[] = [];
  private timeEncoding: TimeEncoding = 'none';

  constructor(container: HTMLElement, options: Partial<NeuralVisualizerOptions> = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options };

    // Handle high DPI displays
    const dpr = window.devicePixelRatio || 1;

    this.canvas = document.createElement('canvas');
    // Set actual canvas size (scaled for DPR)
    this.canvas.width = this.options.width * dpr;
    this.canvas.height = this.options.height * dpr;
    // Set display size via CSS
    this.canvas.style.width = `${this.options.width}px`;
    this.canvas.style.height = `${this.options.height}px`;
    this.canvas.style.borderRadius = '8px';
    this.canvas.style.background = 'var(--bg-tertiary)';

    this.ctx = this.canvas.getContext('2d')!;
    // Scale context to account for DPR
    this.ctx.scale(dpr, dpr);
    container.appendChild(this.canvas);
  }

  /**
   * Set the neural genome to visualize.
   * Extracts weights directly from genome data - no NeuralNetwork class needed.
   */
  setGenome(genome: NeuralGenomeData | undefined, muscleNames: string[]): void {
    if (!genome) {
      this.weights = null;
      this.topology = null;
      this.activationFn = null;
      this.muscleNames = [];
      this.render();
      return;
    }

    // Extract weights directly from genome data
    this.weights = extractWeightMatrices(genome.weights, genome.topology);
    this.topology = genome.topology;
    this.activationFn = getActivation(genome.activation);
    this.muscleNames = muscleNames;
    this.lastResult = null;
    this.render();
  }

  /**
   * Update activations with new sensor inputs (recomputes forward pass locally).
   * @deprecated Use setStoredActivations for accurate display from simulation.
   * This fallback is only used when stored activations aren't available.
   */
  updateActivations(sensorInputs: number[]): void {
    if (!this.weights || !this.topology || !this.activationFn) return;

    try {
      this.lastResult = forwardPass(sensorInputs, this.weights, this.topology, this.activationFn);
      this.render();
    } catch (e) {
      console.warn('Failed to compute neural activations:', e);
    }
  }

  /**
   * Set stored activations directly from simulation data.
   * This displays the actual activations from simulation rather than recomputing.
   * @param activations - Full activation data from simulation (inputs, hidden, outputs)
   *                      Can also accept legacy format (just outputs array)
   */
  setStoredActivations(activations: FrameActivations | number[]): void {
    if (!this.topology) return;

    // Handle both new format (FrameActivations) and legacy format (outputs array)
    if (Array.isArray(activations)) {
      // Legacy format: just outputs array
      this.lastResult = {
        inputs: new Array(this.topology.inputSize).fill(0),
        hidden: new Array(this.topology.hiddenSize).fill(0),
        outputs: activations.slice(0, this.topology.outputSize),
      };
    } else {
      // New format: full FrameActivations with inputs, hidden, outputs
      this.lastResult = {
        inputs: activations.inputs || new Array(this.topology.inputSize).fill(0),
        hidden: activations.hidden || new Array(this.topology.hiddenSize).fill(0),
        outputs: (activations.outputs || []).slice(0, this.topology.outputSize),
      };
    }
    this.render();
  }

  /**
   * Set time encoding for accurate input labels.
   * Call this after setGenome to update labels.
   */
  setTimeEncoding(encoding: TimeEncoding): void {
    this.timeEncoding = encoding;
    this.render();
  }

  /**
   * Clear the visualization
   */
  clear(): void {
    this.weights = null;
    this.topology = null;
    this.activationFn = null;
    this.lastResult = null;
    this.timeEncoding = 'none';
    this.render();
  }

  /**
   * Render the neural network visualization
   */
  private render(): void {
    const { width, height } = this.options;
    const ctx = this.ctx;

    // Clear canvas
    ctx.fillStyle = '#1a1a24';
    ctx.fillRect(0, 0, width, height);

    if (!this.topology) {
      // Show placeholder
      ctx.fillStyle = '#666';
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('No neural network', width / 2, height / 2);
      return;
    }

    const { inputSize, hiddenSize, outputSize } = this.topology;

    // Layout parameters
    const padding = 20;
    const labelWidth = this.options.showLabels ? 50 : 0;
    const layerX = [
      padding + labelWidth,  // Input layer
      width / 2,             // Hidden layer
      width - padding - labelWidth  // Output layer
    ];

    // Calculate node positions
    const inputY = this.getNodeYPositions(inputSize, height, padding);
    const hiddenY = this.getNodeYPositions(hiddenSize, height, padding);
    const outputY = this.getNodeYPositions(outputSize, height, padding);

    // Get activations (or use defaults if not computed yet)
    const inputs = this.lastResult?.inputs || new Array(inputSize).fill(0);
    const hidden = this.lastResult?.hidden || new Array(hiddenSize).fill(0);
    const outputs = this.lastResult?.outputs || new Array(outputSize).fill(0);

    // Draw connections first (so they're behind nodes)
    // Draw if we have weights (to show actual connection strengths) or topology (for structure)
    if (this.options.showWeights && (this.weights || this.topology)) {
      this.drawConnections(ctx, layerX, inputY, hiddenY, outputY, inputs, hidden, outputs);
    }

    // Draw nodes
    this.drawNodes(ctx, layerX[0], inputY, inputs, 'input');
    this.drawNodes(ctx, layerX[1], hiddenY, hidden, 'hidden');
    this.drawNodes(ctx, layerX[2], outputY, outputs, 'output');

    // Draw labels
    if (this.options.showLabels) {
      this.drawLabels(ctx, layerX, inputY, outputY, outputs);
    }
  }

  private getNodeYPositions(count: number, height: number, padding: number): number[] {
    const available = height - padding * 2;
    const spacing = available / (count + 1);
    const positions: number[] = [];
    for (let i = 0; i < count; i++) {
      positions.push(padding + spacing * (i + 1));
    }
    return positions;
  }

  private drawConnections(
    ctx: CanvasRenderingContext2D,
    layerX: number[],
    inputY: number[],
    hiddenY: number[],
    outputY: number[],
    inputs: number[],
    hidden: number[],
    _outputs: number[]
  ): void {
    const weights = this.weights;

    // Draw input -> hidden connections with signal flow
    for (let i = 0; i < inputY.length; i++) {
      for (let h = 0; h < hiddenY.length; h++) {
        const weight = weights?.weightsIH[i]?.[h] ?? 0;
        const inputVal = inputs[i] || 0;
        // Signal = input activation × weight
        const signal = inputVal * weight;
        this.drawSignalConnection(ctx, layerX[0], inputY[i], layerX[1], hiddenY[h], weight, signal);
      }
    }

    // Draw hidden -> output connections with signal flow
    for (let h = 0; h < hiddenY.length; h++) {
      for (let o = 0; o < outputY.length; o++) {
        const weight = weights?.weightsHO[h]?.[o] ?? 0;
        const hiddenVal = hidden[h] || 0;
        // Signal = hidden activation × weight
        const signal = hiddenVal * weight;
        this.drawSignalConnection(ctx, layerX[1], hiddenY[h], layerX[2], outputY[o], weight, signal);
      }
    }
  }

  /**
   * Draw a connection line showing actual signal flow.
   * Signal = activation × weight, showing what's actually contributing to outputs.
   *
   * - Positive signal (positive contribution): cyan/green
   * - Negative signal (inhibitory): red/orange
   * - Signal magnitude determines brightness and thickness
   * - Inactive connections (near-zero signal) are dimmed
   */
  private drawSignalConnection(
    ctx: CanvasRenderingContext2D,
    x1: number, y1: number,
    x2: number, y2: number,
    weight: number,
    signal: number
  ): void {
    const weightMag = Math.abs(weight);
    const signalMag = Math.abs(signal);
    const isPositiveSignal = signal >= 0;

    // Skip very weak weights to reduce visual noise
    if (weightMag < 0.03) return;

    // Normalize signal (typically in [-2, 2] range after activation × weight)
    const normalizedSignal = Math.min(signalMag / 1.0, 1);

    // Normalize weight for base line width
    const normalizedWeight = Math.min(weightMag / 1.5, 1);

    // Color based on signal direction (what's actually contributing)
    // Positive signal: cyan/green (excitatory)
    // Negative signal: red/orange (inhibitory)
    // Near-zero signal: gray (inactive)
    let hue: number;
    let saturation: number;
    let lightness: number;

    if (signalMag < 0.02) {
      // Near-zero signal - show as dim gray (inactive)
      hue = 0;
      saturation = 0;
      lightness = 25 + normalizedWeight * 15;
    } else if (isPositiveSignal) {
      // Positive signal - cyan to green (excitatory)
      hue = 160;
      saturation = 50 + normalizedSignal * 40;
      lightness = 35 + normalizedSignal * 30;
    } else {
      // Negative signal - red to orange (inhibitory)
      hue = 10;
      saturation = 50 + normalizedSignal * 40;
      lightness = 35 + normalizedSignal * 30;
    }

    // Alpha: active signals are more visible
    const alpha = signalMag < 0.02
      ? 0.15 + normalizedWeight * 0.2  // Inactive: show weight structure dimly
      : 0.3 + normalizedSignal * 0.6;   // Active: brighten with signal

    // Line width: base on weight, boost when active
    const baseWidth = 0.5 + normalizedWeight * 1.5;
    const lineWidth = signalMag < 0.02
      ? baseWidth
      : baseWidth + normalizedSignal * 1.5;

    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.strokeStyle = `hsla(${hue}, ${saturation}%, ${lightness}%, ${alpha})`;
    ctx.lineWidth = lineWidth;
    ctx.stroke();
  }

  private drawNodes(
    ctx: CanvasRenderingContext2D,
    x: number,
    yPositions: number[],
    activations: number[],
    _layer: 'input' | 'hidden' | 'output'
  ): void {
    const nodeRadius = 6;

    for (let i = 0; i < yPositions.length; i++) {
      const y = yPositions[i];
      const activation = activations[i] || 0;

      // Node fill color based on activation sign and magnitude
      // Positive: green/cyan, Negative: red/orange, Zero: gray
      const magnitude = Math.abs(activation);
      let hue: number;
      let saturation: number;
      let lightness: number;

      if (magnitude < 0.05) {
        // Near zero - neutral gray
        hue = 0;
        saturation = 0;
        lightness = 40;
      } else if (activation > 0) {
        // Positive - green to cyan
        hue = 140;
        saturation = 60 + magnitude * 30;
        lightness = 35 + magnitude * 25;
      } else {
        // Negative - red to orange
        hue = 15;
        saturation = 60 + magnitude * 30;
        lightness = 35 + magnitude * 25;
      }

      // Draw node with slight glow for active nodes
      if (magnitude > 0.3) {
        ctx.beginPath();
        ctx.arc(x, y, nodeRadius + 2, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${hue}, ${saturation}%, ${lightness}%, 0.3)`;
        ctx.fill();
      }

      // Main node
      ctx.beginPath();
      ctx.arc(x, y, nodeRadius, 0, Math.PI * 2);
      ctx.fillStyle = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
      ctx.fill();
      ctx.strokeStyle = '#555';
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  }

  private drawLabels(
    ctx: CanvasRenderingContext2D,
    layerX: number[],
    inputY: number[],
    outputY: number[],
    outputs: number[]
  ): void {
    // Use pixel-aligned coordinates for crisp text
    const pixelAlign = (n: number) => Math.round(n) + 0.5;

    // Crisp font rendering
    ctx.textBaseline = 'middle';
    ctx.font = '9px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.fillStyle = '#888';

    // Input labels (abbreviated sensor names) - based on time encoding
    const baseNames = ['dir_x', 'dir_y', 'dir_z', 'vel_x', 'vel_y', 'vel_z', 'dist'];
    let shortNames: string[];
    switch (this.timeEncoding) {
      case 'none':
        shortNames = baseNames;
        break;
      case 'sin':
        shortNames = [...baseNames, 't_sin'];
        break;
      case 'raw':
        shortNames = [...baseNames, 't_raw'];
        break;
      case 'cyclic':
        shortNames = [...baseNames, 't_sin', 't_cos'];
        break;
      case 'sin_raw':
        shortNames = [...baseNames, 't_sin', 't_raw'];
        break;
      default:
        // Fallback based on input size if encoding not set
        const inputSize = this.topology?.inputSize || 7;
        shortNames = inputSize <= 7
          ? baseNames
          : inputSize === 8
            ? [...baseNames, 'time']
            : [...baseNames, 't_1', 't_2'];
    }
    ctx.textAlign = 'right';
    for (let i = 0; i < inputY.length && i < shortNames.length; i++) {
      ctx.fillText(shortNames[i], pixelAlign(layerX[0] - 10), pixelAlign(inputY[i]));
    }

    // Output labels: muscle ID and activation value with color coding
    ctx.textAlign = 'left';
    ctx.font = '9px ui-monospace, monospace';
    for (let i = 0; i < outputY.length; i++) {
      const muscleId = this.muscleNames[i] || `M${i}`;
      const activation = outputs[i] || 0;

      // Muscle ID
      ctx.fillStyle = '#999';
      ctx.fillText(muscleId, pixelAlign(layerX[2] + 10), pixelAlign(outputY[i]));

      // Activation value - color coded
      const actMag = Math.abs(activation);
      if (actMag < 0.1) {
        ctx.fillStyle = '#555';
      } else if (activation > 0) {
        ctx.fillStyle = `hsl(140, 60%, ${45 + actMag * 20}%)`;
      } else {
        ctx.fillStyle = `hsl(15, 60%, ${45 + actMag * 20}%)`;
      }
      ctx.fillText(activation.toFixed(2), pixelAlign(layerX[2] + 32), pixelAlign(outputY[i]));
    }

    // Layer titles
    ctx.fillStyle = '#aaa';
    ctx.font = '10px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText('Input', pixelAlign(layerX[0]), 4);
    ctx.fillText('Hidden', pixelAlign(layerX[1]), 4);
    ctx.fillText('Output', pixelAlign(layerX[2]), 4);
  }

  /**
   * Resize the visualizer
   */
  resize(width: number, height: number): void {
    const dpr = window.devicePixelRatio || 1;
    this.options.width = width;
    this.options.height = height;
    this.canvas.width = width * dpr;
    this.canvas.height = height * dpr;
    this.canvas.style.width = `${width}px`;
    this.canvas.style.height = `${height}px`;
    // Reset and rescale context after resize
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.ctx.scale(dpr, dpr);
    this.render();
  }

  /**
   * Get the canvas element
   */
  getCanvas(): HTMLCanvasElement {
    return this.canvas;
  }

  /**
   * Dispose of resources
   */
  dispose(): void {
    this.canvas.remove();
  }
}

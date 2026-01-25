/**
 * Neural Network Visualizer
 *
 * Renders a neural network graph showing:
 * - Input nodes at TOP
 * - Hidden layer nodes in MIDDLE
 * - Output nodes at BOTTOM
 * - Connection weights (color and thickness)
 * - Node activations (color intensity)
 * - Dynamic node sizing based on layer sizes
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
  outputs_raw?: number[];  // Pre-dead-zone outputs (pure mode only)
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
  showWeights: boolean;
}

const DEFAULT_OPTIONS: NeuralVisualizerOptions = {
  width: 800,
  height: 200,
  showWeights: true
};

type TimeEncoding = 'none' | 'cyclic' | 'sin' | 'raw' | 'sin_raw';
type ProprioceptionInputs = 'strain' | 'velocity' | 'ground' | 'all';

interface ProprioceptionConfig {
  enabled: boolean;
  inputs: ProprioceptionInputs;
  numMuscles: number;  // Actual muscle count for this creature
  numNodes: number;    // Actual node count for this creature
}

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
  private proprioception: ProprioceptionConfig = { enabled: false, inputs: 'all', numMuscles: 0, numNodes: 0 };
  // Note: deadZone display is now handled by comparing raw vs post-dead-zone values

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
    this.canvas.style.background = '#1a1a24';

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
   * @param activations - Full activation data from simulation (inputs, hidden, outputs, outputs_raw?)
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
      // New format: full FrameActivations with inputs, hidden, outputs, outputs_raw
      this.lastResult = {
        inputs: activations.inputs || new Array(this.topology.inputSize).fill(0),
        hidden: activations.hidden || new Array(this.topology.hiddenSize).fill(0),
        outputs: (activations.outputs || []).slice(0, this.topology.outputSize),
        // Include raw outputs if available (pure mode only) - used for visualization
        outputs_raw: activations.outputs_raw?.slice(0, this.topology.outputSize),
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
   * Set proprioception config for accurate input labels.
   * Call this after setGenome to update labels.
   */
  setProprioception(config: ProprioceptionConfig): void {
    this.proprioception = config;
    this.render();
  }

  /**
   * Set dead zone threshold for output node coloring.
   * @deprecated Dead zone display is now handled by comparing raw vs post-dead-zone values
   */
  setDeadZone(_deadZone: number): void {
    // No longer needed - dead zone display uses raw vs post-dead-zone comparison
  }

  /**
   * Get non-padded input labels and their indices.
   * Filters out padded inputs (those ending with *).
   */
  private getNonPaddedInputs(): { labels: string[]; indices: number[] } {
    const allLabels = this.getInputLabels();
    const labels: string[] = [];
    const indices: number[] = [];

    for (let i = 0; i < allLabels.length; i++) {
      if (!allLabels[i].endsWith('*')) {
        labels.push(allLabels[i]);
        indices.push(i);
      }
    }

    return { labels, indices };
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
    this.proprioception = { enabled: false, inputs: 'all', numMuscles: 0, numNodes: 0 };
    this.render();
  }

  /**
   * Get the actual input size based on config.
   * When proprioception is enabled, always return the full input count (56),
   * not the stored activations length which may be smaller.
   */
  getActualInputSize(): number {
    // Proprioception takes priority - always show full input count when enabled
    if (this.proprioception.enabled) {
      return this.getInputLabels().length;
    }
    // Otherwise use stored activations or topology
    if (this.lastResult?.inputs && this.lastResult.inputs.length > 0) {
      return this.lastResult.inputs.length;
    }
    return this.topology?.inputSize || 7;
  }

  /**
   * Render the neural network visualization (VERTICAL layout: inputs TOP, outputs BOTTOM)
   * Only shows non-padded inputs (filters out inputs ending with *).
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
      ctx.textBaseline = 'middle';
      ctx.fillText('No neural network', width / 2, height / 2);
      return;
    }

    const { hiddenSize, outputSize } = this.topology;

    // Get non-padded inputs only (filter out padded inputs ending with *)
    const { labels: inputLabels, indices: inputIndices } = this.getNonPaddedInputs();
    const displayInputSize = inputLabels.length;

    // Vertical layout: Y positions for layers (with more space for labels)
    const topPadding = 35;
    const bottomPadding = 45;
    const layerY = [
      topPadding,                       // Input layer (TOP)
      height / 2,                       // Hidden layer (MIDDLE)
      height - bottomPadding            // Output layer (BOTTOM)
    ];

    // Calculate X positions for each layer's nodes
    const sidePadding = 8;
    const inputX = this.getNodeXPositions(displayInputSize, width, sidePadding);
    const hiddenX = this.getNodeXPositions(hiddenSize, width, sidePadding);
    const outputX = this.getNodeXPositions(outputSize, width, sidePadding);

    // Get activations (or use defaults if not computed yet)
    // For inputs, only get non-padded activations
    const allInputs = this.lastResult?.inputs || new Array(this.getActualInputSize()).fill(0);
    const inputs = inputIndices.map(i => allInputs[i] || 0);
    const hidden = this.lastResult?.hidden || new Array(hiddenSize).fill(0);
    const outputs = this.lastResult?.outputs || new Array(outputSize).fill(0);
    // Raw outputs (pre-dead-zone) for visualization - use these for coloring
    const outputsRaw = this.lastResult?.outputs_raw || outputs;

    // Calculate dynamic node radius based on max layer size
    const maxLayerSize = Math.max(displayInputSize, hiddenSize, outputSize);
    const nodeRadius = this.calculateNodeRadius(maxLayerSize, width, sidePadding);

    // Draw connections first (so they're behind nodes)
    // Only draw connections for non-padded inputs
    if (this.options.showWeights && (this.weights || this.topology)) {
      this.drawConnectionsFiltered(ctx, layerY, inputX, hiddenX, outputX, inputs, hidden, outputs, inputIndices);
    }

    // Get labels for outputs
    const outputLabels = this.muscleNames.length > 0
      ? this.muscleNames.map(name => `M${name}`)
      : Array.from({ length: outputSize }, (_, i) => `O${i + 1}`);

    // Draw nodes with labels
    this.drawNodesWithLabels(ctx, layerY[0], inputX, inputs, nodeRadius, inputLabels, 'top');
    this.drawNodes(ctx, layerY[1], hiddenX, hidden, nodeRadius);
    // Pass both raw outputs (for coloring) and post-dead-zone outputs (for display)
    this.drawOutputNodesWithLabels(ctx, layerY[2], outputX, outputsRaw, outputs, nodeRadius, outputLabels);

    // Draw layer labels on the left
    ctx.fillStyle = '#666';
    ctx.font = '10px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(`In (${displayInputSize})`, 5, layerY[0]);
    ctx.fillText(`H (${hiddenSize})`, 5, layerY[1]);
    ctx.fillText(`Out (${outputSize})`, 5, layerY[2]);
  }

  /**
   * Calculate dynamic node radius based on layer size
   */
  private calculateNodeRadius(maxNodes: number, width: number, padding: number): number {
    const availableWidth = width - padding * 2;
    // Max spacing per node
    const maxSpacing = availableWidth / (maxNodes + 1);
    // Node radius should be at most 40% of spacing, capped between 3 and 12
    const radius = Math.min(12, Math.max(3, maxSpacing * 0.35));
    return radius;
  }

  /**
   * Get X positions for nodes in a horizontal row
   */
  private getNodeXPositions(count: number, width: number, padding: number): number[] {
    const available = width - padding * 2;
    const spacing = available / (count + 1);
    const positions: number[] = [];
    for (let i = 0; i < count; i++) {
      positions.push(padding + spacing * (i + 1));
    }
    return positions;
  }

  /**
   * Draw a connection line showing actual signal flow.
   * Signal = activation × weight, showing what's actually contributing to outputs.
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

    // Color based on signal direction
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
      ? 0.1 + normalizedWeight * 0.15
      : 0.2 + normalizedSignal * 0.5;

    // Line width: base on weight, boost when active
    const baseWidth = 0.3 + normalizedWeight * 1.0;
    const lineWidth = signalMag < 0.02
      ? baseWidth
      : baseWidth + normalizedSignal * 1.0;

    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.strokeStyle = `hsla(${hue}, ${saturation}%, ${lightness}%, ${alpha})`;
    ctx.lineWidth = lineWidth;
    ctx.stroke();
  }

  /**
   * Draw connections for filtered (non-padded) inputs only.
   * Uses inputIndices to map display positions to original weight indices.
   */
  private drawConnectionsFiltered(
    ctx: CanvasRenderingContext2D,
    layerY: number[],
    inputX: number[],
    hiddenX: number[],
    outputX: number[],
    inputs: number[],
    hidden: number[],
    _outputs: number[],
    inputIndices: number[]
  ): void {
    const weights = this.weights;
    const storedInputSize = this.topology?.inputSize || 7;

    // Draw input -> hidden connections with signal flow
    // inputIndices maps display position to original index for weight lookup
    for (let displayIdx = 0; displayIdx < inputX.length; displayIdx++) {
      const originalIdx = inputIndices[displayIdx];
      for (let h = 0; h < hiddenX.length; h++) {
        // Only use weights if within stored topology
        const weight = originalIdx < storedInputSize ? (weights?.weightsIH[originalIdx]?.[h] ?? 0) : 0;
        const inputVal = inputs[displayIdx] || 0;
        const signal = inputVal * weight;
        this.drawSignalConnection(ctx, inputX[displayIdx], layerY[0], hiddenX[h], layerY[1], weight, signal);
      }
    }

    // Draw hidden -> output connections with signal flow
    for (let h = 0; h < hiddenX.length; h++) {
      for (let o = 0; o < outputX.length; o++) {
        const weight = weights?.weightsHO[h]?.[o] ?? 0;
        const hiddenVal = hidden[h] || 0;
        const signal = hiddenVal * weight;
        this.drawSignalConnection(ctx, hiddenX[h], layerY[1], outputX[o], layerY[2], weight, signal);
      }
    }
  }

  private drawNodes(
    ctx: CanvasRenderingContext2D,
    y: number,
    xPositions: number[],
    activations: number[],
    nodeRadius: number
  ): void {
    for (let i = 0; i < xPositions.length; i++) {
      const x = xPositions[i];
      const activation = activations[i] || 0;
      this.drawSingleNode(ctx, x, y, activation, nodeRadius);
    }
  }

  private drawNodesWithLabels(
    ctx: CanvasRenderingContext2D,
    y: number,
    xPositions: number[],
    activations: number[],
    nodeRadius: number,
    labels: string[],
    labelPosition: 'top' | 'bottom'
  ): void {
    // Calculate font size based on spacing (slightly larger than before)
    const spacing = xPositions.length > 1 ? xPositions[1] - xPositions[0] : 50;
    const fontSize = Math.min(9, Math.max(6, spacing * 0.4));

    for (let i = 0; i < xPositions.length; i++) {
      const x = xPositions[i];
      const activation = activations[i] || 0;
      const label = labels[i] || `${i}`;

      // Draw the node
      this.drawSingleNode(ctx, x, y, activation, nodeRadius);

      // Draw combined "label value" on one line (e.g., "M1-2 0.45")
      ctx.save();
      ctx.font = `${fontSize}px -apple-system, BlinkMacSystemFont, monospace`;

      // Truncate label if too long
      const shortLabel = label.length > 6 ? label.slice(0, 6) : label;

      // Fixed-width number format: always include sign placeholder
      // This prevents jitter when values go negative
      const absValue = Math.abs(activation).toFixed(2);
      const sign = activation < 0 ? '-' : ' '; // Space for positive to maintain width
      const valueStr = sign + absValue;

      // Position text above or below node
      const textY = labelPosition === 'top'
        ? y - nodeRadius - 3
        : y + nodeRadius + 3 + fontSize;

      ctx.textBaseline = labelPosition === 'top' ? 'bottom' : 'top';

      // Draw label in gray, then value in color
      const labelWidth = ctx.measureText(shortLabel + ' ').width;
      const totalWidth = ctx.measureText(shortLabel + ' ' + valueStr).width;
      const startX = x - totalWidth / 2;

      // Label part (gray)
      ctx.fillStyle = '#aaa';
      ctx.textAlign = 'left';
      ctx.fillText(shortLabel + ' ', startX, textY);

      // Value part (colored by sign)
      ctx.fillStyle = activation >= 0 ? '#6ee7b7' : '#fca5a5';
      ctx.fillText(valueStr, startX + labelWidth, textY);

      ctx.restore();
    }
  }

  /**
   * Draw output nodes showing raw NN values.
   * Uses raw activations for coloring (pre-dead-zone) to show true NN output.
   * @param rawActivations - Pre-dead-zone values (what NN computed)
   * @param postDeadZoneActivations - Post-dead-zone values (what was applied to physics)
   */
  private drawOutputNodesWithLabels(
    ctx: CanvasRenderingContext2D,
    y: number,
    xPositions: number[],
    rawActivations: number[],
    postDeadZoneActivations: number[],
    nodeRadius: number,
    labels: string[]
  ): void {
    const spacing = xPositions.length > 1 ? xPositions[1] - xPositions[0] : 50;
    const fontSize = Math.min(9, Math.max(6, spacing * 0.4));

    for (let i = 0; i < xPositions.length; i++) {
      const x = xPositions[i];
      const rawValue = rawActivations[i] || 0;
      const postDeadZoneValue = postDeadZoneActivations[i] || 0;
      const label = labels[i] || `${i}`;

      // Draw the node - gray if dead zone zeroed it, otherwise show raw color
      const wasZeroedByDeadZone = Math.abs(rawValue) > 0.001 && Math.abs(postDeadZoneValue) < 0.001;
      this.drawOutputNode(ctx, x, y, rawValue, nodeRadius, wasZeroedByDeadZone);

      // Draw combined "label value" on one line - show RAW value
      ctx.save();
      ctx.font = `${fontSize}px -apple-system, BlinkMacSystemFont, monospace`;

      const shortLabel = label.length > 6 ? label.slice(0, 6) : label;
      const absValue = Math.abs(rawValue).toFixed(2);
      const sign = rawValue < 0 ? '-' : ' ';
      const valueStr = sign + absValue;

      const textY = y + nodeRadius + 3 + fontSize;
      ctx.textBaseline = 'top';

      const labelWidth = ctx.measureText(shortLabel + ' ').width;
      const totalWidth = ctx.measureText(shortLabel + ' ' + valueStr).width;
      const startX = x - totalWidth / 2;

      // Label part (gray)
      ctx.fillStyle = '#aaa';
      ctx.textAlign = 'left';
      ctx.fillText(shortLabel + ' ', startX, textY);

      // Value part - gray if in dead zone, otherwise colored by sign
      if (wasZeroedByDeadZone) {
        ctx.fillStyle = '#666';
      } else {
        ctx.fillStyle = rawValue > 0 ? '#6ee7b7' : rawValue < 0 ? '#fca5a5' : '#666';
      }
      ctx.fillText(valueStr, startX + labelWidth, textY);

      ctx.restore();
    }
  }

  /**
   * Draw a single output node showing raw NN activation.
   * Colors based on raw value (pre-dead-zone) to show true NN output.
   * If inDeadZone is true, shows gray to indicate the output was suppressed.
   */
  private drawOutputNode(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    rawActivation: number,
    nodeRadius: number,
    inDeadZone: boolean = false
  ): void {
    const magnitude = Math.abs(rawActivation);
    // Normalize magnitude (values are in [-1, 1] range typically)
    const normalizedMag = Math.min(magnitude, 1);

    let hue: number;
    let saturation: number;
    let lightness: number;

    if (inDeadZone) {
      // Dead zone suppressed this output - show muted gray
      hue = 0;
      saturation = 0;
      lightness = 35;
    } else if (magnitude < 0.01) {
      // Near zero - neutral gray
      hue = 0;
      saturation = 0;
      lightness = 40;
    } else if (rawActivation > 0) {
      // Positive - green
      hue = 140;
      saturation = 50 + normalizedMag * 40;
      lightness = 35 + normalizedMag * 25;
    } else {
      // Negative - red
      hue = 15;
      saturation = 50 + normalizedMag * 40;
      lightness = 35 + normalizedMag * 25;
    }

    // Draw node with slight glow for strongly active nodes
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
    ctx.strokeStyle = '#444';
    ctx.lineWidth = 0.5;
    ctx.stroke();
  }

  private drawSingleNode(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    activation: number,
    nodeRadius: number
  ): void {
    // Node fill color based on activation sign and magnitude
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
    ctx.strokeStyle = '#444';
    ctx.lineWidth = 0.5;
    ctx.stroke();
  }

  /**
   * Generate input labels based on time encoding and proprioception config.
   * Uses descriptive names like "M1_strain" for muscle 1 strain.
   */
  getInputLabels(): string[] {
    // Base sensor names (always present)
    const baseNames = ['dir_x', 'dir_y', 'dir_z', 'vel_x', 'vel_y', 'vel_z', 'dist'];
    let labels = [...baseNames];

    // Add time encoding inputs
    switch (this.timeEncoding) {
      case 'sin':
        labels.push('t_sin');
        break;
      case 'raw':
        labels.push('t_raw');
        break;
      case 'cyclic':
        labels.push('t_sin', 't_cos');
        break;
      case 'sin_raw':
        labels.push('t_sin', 't_raw');
        break;
      // 'none' adds nothing
    }

    // Add proprioception inputs if enabled
    if (this.proprioception.enabled) {
      const { inputs, numMuscles, numNodes } = this.proprioception;

      // Strain inputs (1 per muscle) - how stretched/compressed each muscle is
      if (inputs === 'strain' || inputs === 'all') {
        for (let i = 0; i < numMuscles; i++) {
          const muscleName = this.muscleNames[i] || `M${i + 1}`;
          labels.push(`${muscleName}_str`);
        }
        // Pad to MAX_MUSCLES=15 for tensor batching (masked to 0)
        for (let i = numMuscles; i < 15; i++) {
          labels.push(`M${i + 1}_str*`);
        }
      }

      // Velocity inputs (3 per node: x, y, z) - how fast each node is moving
      if (inputs === 'velocity' || inputs === 'all') {
        for (let i = 0; i < numNodes; i++) {
          labels.push(`N${i + 1}_vx`, `N${i + 1}_vy`, `N${i + 1}_vz`);
        }
        // Pad to MAX_NODES=8 for tensor batching
        for (let i = numNodes; i < 8; i++) {
          labels.push(`N${i + 1}_vx*`, `N${i + 1}_vy*`, `N${i + 1}_vz*`);
        }
      }

      // Ground contact inputs (1 per node) - is each node touching ground
      if (inputs === 'ground' || inputs === 'all') {
        for (let i = 0; i < numNodes; i++) {
          labels.push(`N${i + 1}_gnd`);
        }
        // Pad to MAX_NODES=8 for tensor batching
        for (let i = numNodes; i < 8; i++) {
          labels.push(`N${i + 1}_gnd*`);
        }
      }
    }

    return labels;
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

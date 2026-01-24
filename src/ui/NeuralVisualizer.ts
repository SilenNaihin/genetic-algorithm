/**
 * Neural Network Visualizer
 *
 * Renders a neural network graph showing:
 * - Input nodes (sensor inputs)
 * - Hidden layer nodes
 * - Output nodes (muscle activations)
 * - Connection weights (color and thickness)
 * - Node activations (color intensity)
 */

import type { NeuralGenomeData, ForwardResult } from '../neural';
import { createNetworkFromGenome, NeuralNetwork } from '../neural';

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

export class NeuralVisualizer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private options: NeuralVisualizerOptions;
  private network: NeuralNetwork | null = null;
  private topology: { inputSize: number; hiddenSize: number; outputSize: number } | null = null;
  private lastResult: ForwardResult | null = null;
  private muscleNames: string[] = [];

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
   * Set the neural genome to visualize
   */
  setGenome(genome: NeuralGenomeData | undefined, muscleNames: string[]): void {
    if (!genome) {
      this.network = null;
      this.topology = null;
      this.muscleNames = [];
      this.render();
      return;
    }

    this.network = createNetworkFromGenome(genome);
    this.topology = genome.topology;
    this.muscleNames = muscleNames;
    this.lastResult = null;
    this.render();
  }

  /**
   * Update activations with new sensor inputs (recomputes NN forward pass)
   * @deprecated Use setStoredActivations for accurate display from simulation
   */
  updateActivations(sensorInputs: number[]): void {
    if (!this.network) return;

    try {
      this.lastResult = this.network.forward(sensorInputs);
      this.render();
    } catch (e) {
      console.warn('Failed to compute neural activations:', e);
    }
  }

  /**
   * Set stored activations directly from simulation data.
   * This displays the actual muscle outputs from simulation rather than recomputing.
   * @param outputs - Muscle activation values from simulation (one per muscle)
   */
  setStoredActivations(outputs: number[]): void {
    if (!this.topology) return;

    // Create a ForwardResult-like object with the stored outputs
    // We don't have the exact hidden/input values from simulation,
    // so we'll show outputs directly and use placeholder values for visualization
    this.lastResult = {
      inputs: new Array(this.topology.inputSize).fill(0),  // Not stored, use placeholder
      hidden: new Array(this.topology.hiddenSize).fill(0), // Not stored, use placeholder
      outputs: outputs.slice(0, this.topology.outputSize),
    };
    this.render();
  }

  /**
   * Clear the visualization
   */
  clear(): void {
    this.network = null;
    this.topology = null;
    this.lastResult = null;
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
    // Draw if we have a network (to get actual weights) or if we have topology (for structure)
    if (this.options.showWeights && (this.network || this.topology)) {
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
    _inputs: number[],
    _hidden: number[],
    outputs: number[]
  ): void {
    // Get actual weights if we have a network, otherwise use uniform weight visualization
    const weights = this.network?.getWeightMatrices();

    // Draw input -> hidden connections
    for (let i = 0; i < inputY.length; i++) {
      for (let h = 0; h < hiddenY.length; h++) {
        // Use actual weight magnitude if available, otherwise show structure with uniform weight
        const weight = weights ? Math.abs(weights.weightsIH[i]?.[h] ?? 0) : 0.3;
        this.drawConnection(ctx, layerX[0], inputY[i], layerX[1], hiddenY[h], weight);
      }
    }

    // Draw hidden -> output connections - highlight based on output activation
    for (let h = 0; h < hiddenY.length; h++) {
      for (let o = 0; o < outputY.length; o++) {
        // Use actual weight magnitude, modulated by output activation for visual feedback
        const baseWeight = weights ? Math.abs(weights.weightsHO[h]?.[o] ?? 0) : 0.3;
        const outputMag = Math.abs(outputs[o] || 0);
        // Blend weight with output activation for dynamic visualization
        const activation = baseWeight * 0.5 + outputMag * 0.5;
        this.drawConnection(ctx, layerX[1], hiddenY[h], layerX[2], outputY[o], activation);
      }
    }
  }

  private drawConnection(
    ctx: CanvasRenderingContext2D,
    x1: number, y1: number,
    x2: number, y2: number,
    activation: number
  ): void {
    // Color based on activation strength
    const alpha = Math.min(0.8, 0.1 + activation * 0.7);
    const hue = activation > 0.5 ? 120 : 200; // Green for strong, blue for weak

    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.strokeStyle = `hsla(${hue}, 60%, 50%, ${alpha})`;
    ctx.lineWidth = 0.5 + activation * 1.5;
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

      // Node fill color based on activation
      // Tanh range: [-1, 1] -> map to color
      const normalizedAct = (activation + 1) / 2; // Map [-1,1] to [0,1]
      const hue = normalizedAct * 120; // Red (0) to Green (120)
      const saturation = 70;
      const lightness = 30 + Math.abs(activation) * 30;

      // Draw node
      ctx.beginPath();
      ctx.arc(x, y, nodeRadius, 0, Math.PI * 2);
      ctx.fillStyle = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
      ctx.fill();
      ctx.strokeStyle = '#444';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Activation values are now drawn in drawLabels for output nodes
    }
  }

  private drawLabels(
    ctx: CanvasRenderingContext2D,
    layerX: number[],
    inputY: number[],
    outputY: number[],
    outputs: number[]
  ): void {
    ctx.font = '8px sans-serif';
    ctx.fillStyle = '#666';

    // Input labels (abbreviated sensor names)
    const shortNames = ['dir_x', 'dir_y', 'dir_z', 'vel_x', 'vel_y', 'vel_z', 'dist', 'time'];
    ctx.textAlign = 'right';
    for (let i = 0; i < inputY.length && i < shortNames.length; i++) {
      ctx.fillText(shortNames[i], layerX[0] - 10, inputY[i] + 3);
    }

    // Output labels: muscle ID (nodes it connects) and activation value
    ctx.textAlign = 'left';
    for (let i = 0; i < outputY.length; i++) {
      const muscleId = this.muscleNames[i] || `M${i}`;
      const activation = outputs[i] || 0;
      // Show muscle ID (which nodes it connects, e.g. "1-3") and activation
      ctx.fillStyle = '#888';
      ctx.font = '8px monospace';
      ctx.fillText(muscleId, layerX[2] + 10, outputY[i] + 3);
      // Show activation value slightly dimmer
      ctx.fillStyle = '#666';
      ctx.fillText(activation.toFixed(1), layerX[2] + 34, outputY[i] + 3);
    }

    // Layer titles
    ctx.fillStyle = '#888';
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Input', layerX[0], 12);
    ctx.fillText('Hidden', layerX[1], 12);
    ctx.fillText('Output', layerX[2], 12);
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

/**
 * Brain Evolution Panel
 *
 * Visualizes how neural network weights have evolved over generations:
 * - Diff view: Shows weight changes between gen 1 average and current gen average
 * - Histogram: Shows weight distribution comparison
 */

import type { NeuralGenomeData, NeuralTopology } from '../neural';

export interface BrainEvolutionData {
  gen1Weights: number[];      // Average weights from generation 1
  currentWeights: number[];   // Average weights from current generation
  topology: NeuralTopology;   // Network topology
  gen1Label: string;          // e.g., "Gen 1"
  currentLabel: string;       // e.g., "Gen 50"
}

export interface BrainEvolutionPanelOptions {
  width: number;
  height: number;
}

const DEFAULT_OPTIONS: BrainEvolutionPanelOptions = {
  width: 400,
  height: 350
};

export class BrainEvolutionPanel {
  private panel: HTMLElement;
  private diffCanvas: HTMLCanvasElement;
  private histCanvas: HTMLCanvasElement;
  private diffCtx: CanvasRenderingContext2D;
  private histCtx: CanvasRenderingContext2D;
  private options: BrainEvolutionPanelOptions;
  private data: BrainEvolutionData | null = null;
  private isVisible: boolean = false;

  constructor(container: HTMLElement, options: Partial<BrainEvolutionPanelOptions> = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options };

    // Create panel container
    this.panel = document.createElement('div');
    this.panel.className = 'brain-evolution-panel';
    this.panel.style.cssText = `
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: var(--bg-secondary, #1a1a24);
      border: 1px solid var(--border-color, #333);
      border-radius: 12px;
      padding: 16px;
      z-index: 1000;
      display: none;
      box-shadow: 0 8px 32px rgba(0,0,0,0.5);
    `;

    // Create header
    const header = document.createElement('div');
    header.style.cssText = `
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
    `;
    header.innerHTML = `
      <h3 style="margin: 0; color: #fff; font-size: 14px;">Brain Evolution</h3>
      <button id="close-brain-evolution" style="
        background: none;
        border: none;
        color: #888;
        cursor: pointer;
        font-size: 18px;
        padding: 4px 8px;
      ">&times;</button>
    `;
    this.panel.appendChild(header);

    // Create diff visualization section
    const diffSection = document.createElement('div');
    diffSection.style.marginBottom = '12px';
    diffSection.innerHTML = `<div style="color: #888; font-size: 11px; margin-bottom: 6px;">Weight Changes (Green=Strengthened, Red=Weakened)</div>`;

    this.diffCanvas = document.createElement('canvas');
    this.diffCanvas.width = this.options.width;
    this.diffCanvas.height = 160;
    this.diffCanvas.style.cssText = `
      width: ${this.options.width}px;
      height: 160px;
      border-radius: 6px;
      background: #12121a;
    `;
    this.diffCtx = this.diffCanvas.getContext('2d')!;
    diffSection.appendChild(this.diffCanvas);
    this.panel.appendChild(diffSection);

    // Create histogram section
    const histSection = document.createElement('div');
    histSection.innerHTML = `<div style="color: #888; font-size: 11px; margin-bottom: 6px;">Weight Distribution</div>`;

    this.histCanvas = document.createElement('canvas');
    this.histCanvas.width = this.options.width;
    this.histCanvas.height = 120;
    this.histCanvas.style.cssText = `
      width: ${this.options.width}px;
      height: 120px;
      border-radius: 6px;
      background: #12121a;
    `;
    this.histCtx = this.histCanvas.getContext('2d')!;
    histSection.appendChild(this.histCanvas);
    this.panel.appendChild(histSection);

    // Add legend
    const legend = document.createElement('div');
    legend.style.cssText = `
      display: flex;
      gap: 16px;
      justify-content: center;
      margin-top: 8px;
      font-size: 11px;
    `;
    legend.innerHTML = `
      <span style="color: #4a9eff;">&#9632; Gen 1</span>
      <span style="color: #ff6b6b;">&#9632; Current</span>
    `;
    this.panel.appendChild(legend);

    container.appendChild(this.panel);

    // Set up close button
    this.panel.querySelector('#close-brain-evolution')?.addEventListener('click', () => this.hide());
  }

  /**
   * Compute average weights from an array of neural genomes
   */
  static computeAverageWeights(genomes: NeuralGenomeData[]): number[] | null {
    if (genomes.length === 0) return null;

    const weightCount = genomes[0].weights.length;
    const avgWeights = new Array(weightCount).fill(0);
    let validCount = 0;

    for (const genome of genomes) {
      if (genome.weights.length !== weightCount) continue;
      validCount++;
      for (let i = 0; i < weightCount; i++) {
        avgWeights[i] += genome.weights[i];
      }
    }

    if (validCount === 0) return null;

    for (let i = 0; i < weightCount; i++) {
      avgWeights[i] /= validCount;
    }

    return avgWeights;
  }

  /**
   * Set the data to visualize
   */
  setData(data: BrainEvolutionData): void {
    this.data = data;
    this.render();
  }

  /**
   * Show the panel
   */
  show(): void {
    this.panel.style.display = 'block';
    this.isVisible = true;
    this.render();
  }

  /**
   * Hide the panel
   */
  hide(): void {
    this.panel.style.display = 'none';
    this.isVisible = false;
  }

  /**
   * Toggle visibility
   */
  toggle(): void {
    if (this.isVisible) {
      this.hide();
    } else {
      this.show();
    }
  }

  /**
   * Render the visualizations
   */
  private render(): void {
    this.renderDiffView();
    this.renderHistogram();
  }

  /**
   * Render the diff visualization showing weight changes
   */
  private renderDiffView(): void {
    const ctx = this.diffCtx;
    const width = this.diffCanvas.width;
    const height = this.diffCanvas.height;

    // Clear
    ctx.fillStyle = '#12121a';
    ctx.fillRect(0, 0, width, height);

    if (!this.data) {
      ctx.fillStyle = '#666';
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('No data available', width / 2, height / 2);
      return;
    }

    const { gen1Weights, currentWeights, topology } = this.data;
    const { inputSize, hiddenSize, outputSize } = topology;

    // Layout
    const padding = 30;
    const layerX = [
      padding + 40,
      width / 2,
      width - padding - 40
    ];

    const inputY = this.getNodeYPositions(inputSize, height, padding);
    const hiddenY = this.getNodeYPositions(hiddenSize, height, padding);
    const outputY = this.getNodeYPositions(outputSize, height, padding);

    // Parse weight arrays into layers
    // Weight layout: [input->hidden weights, hidden biases, hidden->output weights, output biases]
    const ihWeightCount = inputSize * hiddenSize;
    const hoWeightCount = hiddenSize * outputSize;

    const gen1IH = gen1Weights.slice(0, ihWeightCount);
    const currentIH = currentWeights.slice(0, ihWeightCount);

    const gen1HO = gen1Weights.slice(ihWeightCount + hiddenSize, ihWeightCount + hiddenSize + hoWeightCount);
    const currentHO = currentWeights.slice(ihWeightCount + hiddenSize, ihWeightCount + hiddenSize + hoWeightCount);

    // Draw input -> hidden connections with diff coloring
    for (let i = 0; i < inputSize; i++) {
      for (let h = 0; h < hiddenSize; h++) {
        const idx = i * hiddenSize + h;
        const diff = currentIH[idx] - gen1IH[idx];
        this.drawDiffConnection(ctx, layerX[0], inputY[i], layerX[1], hiddenY[h], diff);
      }
    }

    // Draw hidden -> output connections with diff coloring
    for (let h = 0; h < hiddenSize; h++) {
      for (let o = 0; o < outputSize; o++) {
        const idx = h * outputSize + o;
        const diff = currentHO[idx] - gen1HO[idx];
        this.drawDiffConnection(ctx, layerX[1], hiddenY[h], layerX[2], outputY[o], diff);
      }
    }

    // Draw nodes
    this.drawDiffNodes(ctx, layerX[0], inputY);
    this.drawDiffNodes(ctx, layerX[1], hiddenY);
    this.drawDiffNodes(ctx, layerX[2], outputY);

    // Draw layer labels
    ctx.fillStyle = '#888';
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Input', layerX[0], 14);
    ctx.fillText('Hidden', layerX[1], 14);
    ctx.fillText('Output', layerX[2], 14);

    // Draw labels
    ctx.fillStyle = '#666';
    ctx.font = '8px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(this.data.gen1Label, 8, height - 8);
    ctx.textAlign = 'right';
    ctx.fillText(this.data.currentLabel, width - 8, height - 8);
  }

  /**
   * Draw a connection colored by weight difference
   */
  private drawDiffConnection(
    ctx: CanvasRenderingContext2D,
    x1: number, y1: number,
    x2: number, y2: number,
    diff: number
  ): void {
    // Color: green for positive (strengthened), red for negative (weakened)
    const absDiff = Math.abs(diff);
    const maxDiff = 1.0; // Normalize to this range
    const normalizedDiff = Math.min(absDiff / maxDiff, 1);

    const alpha = 0.2 + normalizedDiff * 0.6;
    const hue = diff > 0 ? 120 : 0; // Green for positive, red for negative
    const saturation = 70;
    const lightness = 50;

    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.strokeStyle = `hsla(${hue}, ${saturation}%, ${lightness}%, ${alpha})`;
    ctx.lineWidth = 0.5 + normalizedDiff * 2;
    ctx.stroke();
  }

  /**
   * Draw nodes for diff view
   */
  private drawDiffNodes(ctx: CanvasRenderingContext2D, x: number, yPositions: number[]): void {
    const nodeRadius = 5;

    for (const y of yPositions) {
      ctx.beginPath();
      ctx.arc(x, y, nodeRadius, 0, Math.PI * 2);
      ctx.fillStyle = '#2a2a3a';
      ctx.fill();
      ctx.strokeStyle = '#444';
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  }

  /**
   * Render the weight distribution histogram
   */
  private renderHistogram(): void {
    const ctx = this.histCtx;
    const width = this.histCanvas.width;
    const height = this.histCanvas.height;

    // Clear
    ctx.fillStyle = '#12121a';
    ctx.fillRect(0, 0, width, height);

    if (!this.data) {
      return;
    }

    const { gen1Weights, currentWeights } = this.data;

    // Compute histograms
    const bins = 30;
    const minWeight = -2;
    const maxWeight = 2;
    const binWidth = (maxWeight - minWeight) / bins;

    const gen1Hist = new Array(bins).fill(0);
    const currentHist = new Array(bins).fill(0);

    for (const w of gen1Weights) {
      const bin = Math.floor((w - minWeight) / binWidth);
      if (bin >= 0 && bin < bins) gen1Hist[bin]++;
    }

    for (const w of currentWeights) {
      const bin = Math.floor((w - minWeight) / binWidth);
      if (bin >= 0 && bin < bins) currentHist[bin]++;
    }

    // Normalize
    const maxCount = Math.max(...gen1Hist, ...currentHist, 1);

    // Draw axes
    const padding = { left: 30, right: 10, top: 10, bottom: 25 };
    const plotWidth = width - padding.left - padding.right;
    const plotHeight = height - padding.top - padding.bottom;

    // Draw axis lines
    ctx.strokeStyle = '#444';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(padding.left, padding.top);
    ctx.lineTo(padding.left, height - padding.bottom);
    ctx.lineTo(width - padding.right, height - padding.bottom);
    ctx.stroke();

    // Draw bars
    const barWidth = plotWidth / bins;
    const barGap = 1;

    // Gen 1 bars (blue, behind)
    ctx.fillStyle = 'rgba(74, 158, 255, 0.5)';
    for (let i = 0; i < bins; i++) {
      const barHeight = (gen1Hist[i] / maxCount) * plotHeight;
      const x = padding.left + i * barWidth + barGap;
      const y = height - padding.bottom - barHeight;
      ctx.fillRect(x, y, barWidth - barGap * 2, barHeight);
    }

    // Current gen bars (red, in front)
    ctx.fillStyle = 'rgba(255, 107, 107, 0.5)';
    for (let i = 0; i < bins; i++) {
      const barHeight = (currentHist[i] / maxCount) * plotHeight;
      const x = padding.left + i * barWidth + barGap;
      const y = height - padding.bottom - barHeight;
      ctx.fillRect(x, y, barWidth - barGap * 2, barHeight);
    }

    // Draw x-axis labels
    ctx.fillStyle = '#666';
    ctx.font = '9px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(minWeight.toString(), padding.left, height - 8);
    ctx.fillText('0', padding.left + plotWidth / 2, height - 8);
    ctx.fillText(maxWeight.toString(), width - padding.right, height - 8);

    // Draw y-axis label
    ctx.save();
    ctx.translate(12, height / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('Count', 0, 0);
    ctx.restore();
  }

  /**
   * Get evenly spaced Y positions for nodes
   */
  private getNodeYPositions(count: number, height: number, padding: number): number[] {
    const available = height - padding * 2;
    const spacing = available / (count + 1);
    const positions: number[] = [];
    for (let i = 0; i < count; i++) {
      positions.push(padding + spacing * (i + 1));
    }
    return positions;
  }

  /**
   * Check if panel is visible
   */
  isShowing(): boolean {
    return this.isVisible;
  }

  /**
   * Dispose of resources
   */
  dispose(): void {
    this.panel.remove();
  }
}

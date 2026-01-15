# Neural Network Implementation Plan

This document outlines the implementation steps for adding neural network control to Evolution Lab.

## Implementation Phases

### Phase 1: Core Neural Network (TypeScript)
**Goal**: Basic fixed-topology network that can run in browser

### Phase 2: Evolution Integration
**Goal**: Mutate and crossover network weights

### Phase 3: UI Integration
**Goal**: Menu toggle and visualization

### Phase 4: Python Training Pipeline (Future)
**Goal**: Scale to larger networks with GPU acceleration

---

## Phase 1: Core Neural Network

### Files to Create

```
src/neural/
├── NeuralNetwork.ts      # Network class with forward pass
├── NeuralGenome.ts       # Genome storage and initialization
├── activations.ts        # Activation functions
└── index.ts              # Exports
```

### NeuralNetwork.ts

```typescript
// Core network implementation
export interface NeuralNetworkConfig {
  inputSize: number;       // 8 (sensors)
  hiddenSize: number;      // 8 (default)
  outputSize: number;      // N (muscles)
  activation: 'tanh' | 'relu' | 'sigmoid';
}

export class NeuralNetwork {
  private weightsIH: number[][];  // input -> hidden
  private biasH: number[];
  private weightsHO: number[][];  // hidden -> output
  private biasO: number[];
  private activation: (x: number) => number;

  constructor(config: NeuralNetworkConfig);

  // Initialize with Xavier/Glorot
  static initialize(config: NeuralNetworkConfig): NeuralNetwork;

  // Create from flat weight array (for evolution)
  static fromWeights(weights: number[], config: NeuralNetworkConfig): NeuralNetwork;

  // Export to flat array (for evolution)
  toWeights(): number[];

  // Forward pass - returns activations at each layer
  forward(inputs: number[]): {
    hidden: number[];
    outputs: number[];
  };

  // Just get outputs (for simulation)
  predict(inputs: number[]): number[];
}
```

### NeuralGenome.ts

```typescript
// Extension to CreatureGenome for neural weights
export interface NeuralGenomeData {
  weights: number[];           // Flat array of all weights
  topology: {
    inputSize: number;
    hiddenSize: number;
    outputSize: number;
  };
  activation: 'tanh' | 'relu' | 'sigmoid';
}

// Helper functions
export function initializeNeuralGenome(
  numMuscles: number,
  config: NeuralConfig
): NeuralGenomeData;

export function weightCount(
  inputSize: number,
  hiddenSize: number,
  outputSize: number
): number;
```

### activations.ts

```typescript
export const activations = {
  tanh: (x: number) => Math.tanh(x),
  relu: (x: number) => Math.max(0, x),
  sigmoid: (x: number) => 1 / (1 + Math.exp(-x)),
};

// Derivatives (for future gradient-based fine-tuning)
export const activationDerivatives = {
  tanh: (x: number) => 1 - Math.tanh(x) ** 2,
  relu: (x: number) => x > 0 ? 1 : 0,
  sigmoid: (x: number) => {
    const s = 1 / (1 + Math.exp(-x));
    return s * (1 - s);
  },
};
```

---

## Phase 2: Evolution Integration

### Files to Modify

```
src/genetics/
├── Mutation.ts           # Add weight mutation
├── Crossover.ts          # Add weight crossover
└── Population.ts         # Handle neural genome creation
```

### Mutation.ts Additions

```typescript
// New function for neural weight mutation
export function mutateNeuralWeights(
  weights: number[],
  config: {
    mutationRate: number;      // Probability per weight
    mutationMagnitude: number; // Std dev of perturbation
  }
): number[] {
  return weights.map(w => {
    if (Math.random() < config.mutationRate) {
      return w + randomGaussian() * config.mutationMagnitude;
    }
    return w;
  });
}
```

### Crossover.ts Additions

```typescript
// Uniform crossover for neural weights
export function crossoverNeuralWeights(
  parent1: number[],
  parent2: number[]
): number[] {
  return parent1.map((w1, i) =>
    Math.random() < 0.5 ? w1 : parent2[i]
  );
}

// Blend crossover alternative
export function blendNeuralWeights(
  parent1: number[],
  parent2: number[],
  alpha: number = 0.5
): number[] {
  return parent1.map((w1, i) =>
    alpha * w1 + (1 - alpha) * parent2[i]
  );
}
```

### BatchSimulator.ts Modifications

```typescript
// In the simulation loop, replace/augment muscle control:

if (config.useNeuralNet) {
  // Gather sensor inputs
  const sensorInputs = [
    pelletDirection.x,
    pelletDirection.y,
    pelletDirection.z,
    velocityDirection.x,
    velocityDirection.y,
    velocityDirection.z,
    normalizedDistance,
    Math.sin(simulationTime * Math.PI * 2)  // time phase
  ];

  // Forward pass
  const { outputs } = network.forward(sensorInputs);

  // Apply to muscles
  for (let i = 0; i < springs.length; i++) {
    const spring = springs[i];

    if (config.neuralMode === 'hybrid') {
      // Modulate oscillator
      const baseContraction = Math.sin(
        simulationTime * spring.frequency * Math.PI * 2 + spring.phase
      );
      const modulation = 1 + outputs[i];  // outputs in [-1, 1]
      spring.spring.restLength = spring.baseRestLength *
        (1 - baseContraction * spring.amplitude * modulation);
    } else {
      // Pure neural control
      spring.spring.restLength = spring.baseRestLength *
        (1 - outputs[i] * spring.amplitude);
    }
  }

  // Store activations for visualization
  if (recordingFrame) {
    currentFrame.neuralActivations = {
      inputs: sensorInputs,
      hidden: network.getHiddenActivations(),
      outputs: outputs
    };
  }
}
```

---

## Phase 3: UI Integration

### Menu Additions (main.ts)

```typescript
// Add to config interface
interface Config extends SimulationConfig {
  // Neural network settings
  useNeuralNet: boolean;
  neuralMode: 'hybrid' | 'pure';
  hiddenSize: number;
  activation: 'tanh' | 'relu' | 'sigmoid';
  weightMutationRate: number;
  weightMutationMagnitude: number;
}

// Add menu controls
const neuralSection = document.createElement('div');
neuralSection.innerHTML = `
  <h3>Neural Network</h3>
  <label>
    <input type="checkbox" id="useNeuralNet"> Enable Neural Networks
  </label>
  <div id="neuralOptions" style="display: none;">
    <label>
      Mode:
      <select id="neuralMode">
        <option value="hybrid">Hybrid (Recommended)</option>
        <option value="pure">Pure Neural</option>
      </select>
    </label>
    <label>
      Hidden Neurons: <input type="range" id="hiddenSize" min="4" max="16" value="8">
      <span id="hiddenSizeValue">8</span>
    </label>
    <label>
      Activation:
      <select id="activation">
        <option value="tanh">tanh</option>
        <option value="relu">ReLU</option>
        <option value="sigmoid">Sigmoid</option>
      </select>
    </label>
    <label>
      Weight Mutation Rate: <input type="range" id="weightMutationRate" min="0.01" max="0.5" step="0.01" value="0.1">
      <span id="weightMutationRateValue">0.1</span>
    </label>
    <label>
      Mutation Magnitude: <input type="range" id="weightMutationMagnitude" min="0.1" max="1.0" step="0.1" value="0.3">
      <span id="weightMutationMagnitudeValue">0.3</span>
    </label>
  </div>
`;
```

### Visualization Component

```typescript
// New file: src/ui/NeuralVisualizer.ts

export class NeuralVisualizer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;

  constructor(container: HTMLElement, width: number, height: number);

  // Draw network structure with current activations
  render(
    network: NeuralNetwork,
    activations: NeuralActivations,
    muscleNames: string[]
  ): void;

  // Draw activation heatmap over time
  renderHeatmap(
    activationHistory: NeuralActivations[],
    currentFrame: number
  ): void;
}
```

### Replay Modal Additions

```typescript
// In the replay modal, add neural visualization panel
if (creature.genome.controllerType === 'neural') {
  const neuralPanel = document.createElement('div');
  neuralPanel.className = 'neural-panel';
  neuralPanel.innerHTML = `
    <h4>Neural Network</h4>
    <canvas id="neuralCanvas" width="280" height="200"></canvas>
    <label>
      <input type="checkbox" id="showHeatmap" checked> Show Activation Heatmap
    </label>
    <canvas id="heatmapCanvas" width="280" height="100"></canvas>
  `;
  modalContent.appendChild(neuralPanel);

  // Initialize visualizer
  const visualizer = new NeuralVisualizer(
    document.getElementById('neuralCanvas'),
    280, 200
  );

  // Update on each frame
  onFrameUpdate = (frame) => {
    if (frame.neuralActivations) {
      visualizer.render(network, frame.neuralActivations, muscleNames);
      if (showHeatmap) {
        visualizer.renderHeatmap(allActivations, currentFrameIndex);
      }
    }
  };
}
```

---

## Phase 4: Python Training Pipeline (Future)

### Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│  Python Training Server                                          │
│                                                                  │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐         │
│  │   PyTorch   │───▶│   NEAT-Py   │───▶│   Export    │         │
│  │   Network   │    │   Evolution │    │   to JSON   │         │
│  └─────────────┘    └─────────────┘    └─────────────┘         │
│                                              │                   │
└──────────────────────────────────────────────┼───────────────────┘
                                               │
                                               ▼
┌─────────────────────────────────────────────────────────────────┐
│  Browser (TypeScript)                                            │
│                                                                  │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐         │
│  │   Import    │───▶│  Simulation │───▶│  Visualize  │         │
│  │   Weights   │    │   & Eval    │    │   Results   │         │
│  └─────────────┘    └─────────────┘    └─────────────┘         │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Weight Export Format

```json
{
  "version": "1.0",
  "topology": {
    "inputSize": 8,
    "hiddenLayers": [8],
    "outputSize": 10,
    "activation": "tanh"
  },
  "weights": {
    "input_hidden": [[...], [...], ...],
    "hidden_bias": [...],
    "hidden_output": [[...], [...], ...],
    "output_bias": [...]
  },
  "metadata": {
    "generation": 150,
    "fitness": 342.5,
    "trainedWith": "NEAT",
    "timestamp": "2024-01-15T12:00:00Z"
  }
}
```

---

## Implementation Checklist

### Phase 1: Core Neural Network
- [ ] Create `src/neural/` directory
- [ ] Implement `activations.ts`
- [ ] Implement `NeuralNetwork.ts`
- [ ] Implement `NeuralGenome.ts`
- [ ] Add unit tests for forward pass
- [ ] Add unit tests for weight serialization

### Phase 2: Evolution Integration
- [ ] Add `mutateNeuralWeights` to Mutation.ts
- [ ] Add `crossoverNeuralWeights` to Crossover.ts
- [ ] Modify `Population.ts` for neural genome creation
- [ ] Modify `BatchSimulator.ts` for neural control
- [ ] Add activation recording to simulation frames
- [ ] Update types in `simulation.ts`
- [ ] Add integration tests

### Phase 3: UI Integration
- [ ] Add neural network section to menu
- [ ] Implement `NeuralVisualizer.ts`
- [ ] Add neural panel to replay modal
- [ ] Add heatmap visualization
- [ ] Update localStorage for neural settings
- [ ] Test full workflow

### Phase 4: Future Enhancements
- [ ] Python training server
- [ ] NEAT implementation
- [ ] Weight import/export
- [ ] GPU acceleration
- [ ] Distributed evolution

---

## Testing Strategy

### Unit Tests

```typescript
// src/__tests__/neural.test.ts

describe('NeuralNetwork', () => {
  it('should initialize with correct weight count', () => {
    const nn = NeuralNetwork.initialize({
      inputSize: 8,
      hiddenSize: 8,
      outputSize: 10,
      activation: 'tanh'
    });
    expect(nn.toWeights().length).toBe(72 + 90);  // 162 weights
  });

  it('should produce outputs in [-1, 1] with tanh', () => {
    const nn = NeuralNetwork.initialize({ ... });
    const outputs = nn.predict([0, 0, 0, 0, 0, 0, 0, 0]);
    outputs.forEach(o => {
      expect(o).toBeGreaterThanOrEqual(-1);
      expect(o).toBeLessThanOrEqual(1);
    });
  });

  it('should reproduce same output from same weights', () => {
    const nn1 = NeuralNetwork.initialize({ ... });
    const weights = nn1.toWeights();
    const nn2 = NeuralNetwork.fromWeights(weights, { ... });

    const input = [0.5, -0.3, 0.1, 0, 0, 0, 0.8, 0];
    expect(nn1.predict(input)).toEqual(nn2.predict(input));
  });
});
```

### Integration Tests

```typescript
describe('Neural Evolution', () => {
  it('should evolve creatures with neural control', async () => {
    const config = {
      ...DEFAULT_CONFIG,
      useNeuralNet: true,
      neuralMode: 'hybrid'
    };

    const population = Population.createInitial(20, constraints, config);
    const results = await simulatePopulation(population, config);

    // At least some creatures should have non-zero fitness
    const avgFitness = results.reduce((s, r) => s + r.finalFitness, 0) / results.length;
    expect(avgFitness).toBeGreaterThan(0);
  });
});
```

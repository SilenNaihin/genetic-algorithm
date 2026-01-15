# Neural Network Evolution in Evolution Lab

## Table of Contents
1. [Overview](#overview)
2. [Why Neuroevolution?](#why-neuroevolution)
3. [Architecture](#architecture)
4. [Control Modes](#control-modes)
5. [Evolution Operators](#evolution-operators)
6. [Configuration](#configuration)
7. [Visualization](#visualization)
8. [Future: NEAT](#future-neat)
9. [References](#references)

---

## Overview

Evolution Lab supports two creature control systems:

| System | Description | When to Use |
|--------|-------------|-------------|
| **Oscillator** (default) | Muscles contract via sinusoidal oscillation with direction/velocity/distance modulation | Quick experiments, baseline comparison |
| **Neural Network** (optional) | A neural network maps sensory inputs to muscle activations | Complex behaviors, research |

Both systems use **genetic algorithms** for optimization - no gradient descent involved.

---

## Why Neuroevolution?

### The Problem with Gradients

Traditional neural network training uses **backpropagation**: compute gradients of a loss function and adjust weights to minimize loss. This requires:

1. **Differentiable loss function**: Must be able to compute ∂loss/∂weights
2. **Dense reward signal**: Need frequent feedback, not just end-of-episode
3. **Differentiable operations**: Every step from input to loss must be differentiable

Our creature simulation violates all three:

| Requirement | Our Simulation |
|-------------|----------------|
| Differentiable loss | Fitness depends on physics collisions (non-differentiable) |
| Dense rewards | Only know fitness after full 8-second simulation |
| Differentiable ops | Cannon.js physics engine is a black box |

### Evolution as Optimization

Genetic algorithms optimize **without gradients**:

```
Traditional ML:                    Neuroevolution:
─────────────────                  ──────────────
loss = f(pred, target)             fitness = simulate(creature)
grad = ∂loss/∂weights              NO GRADIENTS COMPUTED
weights -= lr * grad               weights = mutate(parent_weights)
```

**Key insight**: We've been doing neuroevolution all along! Our oscillator parameters (frequency, amplitude, phase, biases) ARE the "genome" being evolved. Neural network weights are just a different, more expressive genome.

### Comparison

| Aspect | Gradient Descent | Neuroevolution |
|--------|------------------|----------------|
| Speed | Fast (direct optimization) | Slow (population-based search) |
| Requirements | Differentiable everything | Any fitness function |
| Local optima | Can get stuck | Population explores broadly |
| Parallelization | Limited by batch size | Embarrassingly parallel |
| Sparse rewards | Struggles | Works naturally |

---

## Architecture

### Network Topology (Fixed, v1)

```
INPUTS (8)              HIDDEN (8, tanh)         OUTPUTS (N muscles)
═══════════             ════════════════         ═══════════════════

pellet_dir_x  ─────┐                         ┌─── muscle_0_mod [-1, 1]
pellet_dir_y  ─────┤    ┌───────────────┐    │
pellet_dir_z  ─────┼────┤               ├────┼─── muscle_1_mod [-1, 1]
velocity_x    ─────┤    │   8 neurons   │    │
velocity_y    ─────┼────┤     tanh      ├────┼─── muscle_2_mod [-1, 1]
velocity_z    ─────┤    │  activation   │    │
pellet_dist   ─────┼────┤               ├────┼─── ...
time_phase    ─────┘    └───────────────┘    │
                                             └─── muscle_N_mod [-1, 1]
```

### Sensor Inputs

| Input | Range | Description |
|-------|-------|-------------|
| `pellet_dir_x` | [-1, 1] | X component of unit vector to pellet |
| `pellet_dir_y` | [-1, 1] | Y component of unit vector to pellet |
| `pellet_dir_z` | [-1, 1] | Z component of unit vector to pellet |
| `velocity_x` | [-1, 1] | X component of creature velocity (normalized) |
| `velocity_y` | [-1, 1] | Y component of creature velocity (normalized) |
| `velocity_z` | [-1, 1] | Z component of creature velocity (normalized) |
| `pellet_dist` | [0, 1] | Normalized distance to pellet (0=at pellet, 1=far) |
| `time_phase` | [-1, 1] | sin(time × 2π) for rhythmic behaviors |

### Weight Count

For a creature with N muscles:
- Input → Hidden: 8 × 8 = 64 weights + 8 biases = **72 parameters**
- Hidden → Output: 8 × N = 8N weights + N biases = **9N parameters**
- **Total**: 72 + 9N parameters

| Muscles | Total Parameters |
|---------|------------------|
| 5 | 117 |
| 10 | 162 |
| 15 | 207 |

Compare to oscillator mode: ~12 evolvable parameters per muscle = 60-180 total.
Similar count, but neural net can learn **arbitrary** input→output mappings.

---

## Control Modes

### Hybrid Mode (Recommended)

Neural network output **modulates** the base oscillator:

```python
# Base oscillation (provides rhythm)
base = sin(time * frequency * 2π + phase)

# Neural modulation (provides steering/adaptation)
nn_output = network.forward(sensors)  # in [-1, 1]

# Combined (oscillator rhythm + neural control)
modulation = 1.0 + nn_output * modulation_strength  # e.g., [0.5, 1.5]
contraction = base * amplitude * modulation
```

**Advantages:**
- Creatures move even with random weights (oscillator provides baseline)
- Smoother fitness landscape (easier to evolve)
- Faster convergence
- Good for initial learning

**Disadvantages:**
- Constrained to oscillatory motion
- Can't learn purely reactive behaviors

### Pure Mode (More Expressive)

Neural network **directly controls** muscle contraction:

```python
# Direct neural control
nn_output = network.forward(sensors)  # in [-1, 1]
contraction = nn_output * max_amplitude
```

**Advantages:**
- Can learn any behavior (no oscillator constraints)
- More biologically plausible
- Better for complex tasks

**Disadvantages:**
- Random weights = no movement = zero fitness = no selection signal
- Harder to bootstrap evolution
- Requires careful initialization

### Recommendation

Start with **Hybrid mode** to evolve basic locomotion, then optionally switch to **Pure mode** for fine-tuning complex behaviors.

---

## Evolution Operators

### Weight Initialization

Xavier/Glorot initialization for stable gradients (even though we don't use gradients, this gives reasonable starting behavior):

```python
stddev = sqrt(2.0 / (fan_in + fan_out))
weight = random_normal() * stddev
bias = 0.0
```

### Weight Mutation

```python
def mutate_weights(weights, mutation_rate, mutation_magnitude):
    for i in range(len(weights)):
        if random() < mutation_rate:
            # Gaussian perturbation
            weights[i] += random_normal() * mutation_magnitude
    return weights
```

**Parameters:**
- `mutation_rate`: Probability each weight mutates (default: 0.1 = 10%)
- `mutation_magnitude`: Standard deviation of perturbation (default: 0.3)

### Weight Crossover

**Uniform crossover** (recommended for neural nets):
```python
def crossover_weights(parent1, parent2):
    child = []
    for w1, w2 in zip(parent1, parent2):
        child.append(w1 if random() < 0.5 else w2)
    return child
```

**Blend crossover** (alternative):
```python
def crossover_weights_blend(parent1, parent2):
    alpha = random()  # or fixed at 0.5
    return [alpha * w1 + (1-alpha) * w2 for w1, w2 in zip(parent1, parent2)]
```

---

## Configuration

### Menu Options

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `useNeuralNet` | boolean | false | Enable neural network control |
| `neuralMode` | enum | 'hybrid' | 'hybrid' or 'pure' control mode |
| `hiddenSize` | number | 8 | Neurons in hidden layer |
| `activation` | enum | 'tanh' | 'tanh', 'relu', or 'sigmoid' |
| `mutationMagnitude` | number | 0.3 | Weight perturbation std dev |
| `weightMutationRate` | number | 0.1 | Probability each weight mutates |

### TypeScript Interface

```typescript
interface NeuralConfig {
  useNeuralNet: boolean;
  neuralMode: 'hybrid' | 'pure';
  hiddenSize: number;
  activation: 'tanh' | 'relu' | 'sigmoid';
  mutationMagnitude: number;
  weightMutationRate: number;
}
```

---

## Visualization

### Network Graph View

The replay modal shows the neural network structure:

```
┌─────────────────────────────────────────────────────────────────┐
│  NEURAL NETWORK                                                  │
│                                                                  │
│  Inputs          Hidden           Outputs                       │
│  ───────         ──────           ───────                       │
│  dir_x ●─────────●─────────────────● muscle_0                   │
│  dir_y ●─────────●─────────────────● muscle_1                   │
│  dir_z ●─────────●─────────────────● muscle_2                   │
│  vel_x ●─────────●─────────────────● muscle_3                   │
│  vel_y ●─────────●─────────────────● ...                        │
│  vel_z ●─────────●                                              │
│  dist  ●─────────●                                              │
│  phase ●─────────●                                              │
│                                                                  │
│  Line thickness = |weight|                                       │
│  Line color = weight sign (blue=positive, red=negative)         │
│  Node color = activation level (white=0, bright=high)           │
└─────────────────────────────────────────────────────────────────┘
```

### Activation Heatmap (Toggleable)

Shows neuron activations over time during replay:

```
┌─────────────────────────────────────────────────────────────────┐
│  ACTIVATIONS OVER TIME                              [Hide]      │
│                                                                  │
│  Frame:  0    20    40    60    80   100   120                  │
│         ────────────────────────────────────                    │
│  h_0    ▓▓▓░░░▓▓▓▓▓░░░░░▓▓▓▓▓▓▓░░░░                            │
│  h_1    ░░░▓▓▓▓▓▓░░░▓▓▓▓▓░░░░░▓▓▓▓                              │
│  h_2    ▓▓▓▓▓▓░░░░░░▓▓▓▓▓▓▓▓▓▓░░░░                              │
│  ...                                                             │
│                                                                  │
│  Color: dark=negative, white=zero, bright=positive              │
└─────────────────────────────────────────────────────────────────┘
```

### Activation Storage

Each simulation frame stores neural state:

```typescript
interface NeuralActivations {
  inputs: number[];      // [8] sensor values
  hidden: number[];      // [hiddenSize] hidden activations
  outputs: number[];     // [numMuscles] output activations
}

interface SimulationFrame {
  // ... existing fields ...
  neuralActivations?: NeuralActivations;
}
```

---

## Future: NEAT

### What is NEAT?

**NEAT** (NeuroEvolution of Augmenting Topologies) evolves both network **weights AND structure**:

- Start with minimal networks (no hidden nodes)
- Mutations can add nodes and connections
- Crossover aligns networks by "innovation numbers"
- Speciation protects novel topologies

### Key Innovations

1. **Historical Markings**: Each connection gets a unique global ID when created. This enables meaningful crossover between networks with different structures.

2. **Speciation**: Networks are grouped into species by structural similarity. Competition happens within species, protecting innovation.

3. **Minimal Initialization**: Start with direct input→output connections only. Complexity grows only when beneficial.

### Migration Path

Our fixed-topology implementation is designed for easy NEAT migration:

| Current (Fixed) | Future (NEAT) |
|-----------------|---------------|
| Flat weight array | Connection genes with innovation numbers |
| Fixed forward pass | Dynamic topology evaluation |
| Weight mutation only | Add structural mutations |
| Single population | Speciated population |

### Implementation Notes

When implementing NEAT:
1. Add `innovation_number` to each connection
2. Track global innovation counter
3. Implement `add_node` and `add_connection` mutations
4. Implement species distance metric
5. Implement speciated selection

See `docs/NEAT_IMPLEMENTATION.md` (future) for details.

---

## References

### Essential Papers

1. **NEAT (2002)** - Stanley & Miikkulainen
   - "Evolving Neural Networks through Augmenting Topologies"
   - https://nn.cs.utexas.edu/downloads/papers/stanley.ec02.pdf
   - The foundational paper for topology-evolving neural networks

2. **Weight Agnostic Neural Networks (2019)** - Gaier & Ha
   - https://arxiv.org/abs/1906.04358
   - Shows topology alone can encode behavior

3. **Deep Neuroevolution (2017)** - Uber AI
   - https://arxiv.org/abs/1712.06567
   - Scales genetic algorithms to deep networks

### Books

- "Neuroevolution" by Kenneth O. Stanley (2019)
- "Introduction to Evolutionary Computing" by Eiben & Smith

### Code References

- NEAT-Python: https://github.com/CodeReclwordholder/NEAT-Python
- PyTorch-NEAT: https://github.com/uber-research/PyTorch-NEAT

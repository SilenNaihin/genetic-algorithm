# Neural Network Evolution in Evolution Lab

## Table of Contents
1. [Overview](#overview)
2. [Why Neuroevolution?](#why-neuroevolution)
3. [Architecture](#architecture)
4. [Control Modes](#control-modes)
5. [Evolution Operators](#evolution-operators)
6. [GA Optimization Techniques](#ga-optimization-techniques)
7. [Diversity Maintenance](#diversity-maintenance)
8. [Selection Methods](#selection-methods)
9. [Configuration](#configuration)
10. [Visualization](#visualization)
11. [Future: NEAT](#future-neat)
12. [References](#references)

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

## GA Optimization Techniques

Genetic algorithms for neural networks require different strategies than gradient-based training. Here are key techniques that improve evolution efficiency.

### Output Bias (Negative Initialization)

In pure neural mode, random weights often cause all muscles to fire constantly, wasting energy and producing chaotic movement.

**Solution**: Initialize output layer biases to a negative value (e.g., -1.5):

```typescript
// Output neurons default "off" until inputs push them positive
outputBias = -1.5;

// Effective muscle activation threshold:
// tanh(weighted_sum + bias) > 0
// weighted_sum must exceed 1.5 to activate muscle
```

**Why it works:**
- Muscles start relaxed (biologically plausible)
- Creature must "earn" muscle activation through meaningful input patterns
- Reduces energy waste from constant firing
- Creates selective pressure for efficient movement

### Uniform Weight Initialization

Traditional deep learning uses **Gaussian** initialization (Xavier/He). For GA evolution, **uniform** distribution works better:

```typescript
// Gaussian: most weights near 0, few large
weight = randomGaussian() * 0.5;  // ❌ Clusters near zero

// Uniform: even spread across range
weight = randomUniform(-0.5, 0.5);  // ✅ Better exploration
```

**Why uniform beats Gaussian for GA:**
| Aspect | Gaussian | Uniform |
|--------|----------|---------|
| Initial diversity | Low (clustered) | High (spread) |
| Mutation coverage | Biased toward small weights | Even coverage |
| Edge exploration | Rare | Equally likely |

Gaussian initialization is designed for gradient flow. Since we don't use gradients, we prefer uniform coverage of the weight space.

### Dead Zone Problem

When using `tanh` activation with negative output biases, a **dead zone** emerges:

```
Output = tanh(weighted_sum - 1.5)

If weighted_sum < 0.5:
  Output ≈ tanh(-1.0) ≈ -0.76  (muscle fully relaxed)

Problem: Small weight changes don't affect output!
```

**The Issue:**
- Mutations in the dead zone produce identical fitness
- No selection pressure to improve
- GA "blindly wanders" until lucky mutation escapes

**Mitigations:**
1. **Smaller negative bias** (e.g., -0.5 instead of -1.5)
2. **Leaky activation** that preserves small differences
3. **Fitness shaping** to reward near-activation attempts

### Mutation Decay

Large mutations help early exploration; small mutations enable fine-tuning later.

**Linear Decay:**
```typescript
const mutationMag = initialMag * (1 - generation / maxGenerations);
// Gen 0: mag = 0.5
// Gen 50: mag = 0.25 (if maxGen = 100)
// Gen 100: mag = 0
```

**Exponential Decay (recommended):**
```typescript
const mutationMag = initialMag * Math.pow(decayRate, generation);
// decayRate = 0.99
// Gen 0: mag = 0.5
// Gen 50: mag = 0.303
// Gen 100: mag = 0.183
```

**Typical ranges:**
| Parameter | Early (gen 0-20) | Mid (gen 20-80) | Late (gen 80+) |
|-----------|------------------|-----------------|----------------|
| Mutation magnitude | 0.3 - 0.5 | 0.15 - 0.3 | 0.05 - 0.15 |
| Mutation rate | 0.2 - 0.3 | 0.1 - 0.2 | 0.05 - 0.1 |

---

## Diversity Maintenance

### Why Diversity Matters

**Premature convergence** occurs when the population clusters around a local optimum, losing the genetic variety needed to discover better solutions.

```
Generation 10:  ●  ●  ●  ●  ●  (diverse population)
                  ↓ selection pressure
Generation 50:  ●●●●●           (converged - stuck!)
                     Local optimum  →  Global optimum
                     (stuck here)       (unreachable)
```

Without diversity, evolution becomes a random walk around a single point rather than exploration of the fitness landscape.

### Fitness Sharing

**Fitness sharing** reduces fitness for creatures similar to others, encouraging the population to spread out.

**Formula:**
```typescript
// Sharing function: how much to penalize similarity
function share(distance: number, threshold: number): number {
  if (distance >= threshold) return 0;
  return 1 - (distance / threshold);
}

// Shared fitness calculation
function sharedFitness(creature: Creature, population: Creature[]): number {
  const rawFitness = creature.fitness;

  // Sum of similarity to all others
  const nicheCount = population.reduce((sum, other) => {
    const dist = genomeDistance(creature, other);
    return sum + share(dist, sharingThreshold);
  }, 0);

  return rawFitness / nicheCount;
}
```

**Intuition:** If 10 creatures occupy the same niche, they share that niche's resources (fitness), each getting 1/10th credit. This creates pressure to find unique solutions.

**Parameters:**
- `sharingThreshold`: Distance below which creatures compete (typically 3-5 for normalized genomes)
- Higher threshold = more sharing = more diversity pressure

### Speciation (NEAT-Style)

Rather than continuous sharing, **speciation** groups similar creatures into discrete species:

```typescript
interface Species {
  id: number;
  representative: Genome;  // Comparison point
  members: Creature[];
}

function assignSpecies(creature: Creature, species: Species[]): Species {
  for (const sp of species) {
    if (genomeDistance(creature.genome, sp.representative) < threshold) {
      return sp;  // Join existing species
    }
  }
  return createNewSpecies(creature);  // Found new species
}
```

**Species protection:**
- Each species guaranteed at least one offspring (prevents extinction of novel approaches)
- Selection happens within species first
- Fitness adjusted by species size

**Distance metric:**
```typescript
function genomeDistance(g1: Genome, g2: Genome): number {
  const c1 = 1.0;  // Excess gene coefficient
  const c2 = 1.0;  // Disjoint gene coefficient
  const c3 = 0.4;  // Weight difference coefficient

  const excess = countExcessGenes(g1, g2);
  const disjoint = countDisjointGenes(g1, g2);
  const avgWeightDiff = averageWeightDifference(g1, g2);

  return c1 * excess + c2 * disjoint + c3 * avgWeightDiff;
}
```

### Novelty Search (Alternative)

Instead of optimizing fitness directly, **novelty search** rewards creatures for being *different* from what's been seen before:

```typescript
function noveltyScore(creature: Creature, archive: Creature[]): number {
  // k-nearest neighbors in behavior space
  const k = 15;
  const neighbors = findKNearest(creature.behavior, archive, k);

  // Average distance to neighbors = novelty
  return neighbors.reduce((sum, n) => sum + behaviorDistance(creature, n), 0) / k;
}
```

**When to use:**
- Deceptive fitness landscapes (local optima everywhere)
- Open-ended evolution experiments
- When you don't know what "good" looks like

**Trade-off:** May find interesting behaviors that don't solve the task.

---

## Selection Methods

Different selection methods balance **exploitation** (favoring best) vs **exploration** (maintaining diversity).

### Truncation Selection (Current)

Select the top X% of the population as parents:

```typescript
function truncationSelection(population: Creature[], survivalRate: number): Creature[] {
  const sorted = [...population].sort((a, b) => b.fitness - a.fitness);
  const cutoff = Math.floor(population.length * survivalRate);
  return sorted.slice(0, cutoff);
}

// Usage: top 20% survive
const parents = truncationSelection(population, 0.2);
```

| Pros | Cons |
|------|------|
| Simple to implement | High selection pressure |
| Fast convergence | Can lose diversity quickly |
| Guaranteed best survive | Harsh on near-winners |

**Best for:** Problems where you want fast convergence and have good initial diversity.

### Tournament Selection

Randomly pick K creatures, best wins:

```typescript
function tournamentSelection(
  population: Creature[],
  tournamentSize: number
): Creature {
  // Pick random contestants
  const contestants: Creature[] = [];
  for (let i = 0; i < tournamentSize; i++) {
    const idx = Math.floor(Math.random() * population.length);
    contestants.push(population[idx]);
  }

  // Best wins
  return contestants.reduce((best, c) =>
    c.fitness > best.fitness ? c : best
  );
}

// To select N parents:
const parents = Array(numParents).fill(null).map(() =>
  tournamentSelection(population, tournamentSize)
);
```

**Tournament size controls pressure:**
| Size | Selection Pressure | Notes |
|------|-------------------|-------|
| 2 | Low | Good diversity, slow convergence |
| 5 | Medium | Balanced (recommended) |
| 10+ | High | Fast convergence, low diversity |

**Advantages:**
- Adjustable pressure via tournament size
- Works with negative fitness values
- Easy to parallelize

### Rank-Based Selection

Probability proportional to rank, not raw fitness:

```typescript
function rankBasedSelection(population: Creature[]): Creature {
  const sorted = [...population].sort((a, b) => b.fitness - a.fitness);
  const n = sorted.length;

  // Linear ranking: P(rank r) = (2 - s) / n + 2r(s - 1) / (n(n-1))
  // where s = selection pressure (1.0 to 2.0)
  const s = 1.5;

  const probabilities = sorted.map((_, rank) => {
    const r = n - rank - 1;  // Invert so rank 0 = best
    return (2 - s) / n + (2 * r * (s - 1)) / (n * (n - 1));
  });

  // Roulette wheel selection
  const total = probabilities.reduce((a, b) => a + b, 0);
  let random = Math.random() * total;

  for (let i = 0; i < n; i++) {
    random -= probabilities[i];
    if (random <= 0) return sorted[i];
  }
  return sorted[n - 1];
}
```

**Why use ranks instead of raw fitness?**
- **Immune to fitness scaling:** If best = 1000, second = 100, third = 99, raw fitness gives best almost all selections. Ranks treat second and third fairly.
- **Handles negative fitness**
- **Consistent selection pressure** regardless of fitness distribution

**Comparison:**
| Method | Diversity | Convergence | Implementation |
|--------|-----------|-------------|----------------|
| Truncation | Low | Fast | Trivial |
| Tournament | Tunable | Tunable | Simple |
| Rank-Based | High | Slow | Moderate |

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
| `outputBias` | number | -1.5 | Initial bias for output neurons (negative = muscles default off) |
| `weightMutationDecay` | number | 0.99 | Exponential decay rate for mutation magnitude per generation |
| `fitnessSharing` | boolean | false | Enable fitness sharing for diversity maintenance |
| `sharingThreshold` | number | 3.0 | Genome distance below which creatures share fitness |
| `selectionMethod` | enum | 'truncation' | 'truncation', 'tournament', or 'rank' |
| `tournamentSize` | number | 5 | Number of contestants per tournament (if tournament selection) |

### TypeScript Interface

```typescript
interface NeuralConfig {
  // Core settings
  useNeuralNet: boolean;
  neuralMode: 'hybrid' | 'pure';
  hiddenSize: number;
  activation: 'tanh' | 'relu' | 'sigmoid';

  // Mutation
  mutationMagnitude: number;
  weightMutationRate: number;
  weightMutationDecay: number;

  // Initialization
  outputBias: number;

  // Diversity
  fitnessSharing: boolean;
  sharingThreshold: number;

  // Selection
  selectionMethod: 'truncation' | 'tournament' | 'rank';
  tournamentSize: number;
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

2. **SBX Crossover (1995)** - Deb & Agrawal
   - "Simulated Binary Crossover for Continuous Search Space"
   - Introduced self-adaptive crossover for real-coded GAs
   - Key technique for evolving continuous weight vectors

3. **Fitness Sharing (1987)** - Goldberg & Richardson
   - "Genetic Algorithms with Sharing for Multimodal Function Optimization"
   - Foundational work on diversity maintenance in GAs
   - Introduced niche-based selection pressure

4. **Weight Agnostic Neural Networks (2019)** - Gaier & Ha
   - https://arxiv.org/abs/1906.04358
   - Shows topology alone can encode behavior

5. **Deep Neuroevolution (2017)** - Uber AI
   - https://arxiv.org/abs/1712.06567
   - Scales genetic algorithms to deep networks

6. **Novelty Search (2011)** - Lehman & Stanley
   - "Abandoning Objectives: Evolution Through the Search for Novelty Alone"
   - https://eplex.cs.ucf.edu/papers/lehman_ecj11.pdf
   - Alternative to fitness-based selection

### Books

- "Neuroevolution" by Kenneth O. Stanley (2019)
- "Introduction to Evolutionary Computing" by Eiben & Smith
- "Genetic Algorithms in Search, Optimization, and Machine Learning" by Goldberg (1989)

### Code References

- NEAT-Python: https://github.com/CodeReclwordholder/NEAT-Python
- PyTorch-NEAT: https://github.com/uber-research/PyTorch-NEAT
- SharpNEAT: https://github.com/colgreen/sharpneat (C# implementation with good docs)

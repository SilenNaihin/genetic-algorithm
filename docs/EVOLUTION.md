# Evolution System

This document covers the genetic algorithm operators and how they work together to evolve creature populations.

## Overview

The GA follows the standard evolutionary flow:

```
Population → Selection → Crossover → Mutation → New Population
                ↓            ↓           ↓
            (required)   (optional)  (optional)
```

**Key insight:** Crossover and mutation are NOT mutually exclusive. When both are enabled, offspring created via crossover also get mutated. This follows standard GA practice (Deb & Agrawal, 1995).

## Selection Methods

Selection determines which creatures survive to reproduce. Configured via `selectionMethod`.

### Truncation (`'truncation'`)
- **How it works:** Sort by fitness, keep top N%
- **Pros:** Simple, strong selection pressure
- **Cons:** Can lose diversity quickly, weak performers never reproduce
- **Best for:** Fast convergence when you're confident in fitness function

### Tournament (`'tournament'`)
- **How it works:** Randomly pick `tournamentSize` creatures, best one wins. Repeat until enough parents selected.
- **Pros:** Maintains diversity, weak creatures can win if they avoid strong competitors
- **Cons:** More stochastic, slower convergence
- **Config:** `tournamentSize` (2-10, default 3)
  - Size 2 = weak pressure (50% chance best wins)
  - Size 5+ = strong pressure (best almost always wins)
- **Best for:** Maintaining diversity in complex fitness landscapes

### Rank-Based (`'rank'`) - Default
- **How it works:** Sort by fitness, assign breeding probability by rank (1st gets most chances, last gets fewest)
- **Pros:** Even low-ranked creatures can reproduce, smooth selection pressure
- **Cons:** Ignores fitness magnitude (1st place with 100 fitness treated same as 1st with 1000)
- **Best for:** General purpose, balances exploitation and exploration

## Crossover

Crossover combines two parent genomes to create offspring. Enabled via `useCrossover`, probability controlled by `crossoverRate`.

### Body Crossover
Body crossover always uses **interpolation** - each property is blended between parents:
- Node positions: `lerp(parent1.pos, parent2.pos, random())`
- Muscle parameters: `lerp(parent1.stiffness, parent2.stiffness, random())`
- Structure comes from parent1 (node/muscle count)

### Neural Weight Crossover

Configured via `neuralCrossoverMethod`. Three methods available:

#### Interpolation (`'interpolation'`)
```
child_weight = lerp(parent1_weight, parent2_weight, random())
```
- Always produces values strictly between parents
- Cannot explore beyond the parent range
- Simple and predictable

#### Uniform (`'uniform'`)
```
child_weight = random() < 0.5 ? parent1_weight : parent2_weight
```
- Each weight randomly picked from either parent (50/50)
- Can be disruptive - child may inherit mismatched weights
- No smooth blending - offspring are "patchwork" of parents

#### SBX (`'sbx'`) - Default, Recommended

Simulated Binary Crossover (Deb & Agrawal, 1995) simulates single-point crossover on binary strings but for real numbers. It produces offspring that:

1. Are statistically centered around parent values
2. Have controllable spread via the **eta (η)** parameter
3. Can explore slightly outside the parent range

**The Algorithm:**
```python
def sbx_single(p1: float, p2: float, eta: float) -> float:
    if abs(p1 - p2) < 1e-14:
        return p1  # Parents identical

    u = random()  # Uniform [0, 1]

    # Calculate spread factor beta
    if u <= 0.5:
        beta = (2 * u) ** (1 / (eta + 1))
    else:
        beta = (1 / (2 * (1 - u))) ** (1 / (eta + 1))

    # Generate two children, return one randomly
    child1 = 0.5 * ((1 + beta) * p1 + (1 - beta) * p2)
    child2 = 0.5 * ((1 - beta) * p1 + (1 + beta) * p2)
    return child1 if random() < 0.5 else child2
```

**The Eta Parameter:**

| Eta | Spread | Use Case |
|-----|--------|----------|
| 0.5-1 | Wide | Early evolution, exploration |
| 2 | Balanced | Default, general purpose |
| 3-5 | Narrow | Fine-tuning, exploitation |

**Visual Comparison:**
```
Parent A weight: 0.3
Parent B weight: 0.7

Interpolation:  Always in [0.3, 0.7]     → 0.35, 0.52, 0.68
Uniform:        Always exactly 0.3 or 0.7 → 0.3, 0.7, 0.3
SBX (eta=2):    Usually near [0.3, 0.7], can go beyond → 0.25, 0.35, 0.65, 0.75
```

## Mutation

Mutation introduces random changes to offspring. Enabled via `useMutation`.

### Body Mutation
Controlled by `mutationRate` and `mutationMagnitude`:
- **Node mutations:** Position shifts, size changes, friction adjustments
- **Muscle mutations:** Stiffness, damping, frequency, amplitude, phase changes
- **Bias mutations:** Direction bias, velocity bias, distance bias adjustments

### Neural Weight Mutation
Controlled by `weightMutationRate` and `weightMutationMagnitude`:
- Each weight has `weightMutationRate` probability of being mutated
- Mutation adds Gaussian noise: `weight += gaussian(0, weightMutationMagnitude)`
- Optional decay via `weightMutationDecay`: `'off'`, `'linear'`, `'exponential'`

### Structural Mutation
Controlled by `structuralRate` (default 0.1):
- **Add node:** Insert new node, create muscles to connect it
- **Remove node:** Remove node and its connected muscles (respects `minNodes`)
- **Add muscle:** Connect two unconnected nodes

**Important:** Structural mutations only happen during mutation, not crossover. If you want creatures to evolve different body plans, mutation must be enabled.

## How They Work Together

### Both Enabled (Recommended)
```python
if random() < crossover_rate:
    child = crossover(parent1, parent2)  # Combine two parents
else:
    child = clone(parent)                 # Copy single parent

child = mutate(child)                     # Always mutate the result
```

This is standard GA behavior. Crossover provides "big jumps" by combining successful traits, mutation provides "small tweaks" and structural exploration.

### Crossover Only
```python
child = crossover(parent1, parent2)
# No mutation - child is pure combination of parents
```

**Warning:** Without mutation:
- No structural changes (node/muscle count stays fixed)
- No exploration beyond parent gene ranges
- Population can converge prematurely

### Mutation Only
```python
child = clone(parent)
child = mutate(child)
```

Works fine for simple problems. Each offspring is a mutated copy of one parent. No gene combination between successful individuals.

### Neither (Not Recommended)
```python
child = clone(parent)
# No changes at all
```

Population never changes. Only useful for testing.

## Configuration Reference

| Parameter | Default | Description |
|-----------|---------|-------------|
| `selectionMethod` | `'rank'` | Selection algorithm |
| `tournamentSize` | `3` | Tournament size (if using tournament) |
| `cullPercentage` | `0.5` | Fraction of population replaced each generation |
| `useCrossover` | `false` | Enable crossover |
| `crossoverRate` | `0.5` | Probability of crossover vs clone |
| `neuralCrossoverMethod` | `'sbx'` | Neural weight crossover method |
| `sbxEta` | `2.0` | SBX distribution index |
| `useMutation` | `true` | Enable mutation |
| `mutationRate` | `0.2` | Body mutation probability |
| `mutationMagnitude` | `0.3` | Body mutation strength |
| `weightMutationRate` | `0.2` | Neural weight mutation probability |
| `weightMutationMagnitude` | `0.3` | Neural weight mutation strength |
| `weightMutationDecay` | `'linear'` | Decay schedule for weight mutation |

## Recommended Configurations

### Exploration Phase (Early Evolution)
```javascript
{
  useCrossover: true,
  crossoverRate: 0.3,      // More mutation than crossover
  useMutation: true,
  mutationRate: 0.3,
  mutationMagnitude: 0.4,
  sbxEta: 1.0,             // Wide SBX spread
  selectionMethod: 'rank'
}
```

### Exploitation Phase (Fine-Tuning)
```javascript
{
  useCrossover: true,
  crossoverRate: 0.7,      // More crossover to combine good traits
  useMutation: true,
  mutationRate: 0.1,
  mutationMagnitude: 0.2,
  sbxEta: 4.0,             // Narrow SBX spread
  selectionMethod: 'truncation'
}
```

### Stuck in Local Optimum
Enable [Adaptive Mutation](./ADAPTIVE_MUTATION.md) to automatically boost mutation when fitness stagnates.

## References

- Deb, K. & Agrawal, R.B. (1995). "Simulated Binary Crossover for Continuous Search Space." *Complex Systems*, 9(2), 115-148.
- Deb, K. & Beyer, H.G. (2001). "Self-Adaptive Genetic Algorithms with Simulated Binary Crossover." *Evolutionary Computation*, 9(2), 197-221.
- Goldberg, D.E. (1989). "Genetic Algorithms in Search, Optimization, and Machine Learning"
- Stanley, K.O. & Miikkulainen, R. (2002). "Evolving Neural Networks through Augmenting Topologies." *Evolutionary Computation*, 10(2), 99-127.

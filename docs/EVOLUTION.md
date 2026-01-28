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

## Fitness Sharing

Fitness sharing (Goldberg & Richardson, 1987) maintains population diversity by penalizing creatures that are too similar. This prevents premature convergence to a single solution.

### How It Works

1. **Calculate genome distance** between all pairs of creatures (based on neural weight differences)
2. **For each creature**, count how many others are within the "sharing radius" (similar)
3. **Divide fitness** by the niche count: `shared_fitness = raw_fitness / niche_count`

This means:
- **Unique creatures** keep their full fitness (niche count ≈ 1)
- **Crowded niches** share fitness, reducing effective score for each member
- **Selection pressure** shifts toward exploring diverse solutions

### The Sharing Function

```python
def sharing_function(distance, radius, alpha=1.0):
    if distance >= radius:
        return 0.0
    return 1.0 - (distance / radius) ** alpha
```

The sharing value is 1 for identical creatures, decreasing linearly to 0 at the sharing radius.

### Genome Distance

For neural genomes, distance is the normalized root-mean-squared difference across all weight matrices:

```python
distance = sqrt(sum((w1 - w2)^2) / num_weights)
```

For creatures without neural networks, distance is based on structural differences (node count, muscle count).

### Configuration

| Parameter | Default | Description |
|-----------|---------|-------------|
| `useFitnessSharing` | `false` | Enable/disable fitness sharing |
| `sharingRadius` | `0.5` | Distance threshold for sharing |

**Sharing radius guidelines:**
- **0.1 - 0.3** (narrow): Only very similar creatures share, preserves more unique solutions
- **0.5** (default): Moderate diversity pressure
- **1.0 - 2.0** (wide): Strong diversity pressure, even moderately different creatures share

### When to Use

- **Population converging too quickly** - creatures all look similar after few generations
- **Complex fitness landscapes** - multiple valid strategies should be explored
- **Combined with crossover** - maintains diverse gene pool for recombination

### Example

```
Without sharing:
  Creature A: fitness 100, many similar clones → all survive
  Creature B: fitness 95, unique → might get culled

With sharing (3 similar to A):
  Creature A: shared_fitness = 100 / 3 = 33
  Creature B: shared_fitness = 95 / 1 = 95 → survives!
```

## Speciation

Speciation (inspired by NEAT - Stanley & Miikkulainen, 2002) groups creatures by genome similarity. Selection happens within each species, protecting diverse solutions from being outcompeted.

### How It Works

1. **Assign genomes to species** based on neural genome distance
2. **Select survivors within each species** (each species keeps its top N%)
3. **Combine survivors** from all species for breeding

This differs from fitness sharing:
- **Fitness sharing**: Penalizes similarity (reduces fitness of clones)
- **Speciation**: Guarantees diversity (each species survives independently)

### Species Assignment

```python
def assign_species(genomes, fitness_scores, compatibility_threshold):
    species_list = []
    for genome, fitness in zip(genomes, fitness_scores):
        # Try to find compatible species
        for species in species_list:
            if distance(genome, species.representative) < compatibility_threshold:
                species.add(genome, fitness)
                break
        else:
            # Create new species
            species_list.append(Species(genome))
    return species_list
```

### Within-Species Selection

Speciation-based selection respects the global cull rate while protecting diversity:
- Total survivor budget = population × survival_rate
- If budget allows 1 per species, each species gets at least 1 survivor
- If more species than budget, top species by max fitness get 1 survivor each
- Remaining budget is allocated proportionally by species size

**Important**: The global cull rate takes precedence over `min_species_size`. With 50% cull rate, roughly 50% of the population survives regardless of species count.

### Configuration

Speciation is now a selection method. Set `selectionMethod: 'speciation'` to enable.

| Parameter | Default | Description |
|-----------|---------|-------------|
| `selectionMethod` | `'rank'` | Set to `'speciation'` for speciation-based selection |
| `compatibilityThreshold` | `1.0` | Genome distance threshold for same species |
| `minSpeciesSize` | `2` | Minimum survivors per species |

**Compatibility threshold guidelines:**
- **0.3 - 0.5** (low): Many small species, strong diversity protection
- **1.0** (default): Balanced species formation
- **1.5 - 3.0** (high): Few large species, weaker diversity protection

### When to Use

- **Exploring multiple strategies** - Protects different approaches from competing
- **Complex fitness landscapes** - Multiple local optima should coexist
- **Combined with fitness sharing** - Speciation for structure, sharing for fine-grained diversity

### Example

```
Without speciation (truncation selection, 50% cull):
  Population: [A1, A2, A3, B1]  (A-type fitness: 100, B-type fitness: 60)
  Survivors: [A1, A2]          (B-type goes extinct!)

With speciation (50% cull, 4 creatures, budget=2, 2 species):
  Budget allows 1 per species (2 species ≤ 2 budget)
  Species A: [A1, A2, A3] → gets guaranteed 1
  Species B: [B1] → gets guaranteed 1
  Survivors: [A1, B1]          (B-type protected!)
```

### Limitations (Not Implemented Yet)

- **Species persistence**: Species are recreated each generation (no tracking across generations)
- **Stagnation culling**: Species that don't improve aren't removed
- **Species visualization**: No UI to show species count or distribution

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
| `useFitnessSharing` | `false` | Enable fitness sharing for diversity |
| `sharingRadius` | `0.5` | Genome distance threshold for sharing |
| `selectionMethod` | `'rank'` | Selection method: 'truncation', 'tournament', 'rank', or 'speciation' |
| `compatibilityThreshold` | `1.0` | Genome distance threshold for same species (when using speciation) |
| `minSpeciesSize` | `2` | Minimum survivors per species (when using speciation) |

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
- Goldberg, D.E. (1989). "Genetic Algorithms in Search, Optimization, and Machine Learning." Addison-Wesley.
- Goldberg, D.E. & Richardson, J. (1987). "Genetic Algorithms with Sharing for Multimodal Function Optimization." *Proceedings of the Second International Conference on Genetic Algorithms*, 41-49.
- Stanley, K.O. & Miikkulainen, R. (2002). "Evolving Neural Networks through Augmenting Topologies." *Evolutionary Computation*, 10(2), 99-127.

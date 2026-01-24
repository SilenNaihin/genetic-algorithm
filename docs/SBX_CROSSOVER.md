# Simulated Binary Crossover (SBX)

SBX is a crossover operator for real-valued (continuous) parameters like neural network weights. It produces offspring that respect the "neighborhood" of successful parents while allowing controlled exploration.

## The Problem with Simple Crossover

### Interpolation
```
child_weight = lerp(parent1_weight, parent2_weight, random())
```
- Always produces values strictly between parents
- Cannot explore beyond the parent range
- May slow convergence when optimal values lie outside parent range

### Uniform Crossover
```
child_weight = random() < 0.5 ? parent1_weight : parent2_weight
```
- Picks each weight from either parent (50/50)
- Can be disruptive: child may inherit mismatched weights
- No smooth blending - offspring are "patchwork" of parents

## How SBX Works

SBX simulates the behavior of single-point crossover on binary-encoded strings, but for real numbers. It uses a probability distribution that:

1. Is centered around the parent values
2. Has controllable spread via the **eta (η)** parameter
3. Can produce values slightly outside the parent range

### The Algorithm

For each pair of parent values (p1, p2):

```python
def sbx_single(p1: float, p2: float, eta: float) -> float:
    # If parents are identical, no crossover needed
    if abs(p1 - p2) < 1e-14:
        return p1

    u = random()  # Uniform [0, 1]

    # Calculate spread factor beta
    if u <= 0.5:
        beta = (2 * u) ** (1 / (eta + 1))
    else:
        beta = (1 / (2 * (1 - u))) ** (1 / (eta + 1))

    # Generate two children
    child1 = 0.5 * ((1 + beta) * p1 + (1 - beta) * p2)
    child2 = 0.5 * ((1 - beta) * p1 + (1 + beta) * p2)

    # Return one randomly
    return child1 if random() < 0.5 else child2
```

### The Eta Parameter

The distribution index **η (eta)** controls how far offspring can spread from parents:

| Eta | Spread | Use Case |
|-----|--------|----------|
| 0.5-1 | Wide | Early evolution, exploration |
| 2 | Balanced | Default, general purpose |
| 3-5 | Narrow | Fine-tuning, exploitation |

**Low eta (0.5-1):**
- Children can be significantly different from parents
- Encourages exploration of the search space
- Useful when stuck in local optima

**High eta (3-5):**
- Children stay close to parents
- Preserves good solutions
- Useful for fine-tuning near the optimum

**Default eta = 2:**
- Balanced exploration/exploitation
- Good starting point for most problems

## Visual Comparison

```
Parent A weight: 0.3
Parent B weight: 0.7

Interpolation:
  - Always produces values in [0.3, 0.7]
  - Distribution: uniform across range
  - Example outputs: 0.35, 0.52, 0.68

Uniform:
  - Always produces exactly 0.3 or 0.7
  - Distribution: 50% at each parent value
  - Example outputs: 0.3, 0.7, 0.3

SBX (eta=2):
  - Usually produces values near [0.3, 0.7]
  - Can occasionally go slightly beyond
  - Distribution: peaked near parents, tails extending outward
  - Example outputs: 0.25, 0.35, 0.65, 0.75
```

## Why SBX for Neuroevolution?

1. **Respects parent structure**: Offspring weights are statistically close to parents, preserving learned behaviors

2. **Controlled exploration**: Can still discover values outside parent range when beneficial

3. **Smooth offspring distribution**: Better than uniform's binary choice

4. **Self-adaptive**: Higher fitness parents tend to have children closer to themselves

5. **Well-studied**: Decades of research in evolutionary computation validates its effectiveness

## Configuration

| Parameter | Default | Range | Description |
|-----------|---------|-------|-------------|
| `neuralCrossoverMethod` | `'sbx'` | `'interpolation'`, `'uniform'`, `'sbx'` | Which crossover to use |
| `sbxEta` | `2.0` | `0.5 - 5.0` | Distribution index |

## Implementation Notes

### Handling Identical Parents
When p1 ≈ p2, the formula becomes undefined. We short-circuit and return the parent value directly.

### Symmetric Distribution
The beta calculation ensures the probability distribution is symmetric around the parent midpoint.

### Single Child Output
The standard SBX produces two children. We randomly select one to maintain population diversity while keeping the API simple.

## References

- **Original Paper**: Deb, K. & Agrawal, R.B. (1995). "Simulated Binary Crossover for Continuous Search Space." *Complex Systems*, 9(2), 115-148.

- **Analysis**: Deb, K. & Beyer, H.G. (2001). "Self-Adaptive Genetic Algorithms with Simulated Binary Crossover." *Evolutionary Computation*, 9(2), 197-221.

- **Applications in Neuroevolution**: Stanley, K.O. & Miikkulainen, R. (2002). "Evolving Neural Networks through Augmenting Topologies." *Evolutionary Computation*, 10(2), 99-127.

## Recommendations

- **Default to SBX** with eta=2 for most neuroevolution tasks
- **Lower eta (0.5-1)** if evolution seems stuck or you want more diversity
- **Higher eta (3-5)** if good solutions are being destroyed by crossover
- **Use interpolation** if you want conservative, predictable crossover
- **Avoid uniform** unless you have a specific reason (it's the most disruptive)

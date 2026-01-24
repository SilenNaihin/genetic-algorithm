# Adaptive Mutation

Adaptive mutation automatically adjusts the mutation rate during evolution to help escape local optima when fitness stagnates.

## The Problem

In genetic algorithms, evolution can get "stuck" at local optima - plateaus where the current population is reasonably fit but small mutations can't find better solutions. This manifests as:

- Fitness stops improving for many generations
- Population converges to similar genomes
- Further evolution makes no progress

Fixed mutation rates can't handle this:
- **Too low**: Can't escape local optima
- **Too high**: Destroys good solutions, prevents fine-tuning

## The Solution

Adaptive mutation dynamically adjusts the mutation rate:

1. **Detect stagnation** by comparing rolling fitness averages
2. **Boost mutation** when stagnating to explore more
3. **Reduce mutation** when improving to fine-tune

This creates an automatic "explore vs exploit" balance.

## Algorithm

### State (stored per run)

```
adaptive_boost_level: float (1.0 = no boost, 2.0 = double, etc.)
gens_since_boost_change: int (cooldown counter)
```

### Per-generation logic

```python
def compute_adaptive_boost(history, current_boost, gens_since_change, config):
    threshold = config.stagnation_threshold  # e.g., 20 generations

    # Need 2 windows of history (40 gens with default threshold)
    if len(history) < 2 * threshold:
        return current_boost, gens_since_change + 1, 'cooldown'

    # Cooldown: wait full window between boost changes
    if gens_since_change + 1 < threshold:
        return current_boost, gens_since_change + 1, 'cooldown'

    # Compare trimmed rolling averages
    current_avg = trimmed_mean(history[-threshold:])       # Last N gens
    previous_avg = trimmed_mean(history[-2*threshold:-threshold])  # N before that

    improvement = current_avg - previous_avg

    # Three-way decision
    if improvement >= config.improvement_threshold:
        # Real improvement - halve boost toward 1.0
        return max(1.0, current_boost / 2), 0, 'improving'
    elif improvement <= 0:
        # Stagnation - double boost up to max
        return min(config.max_boost, current_boost * config.boost_factor), 0, 'stagnating'
    else:
        # Marginal - maintain, keep watching
        return current_boost, gens_since_change + 1, 'marginal'
```

### Trimmed Mean

To avoid luck-based outliers (e.g., one creature accidentally collecting 3 pellets):

```python
def trimmed_mean(values):
    if len(values) < 3:
        return mean(values)
    sorted_vals = sorted(values)
    return mean(sorted_vals[1:-1])  # Drop highest and lowest
```

## Configuration Parameters

| Parameter | Default | Description |
|-----------|---------|-------------|
| `useAdaptiveMutation` | `false` | Enable/disable the feature |
| `stagnationThreshold` | `20` | Window size for comparison (also cooldown period) |
| `adaptiveMutationBoost` | `2.0` | Multiplier per stagnation event |
| `maxAdaptiveBoost` | `8.0` | Maximum boost cap |
| `improvementThreshold` | `5.0` | Min fitness improvement to count as progress |

## Behavior Examples

### Scenario 1: Stagnation detected

```
Gen 1-20:  avg fitness = 50
Gen 21-40: avg fitness = 48 (no improvement)
→ Boost 1.0 → 2.0 (double mutation rate)

Gen 41-60: avg fitness = 49 (still stagnating)
→ Boost 2.0 → 4.0

Gen 61-80: avg fitness = 65 (improved by 16 pts > threshold)
→ Boost 4.0 → 2.0 (halve)

Gen 81-100: avg fitness = 72 (improved by 7 pts > threshold)
→ Boost 2.0 → 1.0 (back to baseline)
```

### Scenario 2: Luck spike doesn't trigger

```
Gen 1-20: best fitnesses = [50, 52, 48, 300, 51, 49, ...]
          trimmed_mean = 50 (300 excluded as outlier)

Gen 21-40: best fitnesses = [55, 58, 56, 54, 57, ...]
           trimmed_mean = 56

Improvement = 6 pts > 5 pt threshold → Real improvement detected
```

### Scenario 3: Marginal improvement

```
Gen 1-20:  trimmed_mean = 50
Gen 21-40: trimmed_mean = 53 (improvement = 3 pts)

3 pts < 5 pt threshold → Marginal, keep watching
No boost change, counter keeps incrementing
```

## Interaction with Other Features

### Mutation Decay

Adaptive boost multiplies the decayed rate:

```
effective_rate = decayed_rate * adaptive_boost_level
```

So if decay has reduced mutation to 10% and boost is 4x:
- Effective rate = 10% × 4 = 40%

### Rate Capping

Effective rates are capped at 100%:

```python
effective_rate = min(1.0, base_rate * boost)
```

## Database Schema

New columns on `runs` table (migration 004):

```sql
ALTER TABLE runs ADD COLUMN adaptive_boost_level FLOAT DEFAULT 1.0;
ALTER TABLE runs ADD COLUMN gens_since_boost_change INTEGER DEFAULT 0;
```

## UI Controls

In the Neural Network panel under "Adaptive Mutation":

- **Toggle**: Enable/disable adaptive mutation
- **Window Size**: Generations per comparison window (10-50)
- **Boost Factor**: Multiplier per stagnation event (1.5-4x)
- **Max Boost**: Maximum allowed multiplier (2-16x)
- **Improve Threshold**: Min fitness improvement in points (1-20)

## Design Decisions

### Why trimmed mean over median?

- Median is very robust but can miss gradual improvements
- Trimmed mean excludes outliers while using more data
- Better balance between robustness and sensitivity

### Why cooldown period?

- Prevents rapid oscillation between boost/reduce
- Allows mutations time to have an effect
- Cooldown = window size ensures fair comparison periods

### Why halve instead of reset?

- Gradual return to baseline prevents whiplash
- If we boosted to 8x, sudden reset to 1x might lose momentum
- Halving: 8x → 4x → 2x → 1x gives time to stabilize

### Why improvement threshold?

- Fitness has natural variance (luck, noise)
- Small improvements (1-2 pts) might be statistical noise
- Threshold ensures we only reduce boost for real progress

## Recommendations

- **For long runs (100+ gens)**: Enable adaptive mutation
- **Start conservative**: threshold=20, boost=2x, max=8x
- **Watch the boost level**: If constantly at 8x, evolution is stuck
- **If boost never increases**: Evolution is healthy, keep going

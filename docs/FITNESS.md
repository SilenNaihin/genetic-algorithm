# Fitness System

This document describes the fitness calculation system and important implementation details.

## Fitness Formula

```
fitness = banked_pellet_points + progress_to_current + distance_bonus - efficiency_penalty - regression_penalty
```

### Components

| Component | Range | Description |
|-----------|-------|-------------|
| Banked pellet points | 100 per pellet | Each collected pellet banks 100 pts (80 progress + 20 bonus) |
| Progress to current | 0-80 | Progress toward uncollected pellet |
| Distance traveled | 0-20 | XZ ground distance covered (3 pts/unit) |
| Efficiency penalty | 0-~10 | Normalized average muscle activation |
| Regression penalty | 0-20 | Moving away from pellet (after first collection) |

### Per-Pellet Scoring

Each pellet is worth up to **100 points**:
- **80 points**: Progress toward pellet (edge distance based)
- **20 points**: Collection bonus

When a pellet is collected, the 80 progress points are "banked" - they don't reset to 0 when the new pellet spawns.

**Example timeline:**
- Progress 80% toward pellet 1 → fitness ~64
- Collect pellet 1 → 100 banked + 0 new progress = 100
- Progress 50% toward pellet 2 → 100 + 40 = 140
- Collect pellet 2 → 200 banked + 0 new progress = 200

---

## Distance Calculations

All fitness distances use **edge-based XZ (ground) distance**:
- Distance from creature's nearest edge to target, not center
- Y component (height) is ignored for progress calculations
- Creature radius calculated from initial node positions with 1.3x buffer

### Creature Radius

```python
radius = max(distance_from_center_to_node_edge for all nodes) * 1.3
```

The 1.3x buffer accounts for potential muscle extension during movement.

---

## Regression Penalty

After collecting the first pellet, a regression penalty applies if the creature moves away from subsequent pellets.

```python
regression_dist = current_edge_dist - closest_edge_dist_ever
penalty = (regression_dist / (initial_distance * 0.5)) * 20  # clamped to [0, 20]
```

- `closest_edge_dist_ever`: The closest the creature ever got to the current pellet
- Penalty only kicks in after first collection (`has_collected = total_collected > 0`)
- Full penalty (20 pts) when creature regresses by 50% of initial distance

---

## Known Gotchas & Past Bugs

### 1. Progress Points Not Banking (Fixed)

**Bug:** Fitness dropped from ~80 to 20 when collecting a pellet.

**Cause:** Progress was measured toward the CURRENT pellet only. When collected, a new pellet spawned far away, resetting progress to 0:
- Before: `pellet_fitness = collected * 20` (only bonus, no banked progress)
- After: `pellet_fitness = collected * (20 + 80)` (bonus + banked progress)

**Key insight:** Each collected pellet represents successful 100% progress, which must be preserved.

### 2. Inconsistent Creature Radius (Fixed)

**Bug:** Fitness dropped even when creature stayed completely still after collection.

**Cause:** Different parts of the code calculated creature radius at different times:
- `update_pellets`: Used current positions (muscles extended/contracted)
- `calculate_fitness`: Used initial stable radius

When muscles oscillated, the edge distance calculation fluctuated, triggering false regression penalties.

**Fix:** All distance calculations now use the same stable initial radius (`fitness_state.creature_radii`).

**Key insight:** Any value used for both initialization AND runtime comparison must be consistent. Either:
- Calculate once and reuse everywhere
- Or recalculate everywhere with the same inputs

### 3. Efficiency Penalty Accumulating (Fixed Earlier)

**Bug:** Efficiency penalty grew to ~3000 points, zeroing all fitness.

**Cause:** Total muscle activation accumulated across ALL frames instead of averaging.

**Fix:** Normalize by simulation time and muscle count:
```python
avg_activation = total_activation / (simulation_time * num_muscles)
```

---

## Implementation Files

| File | Purpose |
|------|---------|
| `backend/app/simulation/fitness.py` | Core fitness calculations |
| `backend/app/simulation/physics.py` | Simulation loop integration |
| `backend/app/simulation/test_fitness.py` | Unit tests |
| `backend/app/simulation/test_parity.py` | Parity tests with TypeScript |

---

## Configuration

```python
@dataclass
class FitnessConfig:
    pellet_points: float = 20.0         # Bonus on collection (80 progress banked separately)
    progress_max: float = 80.0          # Max points for progress toward pellet
    distance_per_unit: float = 3.0      # Points per unit traveled
    distance_traveled_max: float = 20.0 # Max distance bonus
    regression_penalty: float = 20.0    # Max regression penalty
    efficiency_penalty: float = 0.5     # Penalty multiplier for muscle activation
```

---

## Testing Fitness Changes

When modifying fitness calculations:

1. Run fitness unit tests: `pytest app/simulation/test_fitness.py -v`
2. Run parity tests: `pytest app/simulation/test_parity.py -v`
3. Visual verification: Watch a creature collect pellets and verify fitness increases smoothly
4. Edge cases to check:
   - Fitness after collecting first pellet (should be ~100-120)
   - Fitness when stationary after collection (should NOT drop)
   - Fitness when moving away (regression penalty should apply gradually)

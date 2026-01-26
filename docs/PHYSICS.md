# Physics Constraints

This document explains the physics constraint systems added to prevent "spammy" creature behavior—creatures that evolve high-frequency chaotic oscillations rather than coordinated movement.

## The Problem

When neural networks control muscles, especially with many inputs (e.g., 56 proprioception inputs), creatures often evolve chaotic high-frequency behavior:

1. **Random outputs → random muscle activations** → appears to vibrate/oscillate
2. **This accidentally works** in early generations (vibration creates some movement)
3. **Evolution reinforces the noise** rather than learning coordinated control
4. **Result:** Local optimum of "spammy" behavior that's hard to escape

### Root Causes

| Problem | Why It Happens |
|---------|---------------|
| No physics limit on muscle speed | Muscles can change length arbitrarily fast |
| Step-and-hold neural outputs | NN computes, holds for N steps, computes → discontinuous |
| High-dimensional inputs | 8 hidden neurons can't meaningfully process 56 inputs |
| Weak selection pressure | Efficiency penalty alone isn't enough to discourage spam |

## Solution: Physics-Based Constraints

Instead of trying to fix the neural network (hard), we constrain the physics (easy). These changes make spammy behavior physically impossible while still allowing complex, coordinated movement.

### Design Philosophy

> "It's easier to make smooth movement the only option than to evolve it."

1. **Velocity cap**: Muscles can only change length so fast (physics reality)
2. **Output smoothing**: Neural outputs blend smoothly (muscle inertia)
3. **Extension limits**: Muscles can only stretch/compress so much (tendon limits)
4. **Damping**: Higher resistance to rapid changes (viscosity)

These constraints are biologically plausible—real muscles have all these properties.

---

## 1. Muscle Velocity Cap

**Parameter:** `muscleVelocityCap` (default: 5.0 units/second)

Limits how fast muscle rest lengths can change per timestep. This is a hard physics constraint that applies regardless of what the neural network outputs.

### Formula

```python
max_delta_per_step = velocity_cap * dt
delta = new_rest_length - prev_rest_length
clamped_delta = clamp(delta, -max_delta_per_step, max_delta_per_step)
actual_rest_length = prev_rest_length + clamped_delta
```

### Example

At 60 FPS with velocity_cap = 5.0:
- `max_delta = 5.0 * (1/60) = 0.083 units per step`
- A muscle trying to jump from 1.0 to 2.0 will instead take ~12 steps to get there

### Rationale

**Why velocity cap instead of output smoothing alone?**

- Velocity cap is a **hard constraint**—cannot be violated
- Output smoothing is a **soft constraint**—can be overcome with extreme values
- Together they provide both smooth behavior AND absolute limits

**Reference:** This is analogous to velocity limits in robotics—servos have maximum speeds regardless of commanded position.

### Configuration Guide

| Value | Effect | Use Case |
|-------|--------|----------|
| 1.0-2.0 | Very slow, "underwater" feel | Aquatic creatures |
| 3.0-5.0 | Natural, smooth movement | Default, most runs |
| 10.0-20.0 | Fast, snappy movement | If you want more responsiveness |

---

## 2. Output Smoothing (Exponential Moving Average)

**Parameters:**
- `outputSmoothingAlpha` (default: 0.3)
- `neuralUpdateHz` (default: 15 Hz)

Applies exponential smoothing to neural network outputs, creating smooth transitions instead of abrupt changes.

### Formula

```python
smoothed_output = alpha * raw_output + (1 - alpha) * previous_smoothed
```

Where:
- `alpha = 1.0`: No smoothing (instant changes)
- `alpha = 0.5`: 50% new + 50% old (light smoothing)
- `alpha = 0.3`: 30% new + 70% old (moderate smoothing, default)
- `alpha = 0.1`: 10% new + 90% old (heavy smoothing)

### Neural Update Rate

The neural network doesn't recompute every physics step. Instead:

```python
nn_update_interval = physics_fps / neural_update_hz
# At 60 FPS physics, 15 Hz neural: update every 4 physics steps
```

This reduces jitter by caching outputs and provides natural "reaction time."

### Rationale

**Why exponential smoothing instead of low-pass filter?**

1. **Simplicity**: EMA requires only one previous value
2. **No phase lag**: Response is immediate, just dampened
3. **Tunable**: Single parameter (alpha) controls smoothness
4. **Stable**: No resonance or oscillation issues

**Reference:** Exponential smoothing is standard in control systems and signal processing. The same concept appears in:
- Temporal difference learning (TD(λ))
- Adam optimizer's momentum terms
- Real-time audio processing

### Configuration Guide

| Alpha | Effect | Use Case |
|-------|--------|----------|
| 0.1 | Very smooth, slow transitions | Creatures that should move deliberately |
| 0.3 | Moderate smoothing (default) | Most runs, good balance |
| 0.5 | Light smoothing | More responsive creatures |
| 1.0 | No smoothing | Testing, or if using velocity cap alone |

---

## 3. Maximum Extension Ratio

**Parameter:** `maxExtensionRatio` (default: 2.0)

Limits how much muscles can stretch or compress relative to their rest length.

### Formula

```python
min_length = base_rest_length / ratio  # e.g., 1.0 / 2.0 = 0.5
max_length = base_rest_length * ratio  # e.g., 1.0 * 2.0 = 2.0
actual_length = clamp(desired_length, min_length, max_length)
```

### Example

With ratio = 2.0 and base rest length of 1.0:
- Muscle can compress to 0.5 (50% of rest)
- Muscle can stretch to 2.0 (200% of rest)
- Cannot go below 0.5 or above 2.0

### Rationale

**Why limit extension?**

1. **Prevents grotesque stretching**: Creatures stay "solid" looking
2. **Reduces numerical instability**: Extreme lengths cause force spikes
3. **Biologically plausible**: Real muscles have physical stretch limits

**Reference:** Muscle physiology research shows skeletal muscles can typically:
- Contract to ~50-70% of resting length
- Stretch to ~150-180% of resting length (before damage)

Our default of 2.0x is generous but prevents infinite stretching.

### Configuration Guide

| Ratio | Range | Use Case |
|-------|-------|----------|
| 1.2-1.5 | ±20-50% | Stiff creatures, compact movement |
| 2.0 | ±100% | Default, balanced |
| 3.0-5.0 | ±200-400% | Stretchy creatures, dramatic movement |

---

## 4. Muscle Damping Multiplier

**Parameter:** `muscleDampingMultiplier` (default: 1.0)

Global scale factor applied to all per-muscle damping coefficients.

### Formula

```python
effective_damping = base_damping * damping_multiplier
damping_force = -effective_damping * relative_velocity
```

### Rationale

**Why global damping instead of per-muscle?**

1. **Simplicity**: One knob to adjust overall viscosity
2. **Consistency**: All muscles respond similarly to rapid changes
3. **Tunable environment**: Can simulate different media (air vs water)

**Reference:** This is analogous to medium viscosity in fluid dynamics. Higher damping simulates denser fluids where rapid movements are harder.

### Configuration Guide

| Multiplier | Effect | Use Case |
|------------|--------|----------|
| 0.1-0.5 | Less damping, snappy | Fast, responsive creatures |
| 1.0 | Default | Normal physics |
| 2.0-3.0 | More damping | Slow, deliberate movement |
| 4.0-5.0 | High damping, "underwater" | Aquatic simulation |

---

## Interaction Between Constraints

The constraints are applied in this order each physics step:

```
1. Neural network computes raw outputs (every N steps)
2. Output smoothing applied (EMA with alpha)
3. Rest length computed from smoothed output
4. Velocity cap applied (clamp delta)
5. Extension limit applied (clamp absolute value)
6. Spring forces computed with final rest length
7. Damping forces computed (scaled by multiplier)
```

### Why This Order?

- **Smoothing before velocity cap**: Smoothed targets get rate-limited
- **Velocity cap before extension**: Rate-limit first, then absolute limit
- **Damping after forces**: Damping opposes motion, computed from velocities

---

## Comparison: Before and After

### Before (No Constraints)

```
Neural Output: [0.9, -0.8, 0.7, -0.9, 0.8, ...]  (noisy)
Muscle Lengths: Jump between extremes each step
Movement: High-frequency vibration, "spazzy"
Fitness: Low but non-zero (vibration creates some progress)
```

### After (With Constraints)

```
Neural Output: [0.9, -0.8, 0.7, ...]  (still noisy)
Smoothed Output: [0.3, -0.1, 0.15, ...]  (dampened)
Velocity Cap: Length changes limited to 0.08/step
Extension: Length bounded to 50%-200%
Movement: Smooth transitions, can't vibrate fast
Fitness: Must evolve coordinated patterns to move
```

---

## Evolutionary Implications

### Selection Pressure

With constraints:
1. **Spammy behavior doesn't work**: Can't vibrate fast enough to move
2. **Coordinated patterns required**: Must evolve actual control strategies
3. **Efficiency matters more**: Wasted activation penalized, can't brute-force

### Recommended Combined Configuration

For runs that were previously getting stuck in spammy local optima:

```typescript
{
  // Physics constraints
  muscleVelocityCap: 5.0,        // Limit muscle speed
  maxExtensionRatio: 2.0,        // Limit stretch range
  muscleDampingMultiplier: 1.0,  // Normal damping

  // Neural timing
  neuralUpdateHz: 15,            // Update 15x/sec (not every frame)
  outputSmoothingAlpha: 0.3,     // Moderate smoothing

  // Keep efficiency penalty
  fitnessEfficiencyPenalty: 0.1, // Penalize excessive activation
}
```

---

## Implementation Details

### Files

| File | Contents |
|------|----------|
| `backend/app/simulation/physics.py` | `apply_velocity_cap()`, `apply_extension_limit()`, `apply_output_smoothing()` |
| `backend/app/services/pytorch_simulator.py` | Passes config through to physics |
| `backend/app/schemas/simulation.py` | Pydantic models with validation |
| `src/types/simulation.ts` | TypeScript types and defaults |

### Tests

| Test File | Coverage |
|-----------|----------|
| `test_velocity_cap.py` | 11 tests for velocity capping |
| `test_output_smoothing.py` | 14 tests for smoothing and NN update rate |
| `test_damping_extension.py` | 15 tests for damping and extension limits |

---

## References

1. **Muscle Physiology:**
   - Herzog, W. (2000). "Skeletal Muscle Mechanics: From Mechanisms to Function." Wiley.
   - Zajac, F.E. (1989). "Muscle and tendon: Properties, models, scaling, and application to biomechanics and motor control." *Critical Reviews in Biomedical Engineering*, 17(4), 359-411.

2. **Control Theory:**
   - Åström, K.J. & Murray, R.M. (2010). "Feedback Systems: An Introduction for Scientists and Engineers." Princeton University Press.
   - Exponential moving average is a standard technique in signal processing and control systems.

3. **Neuroevolution:**
   - Stanley, K.O. & Miikkulainen, R. (2002). "Evolving Neural Networks through Augmenting Topologies." *Evolutionary Computation*, 10(2), 99-127.
   - The problem of neural networks evolving "spam" behaviors is well-documented in continuous control domains.

4. **Soft Robotics:**
   - Rus, D. & Tolley, M.T. (2015). "Design, fabrication and control of soft robots." *Nature*, 521(7553), 467-475.
   - Physical constraints on soft actuators are analogous to our muscle constraints.

# Creature Genome Specification

This document describes the complete genetic makeup of creatures in Evolution Lab, including all heritable traits, how they mutate, what creatures can perceive, and how they exercise agency.

**Version History:**
- **v1**: Direction-modulated oscillation (pellet direction sensing)
- **v2**: Proprioception + distance awareness (velocity sensing, pellet distance)

---

## Overview

A creature's genome defines:
1. **Morphology** - Body structure (nodes and their connections)
2. **Locomotion** - How muscles oscillate to produce movement
3. **Perception** - What environmental information creatures can sense
4. **Volition** - How creatures translate perception into directed action

---

## Genome Structure

### CreatureGenome (Top Level)

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique identifier |
| `generation` | number | Lineage depth (ancestor count) |
| `survivalStreak` | number | Consecutive generations this creature survived |
| `parentIds` | string[] | IDs of parent creature(s) |
| `nodes` | NodeGene[] | Body segments (2-8 typically) |
| `muscles` | MuscleGene[] | Connections between nodes (1-15) |
| `globalFrequencyMultiplier` | number | Scales all muscle frequencies (0.3-2.0) |
| `controllerType` | 'oscillator' \| 'neural' | Control system type (currently oscillator only) |
| `color` | HSL | Visual appearance |

---

## Node Genes (Body Segments)

Each node is a spherical body part with physical properties.

| Gene | Range | Effect | Mutation |
|------|-------|--------|----------|
| `size` | 0.2 - 0.8 | Radius and mass (mass = volume × 10) | ±magnitude within range |
| `friction` | 0.1 - 1.0 | Surface grip on ground | ±magnitude within range |
| `position.x` | -spawnRadius to +spawnRadius | Initial X position | ±(magnitude × 0.5) |
| `position.y` | 0.3 - spawnRadius×1.5 | Initial Y position (height) | ±(magnitude × 0.5) |
| `position.z` | -spawnRadius to +spawnRadius | Initial Z position | ±(magnitude × 0.5) |

### Visual Encoding
- **Cyan nodes** = Low friction (slippery)
- **Orange nodes** = High friction (grippy)
- **Size** = Visual sphere size

---

## Muscle Genes (Connections)

Each muscle is a spring connecting two nodes that oscillates rhythmically.

### Physical Properties

| Gene | Range | Effect | Mutation |
|------|-------|--------|----------|
| `restLength` | 0.2 - 4.0 | Natural spring length | ±(magnitude × 0.3) |
| `stiffness` | 50 - 500 | Spring constant (force = k × displacement) | ±magnitude within range |
| `damping` | 0.05 - 0.8 | Energy dissipation rate | ±magnitude within range |

### Oscillation Properties (Locomotion)

| Gene | Range | Effect | Mutation |
|------|-------|--------|----------|
| `frequency` | 0.5 - 3.0 Hz | Contraction cycle speed | ±magnitude within range |
| `amplitude` | 0.05 - 0.4 | Contraction strength (fraction of restLength) | ±magnitude within range |
| `phase` | 0 - 2π | Timing offset in cycle | ±magnitude within range |

### Direction Bias (v1 - Pellet Direction Sensing)

| Gene | Range | Effect | Mutation |
|------|-------|--------|----------|
| `directionBias` | Unit vector | Preferred pellet direction for this muscle | Perturb + normalize |
| `biasStrength` | 0 - 1.0 | How much direction affects contraction | ±magnitude within range |

### Velocity Sensing (v2 - Proprioception)

| Gene | Range | Effect | Mutation |
|------|-------|--------|----------|
| `velocityBias` | Unit vector | Preferred movement direction for this muscle | Perturb + normalize |
| `velocityStrength` | 0 - 1.0 | How much own velocity affects contraction | ±magnitude within range |

**What this enables:** Creatures can sense their own movement and react to it. A muscle with `velocityBias` pointing forward and high `velocityStrength` will contract more when the creature is already moving forward - creating momentum-based behaviors like "keep going in the direction I'm moving" or "brake when moving away from pellet."

### Distance Awareness (v2 - Pellet Distance Sensing)

| Gene | Range | Effect | Mutation |
|------|-------|--------|----------|
| `distanceBias` | -1.0 to 1.0 | Activate more when far (-1) or near (+1) | ±magnitude within range |
| `distanceStrength` | 0 - 1.0 | How much pellet distance affects contraction | ±magnitude within range |

**What this enables:** Creatures can have different behaviors based on pellet proximity:
- **"Sprint muscles"** (`distanceBias: +1`): Contract harder when close to pellet (final push)
- **"Search muscles"** (`distanceBias: -1`): Contract harder when far from pellet (exploration)

### Visual Encoding
- **Blue muscles** = Slow frequency (calm)
- **Red muscles** = Fast frequency (energetic)
- **Thickness** = Higher stiffness

---

## Perception System

### What Creatures Can Sense

| Sense | Version | Implementation | Resolution |
|-------|---------|----------------|------------|
| **Pellet Direction** | v1 | Vector from center-of-mass to active pellet | Continuous 3D unit vector |
| **Own Velocity** | v2 | Center-of-mass velocity vector | Continuous 3D vector (normalized) |
| **Pellet Distance** | v2 | Distance from center-of-mass to active pellet | Continuous scalar (normalized 0-1) |

### What Creatures Cannot Sense
- Individual node positions (no fine proprioception)
- Ground contact per node
- Muscle stretch state
- Other creatures
- Multiple pellets (only active pellet)
- Time elapsed
- Absolute position in world

### Sensory Processing (v2)
Each physics step (60 Hz):
1. Calculate creature's center of mass
2. Calculate creature's velocity (delta position / delta time)
3. Find active (uncollected) pellet position
4. Compute normalized direction vector: `pelletDir = normalize(pelletPos - centerOfMass)`
5. Compute normalized velocity: `velocityDir = normalize(velocity)`
6. Compute normalized distance: `pelletDist = clamp(distance / maxDistance, 0, 1)`
7. All sensors available to all muscles simultaneously

---

## Volition System

### How Creatures Make "Decisions"

Creatures don't have explicit decision-making. Instead, **multi-factor modulated oscillation** creates emergent steering and behavioral adaptation.

#### Muscle Contraction Formula (v2)

```
baseContraction = sin(time × frequency × 2π + phase)

// v1: Direction sensing
directionMatch = dot(pelletDirection, muscle.directionBias)  // -1 to +1
directionMod = directionMatch × biasStrength

// v2: Velocity sensing (proprioception)
velocityMatch = dot(velocityDirection, muscle.velocityBias)  // -1 to +1
velocityMod = velocityMatch × velocityStrength

// v2: Distance sensing
nearness = 1 - normalizedDistance  // 1 when close, 0 when far
distanceMod = (distanceBias × nearness) × distanceStrength

// Combined modulation
modulation = 1 + directionMod + velocityMod + distanceMod
modulation = clamp(modulation, 0.1, 2.5)  // Prevent extreme values

finalContraction = baseContraction × amplitude × modulation
newRestLength = baseRestLength × (1 - finalContraction)
```

#### How Each Modulation Creates Behavior

| Modulation | Positive Match | Negative Match | Zero Match |
|------------|----------------|----------------|------------|
| **Direction** | Pellet in preferred dir → amplify | Pellet opposite → dampen | Perpendicular → normal |
| **Velocity** | Moving in preferred dir → amplify | Moving opposite → dampen | Stationary → normal |
| **Distance** | Near + positive bias → amplify | Far + negative bias → amplify | Neutral distance → normal |

#### Emergent Behaviors (v2)

A creature can evolve muscles that produce:
- **"Turn toward pellet"**: Right muscles have left direction bias (v1)
- **"Sprint when close"**: Leg muscles have positive distance bias (v2)
- **"Search when far"**: Wide-swing muscles have negative distance bias (v2)
- **"Maintain momentum"**: Forward muscles have forward velocity bias (v2)
- **"Brake when overshooting"**: Opposing muscles activate when moving away from pellet (v2)

The oscillation provides the *power*, direction bias provides *steering*, velocity bias provides *momentum control*, and distance bias provides *effort scaling*.

---

## Mutation System

### Mutation Configuration

| Parameter | Default | Effect |
|-----------|---------|--------|
| `rate` | 0.3 (30%) | Probability each gene mutates |
| `magnitude` | 0.5 | Scale of changes (0-1) |
| `structuralRate` | 0.1 (10%) | Probability of adding/removing nodes or muscles |

### Mutation Types

#### 1. Value Mutations (per gene, 30% chance each)
- Each numeric gene is perturbed: `newValue = oldValue + random(-1,1) × range × magnitude`
- Values are clamped to valid ranges
- Bias vectors (direction, velocity) are perturbed then re-normalized

#### 2. Structural Mutations (10% chance each)

| Mutation | Effect |
|----------|--------|
| **Add Node** | Creates new node near existing node + connecting muscle |
| **Remove Node** | Removes least-connected node + its muscles |
| **Add Muscle** | Creates new connection between unconnected nodes |

### What Mutations Cannot Do
- Change number of nodes below minimum (2)
- Exceed maximum nodes (8) or muscles (15)
- Create self-loops (muscle connecting node to itself)
- Create duplicate connections
- Directly copy another creature's genes (except through crossover)

---

## Crossover System

When two creatures reproduce:

### Single-Point Crossover
- Child inherits structure from parent 1
- Each gene value is interpolated: `childValue = lerp(parent1, parent2, random())`
- Bias vectors (direction, velocity) are interpolated then normalized

### Uniform Crossover
- Each gene randomly selected from either parent (50/50)
- Structure from randomly chosen parent

### Cloning
- Exact copy with new IDs
- No genetic variation (mutations applied separately)

---

## Constraints Reference

| Constraint | Default | Effect |
|------------|---------|--------|
| `minNodes` | 2 | Minimum body segments |
| `maxNodes` | 8 | Maximum body segments |
| `minMuscles` | 1 | Minimum connections |
| `maxMuscles` | 15 | Maximum connections |
| `minSize` | 0.2 | Smallest node radius |
| `maxSize` | 0.8 | Largest node radius |
| `minStiffness` | 50 | Weakest spring |
| `maxStiffness` | 500 | Strongest spring |
| `minFrequency` | 0.5 Hz | Slowest oscillation |
| `maxFrequency` | 3.0 Hz | Fastest oscillation |
| `maxAmplitude` | 0.4 | Maximum contraction (40% of rest length) |
| `spawnRadius` | 2.0 | Initial node spread |

---

## Evolution Pressure

### What Gets Selected For

1. **Pellet Collection** (primary) - +100 fitness per pellet
2. **Proximity to Pellet** - Bonus for being close to active pellet
3. **Movement** - Small bonus for total path length (capped)
4. **Net Displacement** - Optional bonus for straight-line travel

### What This Selects For in Genomes

| Trait | Selection Pressure |
|-------|-------------------|
| Efficient locomotion | Movement + pellet collection |
| Directional steering (v1) | Pellet proximity + collection |
| Momentum control (v2) | Efficient approach paths |
| Effort scaling (v2) | Sprint vs search behaviors |
| Appropriate body size | Trade-off: mobility vs. reach |
| Coordinated oscillation | Effective gaits emerge |

---

## Future Directions

### Phase Coupling (Coordinated Gaits)

**Problem:** Each muscle oscillates independently. Real animals have coupled oscillators that create gaits.

**Proposed genes:**
```typescript
interface MuscleGene {
  // ... existing ...
  coupledTo: string[];        // IDs of muscles this one syncs with
  couplingStrength: number;   // How much to match their phase (0-1)
  couplingOffset: number;     // Phase offset from coupled muscles (0 = sync, π = alternating)
}
```

**What this enables:** A creature could evolve "left leg alternates with right leg" without explicit coordination. Muscles would pull each other's phases toward their coupling offset, creating stable gaits like walk, trot, and gallop patterns.

**Implementation complexity:** Medium - requires tracking muscle phases and applying coupling forces each step.

---

### Reflex Arcs (Direct Sensor-Motor Links)

**Problem:** All muscles respond to the same global signals. Real animals have local reflexes.

**Proposed structure:**
```typescript
interface ReflexGene {
  id: string;
  sensorNode: string;              // Which node triggers this reflex
  triggerCondition: 'ground_contact' | 'high_stretch' | 'collision' | 'low_height';
  threshold: number;               // Activation threshold
  targetMuscle: string;            // Which muscle responds
  responseType: 'contract' | 'relax' | 'freeze';
  responseStrength: number;        // How much to override normal behavior (0-1)
  responseDelay: number;           // Frames before response (0-10)
}

interface CreatureGenome {
  // ... existing ...
  reflexes: ReflexGene[];          // 0-10 reflexes
}
```

**What this enables:**
- "When front node hits ground → contract back muscles" (walking reflex)
- "When stretched too far → relax" (protective reflex)
- "When falling → spread out" (stabilization)

**Implementation complexity:** Medium-High - requires per-node collision detection and a reflex evaluation system.

---

### Behavioral Modes (State Machine)

**Problem:** Creatures have one fixed behavior pattern. Real animals switch between modes.

**Proposed structure:**
```typescript
interface BehavioralMode {
  id: string;
  name: string;                              // 'search' | 'approach' | 'sprint'
  muscleMultipliers: Map<string, number>;    // Scale each muscle's output
  frequencyMultiplier: number;               // Overall speed adjustment (0.5-2.0)
  amplitudeMultiplier: number;               // Overall effort adjustment (0.5-2.0)
}

interface ModeTransition {
  fromMode: string;
  toMode: string;
  condition: 'pellet_near' | 'pellet_far' | 'moving_slow' | 'moving_fast' | 'stuck';
  threshold: number;
  hysteresis: number;                        // Prevents rapid switching
}

interface CreatureGenome {
  // ... existing ...
  modes: BehavioralMode[];                   // 2-4 distinct behavior sets
  transitions: ModeTransition[];             // Rules for switching
  currentMode: string;                       // Runtime state (not inherited)
}
```

**What this enables:**
- **Search mode**: Slow, wide movements, high amplitude - for exploration
- **Approach mode**: Directed, moderate speed - for navigation
- **Sprint mode**: Fast, narrow movements - for final approach
- Automatic switching based on distance, velocity, or time spent stuck

**Implementation complexity:** High - requires state tracking, transition logic, and mode blending.

---

### Neural Network Controller (Long-term)

**Problem:** Evolved weights have limited representational power compared to learned networks.

**Proposed approach:**
```typescript
interface NeuralControllerGene {
  inputNodes: ('pellet_dir_x' | 'pellet_dir_y' | 'pellet_dir_z' |
               'velocity_x' | 'velocity_y' | 'velocity_z' |
               'pellet_dist' | 'time_phase')[];
  hiddenLayers: number[];         // e.g., [8, 4] = two hidden layers
  outputNodes: string[];          // Muscle IDs
  weights: number[];              // Flattened weight matrix (evolved, not learned)
  activationFunction: 'tanh' | 'relu' | 'sigmoid';
}
```

**What this enables:** Arbitrary input-output mappings, learned during evolution. Could develop complex conditional behaviors impossible with direct gene-to-behavior mappings.

**Implementation complexity:** Very High - requires neural network forward pass per step, careful weight initialization, and likely NEAT-style topology evolution.

---

### Comparison of Future Extensions

| Feature | Behavior Richness | Implementation Effort | Evolution Speed |
|---------|-------------------|----------------------|-----------------|
| Phase Coupling | Medium | Medium | Fast |
| Reflex Arcs | High | Medium-High | Medium |
| Behavioral Modes | Very High | High | Slow |
| Neural Networks | Unlimited | Very High | Very Slow |

**Recommended order:** Phase Coupling → Reflex Arcs → Behavioral Modes → Neural Networks

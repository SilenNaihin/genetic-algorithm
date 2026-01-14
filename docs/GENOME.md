# Creature Genome Specification

This document describes the complete genetic makeup of creatures in Evolution Lab, including all heritable traits, how they mutate, what creatures can perceive, and how they exercise agency.

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

### Direction Bias (Perception & Volition)

| Gene | Range | Effect | Mutation |
|------|-------|--------|----------|
| `directionBias` | Unit vector | Preferred pellet direction for this muscle | Perturb + normalize |
| `biasStrength` | 0 - 1.0 | How much direction affects contraction | ±magnitude within range |

### Visual Encoding
- **Blue muscles** = Slow frequency (calm)
- **Red muscles** = Fast frequency (energetic)
- **Thickness** = Higher stiffness

---

## Perception System

### What Creatures Can Sense

| Sense | Implementation | Resolution |
|-------|----------------|------------|
| **Pellet Direction** | Vector from center-of-mass to active pellet | Continuous 3D unit vector |
| **Pellet Distance** | Implicit (through fitness gradient) | Indirect only |

### What Creatures Cannot Sense
- Their own body configuration (no proprioception)
- Velocity or momentum
- Ground contact
- Other creatures
- Multiple pellets (only active pellet)
- Time elapsed

### Sensory Processing
Each physics step (60 Hz):
1. Calculate creature's center of mass
2. Find active (uncollected) pellet position
3. Compute normalized direction vector: `pelletDir = normalize(pelletPos - centerOfMass)`
4. This direction is available to all muscles simultaneously

---

## Volition System

### How Creatures Make "Decisions"

Creatures don't have explicit decision-making. Instead, **direction-modulated oscillation** creates emergent steering behavior.

#### Muscle Contraction Formula

```
baseContraction = sin(time × frequency × 2π + phase)
directionMatch = dot(pelletDirection, muscle.directionBias)  // -1 to +1
modulation = 1 + directionMatch × biasStrength
finalContraction = baseContraction × amplitude × modulation
newRestLength = baseRestLength × (1 - finalContraction)
```

#### How This Creates Steering

| Scenario | directionMatch | Effect |
|----------|----------------|--------|
| Pellet in muscle's preferred direction | +1 | Contraction amplified up to 2× |
| Pellet perpendicular to preference | 0 | Normal oscillation |
| Pellet opposite to preference | -1 | Contraction dampened (can invert) |

#### Emergent Behaviors

A creature can evolve muscles with biases that produce:
- **"Turn left when pellet is left"**: Right-side muscles have leftward bias
- **"Move forward when pellet ahead"**: Back muscles have forward bias
- **"Reach upward for elevated pellets"**: Upper muscles have upward bias

The oscillation provides the *power* (rhythmic locomotion), while direction bias provides the *steering*.

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
- Direction bias vectors are perturbed then re-normalized

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
- Direction bias vectors are interpolated then normalized

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
| Directional steering | Pellet proximity + collection |
| Appropriate body size | Trade-off: mobility vs. reach |
| Coordinated oscillation | Effective gaits emerge |
| Direction bias wiring | "Correct" steering emerges |

---

## Future Extensions (Planned)

| Feature | Status | Notes |
|---------|--------|-------|
| Neural network controller | Interface exists | Replace oscillator with learned policy |
| Proprioception | Not implemented | Sense own body configuration |
| Velocity sensing | Not implemented | Know movement direction/speed |
| Multi-pellet awareness | Not implemented | Plan paths to multiple targets |
| Memory | Not implemented | Learn from past attempts |

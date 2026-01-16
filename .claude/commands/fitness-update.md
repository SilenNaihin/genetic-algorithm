# Fitness Function Update Checklist

When making changes to the fitness function, ensure all these locations are updated:

## Core Implementation
- **src/simulation/BatchSimulator.ts** - Main fitness calculation in `calculateCurrentFitness()`
  - Config values are read at the start of `simulateCreature()`
  - Fitness breakdown: pelletPoints per pellet + progressMax toward pellet + movementMax for displacement - regressionPenalty

## Type Definitions
- **src/types/simulation.ts** - `SimulationConfig` interface
  - `fitnessPelletPoints`: Points per pellet collected (default 100)
  - `fitnessProgressMax`: Max progress bonus toward pellet (default 80)
  - `fitnessMovementMax`: Max bonus for net displacement (default 25)
  - `fitnessRegressionPenalty`: Penalty for moving away after 1st pellet (default 20)
  - Also update `DEFAULT_CONFIG` with any new defaults

## Storage/Replay
- **src/storage/RunStorage.ts** - `recalculateFitnessOverTime()` for replay visualization
  - Must match the logic in BatchSimulator for consistent replay

## UI
- **src/main.ts** - Menu UI updates:
  - Fitness panel HTML (around line 313)
  - `setupFitnessSlider()` method
  - `resetFitnessDefaults()` method
  - `getSettingsInfoHTML()` for the settings info dropdown

## Current Fitness Model
```
Fitness = (pelletsCollected * pelletPoints)
        + (progressTowardPellet * progressMax)
        + (netDisplacementRate * movementMax)
        - (regressionRatio * regressionPenalty)  // Only after 1st pellet
```

Where:
- `progressTowardPellet`: 0-1 based on XZ distance from creature's edge to pellet
- `netDisplacementRate`: XZ displacement rate (units/sec), capped at 1.0
- `regressionRatio`: How far the creature moved away from its closest approach

The minimum fitness is clamped to 0.

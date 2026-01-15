# Documentation Index

## Project Documentation

- [README.md](../README.md) - Project overview and usage

## Architecture

- **main.ts** - Main application class (EvolutionApp) with UI, state, rendering
- **storage/RunStorage.ts** - IndexedDB persistence layer
- **simulation/BatchSimulator.ts** - Headless physics simulation
- **genetics/** - Evolution operators (selection, crossover, mutation)

## Key Concepts

### Creatures
Soft-bodied entities with:
- **Nodes**: Spheres with size and friction
- **Muscles**: Springs connecting nodes with frequency and stiffness

### Fitness Function
Creatures are scored on:
- **Progress (0-80)**: XZ ground distance from creature's edge toward pellet
- **Collection (+20)**: Bonus when pellet actually collected
- **Regression (-20 max)**: Penalty for moving away (after first pellet)

### Storage
Runs and generations are saved to IndexedDB. Creature frames are compacted to reduce storage size.

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
- Pellets collected
- Proximity to active pellet
- Movement (path length)
- Distance (net displacement)

### Storage
Runs and generations are saved to IndexedDB. Creature frames are compacted to reduce storage size.

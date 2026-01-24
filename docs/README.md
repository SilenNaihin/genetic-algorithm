# Documentation Index

## Project Documentation

- [README.md](../README.md) - Project overview and usage
- [CHANGELOG.md](../CHANGELOG.md) - Version history and changes

## Core Concepts

### Creatures
- [GENOME.md](./GENOME.md) - Complete genome specification, perception, volition

### Control Systems
- **Oscillator** (default) - Sinusoidal muscle contraction with modulation
- **Neural Network** (optional) - Learned input→output mappings

### Neural Network Documentation
- [NEURAL.md](./NEURAL.md) - Neural network evolution overview
- [NEURAL_IMPLEMENTATION.md](./NEURAL_IMPLEMENTATION.md) - Implementation checklist
- [NEAT_FUTURE.md](./NEAT_FUTURE.md) - Topology evolution roadmap

## Architecture

```
src/
├── core/           - Creature, Genome, Pellet entities
├── genetics/       - Selection, Crossover, Mutation operators
├── neural/         - Neural network controller (planned)
├── physics/        - Cannon.js physics wrapper
├── rendering/      - Three.js visualization
├── simulation/     - BatchSimulator (headless physics)
├── storage/        - IndexedDB persistence
├── types/          - TypeScript interfaces
├── ui/             - UI components
└── main.ts         - Application entry point
```

## Key Files

| File | Purpose |
|------|---------|
| `main.ts` | Main application class (EvolutionApp) with UI, state, rendering |
| `simulation/BatchSimulator.ts` | Headless physics simulation, fitness calculation |
| `genetics/Selection.ts` | Fitness-based selection |
| `genetics/Mutation.ts` | Genome mutation operators |
| `genetics/Crossover.ts` | Genetic crossover operators |
| `storage/RunStorage.ts` | IndexedDB persistence layer |

## Fitness Function

Creatures are scored on (all distances measured from creature edge, XZ-only):
- **Progress (0-80)**: Distance from creature's edge toward current pellet
- **Collection (+20)**: Bonus when pellet collected (80 progress + 20 collection = 100 total per pellet)
- **Distance Traveled (0-20)**: Total XZ distance traveled during simulation
- **Regression (-20 max)**: Penalty for moving away from pellet (only after first pellet collection)

## Storage

Runs and generations are saved to IndexedDB. Creature frames are compacted to reduce storage size.

## Learning Resources

See `notebooks/` for Jupyter notebooks explaining:
- Genetic algorithms and neuroevolution
- NEAT (NeuroEvolution of Augmenting Topologies)
- How these concepts apply to Evolution Lab

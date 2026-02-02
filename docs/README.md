# Documentation Index

## Project Documentation

- [README.md](../README.md) - Project overview and usage
- [CHANGELOG.md](../CHANGELOG.md) - Version history and changes
- [CLAUDE.md](../CLAUDE.md) - Development conventions and quick reference

## Core Concepts

### Creatures & Genomes
- [GENOME.md](./GENOME.md) - Complete genome specification, perception, volition

### Physics & Simulation
- [PHYSICS.md](./PHYSICS.md) - Physics system documentation
- [FITNESS.md](./FITNESS.md) - Fitness calculation system, known gotchas, and past bugs

### Evolution & Genetics
- [EVOLUTION.md](./EVOLUTION.md) - Evolution system overview
- [ADAPTIVE_MUTATION.md](./ADAPTIVE_MUTATION.md) - Adaptive mutation rates

### Neural Networks
- [NEURAL.md](./NEURAL.md) - Neural network evolution overview (pure/hybrid modes)
- [NEAT.md](./NEAT.md) - NEAT (NeuroEvolution of Augmenting Topologies) technical reference

### Experiments
- [NAS.md](./NAS.md) - Neural Architecture Search experiments
- [NAS-CLI.md](./NAS-CLI.md) - NAS CLI documentation
- [optimized-runs.md](./optimized-runs.md) - Optimized run configurations


## Architecture

```
app/                    # Next.js React application
├── components/         # React components (grid, menu, modals, ui)
├── hooks/              # React hooks (useSimulation)
├── stores/             # Zustand state management
├── menu/               # /menu route - configuration screen
└── run/[runId]/        # /run/[runId] route - evolution view

src/                    # Core simulation modules (shared)
├── core/               # Domain models (Genome)
├── neural/             # Neural network types and initialization
├── rendering/          # Three.js visualization
├── services/           # SimulationService, StorageService
├── simulation/         # BatchSimulator (headless)
├── storage/            # IndexedDB persistence
├── types/              # TypeScript interfaces
├── ui/                 # Shared UI components
└── utils/              # Math, ID utilities

backend/                # Python backend (FastAPI + PyTorch)
├── app/
│   ├── api/            # FastAPI routes
│   ├── genetics/       # Selection, mutation, crossover
│   ├── neural/         # BatchedNeuralNetwork, NEAT
│   ├── schemas/        # Pydantic models
│   ├── services/       # PyTorchSimulator
│   └── simulation/     # Batched tensor physics
└── fixtures/           # Test genomes

nas/                    # Neural Architecture Search
```

## Key Files

| File | Purpose |
|------|---------|
| `app/stores/evolutionStore.ts` | Zustand state management for evolution runs |
| `app/hooks/useSimulation.ts` | React hook for simulation lifecycle |
| `src/simulation/BatchSimulator.ts` | Headless physics simulation bridge |
| `src/storage/RunStorage.ts` | IndexedDB persistence layer |
| `backend/app/genetics/` | Selection, mutation, crossover operators |
| `backend/app/simulation/physics.py` | PyTorch batched physics engine |
| `backend/app/neural/neat_network.py` | NEAT network implementation |

## Fitness Function

See [FITNESS.md](./FITNESS.md) for complete documentation.

**Summary** (all distances XZ-only, measured from creature edge):
- **Banked (100/pellet)**: Each collected pellet banks 100 pts (80 progress + 20 bonus)
- **Progress (0-80)**: Progress toward current uncollected pellet
- **Distance Traveled (0-20)**: Total XZ distance traveled during simulation
- **Regression (-20 max)**: Penalty for moving away from pellet (only after first collection)

## Storage

Runs and generations are saved to IndexedDB. Creature frames are compacted to reduce storage size.

## Learning Resources

See `notebooks/` for Jupyter notebooks explaining:
- Genetic algorithms and neuroevolution
- NEAT (NeuroEvolution of Augmenting Topologies)
- How these concepts apply to Evolution Lab

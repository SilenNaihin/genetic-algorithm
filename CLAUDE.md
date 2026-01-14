# Evolution Lab

Browser-based genetic algorithm simulator where soft-bodied creatures evolve to collect pellets.

## Quick Reference

- Dev: `npm run dev`
- Test: `npm test`
- Build: `npm run build`
- Type check: `tsc --noEmit`

## Directory Structure

```
src/
├── __tests__/        # Vitest tests
├── core/             # Domain models (Creature, Genome, Pellet)
├── genetics/         # Evolution (Selection, Crossover, Mutation, Population)
├── physics/          # Cannon-ES physics (BodyFactory, PhysicsWorld)
├── rendering/        # Three.js visualization
├── simulation/       # Headless simulation (BatchSimulator)
├── storage/          # IndexedDB persistence (RunStorage)
├── types/            # TypeScript interfaces
├── ui/               # UI components (GraphPanel)
├── utils/            # Shared utilities (math, id)
└── main.ts           # Application entry point
```

## Tech Stack

- **Build**: Vite + TypeScript
- **3D**: Three.js
- **Physics**: Cannon-ES
- **Storage**: IndexedDB
- **Testing**: Vitest + happy-dom

## Conventions

- Use shared utilities from `utils/math.ts` and `utils/id.ts`
- Creature results are compacted for storage (frames as number arrays)
- Tests go in `src/__tests__/*.test.ts`
- Interface tests preferred over unit tests

## What NOT to Do

- NEVER edit .env or environment files
- NEVER run destructive git ops (reset --hard, force push) unless explicitly instructed
- NEVER add eslint-disable comments - fix the actual issue
- NEVER create abstractions not asked for
- NEVER silence errors

## Philosophy

- Simplest change possible
- Code readability over minimal diffs
- Clean code over clever code
- Commit after completing each feature/fix

## Testing

```bash
npm test           # Run all tests
npm test -- --run  # Run once (no watch)
```

139 tests covering: genetics, genome, simulation, storage, math utilities.

## Global Commands

- `/commit` - Atomic git commits
- `/debug` - Systematic debugging
- `/setup-repo` - Repository setup

## Context Tips

- `main.ts` is large (~2800 lines) - contains EvolutionApp class with all UI
- RunStorage handles IndexedDB persistence for runs/generations
- Creatures have genomes with nodes (spheres) and muscles (springs)
- Fitness calculated from pellet collection, movement, proximity

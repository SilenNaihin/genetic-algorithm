# Evolution Lab

Browser-based genetic algorithm simulator where soft-bodied creatures evolve to collect pellets.

## Quick Reference

### Frontend (Next.js)
- Dev: `npm run dev` (port 3001)
- Test: `npm test`
- Build: `npm run build`
- Type check: `tsc --noEmit`

### Backend (FastAPI + PyTorch)
- Dev: `cd backend && uvicorn app.main:app --reload --port 8000`
- Test: `cd backend && pytest`
- 441 tests covering physics, neural, genetics, API, parity, integration

## Directory Structure

```
app/                    # Next.js React application
├── components/         # React components
│   ├── common/         # Shared UI components (Button)
│   ├── grid/           # Grid view components (CreatureGrid, ControlPanel, StatsPanel)
│   ├── menu/           # Menu screen components (MenuScreen, ParamSlider, NeuralPanel)
│   ├── modals/         # Modal dialogs (ReplayModal, LoadRunsModal, BrainEvolutionModal)
│   └── ui/             # UI utilities (InfoTooltip, Notification)
├── hooks/              # React hooks (useSimulation)
├── stores/             # Zustand state management (evolutionStore)
├── menu/               # /menu route
├── run/[runId]/        # /run/[runId] dynamic route
└── page.tsx            # Root page (redirects to /menu)

src/                    # Core simulation modules (shared)
├── __tests__/          # Vitest tests
├── core/               # Domain models (Creature, Genome, Pellet)
├── genetics/           # Evolution (Selection, Crossover, Mutation, Population)
├── neural/             # Neural network for neuroevolution
├── physics/            # Cannon-ES physics (BodyFactory, PhysicsWorld)
├── rendering/          # Three.js visualization (PreviewRenderer, ReplayRenderer)
├── services/           # Service layer (SimulationService, StorageService)
├── simulation/         # Headless simulation (BatchSimulator)
├── storage/            # IndexedDB persistence (RunStorage)
├── styles/             # Tailwind CSS (main.css with design tokens)
├── types/              # TypeScript interfaces
├── ui/                 # Shared UI components (GraphPanel, NeuralVisualizer, BrainEvolutionPanel)
└── utils/              # Shared utilities (math, id)

backend/                # Python backend (PyTorch physics)
├── app/
│   ├── api/            # FastAPI routes (runs, generations, simulation, genetics)
│   ├── genetics/       # Selection, mutation, crossover (ported from TS)
│   ├── neural/         # BatchedNeuralNetwork
│   ├── schemas/        # Pydantic models
│   ├── services/       # PyTorchSimulator
│   └── simulation/     # Batched tensor physics (tensors.py, physics.py, fitness.py)
└── fixtures/           # Test genomes
```

## Tech Stack

### Frontend
- **Framework**: Next.js 16 + React 19
- **State**: Zustand
- **3D**: Three.js
- **Physics**: Cannon-ES
- **Storage**: IndexedDB
- **Styling**: Tailwind CSS v4
- **Testing**: Vitest + happy-dom

### Backend
- **Framework**: FastAPI
- **Physics**: PyTorch (batched tensor simulation)
- **Database**: PostgreSQL + SQLAlchemy
- **Testing**: pytest

## Routes

- `/` - Redirects to /menu
- `/menu` - Configuration screen with 3D preview
- `/run/[runId]` - Evolution simulation view for a specific run

## Genetics System

- **Selection**: Truncation (default), Tournament (coming soon)
- **Mutation**: Body (node positions, muscle params), Neural weights, Structural (add/remove nodes/muscles)
- **Crossover**: Interpolation (body), Uniform (neural weights)
- **Key files**: `src/genetics/Selection.ts`, `Population.ts`, `Mutation.ts`, `Crossover.ts`
- See `genetics-prd.json` for implementation roadmap

## Conventions

- Use shared utilities from `utils/math.ts` and `utils/id.ts`
- Creature results are compacted for storage (frames as number arrays)
- Tests go in `src/__tests__/*.test.ts`
- Interface tests preferred over unit tests
- Neural genome topology adapts when muscle count changes (`adaptNeuralTopology`)
- Output biases default negative (-0.5) for GA optimization

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
- No backwards compatibility unless explicitly requested - just fix it the right way

## Changelog

**Keep `CHANGELOG.md` updated for major changes.** When adding significant features or fixes:
1. Add entry under `## [Unreleased]` section
2. Use categories: Added, Changed, Fixed, Removed
3. Be concise but descriptive

## Testing

```bash
npm test           # Run all tests
npm test -- --run  # Run once (no watch)
```

175 frontend tests covering: genetics, genome, storage, neural networks, brain evolution, math utilities.
441 backend tests covering: physics, neural, fitness, genetics, API, parity, integration.

## Global Commands

- `/commit-smart` - Atomic git commits (use after each phase/feature)
- `/update-claudemd` - Update this file with meta learnings (conventions, philosophy, gotchas) - NOT specific technical details
- `/debug` - Systematic debugging
- `/setup-repo` - Repository setup

## Context Tips

- `genetics-prd.json` tracks the genetics system overhaul - check status before implementing GA features
- `COMPUTE.md` explains tensor batching, sparse frame storage, physics FPS, and performance
- RunStorage handles IndexedDB persistence for runs/generations
- Creatures have genomes with nodes (spheres) and muscles (springs)
- Fitness: 0-80 progress + 20 collection per pellet (100 total) + 0-20 distance traveled - regression penalty (after first collection)
- Physics FPS: Configurable 15-120 FPS (default 60). Higher = more expressive but more compute
- Neural networks: Optional neuroevolution mode where creature muscles are controlled by evolved neural nets
  - Pure mode: 7 inputs (no time phase), NN has full control
  - Hybrid mode: 8 inputs (with time phase), NN modulates base oscillation
  - GA-optimized: negative output biases (-0.5), uniform weights, dead zone threshold
  - Efficiency penalty discourages excessive muscle activation
  - BrainEvolutionPanel visualizes weight changes across generations

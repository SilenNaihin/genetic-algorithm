# Evolution Lab

A browser-based genetic algorithm simulator where soft-bodied creatures evolve to collect pellets. Watch populations of creatures develop movement strategies over generations through mutation, crossover, and natural selection.

![Demo](best-creature.gif)

## Features

- **Soft-body Physics**: Creatures are made of nodes (spheres) connected by oscillating muscles (springs)
- **Pellet Collection**: Creatures are rewarded for collecting pellets that progressively spawn further away
- **Genetic Evolution**: Population evolves through selection, mutation, and crossover
- **Neural Networks**: Three modes for muscle control - Pure, Hybrid, and NEAT (topology evolution)
- **Brain Evolution Visualization**: Watch neural network weights evolve across generations
- **Family Tree**: Trace creature ancestry back to generation 0, including crossover parents
- **Config Presets**: Save and load evolution configurations
- **Generation History**: Auto-saves all runs to IndexedDB, navigate through past generations
- **Visual Replay**: Click any creature to watch its simulation replay

## Quick Start

### Prerequisites
- Node.js 18+
- Python 3.10+
- PostgreSQL

### Frontend

```bash
npm install
npm run dev
```

Open `http://localhost:3001` in your browser.

### Backend

```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

## How It Works

### Simulation Cycle

1. **Mutate**: The bottom 50% of creatures are culled. Survivors reproduce with mutation to fill the population.
2. **Simulate**: Each creature runs in a physics simulation for the configured duration, attempting to collect pellets.
3. **Sort**: Creatures are ranked by fitness score.

### Neural Network Modes

| Mode | Description |
|------|-------------|
| **None** | Muscles oscillate based on genome parameters only |
| **Pure** | Neural network has full control over muscle activation (7 inputs) |
| **Hybrid** | Neural network modulates base oscillation (8 inputs with time phase) |
| **NEAT** | Evolves network topology - adds/removes nodes and connections over generations |

Neural inputs include proprioception (body-sensing): muscle lengths, velocities, and ground contact.

### Creature Anatomy

- **Nodes**: Spheres with configurable size and friction
  - Cyan = low friction (slippery)
  - Orange = high friction (grippy)
- **Muscles**: Springs connecting nodes that oscillate at different frequencies
  - Blue = slow frequency (calm)
  - Red = fast frequency (energetic)
  - Thickness indicates stiffness

### Fitness Function

Creatures are scored using an edge-based, ground-distance system:

| Component | Points | Description |
|-----------|--------|-------------|
| **Progress** | 0-80 | XZ ground distance progress from creature's EDGE toward pellet |
| **Collection** | +20 | Bonus when pellet is actually collected (requires correct height) |
| **Net Displacement** | 0-15 | Rate-based bonus for straight-line distance from start position |
| **Distance Traveled** | 0-15 | 3 pts per unit of total ground distance covered |
| **Regression Penalty** | -20 max | Penalty for moving away from pellet (after first pellet) |

**Total per pellet: 100 max** (80 progress + 20 collection) + up to 30 movement bonus

**Key mechanics:**
- All distances measured on XZ plane (ground only, Y/height ignored for progress)
- Distance measured from creature's nearest **edge**, not center
- Progress is banked when pellet collected, not reset to 0

**Anti-luck pellet spawning:**
- Pellets spawn in opposite 180 degree arc from previous pellet direction
- Progressive distances: 7-8 units (1st), 8-9 units (2nd-3rd), 9-10 units (4th+)
- Ensures creatures must change direction to collect successive pellets

### Simulation Parameters

| Parameter | Description | Default |
|-----------|-------------|---------|
| Gravity | Physics gravity (more negative = stronger) | -9.8 |
| Mutation Rate | Probability of gene mutation | 10% |
| Max Frequency | Maximum muscle oscillation frequency (Hz) | 3.0 |
| Sim Duration | Seconds per creature simulation | 8 |
| Max Nodes | Maximum nodes per creature | 8 |
| Max Muscles | Maximum muscles per creature | 15 |
| Physics FPS | Simulation steps per second | 60 |

## Controls

### Main Menu
- Adjust simulation parameters with sliders
- Choose neural network mode (None, Pure, Hybrid, NEAT)
- Enable/disable crossover
- Load config presets or save your own
- Click "Start Evolution" to begin a new run
- Click "Load Run" to continue a previous run

### During Simulation
- **Next Step**: Advance to the next evolution step
- **1x/10x/100x**: Auto-run multiple generations
- **Graph**: Toggle fitness history graph
- **Brain**: View brain evolution visualization (neural modes only)
- **Reset**: Return to main menu
- Click any creature card to watch its replay and view ancestry

### Generation Navigation
- **< >**: Navigate through saved generations
- Click the generation number to jump to a specific generation

## Project Structure

```
app/                    # Next.js React application
├── components/         # React components
│   ├── common/         # Shared UI components
│   ├── grid/           # Grid view (CreatureGrid, ControlPanel, StatsPanel)
│   ├── menu/           # Menu screen components
│   └── modals/         # Modal dialogs (Replay, LoadRuns, BrainEvolution)
├── hooks/              # React hooks (useSimulation)
├── stores/             # Zustand state management
├── menu/               # /menu route
└── run/[runId]/        # /run/[runId] dynamic route

src/                    # Core simulation modules
├── core/               # Domain models (Genome)
├── neural/             # Neural network types and initialization
├── rendering/          # Three.js visualization
├── services/           # Service layer (SimulationService, StorageService)
├── storage/            # IndexedDB persistence
├── types/              # TypeScript interfaces
├── ui/                 # Shared UI (GraphPanel, NeuralVisualizer, BrainEvolutionPanel)
└── utils/              # Shared utilities (math, id)

backend/                # Python backend (FastAPI + PyTorch)
├── app/
│   ├── api/            # FastAPI routes (runs, generations, simulation, genetics)
│   ├── genetics/       # Selection, mutation, crossover, speciation
│   ├── neural/         # Neural networks (fixed topology + NEAT)
│   ├── schemas/        # Pydantic models
│   ├── services/       # PyTorchSimulator
│   └── simulation/     # Batched tensor physics
└── tests/

nas/                    # Neural Architecture Search (experimental)
├── cli.py              # NAS CLI tool
├── configs.py          # Predefined search configurations
├── search.py           # Optuna-based hyperparameter search
└── results/            # Experiment results
```

## Tech Stack

### Frontend
- **Framework**: Next.js 16 + React 19
- **State**: Zustand
- **3D**: Three.js (rendering only - physics runs on backend)
- **Storage**: IndexedDB
- **Styling**: Tailwind CSS v4
- **Testing**: Vitest + happy-dom

### Backend
- **Framework**: FastAPI
- **Physics**: PyTorch (batched tensor simulation)
- **Database**: PostgreSQL + SQLAlchemy
- **Testing**: pytest

## Testing

```bash
# Frontend
npm test

# Backend
cd backend && pytest
```

- 312 frontend tests covering genome, storage, neural networks, brain evolution
- 600+ backend tests covering physics, neural, fitness, genetics, API, NEAT

## License

MIT

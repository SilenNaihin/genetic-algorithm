# Evolution Lab

A browser-based genetic algorithm simulator where soft-bodied creatures evolve to collect pellets. Watch populations of creatures develop movement strategies over generations through mutation, crossover, and natural selection.

![Demo](assets/demo.gif)

## Features

- **Soft-body Physics**: Creatures are made of nodes (spheres) connected by oscillating muscles (springs)
- **Pellet Collection**: Creatures are rewarded for collecting pellets that progressively spawn further away and higher up
- **Genetic Evolution**: Population evolves through selection, mutation, and crossover
- **Configurable Fitness Function**: Customize how creatures are evaluated
- **Generation History**: Auto-saves all runs to IndexedDB, navigate through past generations
- **Visual Replay**: Click any creature to watch its simulation replay

## Quick Start

```bash
npm install
npm run dev
```

Open `http://localhost:5173` in your browser.

## How It Works

### Simulation Cycle

1. **Mutate**: The bottom 50% of creatures are culled. Survivors reproduce with mutation to fill the population.
2. **Simulate**: Each creature runs in a physics simulation for the configured duration, attempting to collect pellets.
3. **Sort**: Creatures are ranked by fitness score.

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
| **Movement Bonus** | 0-25 | XZ net displacement over time (ignores falling, discourages flailing) |
| **Regression Penalty** | -20 max | Penalty for moving away from pellet (after first pellet) |

**Total per pellet: 100 max** (80 progress + 20 collection) + up to 25 movement bonus

**Key mechanics:**
- All distances measured on XZ plane (ground only, Y/height ignored for progress)
- Distance measured from creature's nearest **edge**, not center
- Creature radius calculated from genome with 1.3x buffer for muscle extension
- Progress capped at 80 to incentivize actually collecting (reaching correct height)

**Anti-luck pellet spawning:**
- Pellets spawn in opposite 180° arc from previous pellet direction
- Progressive distances from creature's edge: 7-8 units (1st), 8-9 units (2nd-3rd), 9-10 units (4th+)
- Extra distance accounts for full muscle extension (chains of muscles can reach far)
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

### Persistence

- **Auto-save**: Every generation is automatically saved to IndexedDB
- **Load Runs**: Access previous runs from the main menu
- **Navigation**: Use arrows in the stats panel to browse generation history
- **Fitness Settings**: Saved to localStorage and persist across sessions

## Controls

### Main Menu
- Adjust simulation parameters with sliders
- Expand "Fitness Function Settings" to customize scoring
- Click "Start Evolution" to begin a new run
- Click "Load Run" to continue a previous run

### During Simulation
- **Next Step**: Advance to the next evolution step
- **1x/10x/100x**: Auto-run multiple generations
- **Graph**: Toggle fitness history graph
- **Reset**: Return to main menu
- Click any creature card to watch its replay

### Generation Navigation
- **< >**: Navigate through saved generations
- Click the generation number to jump to a specific generation
- Click the total to return to the current generation

## Project Structure

```
src/
├── __tests__/              # Test suite (Vitest)
│   ├── genetics.test.ts    # Selection, crossover, mutation, population tests
│   ├── genome.test.ts      # Genome generation tests
│   ├── math.test.ts        # Math utility tests
│   ├── simulation.test.ts  # BatchSimulator tests
│   └── storage.test.ts     # IndexedDB storage tests
├── core/                   # Domain models
│   ├── Creature.ts         # Creature entity (genome + physics + rendering)
│   ├── Genome.ts           # Genome generation utilities
│   └── Pellet.ts           # Pellet entity for collection
├── genetics/               # Evolutionary algorithm
│   ├── Crossover.ts        # Genetic crossover operators
│   ├── Mutation.ts         # Mutation operators
│   ├── Population.ts       # Population management
│   └── Selection.ts        # Selection operators
├── physics/                # Physics engine
│   ├── BodyFactory.ts      # Creates physics bodies for creatures
│   └── PhysicsWorld.ts     # Cannon.js world wrapper
├── rendering/              # 3D visualization
│   ├── CreatureRenderer.ts # Three.js mesh creation for creatures
│   └── SceneManager.ts     # Three.js scene setup
├── simulation/             # Simulation engine
│   └── BatchSimulator.ts   # Headless creature simulation
├── storage/                # Persistence
│   └── RunStorage.ts       # IndexedDB storage for runs/generations
├── types/                  # TypeScript interfaces
│   ├── genome.ts           # Genome type definitions
│   ├── index.ts            # Re-exports
│   └── simulation.ts       # Simulation config types
├── ui/                     # UI components
│   └── GraphPanel.ts       # Fitness history graph
├── utils/                  # Shared utilities
│   ├── id.ts               # ID generation
│   └── math.ts             # Math utilities (distance, lerp, clamp)
└── main.ts                 # Application entry point
```

## Technologies

- **TypeScript** - Type-safe development
- **Three.js** - 3D rendering
- **Cannon-ES** - Physics simulation
- **Vite** - Build tool
- **IndexedDB** - Persistent storage

## License

MIT

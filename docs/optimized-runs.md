# Optimized Runs: Scaling to 1000+ Generations

## Current Bottlenecks

### 1. Simulation Performance
- **20s simulation = 1200 physics steps** at 60 FPS
- **Sequential processing** - creatures simulated one at a time
- **Full frame recording** - every frame stored for replay (~1200 frames × 20 creatures)
- **Per-creature physics world** - each simulation creates/destroys Cannon-ES world

### 2. Memory & GC Issues
- Chrome freezes every ~30 generations due to GC pressure
- WebGL context loss from memory exhaustion
- IndexedDB performance degrades with large datasets
- Frame data accumulates (~3KB per creature per generation)

### 3. Browser Constraints
- Single main thread for JS execution
- WebGL context limits
- IndexedDB transaction overhead
- No true parallelism (Web Workers help but limited)

---

## Solution Architecture

### Tier 1: Browser Optimizations (Quick Wins)

#### 1.1 Reduced Frame Recording
Only record every 4th frame for replay (15 FPS instead of 60 FPS):
```typescript
// In BatchSimulator.ts
const REPLAY_FRAME_RATE = 15; // Down from 60
const frameInterval = 1 / REPLAY_FRAME_RATE;
```
**Impact:** 4× less memory per creature, faster storage

#### 1.2 "Turbo Mode" for Batch Runs
Skip frame recording entirely for headless batch runs:
```typescript
interface SimulationOptions {
  recordFrames: boolean;  // false for turbo mode
  frameRate: number;      // 15 for replay, 0 for none
}

// Only store final fitness + genome for batch runs
interface MinimalResult {
  genome: CreatureGenome;
  fitness: number;
  pelletsCollected: number;
  disqualified: boolean;
}
```
**Impact:** 10× faster simulation, minimal memory

#### 1.3 Physics Timestep Optimization
Use larger timesteps for faster (less accurate) simulation:
```typescript
// Normal: 1/60 = 0.0167s per step (1200 steps for 20s)
// Fast:   1/30 = 0.033s per step (600 steps for 20s)
// Turbo:  1/20 = 0.05s per step (400 steps for 20s)
```
**Impact:** 2-3× faster physics, slightly less accurate

#### 1.4 Web Workers for Parallel Simulation
Simulate multiple creatures in parallel using Web Workers:
```typescript
// worker-pool.ts
class SimulationWorkerPool {
  private workers: Worker[];
  private queue: SimulationTask[];

  constructor(numWorkers = navigator.hardwareConcurrency || 4) {
    this.workers = Array(numWorkers).fill(null).map(() =>
      new Worker(new URL('./simulation.worker.ts', import.meta.url))
    );
  }

  async simulateBatch(genomes: CreatureGenome[]): Promise<MinimalResult[]> {
    // Distribute genomes across workers
    // Each worker runs Cannon-ES independently
  }
}
```
**Impact:** 4-8× faster on multi-core machines

---

### Tier 2: Node.js CLI Runner (Recommended for 1000+ gens)

#### 2.1 Architecture
```
┌─────────────────────────────────────────────────────────┐
│                    CLI Runner (Node.js)                  │
├─────────────────────────────────────────────────────────┤
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐   │
│  │Worker 1 │  │Worker 2 │  │Worker 3 │  │Worker 4 │   │
│  │Cannon-ES│  │Cannon-ES│  │Cannon-ES│  │Cannon-ES│   │
│  └─────────┘  └─────────┘  └─────────┘  └─────────┘   │
├─────────────────────────────────────────────────────────┤
│                    SQLite Database                       │
│  - runs, generations, genomes, fitness_history          │
└─────────────────────────────────────────────────────────┘
              ↓ Export/Import
┌─────────────────────────────────────────────────────────┐
│                    Browser UI                            │
│  - View results, replay creatures, visualize graphs     │
└─────────────────────────────────────────────────────────┘
```

#### 2.2 CLI Implementation
```typescript
// cli/evolve.ts
import { Worker } from 'worker_threads';
import Database from 'better-sqlite3';

interface CLIOptions {
  generations: number;      // Target generations (e.g., 1000)
  population: number;       // Creatures per generation (e.g., 20)
  duration: number;         // Simulation duration (e.g., 8s)
  workers: number;          // Parallel workers (default: CPU cores)
  checkpoint: number;       // Save every N generations (e.g., 10)
  turbo: boolean;           // Skip frame recording
  resume?: string;          // Resume from run ID
}

async function evolve(options: CLIOptions) {
  const db = new Database('evolution.db');
  const pool = new WorkerPool(options.workers);

  for (let gen = 0; gen < options.generations; gen++) {
    // 1. Evolve population (selection, crossover, mutation)
    const genomes = population.evolve();

    // 2. Simulate in parallel across workers
    const results = await pool.simulateBatch(genomes, {
      recordFrames: !options.turbo,
      duration: options.duration
    });

    // 3. Store results
    db.exec(`INSERT INTO generations ...`);

    // 4. Checkpoint full state periodically
    if (gen % options.checkpoint === 0) {
      saveCheckpoint(db, population, gen);
      console.log(`Gen ${gen}: Best=${best.toFixed(1)}, Avg=${avg.toFixed(1)}`);
    }
  }
}
```

#### 2.3 Usage
```bash
# Run 1000 generations overnight
npx tsx cli/evolve.ts --generations 1000 --turbo

# Resume interrupted run
npx tsx cli/evolve.ts --resume run_123456 --generations 500

# Export to browser format
npx tsx cli/export.ts --run run_123456 --output run.json

# View in browser
npm run dev
# Then: Load Run → Import from File
```

#### 2.4 SQLite Schema
```sql
CREATE TABLE runs (
  id TEXT PRIMARY KEY,
  name TEXT,
  config JSON,
  created_at INTEGER,
  generation_count INTEGER,
  best_fitness REAL,
  best_creature_id TEXT
);

CREATE TABLE generations (
  run_id TEXT,
  generation INTEGER,
  best_fitness REAL,
  avg_fitness REAL,
  worst_fitness REAL,
  creature_type_distribution JSON,
  PRIMARY KEY (run_id, generation)
);

CREATE TABLE creatures (
  id TEXT PRIMARY KEY,
  run_id TEXT,
  generation INTEGER,
  genome JSON,
  fitness REAL,
  pellets_collected INTEGER,
  disqualified TEXT,
  frames BLOB,  -- Compressed frame data (only if recorded)
  FOREIGN KEY (run_id) REFERENCES runs(id)
);

CREATE INDEX idx_creatures_fitness ON creatures(run_id, generation, fitness DESC);
```

**Benefits over IndexedDB:**
- 10× faster bulk inserts
- SQL queries for analytics
- Single file, easy backup
- No transaction size limits
- Works in Node.js (no browser)

---

### Tier 3: Advanced Optimizations

#### 3.1 WASM Physics Engine
Replace Cannon-ES with Rapier (Rust-based, WASM):
```typescript
import RAPIER from '@dimforge/rapier3d';

// Rapier is 2-5× faster than Cannon-ES
// Written in Rust, compiled to WASM
```

#### 3.2 GPU Compute (Future)
Use WebGPU compute shaders for parallel physics:
- Simulate 100+ creatures simultaneously on GPU
- Requires WebGPU support (Chrome 113+)

#### 3.3 Distributed Computing
- Run workers on multiple machines
- Use Redis for job queue
- Cloud functions for burst capacity

---

## Implementation Roadmap

### Phase 1: Quick Browser Wins (1-2 days)
1. [ ] Add "Turbo Mode" toggle in UI
2. [ ] Reduce replay frame rate to 15 FPS
3. [ ] Add physics timestep option (1/60, 1/30, 1/20)
4. [ ] Implement basic Web Worker pool (2-4 workers)

### Phase 2: CLI Runner MVP (3-5 days)
1. [ ] Set up Node.js CLI with tsx
2. [ ] Port simulation code (extract browser-independent parts)
3. [ ] Implement SQLite storage
4. [ ] Add worker_threads pool
5. [ ] Basic progress logging
6. [ ] Export/import for browser viewing

### Phase 3: Production CLI (1 week)
1. [ ] Checkpoint/resume functionality
2. [ ] Real-time progress dashboard (terminal UI)
3. [ ] Analytics queries (best creatures over time, etc.)
4. [ ] Batch export for browser
5. [ ] Configuration presets

### Phase 4: Advanced (Future)
1. [ ] Rapier WASM integration
2. [ ] WebGPU compute exploration
3. [ ] Distributed runner

---

## Expected Performance Gains

| Mode | Time per Generation | 1000 Gens |
|------|---------------------|-----------|
| Current (Browser) | ~3-5s | 50-80 min + crashes |
| Browser + Turbo | ~1s | 17 min |
| Browser + Workers (4) | ~0.5s | 8 min |
| CLI + Turbo | ~0.3s | 5 min |
| CLI + Workers (8) | ~0.1s | 1.5 min |
| CLI + Rapier + Workers | ~0.05s | 50 sec |

---

## File Structure for CLI

```
cli/
├── evolve.ts           # Main CLI entry point
├── simulation.worker.ts # Worker thread for simulation
├── database.ts         # SQLite operations
├── export.ts           # Export to browser format
├── import.ts           # Import browser runs to SQLite
└── config.ts           # CLI configuration

src/
├── simulation/
│   ├── BatchSimulator.ts      # Existing (browser)
│   └── HeadlessSimulator.ts   # New (shared core, no frames)
├── genetics/                  # Shared (already browser-independent)
└── core/                      # Shared (already browser-independent)
```

---

## Quick Start: Turbo Mode

Add to existing UI immediately:

```typescript
// In main.ts, add turbo mode toggle
private turboMode: boolean = false;

// In menu HTML
<label>
  <input type="checkbox" id="turbo-mode"> Turbo Mode (no replay recording)
</label>

// In simulation
const results = await simulatePopulation(genomes, config, {
  recordFrames: !this.turboMode,
  frameRate: this.turboMode ? 0 : 15
});
```

This alone could give 5-10× speedup for batch runs where you don't need to replay every creature.

---

## User Feedback & Revised Plan

### Feedback Summary

1. **Frame storage strategy**: Keep frames for top 10, random 10, and bottom 5 creatures per generation (25 total, not all 20+)
2. **Already using 15 FPS**: The reduced frame rate is already implemented
3. **Physics timestep concerns**: Larger timesteps lose simulation accuracy - avoid for now
4. **Full SQLite migration**: Move ALL storage to SQLite, not just CLI. Browser should read from SQLite too
5. **Future GPU compute**: Support CUDA/PyTorch for physics acceleration down the road

### My Thoughts

#### On Selective Frame Storage

The top 10 + random 10 + bottom 5 strategy is smart:
- **Top 10**: See what's working, analyze winning strategies
- **Random 10**: Catch diversity, avoid selection bias in what you review
- **Bottom 5**: Debug failures, understand what's being eliminated

For a population of 20, this means keeping all frames anyway (25 > 20). But it scales well:
- Population 50 → keep 25 (50% reduction)
- Population 100 → keep 25 (75% reduction)

Implementation:
```typescript
interface FrameStorageStrategy {
  keepTop: number;      // default 10
  keepRandom: number;   // default 10
  keepBottom: number;   // default 5
}

function selectCreaturesForFrameStorage(
  results: SimulationResult[],
  strategy: FrameStorageStrategy
): Set<string> {
  const sorted = [...results].sort((a, b) => b.finalFitness - a.finalFitness);
  const ids = new Set<string>();

  // Top N
  sorted.slice(0, strategy.keepTop).forEach(r => ids.add(r.genome.id));

  // Bottom N
  sorted.slice(-strategy.keepBottom).forEach(r => ids.add(r.genome.id));

  // Random N from middle
  const middle = sorted.slice(strategy.keepTop, -strategy.keepBottom);
  const shuffled = middle.sort(() => Math.random() - 0.5);
  shuffled.slice(0, strategy.keepRandom).forEach(r => ids.add(r.genome.id));

  return ids;
}
```

#### On Physics Timestep

Agreed - changing physics timestep fundamentally alters simulation dynamics. A creature optimized at 1/60 timestep behaves differently at 1/30. This creates:
- Non-comparable fitness scores across runs
- Creatures that exploit timestep artifacts
- Reproducibility issues

**Recommendation**: Keep 1/60 timestep. Optimize elsewhere.

#### On Full SQLite Migration

This is the right call. IndexedDB has fundamental issues:
- No SQL queries for analytics
- Browser-specific, can't share with CLI
- Transaction overhead kills batch performance
- Async-only API adds complexity

**Migration path**:
1. Create SQLite wrapper with same interface as RunStorage
2. Add sql.js (SQLite compiled to WASM) for browser
3. Use better-sqlite3 for Node.js CLI
4. Single database file works in both environments
5. Deprecate IndexedDB, migrate existing runs on first load

Browser considerations with sql.js:
- ~1MB WASM download (one-time)
- Slightly slower than native IndexedDB for small ops
- Much faster for batch operations and queries
- Database persists to IndexedDB as a blob (ironic but works)

#### On CUDA/PyTorch Future

This is ambitious and changes the architecture significantly:

**Option A: Python backend with PyTorch**
```
┌─────────────────────────────────────────┐
│          Browser UI (TypeScript)         │
│  - Visualization only                    │
│  - WebSocket connection to backend       │
└─────────────────┬───────────────────────┘
                  │ WebSocket
┌─────────────────▼───────────────────────┐
│         Python Backend (FastAPI)         │
├─────────────────────────────────────────┤
│  - PyTorch for physics simulation        │
│  - CUDA acceleration when available      │
│  - SQLite for storage                    │
│  - REST API for data queries             │
└─────────────────────────────────────────┘
```

**Option B: Hybrid approach**
- Keep TypeScript for genetics (selection, crossover, mutation)
- Python/CUDA only for batch physics simulation
- Communicate via shared SQLite database

**My recommendation**: Start with Option B:
1. Physics is the bottleneck, not genetics
2. Keeps UI responsive and simple
3. Can run Python backend as a separate process
4. SQLite as the integration point (both can read/write)

PyTorch considerations for physics:
- Cannon-ES → custom differentiable physics in PyTorch
- Batch simulate 100+ creatures in parallel on GPU
- Potential for gradient-based optimization (not just evolution)
- Significant rewrite of physics simulation

---

## Revised Implementation Roadmap

### Phase 1: SQLite Migration (Priority)

**Goal**: Replace IndexedDB with SQLite everywhere

1. [ ] Install sql.js for browser, better-sqlite3 for Node
2. [ ] Create unified SQLiteStorage class
3. [ ] Implement same interface as current RunStorage
4. [ ] Add migration utility: IndexedDB → SQLite
5. [ ] Update main.ts to use new storage
6. [ ] Test thoroughly (268 tests should still pass)

**Schema** (revised):
```sql
CREATE TABLE runs (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  config JSON NOT NULL,
  created_at INTEGER NOT NULL,
  generation_count INTEGER DEFAULT 0,
  best_fitness REAL DEFAULT 0,
  best_creature JSON,           -- Full creature with frames
  longest_survivor JSON         -- Full creature with frames
);

CREATE TABLE generations (
  run_id TEXT NOT NULL,
  generation INTEGER NOT NULL,
  results JSON NOT NULL,        -- Array of CompactCreatureResult
  fitness_history JSON,         -- {best, avg, worst, median}
  creature_types JSON,          -- Node count distribution
  PRIMARY KEY (run_id, generation),
  FOREIGN KEY (run_id) REFERENCES runs(id) ON DELETE CASCADE
);

CREATE TABLE creature_frames (
  run_id TEXT NOT NULL,
  generation INTEGER NOT NULL,
  creature_id TEXT NOT NULL,
  frames BLOB NOT NULL,         -- Compressed frame data
  PRIMARY KEY (run_id, generation, creature_id),
  FOREIGN KEY (run_id, generation) REFERENCES generations(run_id, generation) ON DELETE CASCADE
);

CREATE INDEX idx_gen_run ON generations(run_id);
CREATE INDEX idx_frames_creature ON creature_frames(creature_id);
```

Key changes from original schema:
- Separate `creature_frames` table for selective storage
- Frames stored as BLOB (compressed)
- CASCADE deletes for cleanup

### Phase 2: Selective Frame Storage

**Goal**: Only store frames for top 10 + random 10 + bottom 5

1. [ ] Add FrameStorageStrategy to config
2. [ ] Implement selectCreaturesForFrameStorage()
3. [ ] Modify saveGeneration to store frames selectively
4. [ ] Update UI to handle missing frames gracefully
5. [ ] Add "No replay available" message for non-stored creatures

### Phase 3: Node.js CLI Runner

**Goal**: Run evolution from command line with worker threads

1. [ ] Create cli/ directory structure
2. [ ] Extract browser-independent simulation code
3. [ ] Implement worker_threads pool
4. [ ] Add CLI argument parsing (commander.js)
5. [ ] Progress logging with live stats
6. [ ] Checkpoint/resume functionality

### Phase 4: Python Backend (Future)

**Goal**: GPU-accelerated physics with PyTorch

1. [ ] Design Python backend architecture
2. [ ] Implement differentiable physics in PyTorch
3. [ ] Create WebSocket server for browser communication
4. [ ] Add CUDA detection and fallback
5. [ ] Batch simulation optimization
6. [ ] Integration with SQLite database

---

## Test Coverage Before Migration

**Status**: 268 tests passing

Key test files for storage migration:
- `storage-integration.test.ts` - 53 tests covering:
  - Run CRUD operations
  - Generation save/load
  - Frame compaction/expansion
  - Fitness history tracking
  - Best creature persistence
  - Longest survivor tracking
  - Fork functionality
  - Concurrent access
  - Data integrity

- `evolution-pipeline.test.ts` - 27 tests covering:
  - Full evolution cycle
  - Genome validity through mutations
  - Selection pressure
  - Simulation consistency

These tests use fake-indexeddb and are interface-based, so they should work with minimal changes when we swap to SQLite (just need to update the storage implementation, not the tests).

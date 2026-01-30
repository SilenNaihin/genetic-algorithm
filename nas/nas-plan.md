# Neural Architecture Search (NAS) Plan

## Overview

A pure CLI system for hyperparameter optimization and neural architecture search for the Evolution Lab genetic algorithm simulator. Optimizes creature evolution parameters to find configurations that maximize fitness and behavioral diversity.

## Goals

1. **Find optimal configurations** for pellet collection task
2. **Sensitivity analysis** - understand which parameters actually matter
3. **Multi-objective optimization** - balance fitness AND diversity
4. **Reproducibility** - checkpoint everything, resume anytime

## Architecture

### File Structure
```
nas/
├── cli.py              # Main CLI entry point (Typer)
├── runner.py           # Trial runner - in-memory evolution loop
├── config.py           # Parameter space & config loading
├── results.py          # Results storage (CSV/JSON + optional DB)
└── nas-prd.json        # PRD tracking implementation
```

### Execution Model: In-Memory Evolution

**Why skip per-generation DB writes:**
- Per-generation overhead: creature records, frame compression, ORM commits
- For NAS we don't need frame data or individual creature histories
- ~10x speedup by running evolution purely in memory

**What we track per run:**
1. Config used (JSON blob)
2. Fitness curve (array of [gen, best, avg, median] per generation)
3. Final stats (best fitness, generations to plateau)
4. Best genome (for verification replay)

**Data flow:**
```
1. CLI loads config (from /use-config system or inline)
2. Run N seeds with in-memory evolution (PyTorchSimulator + genetics directly)
3. Track: [gen, best, avg, median] per generation → write to CSV/JSON live
4. At end: optionally create full Run in DB for best config (with frames for replay)
5. Console summary + JSON results file
```

### Output Strategy

**Console (real-time):**
```
[seed 1/3] gen 25/100 | best: 342.5 | avg: 156.2 | 1.2s/gen
[seed 1/3] gen 50/100 | best: 456.8 | avg: 234.1 | 1.1s/gen
...
Config: neat_baseline | Seeds: 3 | Final: 512.3 ± 45.2 | Time: 4m32s
```

**CSV/JSON (persistent):**
- Written incrementally (crash-safe)
- One file per config: `results/neat_baseline_20250129_143022.json`
- Contains: config, per-seed fitness curves, final stats, timing

**Database (optional, for important runs):**
- Only for configs we want to replay on frontend
- Create full Run with frame storage after NAS identifies winners
- Use existing `/use-config` system for config management

## Approach: Optuna with NSGA-II

### Why Optuna?
- **Multi-objective native** - NSGA-II sampler for Pareto fronts
- **fANOVA built-in** - Sensitivity analysis comes free
- **Checkpointing** - PostgreSQL storage, resume anytime
- **Pruning** - Early-stop bad configs (MedianPruner)
- **Battle-tested** - Production-ready, well-documented

### Two-Phase Strategy

#### Phase 1: Screening (~50-100 trials)
- Morris method OR low-fidelity runs (fewer generations)
- Identify which 15-20 of 100+ parameters actually matter
- Quick trials: 20 generations, 200 creatures, 1 seed

#### Phase 2: Deep Search (~200-500 trials)
- Focus only on impactful parameters from Phase 1
- Full runs: 100 generations, 1000 creatures, 5 seeds
- Multi-objective: fitness + diversity Pareto front

## Parameter Space

### Focus Priority
1. **NEAT** (primary) - variable topology is the most interesting
2. **Pure neural** (secondary) - fixed topology baseline
3. **Hybrid** (tertiary) - only if time permits

### ALWAYS CONSTANT (do not optimize)
| Parameter | Fixed Value | Reason |
|-----------|-------------|--------|
| `gravity` | -9.8 | Physics baseline |
| `simulation_duration` | 40 | Sufficient for behavior to emerge |
| `physics_fps` | 30 | Balance of accuracy vs speed |
| `damping`, `velocity_cap`, `max_extension` | defaults | Physics stability |
| `fitness_*` | defaults | Consistent objective function |
| `neural_dead_zone` | 0.1 | |
| `neural_update_hz` | defaults | |
| `ground_friction` | 0.5 | |

### Tier 1: High Impact (Always Search)
| Parameter | Range | Type | Notes |
|-----------|-------|------|-------|
| `population_size` | 100 - 1000 | int | Tradeoff: diversity vs speed |
| `elite_count` | 1 - 20 | int | |
| `cull_percentage` | 0.3 - 0.7 | float | |
| `mutation_rate` | 0.1 - 0.5 | float | Body mutation |
| `mutation_magnitude` | 0.1 - 0.5 | float | |
| `weight_mutation_rate` | 0.1 - 0.5 | float | Neural weight mutation |
| `weight_mutation_magnitude` | 0.1 - 1.0 | float | |
| `crossover_rate` | 0.0 - 0.8 | float | |
| `selection_method` | truncation, tournament, rank, speciation | categorical | |
| `tournament_size` | 2 - 7 | int | For tournament selection |

### Tier 2: NEAT-Specific (Primary Focus)
| Parameter | Range | Type | Notes |
|-----------|-------|------|-------|
| `neat_initial_connectivity` | full, sparse_inputs, sparse_outputs, none | categorical | Starting topology |
| `neat_add_connection_rate` | 0.0 - 0.8 | float | Structural mutation |
| `neat_add_node_rate` | 0.0 - 0.5 | float | Structural mutation |
| `neat_enable_rate` | 0.0 - 0.1 | float | Re-enable disabled genes |
| `neat_disable_rate` | 0.0 - 0.1 | float | Disable genes |
| `neat_max_hidden_nodes` | 4 - 32 | int | Prevent bloat |
| `compatibility_threshold` | 0.5 - 3.0 | float | Speciation distance |
| `neat_excess_coefficient` | 0.5 - 2.0 | float | Speciation weight |
| `neat_disjoint_coefficient` | 0.5 - 2.0 | float | Speciation weight |
| `neat_weight_coefficient` | 0.1 - 1.0 | float | Speciation weight |
| `bias_mode` | node, bias_node | categorical | bias_node is original NEAT |
| `use_fitness_sharing` | true, false | bool | |
| `sharing_radius` | 0.3 - 1.0 | float | |

### Tier 3: Body/Creature Constraints
| Parameter | Range | Type | Notes |
|-----------|-------|------|-------|
| `min_nodes` | 3 - 4 | int | |
| `max_nodes` | 5 - 10 | int | |
| `max_muscles` | 10 - 20 | int | |

### Tier 4: Pure/Hybrid Only (Secondary)
| Parameter | Range | Type | Notes |
|-----------|-------|------|-------|
| `neural_hidden_size` | 4 - 24 | int | Fixed topology size |
| `neural_output_bias` | -0.5 - 0.0 | float | |
| `time_encoding` | cyclic, sin, raw | categorical | Hybrid mode only |
| `use_proprioception` | true, false | bool | |

### Auto-Enforcement Rules
When certain parameters are set, others are automatically adjusted:

| Trigger | Enforced |
|---------|----------|
| `neural_mode = neat` | `selection_method` → speciation, `use_fitness_sharing` → false |
| `selection_method = speciation` | Activates `compatibility_threshold`, `min_species_size` |

## Objectives

### Primary: Fitness
```python
def fitness_objective(trial_results):
    # Top-5 average fitness after N generations
    return np.mean(sorted(trial_results.final_fitness, reverse=True)[:5])
```

### Secondary: Diversity
```python
def diversity_objective(trial_results):
    # Options (TBD based on what's measurable):
    # 1. Fitness variance (want spread, not just high mean)
    # 2. Behavioral: variance in center-of-mass trajectories
    # 3. Morphological: variance in node/muscle counts
    return compute_diversity_metric(trial_results)
```

## Compute Budget

### Hardware Benchmarks

Run benchmarks with: `python cli.py benchmark -c <config> -p <pop> -g <gens> -d <device>`

| Machine | Cores | Mode | Pop | CPU | GPU | vs Azure |
|---------|-------|------|-----|-----|-----|----------|
| **Apple M3 Max** | 16 | NEAT | 200 | 132/s | - | 4.3x |
| | | NEAT | 300 | 135/s | - | 3.9x |
| | | NEAT | 500 | 162/s | - | 4.6x |
| | | Pure | 300 | 327/s | - | 3.3x |
| **Azure VM (AMD EPYC 7V12)** | 8 | NEAT | 200 | 31/s | 20/s (T4) | - |
| | | NEAT | 300 | 35/s | - | - |
| | | NEAT | 500 | 35/s | 23/s (T4) | - |
| | | Pure | 300 | 100/s | - | - |

### Batched vs Sequential (3 seeds, NEAT 300)

| Machine | Batched | Sequential | Speedup |
|---------|---------|------------|---------|
| M3 Max | 30.7s | 33.4s | 1.09x |
| Azure VM | - | - | 1.38x |

### Numba Parallel Threshold

| Machine | Recommended | Notes |
|---------|-------------|-------|
| M3 Max | 150-300 | Parallel wins >1.4x at 300+ |
| Azure VM | 300 | Default setting |

**Notes:**
- M3 Max is **3.3-4.6x faster** than Azure VM on CPU
- Batched speedup smaller on M3 Max (fast single-core reduces benefit)
- MPS (Apple GPU) not compatible - needs PyTorch optimization
- Pure mode scales better with population (batched tensor ops)

### Estimated Times (per trial)
| Config | Generations | Creatures | Time/Trial |
|--------|-------------|-----------|------------|
| Screening | 20 | 200 | ~2-5 min |
| Full | 100 | 1000 | ~30-60 min |

### Total Budget Options
| Budget | Screening | Deep Search | Wall Time |
|--------|-----------|-------------|-----------|
| Overnight | 50 trials | 100 trials | ~12h |
| Weekend | 100 trials | 300 trials | ~48h |
| Week | 100 trials | 500 trials | ~168h |

## Checkpointing & Persistence

### During Evolution: None
- No per-generation DB writes (speed priority)
- Fitness curves written to CSV/JSON incrementally (crash-safe)

### After Run Completes
- Results saved to `nas/results/<config>_<timestamp>.json`
- Contains: config, fitness curves, final stats, timing, best genome

### For Important Configs (Manual)
After NAS identifies winning configs, create full runs for frontend replay:
```bash
# Create a full run with frame storage for the best config
nas replay --config neat_winner --generations 100
```
This creates a proper Run in the database with:
- All creature records
- Frame data for top creatures (sparse mode)
- Neural activations
- Viewable in Evolution Lab frontend

### Resume Capability
```bash
# Results are in JSON, so just re-run configs as needed
nas run --config neat_baseline --seeds 3
```

## CLI Interface

### V1 (Simple - Build First)
```bash
# Run a single config with multiple seeds
nas run --config neat_baseline --generations 100 --seeds 3

# Run from inline params (for quick tests)
nas run --generations 50 --seeds 1 --population-size 200 --neat-add-node-rate 0.3

# Compare results
nas compare neat_baseline neat_sparse neat_minimal

# Create full run for frontend replay (after identifying winners)
nas replay --config neat_winner --generations 100
```

### V2 (Optuna Integration - Later)
```bash
# Run hyperparameter search
nas search --study-name exp-001 --n-trials 100 --mode neat

# Show progress
nas status --study-name exp-001

# Get best configs
nas best --study-name exp-001 --n-top 5
```

## Pruning Strategy

- Use `MedianPruner` with `n_startup_trials=10`
- Prune at generations 10, 20, 50
- If trial's fitness < median of completed trials at that generation, kill it
- Saves ~30-40% compute on bad configs

## Seed Handling

- Each config tested with 3-5 random seeds (default 3 for speed, 5 for final validation)
- Report: mean ± std across seeds
- Seeds: 42, 123, 456, 789, 1337 (use first N)
- Consistency matters: high std = unstable config

## Output & Visualization

### CLI Progress
```
[Trial 47/100] gen 45/100 | fitness: 342.5 | best: 456.2
Parameters: mutation_rate=0.32, hidden_size=16, ...
```

### PostgreSQL Tables
- `nas_studies` - study metadata
- `nas_trials` - individual trial results
- `nas_parameters` - parameter values per trial
- `nas_objectives` - objective values per trial

### Dashboard Integration
- Runs visible in existing Evolution Lab dashboard
- Can open any trial's evolved creatures for replay

## Success Criteria

1. **Find config with fitness > X** (baseline TBD from current best)
2. **Identify top 5 most impactful parameters** via fANOVA
3. **Pareto front** showing fitness-diversity tradeoffs
4. **Reproducible** - any config can be re-run with same results

## Deliverables

### `nas-findings.ipynb` (created after search completes)
- **Pareto Frontier**: Interactive plot of fitness vs diversity tradeoffs
- **Parameter Importance**: fANOVA rankings with confidence intervals
- **Mode Comparison**: pure vs hybrid vs NEAT head-to-head analysis
- **Best Configs**: Top performers with links to dashboard runs
- **Behavioral Analysis**: What strategies emerged? (locomotion patterns, body shapes)
- **Recommendations**: Production configs for different use cases (fast training, max fitness, diverse population)

## Search Strategies

Three approaches depending on your goal:

### 1. Fixed Topology Search
Focus on pure/hybrid modes with fixed architecture.
```bash
nas run --study-name fixed-arch --mode pure,hybrid
```
**Focus params:** `neural_hidden_size`, `neural_activation`, `time_encoding`, `mutation_rate`

### 2. NEAT Search
Focus on variable topology evolution.
```bash
nas run --study-name neat-explore --mode neat
```
**Focus params:** `neat_initial_connectivity`, `neat_add_connection_rate`, `neat_add_node_rate`, `compatibility_threshold`

### 3. Full Comparison
Compare all modes head-to-head (most expensive but most informative).
```bash
nas run --study-name full-compare
```
**Focus params:** `neural_mode`, `mutation_rate`, `population_size`, `simulation_duration`

## Open Questions

1. **Diversity metric** - how exactly to measure behavioral diversity?
2. **Multi-GPU** - run 2 trials in parallel on 2x T4, or use both for single larger batch?
3. **Pruning aggressiveness** - how early to kill underperforming trials?
4. **NEAT vs Fixed** - separate studies or one study with `neural_mode` as a parameter?

## Next Steps

### V1: Fast CLI (Priority)
1. [ ] `runner.py` - in-memory evolution loop (no DB)
2. [ ] `cli.py` - basic `nas run` command
3. [ ] `results.py` - JSON/CSV output with incremental writes
4. [ ] Test speed: target 1000 creatures x 100 gens in <5 min
5. [ ] `nas compare` - load results and compare configs

### V2: Optuna Integration (Later)
6. [ ] Parameter space definition for Optuna
7. [ ] Optuna study management
8. [ ] fANOVA analysis
9. [ ] Pruning integration

### V3: Frontend Integration (Later)
10. [ ] `nas replay` - create full DB run from config
11. [ ] Link NAS results to Evolution Lab dashboard

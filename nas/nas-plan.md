# Neural Architecture Search (NAS) Plan

## Overview

A pure CLI system for hyperparameter optimization and neural architecture search for the Evolution Lab genetic algorithm simulator. Optimizes creature evolution parameters to find configurations that maximize fitness and behavioral diversity.

## Goals

1. **Find optimal configurations** for pellet collection task
2. **Sensitivity analysis** - understand which parameters actually matter
3. **Multi-objective optimization** - balance fitness AND diversity
4. **Reproducibility** - checkpoint everything, resume anytime

## Architecture

```
nas/
├── cli.py              # Main CLI entry point (Click/Typer)
├── search.py           # Optuna study management
├── objectives.py       # Fitness + diversity objective functions
├── parameters.py       # Parameter space definitions
├── screening.py        # Morris method / low-fidelity screening
├── analysis.py         # fANOVA sensitivity analysis
├── checkpointing.py    # PostgreSQL storage integration
├── logging.py          # Progress logging and metrics
└── notebook.ipynb      # Learning notebook for NAS concepts
```

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

### Tier 1: High Impact (Always Search)
| Parameter | Range | Type | Notes |
|-----------|-------|------|-------|
| `neural_mode` | pure, hybrid, neat | categorical | **Fundamental choice** - NEAT enables variable topology |
| `mutation_rate` | 0.1 - 0.5 | float | |
| `weight_mutation_magnitude` | 0.1 - 1.0 | float | |
| `neural_hidden_size` | 4 - 32 | int | Ignored for NEAT |
| `population_size` | 200 - 2000 | int | |
| `simulation_duration` | 15 - 60 | float | |
| `selection_method` | truncation, tournament, rank, speciation | categorical | Auto-set to speciation for NEAT |
| `neat_initial_connectivity` | full, sparse_inputs, sparse_outputs, none | categorical | NEAT only |
| `neat_add_connection_rate` | 0.0 - 1.0 | float | NEAT only |
| `neat_add_node_rate` | 0.0 - 1.0 | float | NEAT only |
| `neat_max_hidden_nodes` | 1 - 128 | int | NEAT only - prevents bloat |

### Tier 2: Medium Impact (Screen First)
| Parameter | Range | Type | Notes |
|-----------|-------|------|-------|
| `neural_activation` | tanh, relu, sigmoid | categorical | |
| `crossover_rate` | 0.0 - 0.8 | float | |
| `elite_count` | 1 - 20 | int | |
| `weight_mutation_decay` | off, linear, exponential | categorical | |
| `time_encoding` | none, cyclic, sin, raw, sin_raw | categorical | How time is encoded as input |
| `bias_mode` | none, node, bias_node | categorical | bias_node recommended for NEAT |
| `use_proprioception` | true, false | bool | Adds body-sensing inputs |
| `neural_crossover_method` | interpolation, uniform, sbx | categorical | SBX is most sophisticated |
| `use_adaptive_mutation` | true, false | bool | Auto-boost on stagnation |
| `compatibility_threshold` | 0.1 - 3.0 | float | Speciation distance threshold |
| `neat_excess_coefficient` | 0.0 - 10.0 | float | NEAT speciation weight |
| `neat_disjoint_coefficient` | 0.0 - 10.0 | float | NEAT speciation weight |
| `neat_weight_coefficient` | 0.0 - 10.0 | float | NEAT speciation weight |

### Tier 3: Low Impact (Fixed Unless Screening Shows Otherwise)
| Parameter | Default | Notes |
|-----------|---------|-------|
| `ground_friction` | 0.5 | |
| `gravity` | -9.8 | |
| `neural_output_bias` | -0.1 | |
| `neural_dead_zone` | 0.1 | |
| `sbx_eta` | 2.0 | SBX distribution index |
| `output_smoothing_alpha` | 0.15 | 1.0 = no smoothing |
| `neural_update_hz` | 10 | NN evaluation frequency |

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

### Hardware
- 2x NVIDIA T4 (16GB VRAM each)
- 56GB RAM

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

## Checkpointing

### What Gets Saved (PostgreSQL)
- Optuna study state (all trials, parameters, objectives)
- Best configurations found so far
- Sensitivity analysis results (fANOVA)
- Per-trial metadata (timing, seeds used)

### Resume Capability
```bash
# Start new study
nas run --study-name exp-001 --n-trials 100

# Resume interrupted study
nas run --study-name exp-001 --resume
```

## CLI Interface

```bash
# Run hyperparameter search
nas run --study-name <name> [--n-trials N] [--resume] [--phase screening|deep]

# Show progress
nas status --study-name <name>

# Export results
nas export --study-name <name> --format csv|json

# Sensitivity analysis
nas analyze --study-name <name>

# Get best config
nas best --study-name <name> [--n-top 5]
```

## Pruning Strategy

- Use `MedianPruner` with `n_startup_trials=10`
- Prune at generations 10, 20, 50
- If trial's fitness < median of completed trials at that generation, kill it
- Saves ~30-40% compute on bad configs

## Seed Handling

- Each config tested with 5 random seeds
- Final objective = mean across seeds
- Also track std for consistency metric
- Seeds: 42, 123, 456, 789, 1337

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

1. [ ] Implement parameter space definition
2. [ ] Create Optuna objective function
3. [ ] Wire up PostgreSQL storage
4. [ ] Build CLI interface
5. [ ] Add screening phase
6. [ ] Add fANOVA analysis
7. [ ] Test on small scale
8. [ ] Run full search

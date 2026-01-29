# NAS Next Step

Execute the next pending task from the `nas/nas-prd.json` roadmap.

**IMPORTANT: This command should DO THE WORK, not just display instructions.**

## Steps to Execute

1. **Read the PRD and find the next pending task:**
   ```bash
   cat nas/nas-prd.json | jq '.phases[] | select(.status != "completed") | {id, name, status, tasks: [.tasks[] | select(.status != "completed")]}' | head -80
   ```

2. **Announce the task:**
   - State the phase and task ID (e.g., "Phase 1, Task 1.1")
   - Summarize what will be implemented
   - State the target file

3. **Execute the task:**
   - Implement the functionality in the specified file
   - Follow existing patterns in the backend
   - Use PostgreSQL storage (already configured)
   - Integrate with existing FastAPI backend APIs

4. **Test the implementation:**
   ```bash
   cd backend && pytest tests/test_nas*.py -v
   # Or for CLI:
   python -m nas.cli --help
   ```

5. **Update the PRD status:**
   After completing a task, update `nas/nas-prd.json`:
   - Change task status from `"not_started"` to `"completed"`
   - If all tasks in a phase are done, mark phase as `"completed"`

6. **Report results:**
   - What was implemented
   - Any issues encountered
   - What to test manually

7. **STOP and wait for user approval before committing**

## After User Approves

Only after user says "ok", "approved", "looks good", "next", "continue", etc:
1. Commit the changes with `/commit-smart`
2. Then start the next task

## Key Context

### Architecture Decisions
- **Framework**: Optuna with NSGA-II sampler
- **Storage**: PostgreSQL (existing, use same connection)
- **Pruning**: MedianPruner at gen 10, 20, 50
- **Seeds**: 5 per configuration
- **Sensitivity**: fANOVA (built into Optuna)

### Parameter Tiers (Updated with NEAT)
- **Tier 1 (11 params)**: neural_mode, mutation_rate, weight_mutation_magnitude, neural_hidden_size, population_size, simulation_duration, selection_method, neat_initial_connectivity, neat_add_connection_rate, neat_add_node_rate, neat_max_hidden_nodes
- **Tier 2 (17 params)**: activation, crossover_rate, elite_count, decay, time_encoding, bias_mode, use_proprioception, neural_crossover_method, use_adaptive_mutation, compatibility_threshold, neat_excess/disjoint/weight coefficients
- **Tier 3 (13 params)**: friction, gravity, output_bias, dead_zone, sbx_eta, stagnation params, sharing params, output_smoothing, neural_update_hz

### Auto-Enforcement Rules
- If `neural_mode == 'neat'`: force `selection_method = 'speciation'`, disable `use_fitness_sharing`
- NEAT params are only sampled when `neural_mode == 'neat'` (conditional parameter space)

### Objectives
1. **Fitness** (maximize): Top-5 average fitness after N generations
2. **Diversity** (maximize): Behavioral/morphological variance

### Two-Phase Search Strategy
1. **Screening**: 50-100 quick trials (20 gens, 200 creatures, 1 seed) to identify important parameters
2. **Deep Search**: 200-500 trials on important params (100 gens, 1000 creatures, 5 seeds)

### Compute
- 2x NVIDIA T4 (16GB VRAM each)
- 56GB RAM
- Can run 2 trials in parallel

## CLI Interface (Target)

```bash
# Run NAS - full search across all neural modes
nas run --study-name my-search [--n-trials 100] [--resume] [--phase screening|deep]

# Run NAS - focus on specific modes
nas run --study-name fixed-arch --mode pure,hybrid   # Fixed topology only
nas run --study-name neat-explore --mode neat        # NEAT only

# Check status
nas status --study-name my-search

# Export results
nas export --study-name my-search --format csv|json

# Show best configs
nas best --study-name my-search [--n-top 5]

# Sensitivity analysis
nas analyze --study-name my-search
```

## Files to Create

```
nas/
├── nas-plan.md           # Architecture plan (done)
├── nas-prd.json          # Task tracker (done)
├── nas-intuitions.ipynb  # Learning notebook (done)
├── cli.py                # Typer CLI entry point
├── parameters.py         # Parameter space definition
├── objectives.py         # Fitness/diversity calculations
├── runner.py             # Trial runner (calls backend APIs)
├── search.py             # Optuna study management
├── storage.py            # PostgreSQL integration
├── screening.py          # Morris/low-fidelity screening
├── analysis.py           # fANOVA, Pareto front analysis
├── logging.py            # CLI progress output
└── nas-findings.ipynb    # Results notebook (created after search completes)
```

## Checklist

Before marking a task complete:
- [ ] Implementation works
- [ ] Tests pass (if applicable)
- [ ] CLI command works (if applicable)
- [ ] PRD status updated
- [ ] Changes committed

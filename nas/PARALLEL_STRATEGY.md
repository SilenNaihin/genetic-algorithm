# Parallel Trial Strategy for Azure D128as_v7 (128 vCPU)

## Current Bottlenecks

1. **Optuna trials run sequentially** - Only uses 1 core at a time
2. **Seeds within trials are sequential** - Even though there's batched mode, it doesn't fully parallelize
3. **No cross-trial parallelism** - 128 cores sit idle while one trial runs

## Performance Analysis

**Single trial performance:**
- NEAT (500 pop, 10 gen): ~4.3s per generation = ~43s total
- Pure (500 pop, 10 gen): ~1.4s per generation = ~14s total

**Typical NAS search:**
- 100 trials × 30 generations × 3 seeds × 300 population
- Sequential: ~100 trials × 90s/trial = **2.5 hours**
- With 20 parallel workers: ~5 trials × 90s = **7.5 minutes** (20x speedup!)

## Optimal Strategy

### Tier 1: Parallel Trials (Primary Speedup)

**Use Optuna's `n_jobs` parameter to run multiple trials simultaneously:**

```python
study.optimize(objective, n_trials=100, n_jobs=20)
```

**Why 20 workers?**
- Each trial uses ~4-6 cores (PyTorch parallel ops)
- 20 workers × 6 cores = 120 cores utilized
- Leaves headroom for system overhead

**Benefits:**
- 15-20x speedup on full search
- Each trial is isolated (different hyperparameters)
- No shared state issues
- Linear scaling up to memory limits

### Tier 2: Keep Seeds Sequential (Within Trial)

**DO NOT parallelize seeds within a trial:**

```python
# Good: Sequential seeds
for seed in [42, 123, 456]:
    result = run_evolution(config, generations, seed)

# Bad: Parallel seeds (diminishing returns)
with ProcessPoolExecutor() as executor:
    results = executor.map(run_evolution, seeds)  # Not worth the overhead
```

**Why?**
- Seeds share the same config (same simulator setup)
- Sequential is simpler and avoids multiprocessing overhead
- Trials are already parallelized (Tier 1)
- 3 seeds × 90s = 270s per trial is acceptable when 20 trials run in parallel

### Tier 3: Multiple Search Studies (Advanced)

**For exhaustive exploration, run multiple search studies simultaneously:**

```bash
# Terminal 1: NEAT search (low population)
nas search neat-low -m neat -n 100 -g 30 -s 3 -p 200 --n-jobs 10

# Terminal 2: NEAT search (high population)
nas search neat-high -m neat -n 100 -g 30 -s 3 -p 500 --n-jobs 10

# Uses all 128 cores: 10+10 studies × 6 cores = 120 cores
```

## Implementation Plan

### Phase 1: Add `n_jobs` to Optuna (Quick Win)

**Changes needed:**
1. Add `--n-jobs` flag to `nas search` command
2. Pass `n_jobs` to `study.optimize()`
3. Add progress reporting that works with parallel workers

**Code changes:**
```python
# cli.py
@app.command()
def search(
    ...,
    n_jobs: int = typer.Option(1, "--n-jobs", "-j", help="Parallel workers (1=sequential, -1=all cores)"),
):
    ...

# search.py
def run_search(..., n_jobs: int = 1):
    study.optimize(
        objective,
        n_trials=n_trials,
        n_jobs=n_jobs,
        show_progress_bar=True,
    )
```

### Phase 2: Process Pool for Seeds (Optional, Lower Priority)

**Only if Tier 1 doesn't saturate cores:**

```python
def run_multi_seed_parallel(config, generations, seeds, max_workers=3):
    from multiprocessing import Pool

    def run_single_seed(args):
        config, generations, seed = args
        return run_evolution(config, generations, seed)

    with Pool(max_workers) as pool:
        results = pool.map(run_single_seed, [(config, generations, s) for s in seeds])

    return results
```

**Trade-offs:**
- Adds ~2-3x speedup per trial (3 seeds in parallel)
- But reduces number of parallel trials (20 → 7 workers)
- Net gain: ~1.5x overall (not worth the complexity)

### Phase 3: Distributed Search (Future)

**For multi-machine clusters:**
- Use Optuna's built-in distributed optimization
- Shared PostgreSQL storage for trial coordination
- Each machine runs `n_jobs` workers independently

## Recommended Configuration

### Quick Screening (1-2 hours)
```bash
nas search screen-001 -m neat -n 100 -g 20 -s 2 -p 200 --n-jobs 20 --stagnation-limit 15
```
- 100 trials, 20 generations, 2 seeds, population 200
- 20 parallel workers
- Early stopping if no improvement for 15 generations
- ~1-2 hours total

### Deep Search (4-6 hours)
```bash
nas search deep-001 -m neat -n 200 -g 50 -s 3 -p 300 --n-jobs 15 --stagnation-limit 30
```
- 200 trials, 50 generations, 3 seeds, population 300
- 15 parallel workers (higher memory usage per trial)
- ~4-6 hours total

### Exhaustive Search (12-24 hours)
```bash
# Run two studies in parallel (different parameter spaces)
nas search neat-struct -m neat -n 300 -g 100 -s 3 -p 500 --n-jobs 10 &
nas search pure-fixed -m pure -n 200 -g 100 -s 3 -p 500 --n-jobs 10 &
```
- 500 total trials across both studies
- 20 workers total (10 per study)
- ~12-24 hours total

## Memory Considerations

**Per-trial memory usage:**
- Population 200: ~500 MB
- Population 300: ~800 MB
- Population 500: ~1.5 GB

**Total memory with 20 workers:**
- 20 × 1.5 GB = **30 GB** peak
- Azure D128as_v7: 512 GB RAM ✓ (plenty of headroom)

## Testing Plan

1. **Baseline (sequential):**
   ```bash
   time nas search test-seq -m neat -n 10 -g 20 -s 2 -p 200 --n-jobs 1
   ```

2. **Parallel (20 workers):**
   ```bash
   time nas search test-par -m neat -n 10 -g 20 -s 2 -p 200 --n-jobs 20
   ```

3. **Measure speedup:**
   - Expected: 15-18x speedup (not full 20x due to overhead)
   - Memory usage should stay under 20 GB

## Next Steps

1. ✅ Benchmark single trial performance (DONE)
2. ✅ Implement `n_jobs` parameter in search command (DONE)
3. ⬜ Test with 10 workers, then 20 workers
4. ⬜ Monitor CPU utilization (`htop`) and memory (`free -h`)
5. ⬜ Run full screening search (100 trials) to validate
6. ⬜ Update docs with recommended commands for 128-core machines

## Quick Test

Test the parallel implementation with a small search:

```bash
# Test with 5 workers (should finish ~5x faster than sequential)
time python cli.py search test-parallel -m neat -n 10 -g 10 -s 2 -p 200 --n-jobs 5

# Compare to sequential
time python cli.py search test-sequential -m neat -n 10 -g 10 -s 2 -p 200 --n-jobs 1

# Monitor in another terminal
htop
```

Expected results:
- 5 workers: ~2x wall time of single trial (not 5x due to startup overhead with small trials)
- CPU utilization: Should see 5 cores at 100% throughout
- Memory: ~2.5 GB total (5 × 500 MB)

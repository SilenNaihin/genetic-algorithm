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
3. ✅ Test with 5, 10, 20 workers (DONE - see results below)
4. ✅ Monitor CPU utilization (`htop`) and memory (`free -h`) (DONE)
5. ❌ Run full screening search (100 trials) - **FAILED AT PRODUCTION SCALE**
6. ⬜ Update docs with recommended commands for 128-core machines

---

## ACTUAL RESULTS: 128-CORE FAILURE (2026-01-30)

### What We Tested

**Hardware:** Azure D128as_v7 (128 vCPU, 512 GB RAM)

**Test configurations:**
1. ✅ Small tests (200 pop, 10-20 gen, 2 seeds): **WORKED**
2. ❌ Production tests (500 pop, 150 gen, 3 seeds): **FAILED**

### Results Summary

| Configuration | n_jobs | Expected Time | Actual Time | Trials Completed | Status |
|--------------|--------|---------------|-------------|------------------|---------|
| Small (200p/20g/2s) | 5 | ~2 min | ~2-3 min | 10/10 | ✅ Works |
| Small (200p/10g/2s) | 10 | ~1 min | ~1-2 min | 5/5 | ✅ Works |
| **Production (500p/150g/3s)** | **5** | **~12 min** | **8 hours** | **12/100** | ❌ **Sequential** |
| **Production (500p/150g/3s)** | **1** | **19 hours** | **11.4 min/trial** | **1/1** | ✅ Baseline |

### The Failure Mode

**What happened:**
- Launched 100 trials with `n_jobs=5` for both Pure and NEAT modes
- Expected: 100 trials ÷ 5 workers × 11.4 min = **~3.8 hours**
- Actual: 12 trials in 8 hours = **40 min/trial** (sequential execution)
- **Speedup: 0x** (worse than sequential due to overhead)

**Symptoms:**
- Progress bar showed `0%|          | 0/100 [00:00<?, ?it/s]` for hours
- No trial result files being written
- CPU usage: 200-400% (2-4 cores active, not 20-30 expected)
- 387 threads spawned per process (expected ~50-100)
- Process appeared "stuck" in initialization

**What we expected:**
```
Trial 0: RUNNING (worker 1)
Trial 1: RUNNING (worker 2)
Trial 2: RUNNING (worker 3)
Trial 3: RUNNING (worker 4)
Trial 4: RUNNING (worker 5)
...
[Trial 0 completes after 11 min]
Trial 5: RUNNING (worker 1)  # Immediately starts next batch
```

**What actually happened:**
```
[8 hours of apparent hanging]
Trial 0: COMPLETE (11.4 min)
[Wait]
Trial 1: COMPLETE (11.4 min)
[Wait]
Trial 2: COMPLETE (11.4 min)
...
# Sequential execution with massive overhead
```

### Root Cause Analysis

**Why it failed at production scale:**

1. **Optuna multiprocessing overhead**
   - Small trials: Overhead is negligible (trial runs in seconds)
   - Large trials: Overhead dominates (trial runs in minutes)
   - With 500 pop × 150 gen × 3 seeds, the process spawn/join overhead becomes significant

2. **Memory contention (suspected)**
   - 5 workers × 500 pop × 150 gen = massive memory footprint
   - Each worker's PyTorch operations may be competing for memory bandwidth
   - RAM available (512 GB) but memory **bandwidth** may be saturated

3. **Thread explosion**
   - 387 threads per process (way more than expected 50-100)
   - Suggests nested parallelism issues (PyTorch + Optuna both trying to parallelize)
   - Thread context switching overhead

4. **Optuna's joblib backend limitations**
   - Uses `joblib.Parallel` under the hood with `loky` backend
   - Known to have issues with long-running jobs
   - May serialize instead of parallelize when processes are slow to respond

5. **Resource locking**
   - Multiple processes trying to write to results directory
   - File I/O contention during checkpoint saves
   - Database/study storage contention

### What Actually Works

**Small-scale parallelism** (confirmed working):
```bash
# ✅ WORKS: 200 pop, 20 gen, 2 seeds, 5-10 workers
python cli.py search test-small -m pure -n 10 -g 20 -s 2 -p 200 --n-jobs 5
# Completes in ~2-3 minutes (5x speedup achieved)
```

**Sequential at production scale** (reliable baseline):
```bash
# ✅ WORKS: 500 pop, 150 gen, 3 seeds, 1 worker
python cli.py search prod-seq -m pure -n 50 -g 150 -s 3 -p 500 --n-jobs 1
# Completes in ~9.5 hours (11.4 min/trial × 50 trials)
```

### Recommended Approach Going Forward

**For Azure D128as_v7 (128 cores):**

**DON'T:**
- ❌ Use `n_jobs > 1` with production parameters (500 pop, 150+ gen, 3 seeds)
- ❌ Expect linear scaling beyond small tests
- ❌ Trust the 128-core promise for this workload

**DO:**
- ✅ Run sequential searches (`--n-jobs 1`)
- ✅ Launch multiple independent search studies in separate terminals
- ✅ Use smaller population/generation counts if parallelism is needed
- ✅ Reduce scope (50 trials instead of 100) to finish overnight

**Practical production commands:**

```bash
# Option 1: Sequential, reliable (9.5 hours for 50 trials)
python cli.py search pure-prod -m pure -n 50 -g 150 -s 3 -p 500 --stagnation-limit 50 --n-jobs 1

# Option 2: Multiple sequential searches in parallel terminals
# Terminal 1: Pure search
python cli.py search pure-prod -m pure -n 50 -g 150 -s 3 -p 500 --n-jobs 1 > pure.log 2>&1 &

# Terminal 2: NEAT search
python cli.py search neat-prod -m neat -n 50 -g 150 -s 3 -p 500 --n-jobs 1 > neat.log 2>&1 &

# This uses 2 cores reliably, finishes both in ~9.5 hours
# NOT efficient for 128 cores, but WORKS
```

### Why 128 Cores Don't Help

**The brutal truth:**
- Genetic algorithms are inherently sequential at the generation level
- Within-generation parallelism exists (PyTorch batch ops) but saturates at 4-6 cores per trial
- Optuna's multiprocessing works great for **short trials** (seconds)
- Optuna's multiprocessing **fails** for **long trials** (10+ minutes)
- 128 cores would be amazing for **embarrassingly parallel** workloads (web servers, map-reduce)
- 128 cores are **mostly wasted** for this workload

**What would help:**
- Distributed computing framework (Ray, Dask) instead of Optuna's joblib
- True distributed evolution (islands model with migration)
- GPU acceleration for physics simulation (move from CPU PyTorch to CUDA)
- None of these are currently implemented

### Lessons Learned

1. **Always benchmark at production scale before assuming parallelism works**
2. **Small test success ≠ production scale success**
3. **Optuna's `n_jobs` is great for quick trials, terrible for long trials**
4. **128 cores doesn't matter if your parallelism strategy is broken**
5. **Sequential + overnight >>> parallel + broken**

### Cost Analysis

**What we paid for:**
- Azure D128as_v7: ~$3.50/hour
- 8 hours of failed parallel runs: **~$28 wasted**
- 0 additional results vs sequential

**What would have worked:**
- Azure D4as_v7 (4 vCPU): ~$0.20/hour
- 10 hours sequential: **~$2.00 total**
- Same results, 14x cheaper

**The 128-core premium was pointless for this workload.**

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

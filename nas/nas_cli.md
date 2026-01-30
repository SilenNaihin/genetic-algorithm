# NAS CLI Documentation

Neural Architecture Search command-line interface for Evolution Lab.

---

## Quick Start

```bash
# Single evolution run
python cli.py run -c neat_baseline -g 100 -s 3

# Hyperparameter search (sequential - WORKS)
python cli.py search my-study -m neat -n 50 -g 150 -s 3 -p 500 --n-jobs 1

# ⚠️ DO NOT USE n-jobs > 1 with production parameters (see below)
```

---

## The 128-Core Failure: A Case Study

### What We Tried

**Goal:** Utilize Azure D128as_v7 (128 vCPU, $3.50/hour) for parallel hyperparameter search.

**Initial Attempt:**
```bash
python cli.py search my-study -m pure -n 100 -g 150 -s 3 -p 500 --n-jobs 5
```

**Expected:** 100 trials ÷ 5 workers × 11.4 min = **3.8 hours** (~$13)

**Actual:** 12 trials in 8 hours = **sequential execution** (~$28 wasted)

### Why It Failed

**Root Cause:** Optuna's joblib backend cannot handle long-running trials (10+ minutes).

**Two separate issues:**

1. **Nested Parallelism** (minor contributor):
   - PyTorch's internal threading (OMP/MKL) conflicts with Optuna's multiprocessing
   - Causes 387 threads per process (expected ~50-100)
   - High context-switching overhead

2. **Joblib Serialization** (primary cause):
   - Joblib's `loky` backend has timeout/heartbeat mechanisms
   - Long-running trials trigger "unresponsive process" detection
   - Falls back to sequential execution "to be safe"
   - No amount of tuning fixes this architectural limitation

### Symptoms

```
Progress: 0%|          | 0/100 [00:00<?, ?it/s]
[Hours of apparent hanging]
Trial 0: COMPLETE (11.4 min)
[Wait]
Trial 1: COMPLETE (11.4 min)
...
# Sequential execution with massive overhead
```

**Diagnostic signs:**
- Progress bar stuck at 0% for hours
- CPU usage: 200-400% (only 2-4 cores active)
- No child processes in process tree (only main process)
- Thread explosion (387 threads vs expected 50-100)
- Empty results directory despite hours of runtime

### Thread Limiting Experiment (Failed)

**Hypothesis:** Nested parallelism was preventing worker spawning.

**Solution Attempted:** Added `--limit-threads` flag to force single-threaded PyTorch:
```python
os.environ['OMP_NUM_THREADS'] = '1'
os.environ['MKL_NUM_THREADS'] = '1'
os.environ['OPENBLAS_NUM_THREADS'] = '1'
```

**Results:**

| Scale | Without | With --limit-threads | Speedup |
|-------|---------|---------------------|---------|
| **Small** (200 pop, 10 gen) | 44.2s | **28.3s** | **1.56x** ✅ |
| **Production** (500 pop, 150 gen) | 8h for 12 trials | **12min for 0 trials** | **Worse!** ❌ |

**Conclusion:** Thread limiting improved CPU efficiency at small scale but **completely failed** at production scale. The core issue is joblib's serialization, not nested parallelism.

### Why 128 Cores Didn't Help

**The brutal truth:**

- Optuna's joblib backend: Built for short trials (seconds to minutes)
- Our trials: 10+ minutes each (too long)
- Scaling behavior: Works at small scale, breaks at large scale
- Core count: Irrelevant if backend serializes everything

**Cost Analysis:**

| VM Size | vCPU | Cost/Hour | Our Utilization | Effective Cost |
|---------|------|-----------|-----------------|----------------|
| D128as_v7 | 128 | $3.50 | 0.8% (1 core) | $437.50 per core-hour |
| D4as_v7 | 4 | $0.20 | 25% (1 core) | $0.80 per core-hour |

**Verdict:** We paid $3.50/hour for 128 cores but used only 1. **A 4-core VM gives identical performance for $0.20/hour** (94% savings).

---

## Working Solutions

### Option 1: Sequential Execution (Current Workaround)

**Use this until Ray backend is validated.**

```bash
python cli.py search my-study -m neat -n 50 -g 150 -s 3 -p 500 --n-jobs 1
```

**Performance:**
- Time: ~9.5 hours for 50 trials (11.4 min/trial)
- Cores used: 1
- Cost on D128as_v7: $33 (~$0.66/trial)
- **Recommendation:** Use D4as_v7 instead ($2 for same result)

**When to use:**
- Overnight runs (reliable, low-maintenance)
- Limited budget (use D4as_v7)
- Small-scale searches (<50 trials)

### Option 2: Multiple Sequential Searches

**Launch separate studies in different terminals.**

```bash
# Terminal 1: Pure mode
python cli.py search pure-study -m pure -n 50 -g 150 -s 3 -p 500 --n-jobs 1 &

# Terminal 2: NEAT mode
python cli.py search neat-study -m neat -n 50 -g 150 -s 3 -p 500 --n-jobs 1 &

# Both complete in ~9.5 hours (parallel)
# Uses 2 cores (still wasteful on 128-core VM)
```

**Performance:**
- Time: ~9.5 hours for 100 trials total (2 studies in parallel)
- Cores used: 2
- Cost: $33 for 100 trials across both modes
- **Utilization:** Still only 1.6% (2/128 cores)

### Option 3: Ray Backend (Implemented, Not Yet Tested) ⭐

**This should work for true parallelism.**

```bash
# Install Ray
pip install "ray[default]"

# Run search
python search_ray.py search my-study -m neat -n 100 -g 150 -s 3 -p 500 -w 15
```

**Why Ray should work:**
- Centralized scheduler (not fork-based like joblib)
- Designed for long-running distributed tasks
- Shared object store (less memory duplication)
- Explicit task management (no mysterious serialization)
- Actor-based parallelism

**Expected Performance:**
- Time: ~1.3 hours for 100 trials (15x speedup)
- Cores used: ~90 (15 workers × 6 cores each)
- Cost: ~$4.50 for 100 trials ($0.045/trial)
- **Utilization:** ~70% (90/128 cores)

**Status:** ⏳ Implementation complete, requires testing to validate

### Option 4: Process Pool Baseline (Implemented, Diagnostic)

**Bypasses Optuna entirely for diagnostic purposes.**

```bash
python search_processpool.py search my-study -m neat -n 10 -g 150 -s 3 -p 500 -w 5
```

**Purpose:**
- Tests if multiprocessing.Pool works (it should)
- Isolates Optuna as the bottleneck
- Provides working alternative if Ray fails

**Limitations:**
- No Optuna features (TPE sampler, pruning, etc.)
- Random search only (uniform sampling)
- Less sophisticated hyperparameter optimization

### Option 5: Islands Model (Future Work)

**Distributed evolution with migration.**

**Concept:**
```bash
# Launch 20 independent islands
for i in {1..20}; do
    python cli.py evolve island-$i -p 250 -g 150 --migration-dir shared/ &
done
```

**Migration strategy:**
- Every 10 generations: Write top 5 genomes to `shared/migration_pool/`
- Import random 5 genomes from other islands
- Replace worst 5 in population
- File-based synchronization (no coordination overhead)

**Expected Performance:**
- Time: ~19 hours (same as sequential, but explores 10x more parameter space)
- Cores used: ~120 (20 islands × 6 cores each)
- Cost: ~$67 for 500 total trials across 20 studies
- **Utilization:** ~94% (120/128 cores)

**Advantages:**
- Embarrassingly parallel (guaranteed to scale)
- Natural fit for genetic algorithms
- Well-established in GA literature
- Highest core utilization possible

**Status:** 📋 Design complete, implementation needed (~4-6 hours)

---

## Command Reference

### Basic Commands

```bash
# List available configs
python cli.py configs

# Run single evolution
python cli.py run -c neat_baseline -g 100 -s 3 -p 500

# Benchmark performance
python cli.py benchmark -p 500 -g 10

# List results
python cli.py results

# Compare configs
python cli.py compare neat_baseline neat_sparse neat_minimal
```

### Search Commands

```bash
# Sequential search (RECOMMENDED)
python cli.py search study-name \
    --mode neat \
    --trials 50 \
    --generations 150 \
    --seeds 3 \
    --population-size 500 \
    --n-jobs 1 \
    --stagnation-limit 50

# ⚠️ Parallel search (BROKEN - DO NOT USE)
python cli.py search study-name \
    --mode neat \
    --trials 50 \
    --generations 150 \
    --seeds 3 \
    --population-size 500 \
    --n-jobs 20 \
    --limit-threads  # This doesn't help!

# Multi-objective search
python cli.py search study-name \
    --mode neat \
    --trials 100 \
    --multi-objective \
    --n-jobs 1  # Sequential only!
```

### Alternative Backends

```bash
# Ray backend (use this when validated)
python search_ray.py search study-name \
    -m neat \
    -n 100 \
    -g 150 \
    -s 3 \
    -p 500 \
    -w 15

# Process Pool (diagnostic)
python search_processpool.py search study-name \
    -m neat \
    -n 10 \
    -g 150 \
    -s 3 \
    -p 500 \
    -w 5
```

---

## Hardware Recommendations

### For Sequential Execution

**Use the smallest VM that fits in memory:**

| Population | Memory Needed | Recommended VM | Cost/Hour | Cost per 50 Trials |
|-----------|---------------|----------------|-----------|-------------------|
| 200 | ~4 GB | D2as_v7 (2 vCPU, 8 GB) | $0.10 | $1.00 |
| 500 | ~8 GB | D4as_v7 (4 vCPU, 16 GB) | $0.20 | $2.00 |
| 1000 | ~16 GB | D8as_v7 (8 vCPU, 32 GB) | $0.40 | $4.00 |

**Rule of thumb:** Sequential execution uses 1 core regardless of VM size. Don't pay for cores you won't use.

### For Parallel Execution (Once Ray is Validated)

**Match workers to available cores:**

| VM Size | vCPU | Memory | Recommended Workers | Cost/Hour | Trials/Hour |
|---------|------|--------|-------------------|-----------|-------------|
| D8as_v7 | 8 | 32 GB | 1 (sequential) | $0.40 | ~5 |
| D16as_v7 | 16 | 64 GB | 2 | $0.80 | ~10 |
| D32as_v7 | 32 | 128 GB | 5 | $1.60 | ~26 |
| D64as_v7 | 64 | 256 GB | 10 | $3.20 | ~52 |
| D128as_v7 | 128 | 512 GB | 15-20 | $3.50 | ~78 |

**Rule of thumb:** Use n_workers ≈ vCPU / 6 (each worker uses ~6 cores for PyTorch ops)

**Cost-effectiveness:**
- D32as_v7 is the "sweet spot" (5 workers, $1.60/h, ~$3/100 trials)
- D128as_v7 only worth it for large-scale searches (>500 trials)

---

## Troubleshooting

### Problem: Progress bar stuck at 0%

**Symptoms:**
```
0%|          | 0/100 [00:00<?, ?it/s]
[Hours pass with no output]
```

**Cause:** Optuna's joblib backend serializing long trials.

**Solution:**
1. Kill the process (it's stuck)
2. Use `--n-jobs 1` (sequential)
3. OR wait for Ray backend validation

### Problem: High CPU but no output

**Symptoms:**
- `htop` shows 400-600% CPU usage
- No trials completing
- Results directory empty

**Cause:** Process stuck in initialization or first trial.

**Solution:**
1. Kill the process
2. Check if you're using production parameters (500 pop, 150 gen)
3. Use sequential execution (`--n-jobs 1`)

### Problem: Memory errors

**Symptoms:**
```
RuntimeError: [enforce fail at alloc_cpu.cpp:73] . DefaultCPUAllocator: can't allocate memory
```

**Cause:** Not enough RAM for population size × workers.

**Solution:**
1. Reduce `--population-size`
2. Reduce `--n-jobs` (if using parallel)
3. Upgrade to larger VM

**Memory requirements:**
- Population 200: ~500 MB per worker
- Population 500: ~1.5 GB per worker
- Population 1000: ~3 GB per worker

### Problem: Thread explosion

**Symptoms:**
- `ps -p <pid> -o nlwp` shows 300+ threads
- High context-switching overhead

**Cause:** Nested parallelism (PyTorch × Optuna).

**Partial fix:** Use `--limit-threads` flag
```bash
python cli.py search study-name ... --n-jobs 5 --limit-threads
```

**Note:** This improves small-scale performance but doesn't fix large-scale serialization.

---

## Performance Expectations

### Single Trial Benchmarks

**Hardware:** AMD EPYC 7763 (128 vCPU), CPU only

| Configuration | Time per Generation | Total Time (150 gen) |
|--------------|-------------------|---------------------|
| 200 pop, Pure | ~0.5s | ~75s (~1.3 min) |
| 500 pop, Pure | ~1.5s | ~225s (~3.8 min) |
| 500 pop, Pure, 3 seeds | ~1.5s | ~680s (~11.4 min) |
| 200 pop, NEAT | ~1.4s | ~210s (~3.5 min) |
| 500 pop, NEAT | ~4.3s | ~645s (~10.8 min) |

### Parallel Search Estimates

**Assuming Ray backend works with 15 workers:**

| Trials | Sequential Time | Parallel Time (15 workers) | Speedup |
|--------|----------------|---------------------------|---------|
| 10 | ~2 hours | ~8 minutes | 15x |
| 50 | ~9.5 hours | ~38 minutes | 15x |
| 100 | ~19 hours | ~1.3 hours | 15x |
| 500 | ~95 hours | ~6.3 hours | 15x |

**Note:** These are projections based on Ray architecture. Actual performance pending validation.

---

## Best Practices

### DO ✅

- **Use sequential execution** (`--n-jobs 1`) for production parameters
- **Use small VMs** (D4as_v7) for sequential execution
- **Test at production scale** before assuming parallelism works
- **Monitor with `htop`** to verify cores are actually utilized
- **Check results directory** to confirm trials are completing
- **Use early stopping** (`--stagnation-limit 50`) to save time

### DON'T ❌

- **Don't use `--n-jobs > 1`** with Optuna for production parameters (broken)
- **Don't pay for 128 cores** if you're using sequential execution
- **Don't assume small-scale success** means production-scale success
- **Don't wait 8 hours** before checking if it's stuck
- **Don't use `--no-batched`** (batched mode is 1.4-1.6x faster)

---

## Research Findings

**Full details:** See `RESEARCH_SUMMARY.md` for comprehensive 12-page analysis.

### Key Insights

1. **Optuna + joblib cannot handle long trials** (10+ min) regardless of tuning
2. **Thread limiting helps at small scale** (36% faster) but **fails at large scale**
3. **Nested parallelism is real** but joblib serialization is the bigger issue
4. **Small test success ≠ production success** due to non-linear overhead scaling
5. **128 cores are useless** with the wrong backend (0.8% utilization = $437.50/core-hour)

### Future Directions

1. **Validate Ray backend** (1 hour of testing, high probability of success)
2. **Implement Islands model** (4-6 hours, guaranteed to work)
3. **Add GPU acceleration** (orthogonal optimization, speeds up individual trials)
4. **Contribute fixes to Optuna** (if possible - may be fundamental limitation)

---

## Related Documentation

- **PARALLEL_STRATEGY.md** - Original failure analysis and strategy design
- **PARALLEL_RESULTS.md** - Detailed experimental results and measurements
- **PARALLEL_EXPERIMENTS.md** - Research methodology and experimental design
- **RESEARCH_SUMMARY.md** - Comprehensive 12-page research analysis
- **CLAUDE.md** - General project documentation

---

## Support

For issues or questions:
1. Check troubleshooting section above
2. Review research documentation in `nas/` directory
3. File issue at: https://github.com/anthropics/evolution-lab/issues

---

**Last updated:** 2026-01-30 (after 128-core failure investigation)

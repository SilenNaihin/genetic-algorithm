# Parallel Execution Experiments

**Goal:** Understand why n_jobs parallelism fails at production scale and test alternatives.

## Hypothesis

The 128-core failure is caused by Optuna's joblib/loky backend, not fundamental parallelism limits.

**Evidence:**
- Small trials (200 pop, 20 gen) parallelize successfully
- Large trials (500 pop, 150 gen) fall back to sequential execution
- 387 threads per process suggests nested parallelism conflicts
- Memory bandwidth and I/O contention may be secondary factors

## Experiments

### Experiment 1: Ray Backend (HIGHEST PRIORITY)

**Hypothesis:** Ray's distributed scheduler will handle long-running trials better than joblib.

**Why this might work:**
- Ray uses a centralized scheduler (not fork-based multiprocessing)
- Better handling of long-running tasks
- Less memory copying overhead (shared object store)
- Built-in Optuna integration

**Implementation:**
```python
# Install: pip install ray optuna-integration
import ray
from optuna.integration import RayStudy

ray.init(num_cpus=20)  # Control parallelism explicitly

# Replace study.optimize() with Ray-backed version
ray_study = RayStudy(study, n_jobs=5)
ray_study.optimize(objective, n_trials=100)
```

**Test plan:**
1. Small test (200 pop, 20 gen, 2 seeds) - should match current performance
2. Medium test (300 pop, 50 gen, 3 seeds) - critical transition point
3. Production test (500 pop, 150 gen, 3 seeds) - full scale

**Success criteria:**
- CPU usage: 200-300% per worker (5 workers = 1000-1500% total)
- Memory: Linear growth with workers (5 workers × 1.5 GB = 7.5 GB)
- Time: ~5x speedup vs sequential (20 hours → 4 hours)

**Cost:** $0 (just install Ray)

---

### Experiment 2: Process Pool Baseline (CONTROL)

**Hypothesis:** Even simple multiprocessing.Pool will work better than Optuna's backend.

**Why this might work:**
- Direct control over process spawning
- No Optuna overhead
- Simple fork model without fancy scheduling

**Implementation:**
```python
from multiprocessing import Pool

def run_trial_wrapper(trial_id):
    """Run a single trial (complete evolution run)"""
    config = suggest_hyperparameters()  # Sample from search space
    result = run_evolution(config, generations=150, seeds=[42, 123, 456])
    save_result(trial_id, config, result)
    return result

# Run trials in parallel
with Pool(processes=5) as pool:
    results = pool.map(run_trial_wrapper, range(100))
```

**Test plan:**
1. 10 trials with 5 workers
2. Monitor for sequential fallback
3. Compare to Ray backend

**Success criteria:**
- Should see 5 cores active simultaneously
- No 8-hour hangs

**Cost:** $0 (no new dependencies)

---

### Experiment 3: Islands Model (ARCHITECTURE CHANGE)

**Hypothesis:** Independent subpopulations with periodic migration will scale better.

**Why this might work:**
- No cross-trial coordination needed
- Each island runs independently (embarrassingly parallel)
- Migration happens asynchronously via shared directory
- Natural fit for 128 cores (20+ islands)

**Implementation:**
```python
# Launch 20 independent evolution runs (islands)
# Each island: 250 pop, 150 gen, different hyperparameters
# Every 10 generations: write best 5 genomes to migration_pool/
# Every 10 generations: import random 5 genomes from migration_pool/

# Terminal 1-20: Each runs one island
python cli.py evolve island-01 -p 250 -g 150 --migration-dir shared/ --migrate-every 10

# Islands read from/write to shared directory
# No coordination needed except file I/O
```

**Migration strategy:**
- Every N generations: Write top K genomes to `migration_pool/island-{id}/gen-{n}/`
- Import random K genomes from other islands, replace worst K
- File-based synchronization (simple, no database)

**Test plan:**
1. 5 islands, 200 pop, 50 gen - prove concept
2. 20 islands, 250 pop, 150 gen - full scale

**Success criteria:**
- All 20 islands run independently
- Periodic migration files appear
- Final population shows genetic diversity (not all from one island)

**Cost:** 4-6 hours implementation time

---

### Experiment 4: Thread Count Limiting (CONTROL)

**Hypothesis:** Thread explosion is the root cause, not trial length.

**Why this might work:**
- 387 threads per process is insane
- Forcing PyTorch to single-threaded might reduce contention

**Implementation:**
```python
import os
os.environ['OMP_NUM_THREADS'] = '1'
os.environ['MKL_NUM_THREADS'] = '1'
os.environ['OPENBLAS_NUM_THREADS'] = '1'
os.environ['NUMEXPR_NUM_THREADS'] = '1'

# Then run study.optimize(n_jobs=20)
```

**Test plan:**
1. Production test (500 pop, 150 gen, 3 seeds, 20 workers)
2. Monitor thread count per process

**Success criteria:**
- Thread count per process: 10-20 (not 387)
- If this fixes it, we know nested parallelism was the issue

**Cost:** $0 (just environment variables)

---

### Experiment 5: GPU Acceleration (SEPARATE TRACK)

**Hypothesis:** GPU will speed up physics but won't solve parallelism issues.

**Why this might work:**
- PyTorch operations move to CUDA
- 10-100x speedup for tensor operations
- But: Still CPU-bound by Python overhead

**Implementation:**
```python
# Move tensors to GPU
device = torch.device('cuda')
positions = positions.to(device)
velocities = velocities.to(device)
# ... rest of physics on GPU
```

**Test plan:**
1. Single trial on GPU vs CPU
2. Measure speedup
3. Test if GPU enables more parallelism (probably not)

**Success criteria:**
- 5-10x speedup per trial (11.4 min → 1-2 min)
- But: Still only 1 trial at a time per GPU

**Cost:** ~$2-4/hour for GPU VM (A100 or V100)

**Note:** This is orthogonal to parallelism - it speeds up individual trials but doesn't help with multi-trial parallelism unless you have multiple GPUs.

---

## Recommended Order

1. **Experiment 4** (Thread limiting) - 1 hour, $0
   - Fast test of root cause hypothesis
   - If this fixes it, we're done

2. **Experiment 1** (Ray backend) - 2 hours, $0
   - Addresses known joblib limitations
   - Optuna has built-in integration

3. **Experiment 2** (Process Pool) - 1 hour, $0
   - Control experiment
   - Proves whether Optuna is the problem

4. **Experiment 3** (Islands model) - 4-6 hours, $0
   - Most research-interesting
   - Natural fit for genetic algorithms
   - Would make a good paper contribution

5. **Experiment 5** (GPU) - Separate track
   - Different optimization goal
   - Expensive to test
   - Do this AFTER solving parallelism

## Expected Outcomes

**If thread limiting works:**
- Root cause: Nested parallelism (PyTorch × Optuna)
- Solution: Set thread limits before launching workers
- Paper contribution: "Avoiding nested parallelism in hyperparameter optimization"

**If Ray backend works:**
- Root cause: Joblib/loky backend limitations
- Solution: Use Ray for long-running trials
- Paper contribution: "Ray vs joblib for long-running hyperparameter optimization"

**If Process Pool works but Optuna doesn't:**
- Root cause: Optuna's overhead
- Solution: Manual trial management
- Paper contribution: "When to avoid Optuna"

**If Islands model works best:**
- Root cause: Centralized coordination overhead
- Solution: Distributed evolution with migration
- Paper contribution: "Island models for scalable neuroevolution" (strongest paper)

**If nothing works except sequential:**
- Root cause: Fundamental memory bandwidth / I/O contention
- Solution: Smaller population, more generations, or GPU
- Paper contribution: "Scaling limits of CPU-based genetic algorithms"

## Success Metrics

**Good result:**
- 10x speedup with 20 workers (19 hours → 2 hours)
- Understanding of root cause
- Publishable findings

**Acceptable result:**
- 5x speedup with 10 workers (19 hours → 4 hours)
- Clear explanation of failure modes
- Recommendations for practitioners

**Failure:**
- No speedup beyond sequential
- But: We document why, which is still valuable

## Timeline

- Day 1 (4 hours): Experiments 1-4
- Day 2 (4 hours): Islands model implementation
- Day 3 (12 hours): Production-scale validation runs
- Day 4 (4 hours): Write up findings

**Total:** 24 hours of work + 12 hours of compute time

## Deliverables

1. `PARALLEL_EXPERIMENTS.md` (this document) - experimental design
2. `PARALLEL_RESULTS.md` - detailed findings
3. Updated `PARALLEL_STRATEGY.md` - final recommendations
4. Code changes for working approach
5. Optional: Paper draft if findings are novel

## Questions to Answer

1. **Is Optuna the problem?** (Process Pool vs Optuna comparison)
2. **Is nested parallelism the problem?** (Thread limiting test)
3. **Is centralized scheduling the problem?** (Ray backend test)
4. **Is coordination overhead the problem?** (Islands model test)
5. **What's the scaling ceiling?** (How many workers before diminishing returns?)
6. **What's the optimal configuration?** (Population × generations × workers trade-offs)

## Research Value

Even if parallelism fails, documenting *why* is valuable:
- Practitioners need to know when NOT to use Optuna
- Understanding scaling limits of genetic algorithms
- Comparing parallel backends (joblib vs Ray vs manual)
- Islands model is underexplored in modern neuroevolution

**This could be a strong empirical paper.**

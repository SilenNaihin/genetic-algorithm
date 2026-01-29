# NAS CLI - Neural Architecture Search for Evolution Lab

Fast, database-free evolution experiments for hyperparameter optimization.

## Quick Start

```bash
cd nas

# Run a single config
python cli.py run --config neat_baseline --generations 100 --seeds 3

# List available configs
python cli.py configs

# Compare results
python cli.py compare neat_baseline neat_sparse pure_baseline
```

## Installation

The CLI uses the backend's existing dependencies. No additional installation required.

```bash
cd nas
python cli.py --help
```

## Commands

### `run` - Run Evolution Experiment

Run evolution with a specific configuration.

```bash
python cli.py run [OPTIONS]
```

**Options:**
| Option | Short | Default | Description |
|--------|-------|---------|-------------|
| `--config` | `-c` | `neat_baseline` | Configuration name from `configs.py` |
| `--generations` | `-g` | `100` | Number of generations to run |
| `--seeds` | `-s` | `3` | Number of random seeds (up to 5: 42, 123, 456, 789, 1337) |
| `--population-size` | `-p` | (from config) | Override population size |
| `--device` | `-d` | auto | PyTorch device (`cuda:0`, `cuda:1`, `cpu`) |
| `--quiet` | `-q` | False | Minimal output (only every 10th generation) |

**Examples:**
```bash
# Basic run with NEAT
python cli.py run -c neat_baseline -g 50 -s 3

# Quick test run
python cli.py run -c pure_baseline -g 10 -s 1 -q

# Large population on specific GPU
python cli.py run -c neat_aggressive -g 100 -p 500 -d cuda:1
```

**Output:**
- Progress printed to console
- Results saved to `nas/results/<config>_<timestamp>.json`

---

### `configs` - List Configurations

Show all available predefined configurations.

```bash
python cli.py configs
```

**Output table columns:**
- Name: Configuration identifier
- Mode: Neural mode (`neat`, `pure`, `hybrid`)
- Population: Default population size
- Description: Brief description

---

### `results` - List Result Files

Show all saved experiment results.

```bash
python cli.py results
```

**Output table columns:**
- Config: Configuration name
- Timestamp: When the experiment ran
- Status: `completed`, `in_progress`, or `error`
- Seeds: Number of seeds completed
- Best Fitness: Mean best fitness across seeds
- Path: File path

---

### `compare` - Compare Results

Compare results from multiple configurations side-by-side.

```bash
python cli.py compare CONFIG1 CONFIG2 [CONFIG3...]
```

**Example:**
```bash
python cli.py compare neat_baseline neat_sparse neat_minimal
```

**Output:**
- Results ranked by best fitness
- Shows mean, std, final average, time, and seed count

---

### `show` - Show Detailed Results

Display detailed results for a specific configuration.

```bash
python cli.py show CONFIG
```

**Example:**
```bash
python cli.py show neat_baseline
```

**Output:**
- Configuration details (mode, population, NEAT settings)
- Aggregate statistics across seeds
- Per-seed breakdown (best fitness, time)

---

### `benchmark` - Performance Benchmark

Test simulation speed to find optimal settings.

```bash
python cli.py benchmark [OPTIONS]
```

**Options:**
| Option | Short | Default | Description |
|--------|-------|---------|-------------|
| `--population-size` | `-p` | `500` | Population size to test |
| `--generations` | `-g` | `10` | Generations to test |
| `--config` | `-c` | `neat_baseline` | Config to use |
| `--device` | `-d` | auto | PyTorch device |

**Example:**
```bash
python cli.py benchmark -p 500 -g 10 -c pure_baseline
```

**Output:**
- Total time
- Creatures simulated
- Creatures/second throughput
- Time per generation

---

### `parallel` - Run Multiple Configs in Parallel

Run multiple configurations concurrently (one per GPU).

```bash
python cli.py parallel CONFIG1 CONFIG2 [CONFIG3...] [OPTIONS]
```

**Options:**
| Option | Short | Default | Description |
|--------|-------|---------|-------------|
| `--generations` | `-g` | `50` | Generations per config |
| `--seeds` | `-s` | `1` | Seeds per config |

**Example:**
```bash
python cli.py parallel neat_baseline neat_sparse neat_minimal -g 50 -s 3
```

**Note:** Launches separate processes. Use `nas results` to check completion.

---

## Available Configurations

### NEAT Variants (Primary Focus)

| Config | Description | Key Settings |
|--------|-------------|--------------|
| `neat_baseline` | Standard NEAT | Full connectivity, speciation |
| `neat_sparse` | Sparse initial connectivity | `sparse_inputs`, higher add_connection_rate |
| `neat_minimal` | No initial connections | Topology emerges from evolution |
| `neat_aggressive` | High structural mutation | More node/connection additions |
| `neat_conservative` | Tight speciation | Lower mutation rates |
| `neat_high_mutation` | High mutation rates | 0.5 mutation, 0.4 weight mutation |
| `neat_low_mutation` | Low mutation rates | 0.15 mutation, 0.1 weight mutation |

### Pure Neural (Fixed Topology)

| Config | Description | Key Settings |
|--------|-------------|--------------|
| `pure_baseline` | Standard pure mode | 8 hidden neurons |
| `pure_large` | Larger network | 16 hidden neurons |
| `pure_small` | Smaller network | 4 hidden neurons |
| `pure_high_mutation` | High mutation | 0.5 mutation rate |

### Hybrid Mode

| Config | Description | Key Settings |
|--------|-------------|--------------|
| `hybrid_baseline` | NN modulates oscillation | Cyclic time encoding |
| `hybrid_sin` | Sin time encoding | Simpler time signal |

### Population Experiments

| Config | Description | Population |
|--------|-------------|------------|
| `pop_small` | Small population | 100 |
| `pop_medium` | Medium population | 300 |
| `pop_large` | Large population | 500 |

### Selection Experiments

| Config | Description | Selection Method |
|--------|-------------|-----------------|
| `select_tournament` | Tournament selection | tournament, size=3 |
| `select_truncation` | Truncation selection | truncation |

---

## Result File Format

Results are saved as JSON files in `nas/results/`:

```json
{
  "config_name": "neat_baseline",
  "config": { /* full configuration dict */ },
  "seeds": [42, 123, 456],
  "timestamp": "20260129_193736",
  "status": "completed",
  "seed_results": [
    {
      "seed": 42,
      "generations": [
        {
          "generation": 0,
          "best_fitness": 14.4,
          "avg_fitness": 0.63,
          "median_fitness": 0.0,
          "worst_fitness": 0.0,
          "simulation_time_ms": 4010,
          "evolution_time_ms": 29
        }
        // ... more generations
      ],
      "best_genome": { /* full genome dict */ },
      "best_fitness": 96.3,
      "total_time_s": 10.5,
      "creatures_per_second": 130.2
    }
    // ... more seed results
  ],
  "aggregate": {
    "best_fitness": { "mean": 96.3, "std": 2.1, "min": 93.5, "max": 98.2 },
    "final_avg_fitness": { "mean": 45.2, "std": 5.3 },
    "total_time_s": { "mean": 10.5, "std": 0.8 },
    "seeds": 3
  }
}
```

**Key fields:**
- `aggregate`: Statistical summary across all seeds
- `seed_results`: Full data per seed including best genome
- `generations`: Per-generation fitness curves for plotting

---

## Performance Notes

### CPU vs GPU Benchmarks

Benchmarked on various population sizes to determine optimal device:

| Mode | Population | CPU (creatures/s) | GPU (creatures/s) | Winner |
|------|------------|-------------------|-------------------|--------|
| Pure | 200 | 82 | 54 | CPU (1.5x) |
| Pure | 500 | 83 | 106 | GPU (1.3x) |
| Pure | 1000 | 117 | 135 | GPU (1.2x) |
| NEAT | 200 | 31 | 20 | CPU (1.5x) |
| NEAT | 500 | 35 | 23 | CPU (1.5x) |
| NEAT | 1000 | 36 | 25 | CPU (1.4x) |

**Key findings:**
- **NEAT is always faster on CPU** (1.4-1.5x) at all population sizes
- **Pure mode benefits from GPU** only at larger populations (500+)
- Default recommendation: Use CPU for NEAT, GPU for Pure with large populations

### Why NEAT Can't Use GPU Parallelization

NEAT's variable topology fundamentally prevents GPU tensor batching:

1. **No uniform shapes**: Each creature has different neurons and connections. GPU tensor operations require all inputs to have identical dimensions.

2. **Padding is wasteful**: Padding all networks to max size (e.g., 100 connections) when most have 10-20 connections wastes 80%+ of computation.

3. **Sparse tensors too slow**: PyTorch sparse operations have high overhead for the small network sizes typical in NEAT (10-50 neurons).

4. **Memory transfer overhead**: Even if GPU computation were possible, transferring thousands of small variable-sized networks would dominate runtime.

**Parallelization approaches tested:**
| Approach | Result | Why |
|----------|--------|-----|
| Python threading | 0.33x slower | GIL prevents true parallelism |
| Multiprocessing | 0.04x slower | IPC overhead exceeds gains |
| NumPy vectorization | 0.23x slower | Small networks don't benefit |
| Topology grouping | 0.23x slower | Grouping overhead exceeds batching gains |
| **Numba JIT + prange** | **10x faster** | Machine code + CPU parallelism |

### Numba Acceleration

NEAT networks use Numba JIT compilation for optimal performance:

- **Always active**: Numba is a standard dependency (see `pyproject.toml`)
- **10x speedup**: Compiles Python to machine code
- **CPU parallel**: Uses `prange` to parallelize across CPU cores
- **Threshold**: Parallel execution kicks in at batch size >= 300

### Speed Comparison Summary

| Mode | Creatures/sec | Notes |
|------|---------------|-------|
| Pure (GPU, pop 500+) | ~100-135 | GPU tensor batching |
| Pure (CPU) | ~80-120 | Good baseline |
| NEAT (CPU + Numba) | ~30-36 | Numba JIT + parallel |
| NEAT (no Numba) | ~2-3 | Sequential Python fallback |

### Architecture Notes

**What's GPU-parallelized:**
- Physics simulation (spring forces, gravity, collision) - fully batched tensor ops
- Pure/Hybrid neural forward pass - batched matrix multiplication

**What's CPU-only (Numba):**
- NEAT forward pass - variable topology prevents GPU batching

The physics is NOT the bottleneck. For NEAT mode, the neural forward pass dominates runtime because each creature has a unique network structure that must be evaluated sequentially (within Numba's parallel batch loop).

### Multi-Seed Batching (Recommended)

When running multiple seeds, the CLI batches all seeds together for simulation:

```bash
# Default: batched mode (1.4-1.6x faster)
python cli.py run -c neat_baseline -g 100 -s 3

# Disable batching (sequential seeds)
python cli.py run -c neat_baseline -g 100 -s 3 --no-batched
```

**Benchmark results (3 seeds, 5 generations, pop=300):**

| Mode | Sequential | Batched | Speedup |
|------|-----------|---------|---------|
| NEAT | 138.6s (32/s) | 100.5s (45/s) | **1.38x** |
| Pure | 52.6s (86/s) | 32.6s (138/s) | **1.61x** |

Why batching helps:
- Combines all seeds into single simulation batch (900 creatures instead of 300)
- Better utilizes Numba parallel loops and GPU tensor batching
- Single simulator instance (no re-initialization overhead)
- Shared JIT-compiled code

### Parallel Configs Warning

**Do NOT use `nas parallel` on single-GPU or CPU-only machines!**

| Mode | Sequential (2 configs) | Parallel (2 configs) | Result |
|------|------------------------|----------------------|--------|
| NEAT | 82s | 220s | **2.7x slower** |
| Pure | 34s | 250s | **7x slower** |

Why? Both Numba (`prange`) and PyTorch use all CPU cores internally. Running 2 processes causes massive thread contention - each gets ~1/5th the throughput instead of 1/2.

**When `parallel` IS useful:**
- Multiple GPUs: Each process gets a dedicated GPU
- Distributed machines: Run configs on different machines

**For single machines**: Run configs sequentially (just run multiple `nas run` commands one after another).

### Optimization Tips

1. **Use batched mode**: Default for multi-seed runs, 1.4-1.6x faster
2. **Use CPU for NEAT**: GPU adds transfer overhead with no benefit
3. **Use larger populations**: Numba parallel kicks in at 300+ creatures
4. **Use GPU for Pure mode**: At population 500+, GPU is 1.2-1.3x faster
5. **Run configs sequentially**: Do NOT use `nas parallel` on single machines
6. **Reduce generations for testing**: Use `-g 10 -s 1` for quick tests

### Machine Benchmarks

Results vary by hardware. The benchmarks above were run on:
- **Azure VM**: AMD EPYC 7V12 (8 vCPUs), Zen 2 architecture

Expected relative performance on other machines:
| Machine | vs Azure VM | Notes |
|---------|-------------|-------|
| M3 Max | ~2-3x faster | Higher IPC, more cores, unified memory |
| M1/M2 Mac | ~1.5-2x faster | Good single-thread, unified memory |
| Modern Intel i7/i9 | ~1.5-2x faster | Higher clock speeds |
| Older laptops | ~0.5-1x | Varies widely |

---

## Custom Configurations

Create custom configs using `create_config()`:

```python
from configs import create_config

# Start from base and override
my_config = create_config(
    base='neat_baseline',
    population_size=300,
    neat_add_connection_rate=0.7,
    mutation_rate=0.4,
)
```

Or add to `configs.py`:

```python
MY_CUSTOM: dict[str, Any] = {
    **NEAT_BASELINE,
    'population_size': 300,
    'neat_add_connection_rate': 0.7,
}

# Add to registry
CONFIGS['my_custom'] = MY_CUSTOM
```

---

## Workflow Recommendations

### Initial Exploration

```bash
# Quick test all modes
python cli.py run -c pure_baseline -g 20 -s 1
python cli.py run -c neat_baseline -g 20 -s 1
python cli.py run -c hybrid_baseline -g 20 -s 1

# Compare
python cli.py compare pure_baseline neat_baseline hybrid_baseline
```

### Statistical Runs

```bash
# Run with 3+ seeds for statistical significance
python cli.py run -c neat_baseline -g 100 -s 5

# View detailed results
python cli.py show neat_baseline
```

### Full Comparison

```bash
# Run all NEAT variants in parallel (if multiple GPUs)
python cli.py parallel neat_baseline neat_sparse neat_minimal \
    neat_aggressive neat_conservative -g 100 -s 3

# Or sequentially
for config in neat_baseline neat_sparse neat_minimal; do
    python cli.py run -c $config -g 100 -s 3
done

# Compare all
python cli.py compare neat_baseline neat_sparse neat_minimal \
    neat_aggressive neat_conservative
```

---

## Troubleshooting

### "Config not found"

List available configs:
```bash
python cli.py configs
```

### CUDA out of memory

Reduce population size:
```bash
python cli.py run -c neat_baseline -p 100 -g 50
```

### Slow NEAT performance

This is expected. NEAT is ~10x slower than Pure mode due to variable topology.
Consider using Pure mode for initial exploration.

### Results not saved

Check the `nas/results/` directory. Results are saved incrementally every 10 generations.

# Compute Guide

This document explains the computational aspects of the Evolution Lab simulator.

## Physics FPS (Timestep)

The physics simulation runs at a configurable frames-per-second (FPS) rate:

| FPS | Timestep | Steps/10s | Use Case |
|-----|----------|-----------|----------|
| 15  | 1/15 = 0.067s | 150 | Fast runs, exploration |
| 30  | 1/30 = 0.033s | 300 | Balanced speed/quality |
| 60  | 1/60 = 0.017s | 600 | Default, good fidelity |
| 120 | 1/120 = 0.008s | 1200 | Maximum precision |

**Trade-offs:**
- Higher FPS = more expressive movement, but more compute
- Lower FPS = faster simulation, but may miss subtle behaviors
- Muscle oscillations need sufficient resolution (at 3Hz muscle, 15 FPS only gives 5 samples per cycle)

**Configuration:**
```typescript
// Frontend
config.physicsFPS = 60;  // 15-120 FPS
config.timeStep = 1 / 60;  // Automatically computed

// Backend receives time_step directly
```

## Physics Model

### Ground Friction (Coulomb)

Ground friction uses a force-based Coulomb model, not velocity damping:

```python
# Friction force = coefficient × normal force
friction_force = GROUND_FRICTION * mass * |gravity|  # F = μN

# Maximum velocity change per timestep
max_delta_v = friction_force / mass * dt

# Apply: reduce velocity toward zero, never reverse
velocity *= (1 - clamp(max_delta_v / speed, 0, 1))
```

This means creatures can overcome friction with sufficient muscle force, unlike velocity damping which exponentially kills all motion.

### Linear Damping

Air resistance applied to all nodes:
```python
damping_factor = (1 - LINEAR_DAMPING) ^ dt  # Time-scaled
velocity *= damping_factor
```

### Muscle Oscillation Limits

Muscle rest lengths are clamped to prevent "spazzy" behavior with small muscles:

```python
# Oscillation formula
new_rest_length = base_rest_length * (1 - oscillation * amplitude)

# Clamped to 50%-150% of base to prevent wild swinging
min_length = max(base_rest_length * 0.5, 0.1)
max_length = base_rest_length * 1.5
```

**Why this matters:** Without clamping, a small muscle (0.2 units) with high amplitude (0.5) could oscillate from 0.1 to 0.4 units—a 300% range that causes wild swinging. The clamp limits all muscles to ±50% of their rest length.

## Tensor Batching

The PyTorch backend processes creatures in parallel using batched tensor operations:

### Data Layout
```
CreatureBatch:
  positions:    [B, N, 3]  # B creatures, N max nodes, XYZ
  velocities:   [B, N, 3]  # Same layout
  node_mask:    [B, N]     # Which nodes are valid (padded to N)
  masses:       [B, N]     # Node masses
  spring_*:     [B, M, ...]  # Muscle parameters (padded to M)
```

Where:
- B = batch size (population)
- N = MAX_NODES (20)
- M = MAX_MUSCLES (30)

### Benefits
- Single GPU kernel for all creatures
- No Python loop overhead
- 100+ creatures simulated in <1s on CPU
- GPU scales to 1000s of creatures

### Padding Strategy
Unused nodes/muscles are masked out rather than using variable-sized tensors:
```python
# Forces only applied to valid nodes
forces = torch.where(node_mask.unsqueeze(-1), computed_forces, zeros)
```

## Frame Storage Modes

Three modes for storing simulation frames:

| Mode | When Used | Description |
|------|-----------|-------------|
| `none` | Default | No frames stored, only final fitness |
| `all` | UI replay | All creatures get frames at configured frame_rate |
| `sparse` | CLI large runs | Only top N and bottom N creatures get frames |

### Sparse Mode Details
For large population runs (1000+ creatures), storing all frames is expensive. Sparse mode saves:
- Top 10 creatures (best fitness) - to study successful strategies
- Bottom 10 creatures (worst fitness) - to see failure modes

```python
# Controlled by config
config.frame_storage_mode = 'sparse'
config.sparse_top_count = 10
config.sparse_bottom_count = 10
```

### Frame Interval
Frames are recorded at `frame_rate` FPS (default 30), independent of physics FPS:
```python
physics_fps = 60
frame_rate = 30
frame_interval = physics_fps // frame_rate  # = 2 (record every 2nd frame)
```

## Simulation Duration vs Physics Steps

The relationship between duration and steps:

```
steps = duration_seconds × physics_FPS
time = steps × timestep
```

Examples:
| Duration | Physics FPS | Steps | Compute |
|----------|-------------|-------|---------|
| 10s | 60 | 600 | Normal |
| 30s | 60 | 1800 | 3× normal |
| 10s | 120 | 1200 | 2× normal |
| 30s | 120 | 3600 | 6× normal |

## Performance Characteristics

### CPU Performance (M1 MacBook)
- 100 creatures @ 60 FPS × 10s: ~1 second
- 100 creatures @ 120 FPS × 30s: ~6 seconds
- Neural mode adds ~10-20% overhead

### Memory Usage
- Per creature: ~10KB (positions, velocities, genome)
- Per frame: ~240 bytes (8 nodes × 3 floats × 4 bytes × 2.5 overhead)
- 100 creatures × 300 frames: ~7MB

### GPU Considerations
When CUDA is available:
- Batch sizes >100 see significant speedup
- Memory transfers become bottleneck for small batches
- Frame recording disabled on GPU (transfer overhead)

## Neural Network Compute

Each physics step with neural control:
1. **Sensor gathering**: [B, 7-8] inputs from world state
2. **Forward pass**: input → hidden → output with activations
3. **Muscle control**: [B, M] outputs modulate muscle rest lengths

### NN Update Interval

Neural network outputs are cached and reused for multiple physics steps to reduce jitter:

```python
nn_update_interval = 4  # Default: update every 4 physics steps
# At 60 FPS physics: 15 NN updates/sec instead of 60
```

This smooths muscle activation without sacrificing responsiveness. The sensor inputs still change every physics step, but the NN only recomputes outputs periodically.

Neural network sizes:
| Mode | Inputs | Hidden | Outputs | Parameters |
|------|--------|--------|---------|------------|
| Pure | 7 | 8 | M | 7×8 + 8×M + 8 + M |
| Hybrid | 8 | 8 | M | 8×8 + 8×M + 8 + M |

With M=15 muscles, hidden=8: ~200 parameters per creature.

### Weight Mutation Magnitude

In high-dimensional spaces, Gaussian mutation magnitude (σ) has a non-obvious effect:

```
E[‖θ' - θ‖] ≈ σ × √d    (where d = number of parameters)
```

With ~200 parameters:
| σ (magnitude) | Expected displacement |
|---------------|----------------------|
| 0.3 | 4.2 (too large!) |
| 0.1 | 1.4 |
| **0.05** (default) | **0.7** |
| 0.02 | 0.28 (fine-tuning) |

**Why σ=0.05?** Literature (NEAT, OpenAI ES) uses σ=0.01-0.05. Larger values cause random search behavior instead of gradient-like optimization.

## Optimization Tips

1. **For fast exploration**: 15-30 FPS, 5-10s duration
2. **For quality runs**: 60 FPS, 10-15s duration
3. **For research**: 120 FPS, 30s duration, sparse frame storage
4. **For large populations**: Use backend API, sparse frames, GPU if available

## API Endpoints

| Endpoint | Use Case |
|----------|----------|
| `POST /api/simulation/batch` | Simulate creatures, get fitness |
| `POST /api/genetics/evolve` | Full evolution step |
| `POST /api/genetics/generate` | Generate random population |

All endpoints accept the full `SimulationConfig` including `time_step` for custom FPS.

## Remote GPU Backend

For large-scale simulations, the backend can proxy simulation requests to a remote GPU server.

### Architecture

```
┌─────────────────────────────────────────┐
│            Your Machine                 │
│                                         │
│  Next.js :3001 ──► FastAPI :8000        │
│                    │                    │
│                    │ GPU_BACKEND_URL    │
│                    ▼                    │
└────────────────────┼────────────────────┘
                     │ (SSH tunnel)
                     ▼
        ┌────────────────────────┐
        │   GPU VM (T4/A100)     │
        │   FastAPI :8000        │
        │   PyTorch + CUDA       │
        └────────────────────────┘
```

### Setup

**1. On the GPU VM:**
```bash
# Clone repo and install
git clone <repo>
cd genetic-algorithm/backend
pip install torch --index-url https://download.pytorch.org/whl/cu118
pip install -e .

# Start backend
uvicorn app.main:app --host 127.0.0.1 --port 8000
```

**2. SSH tunnel from your machine:**
```bash
ssh -L 9000:localhost:8000 user@gpu-vm-ip
```

**3. Local backend with GPU proxy:**
```bash
export GPU_BACKEND_URL="http://localhost:9000"
cd backend && uvicorn app.main:app --port 8000
```

**4. Verify connection:**
```bash
# Local health check shows proxy mode
curl http://localhost:8000/api/health
# {"status":"healthy","device":"cpu","gpu_backend_url":"http://localhost:9000","mode":"proxy"}

# GPU backend health check shows CUDA
curl http://localhost:9000/api/health
# {"status":"healthy","device":"cuda","gpu_backend_url":null,"mode":"local"}
```

### Expected Speedups

| Batch Size | CPU (M1) | T4 GPU | A100 GPU |
|------------|----------|--------|----------|
| 100        | 1×       | 3-5×   | 5-10×    |
| 1,000      | 1×       | 10-20× | 30-50×   |
| 10,000     | 1×       | 20-30× | 50-100×  |

The T4 has 16GB VRAM, sufficient for batch sizes up to ~5,000 creatures.

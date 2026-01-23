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

Neural network sizes:
| Mode | Inputs | Hidden | Outputs | Parameters |
|------|--------|--------|---------|------------|
| Pure | 7 | 8 | M | 7×8 + 8×M + 8 + M |
| Hybrid | 8 | 8 | M | 8×8 + 8×M + 8 + M |

With M=15 muscles, hidden=8: ~200 parameters per creature.

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

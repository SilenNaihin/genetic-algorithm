# Performance & Scaling

## Current Architecture

The Python backend with PyTorch handles all simulation:

```
┌─────────────────────────────────────────┐
│     Python Backend (FastAPI + PyTorch)   │
├─────────────────────────────────────────┤
│  - Batched physics simulation            │
│  - Batched neural network forward pass   │
│  - CPU/CUDA device selection at runtime  │
│  - PostgreSQL for storage                │
└─────────────────────────────────────────┘
```

### Current Performance

| Population | CPU Time | GPU Target |
|------------|----------|------------|
| 100 creatures | <1s | <0.1s |
| 500 creatures | <5s | <0.5s |
| 1000 creatures | ~10s | <1s |

---

## Tensor Data Structures

All creatures packed into batched tensors:

```python
positions: [B, max_nodes, 3]      # Node positions
velocities: [B, max_nodes, 3]     # Node velocities
masses: [B, max_nodes]            # Node masses
node_mask: [B, max_nodes]         # Valid nodes per creature
spring_indices: [B, max_muscles, 2]  # Muscle connections
spring_params: [B, max_muscles, 6]   # Muscle parameters
```

Benefits:
- Single kernel call per physics step
- GPU acceleration without code changes
- Efficient memory layout

---

## Frame Storage Strategy

Not all creatures need replay frames stored:

```python
class FrameStorageStrategy:
    keep_top: int = 10      # Best performers
    keep_random: int = 10   # Random sample
    keep_bottom: int = 5    # Worst (for debugging)
```

For population of 100: store 25 creatures' frames (75% reduction).

---

## Future Optimizations

### GPU Acceleration

Same code runs on CUDA:

```python
device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
positions = positions.to(device)
```

Expected 10x+ speedup on A100.

### Mixed Precision

Use float16 where accuracy permits:

```python
with torch.cuda.amp.autocast():
    # Physics computations in float16
    pass
```

2x memory reduction, ~1.5x speed improvement.

### Distributed Simulation

For very large populations:
- Chunk population across multiple GPUs
- Use Ray or similar for distribution

---

## Database

PostgreSQL with async SQLAlchemy:

```sql
-- Key tables
runs (id, name, config, created_at)
generations (run_id, generation, results)
creatures (id, run_id, generation, genome, fitness, frames)
```

Indexes on (run_id, generation, fitness) for fast queries.

---

## API Endpoints

| Endpoint | Description |
|----------|-------------|
| `POST /api/simulation/batch` | Simulate batch of creatures |
| `POST /api/genetics/generate` | Generate initial population |
| `POST /api/genetics/evolve` | Evolve to next generation |

All endpoints support batched operations for efficiency.

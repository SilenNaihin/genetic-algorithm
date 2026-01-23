# Evolution Lab Backend

Python backend for the Evolution Lab genetic algorithm simulator with **PyTorch-powered batched physics simulation**.

## Tech Stack

- **FastAPI** - Async web framework with auto-generated OpenAPI docs
- **PyTorch** - Batched tensor physics simulation (CPU/GPU agnostic)
- **SQLAlchemy 2.0** - Async ORM with type hints
- **Alembic** - Database migrations
- **PostgreSQL** - Production database

## Key Features

- **Batched Physics**: Simulate 100+ creatures in parallel using PyTorch tensors
- **Neural Network Control**: Batched neural network forward pass for creature muscles
- **GPU-Ready**: Same code runs on CPU or CUDA GPU (device selection at runtime)
- **Full Genetics**: Selection, mutation, crossover ported from TypeScript

## Setup

### 1. Install Python dependencies

```bash
cd backend
pip install -e ".[dev]"
# Or with uv:
uv pip install -e ".[dev]"
```

### 2. Start PostgreSQL

```bash
docker-compose up -d
```

### 3. Create .env file

```bash
cp .env.example .env
# Edit .env if needed
```

### 4. Run database migrations

```bash
alembic upgrade head
```

### 5. Start the server

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

## Testing

```bash
# Run all tests
pytest

# Run with coverage
pytest --cov=app

# Run specific test file
pytest app/simulation/test_physics.py
```

**285 tests** covering: physics, neural networks, fitness, genetics, API integration.

## API Documentation

Once running, visit:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc
- OpenAPI JSON: http://localhost:8000/openapi.json

## Project Structure

```
backend/
├── alembic/                  # Database migrations
│   └── versions/             # Migration files
├── app/
│   ├── api/                  # API route handlers
│   │   ├── runs.py           # Run CRUD endpoints
│   │   ├── generations.py    # Generation endpoints
│   │   ├── creatures.py      # Creature endpoints
│   │   ├── simulation.py     # Simulation endpoints
│   │   ├── evolution.py      # Evolution control endpoints
│   │   └── genetics.py       # Genetics endpoints (generate, evolve)
│   ├── core/
│   │   ├── config.py         # Settings from env
│   │   └── database.py       # DB connection
│   ├── genetics/             # Genetic algorithm operations
│   │   ├── selection.py      # Truncation, tournament selection
│   │   ├── mutation.py       # Body & neural mutations
│   │   ├── crossover.py      # Crossover operators
│   │   └── population.py     # Population management
│   ├── models/               # SQLAlchemy models
│   │   ├── run.py
│   │   ├── generation.py
│   │   └── creature.py
│   ├── neural/               # Neural network module
│   │   └── network.py        # BatchedNeuralNetwork
│   ├── schemas/              # Pydantic schemas
│   │   ├── run.py
│   │   ├── generation.py
│   │   ├── creature.py
│   │   ├── genome.py         # CreatureGenome, NeuralGenome
│   │   ├── simulation.py     # SimulationConfig, SimulationResult
│   │   └── genetics.py       # EvolveRequest, EvolveResponse
│   ├── services/             # Business logic
│   │   ├── simulator.py      # SimulatorService (API interface)
│   │   └── pytorch_simulator.py  # PyTorchSimulator (tensor impl)
│   ├── simulation/           # PyTorch physics core
│   │   ├── tensors.py        # Creature data → tensor conversion
│   │   ├── physics.py        # Batched physics simulation
│   │   ├── fitness.py        # Batched fitness calculation
│   │   └── config.py         # Physics constants
│   └── main.py               # FastAPI app
├── fixtures/                 # Test fixtures
│   └── test_genomes.json     # Test creature genomes
├── tests/                    # Additional tests
├── alembic.ini               # Alembic config
├── docker-compose.yml        # PostgreSQL container
├── pyproject.toml            # Python dependencies
└── README.md
```

## API Endpoints

### Runs

- `GET /api/runs` - List all runs
- `POST /api/runs` - Create a new run
- `GET /api/runs/{id}` - Get run details
- `PATCH /api/runs/{id}` - Update run
- `DELETE /api/runs/{id}` - Delete run
- `POST /api/runs/{id}/fork` - Fork a run

### Generations

- `GET /api/runs/{id}/generations` - List generations
- `GET /api/runs/{id}/generations/{gen}` - Get generation
- `GET /api/runs/{id}/generations/{gen}/creatures` - Get creatures
- `GET /api/runs/{id}/generations/fitness-history` - Fitness graph data
- `GET /api/runs/{id}/generations/creature-types-history` - Type distribution

### Creatures

- `GET /api/creatures/{id}` - Get creature (no frames)
- `GET /api/creatures/{id}/with-frames` - Get creature with replay frames
- `GET /api/creatures/run/{run_id}/best` - Get best creature
- `GET /api/creatures/run/{run_id}/longest-survivor` - Get longest survivor

### Evolution

- `POST /api/evolution/{run_id}/step` - Run one generation
- `POST /api/evolution/{run_id}/run` - Start batch evolution
- `WS /api/evolution/{run_id}/ws` - WebSocket for real-time updates

### Simulation

- `POST /api/simulation/batch` - Simulate batch of creatures (PyTorch)
- `POST /api/simulation/single` - Simulate single creature

### Genetics

- `POST /api/genetics/generate` - Generate initial population
- `POST /api/genetics/evolve` - Evolve to next generation
- `POST /api/genetics/stats` - Get population statistics

## Physics Implementation

The backend uses **custom PyTorch tensor physics** instead of a physics engine like PyBullet. This allows:

1. **Batched Simulation**: All creatures simulated in a single tensor operation
2. **GPU Acceleration**: Same code runs on CPU or CUDA
3. **Differentiable** (future): Could enable gradient-based optimization

### Tensor Data Structures

```python
# All creatures packed into tensors
positions: [B, max_nodes, 3]      # Node positions
velocities: [B, max_nodes, 3]     # Node velocities
masses: [B, max_nodes]            # Node masses
node_mask: [B, max_nodes]         # Valid nodes per creature
spring_indices: [B, max_muscles, 2]  # Muscle connections
spring_params: [B, max_muscles, 6]   # Muscle parameters
```

### Physics Step

Each timestep (1/60s):
1. Compute spring forces (Hooke's law with damping)
2. Apply muscle oscillation or neural control
3. Apply gravity
4. Euler integration
5. Ground collision with friction/restitution

### Performance

- **100 creatures**: <1 second on CPU
- **500 creatures**: <5 seconds on CPU
- **1000+ creatures**: Target <1 second on A100 GPU

## Neural Network Mode

Two control modes for neural-controlled creatures:

### Hybrid Mode (default)
- 8 inputs: pellet direction (3), velocity (3), distance (1), time phase (1)
- Neural network modulates base oscillation
- Smoother learning curve for GA

### Pure Mode
- 7 inputs: pellet direction (3), velocity (3), distance (1)
- Neural network has full control
- More expressive but harder to evolve

### Batched Forward Pass

```python
# All creatures' neural networks evaluated in parallel
# weights: [B, layer_sizes...]
# inputs: [B, input_size]
output = batched_forward(weights, inputs)  # [B, num_muscles]
```

## Database Migrations

```bash
# Create a new migration
alembic revision --autogenerate -m "Description"

# Apply migrations
alembic upgrade head

# Rollback one migration
alembic downgrade -1

# View migration history
alembic history
```

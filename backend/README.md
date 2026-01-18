# Evolution Lab Backend

Python backend for the Evolution Lab genetic algorithm simulator.

## Tech Stack

- **FastAPI** - Async web framework with auto-generated OpenAPI docs
- **SQLAlchemy 2.0** - Async ORM with type hints
- **Alembic** - Database migrations
- **PostgreSQL** - Production database
- **NumPy** - Numerical operations for physics

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

## API Documentation

Once running, visit:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc
- OpenAPI JSON: http://localhost:8000/openapi.json

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

## Project Structure

```
backend/
├── alembic/              # Database migrations
│   └── versions/         # Migration files
├── app/
│   ├── api/              # API route handlers
│   │   ├── runs.py       # Run CRUD endpoints
│   │   ├── generations.py# Generation endpoints
│   │   ├── creatures.py  # Creature endpoints
│   │   ├── simulation.py # Simulation endpoints
│   │   └── evolution.py  # Evolution control endpoints
│   ├── core/
│   │   ├── config.py     # Settings from env
│   │   └── database.py   # DB connection
│   ├── models/           # SQLAlchemy models
│   │   ├── run.py
│   │   ├── generation.py
│   │   └── creature.py
│   ├── schemas/          # Pydantic schemas
│   │   ├── run.py
│   │   ├── generation.py
│   │   ├── creature.py
│   │   ├── genome.py
│   │   └── simulation.py
│   ├── services/         # Business logic
│   │   ├── genetics.py   # Selection, crossover, mutation
│   │   └── simulator.py  # Physics simulation
│   └── main.py           # FastAPI app
├── tests/                # Pytest tests
├── alembic.ini           # Alembic config
├── docker-compose.yml    # PostgreSQL container
├── pyproject.toml        # Python dependencies
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

- `POST /api/simulation/batch` - Simulate batch of creatures
- `POST /api/simulation/single` - Simulate single creature

## Future: GPU Acceleration

The simulator service (`app/services/simulator.py`) is designed to be swapped out for GPU-accelerated physics:

```bash
# Install PyTorch for GPU support
pip install -e ".[gpu]"
```

Options for GPU physics:
1. **PyTorch custom physics** - Differentiable, batched simulation on GPU
2. **PyBullet** - Accurate rigid body physics with CUDA support
3. **Warp** - NVIDIA's differentiable simulation library

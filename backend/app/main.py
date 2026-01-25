from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import creatures, evolution, generations, genetics, runs, simulation
from app.core.config import settings
from app.core.database import engine, Base


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Handle startup and shutdown events."""
    # Startup: create tables if they don't exist (dev only, use alembic in prod)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    # Shutdown: close connections
    await engine.dispose()


app = FastAPI(
    title="Evolution Lab API",
    description="Backend API for the Evolution Lab genetic algorithm simulator",
    version="0.1.0",
    lifespan=lifespan,
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(runs.router, prefix="/api/runs", tags=["runs"])
app.include_router(generations.router, prefix="/api/runs/{run_id}/generations", tags=["generations"])
app.include_router(creatures.router, prefix="/api/creatures", tags=["creatures"])
app.include_router(simulation.router, prefix="/api/simulation", tags=["simulation"])
app.include_router(evolution.router, prefix="/api/evolution", tags=["evolution"])
app.include_router(genetics.router, prefix="/api/genetics", tags=["genetics"])


@app.get("/health")
@app.get("/api/health")
async def health_check():
    """Health check endpoint."""
    import os
    import torch

    gpu_backend_url = os.getenv("GPU_BACKEND_URL")

    return {
        "status": "healthy",
        "version": "0.1.0",
        "device": "cuda" if torch.cuda.is_available() else "cpu",
        "gpu_backend_url": gpu_backend_url,
        "mode": "proxy" if gpu_backend_url else "local",
    }


@app.get("/")
async def root():
    """Root endpoint with API info."""
    return {
        "name": "Evolution Lab API",
        "version": "0.1.0",
        "docs": "/docs",
        "health": "/health",
    }

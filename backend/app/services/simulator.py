"""
Simulation service for running physics simulations.

This module provides the main SimulatorService used by API endpoints.
It delegates to PyTorchSimulator for actual batched physics computation.

Supports optional GPU backend proxy via GPU_BACKEND_URL environment variable.
When set, simulation requests are forwarded to a remote GPU server.
"""

import os
import time
from typing import Any

import httpx

from app.schemas.simulation import (
    SimulationConfig,
    SimulationResult,
    BatchSimulationRequest,
    BatchSimulationResponse,
)
from app.services.pytorch_simulator import PyTorchSimulator

# Remote GPU backend URL (e.g., "http://localhost:9000" via SSH tunnel)
GPU_BACKEND_URL = os.getenv("GPU_BACKEND_URL")


class SimulatorService:
    """
    Service for simulating creatures and calculating fitness.

    Uses PyTorch batched physics for efficient simulation of many creatures.
    """

    def __init__(self):
        """Initialize the simulator service with PyTorch backend."""
        self._pytorch_simulator = PyTorchSimulator()

    async def simulate_batch(
        self,
        genomes: list[dict[str, Any]],
        config: dict[str, Any] | None = None,
    ) -> list[dict[str, Any]]:
        """
        Simulate a batch of creatures in parallel.

        Args:
            genomes: List of genome dicts
            config: Simulation configuration dict

        Returns:
            List of result dicts with fitness, pellets_collected, etc.
        """
        # Convert config dict to SimulationConfig if provided
        sim_config = SimulationConfig(**config) if config else SimulationConfig()

        # Run simulation using PyTorch backend
        results = self._pytorch_simulator.simulate_batch(genomes, sim_config)

        # Convert results to dicts for backward compatibility
        return [r.model_dump() for r in results]

    def simulate_batch_sync(
        self,
        request: BatchSimulationRequest,
    ) -> BatchSimulationResponse:
        """
        Synchronous batch simulation (for FastAPI endpoints).

        Args:
            request: BatchSimulationRequest with genomes and config

        Returns:
            BatchSimulationResponse with results and timing
        """
        start_time = time.time()

        # Convert Pydantic models to dicts for the simulator
        genomes = [g.model_dump(by_alias=True) for g in request.genomes]

        # Run simulation
        results = self._pytorch_simulator.simulate_batch(genomes, request.config)

        import math
        elapsed_ms = int((time.time() - start_time) * 1000)
        # Guard against division by zero and ensure JSON-serializable float
        creatures_per_second = float(len(genomes) / (elapsed_ms / 1000)) if elapsed_ms > 0 else 0.0
        if math.isnan(creatures_per_second) or math.isinf(creatures_per_second):
            creatures_per_second = 0.0

        return BatchSimulationResponse(
            results=results,
            total_time_ms=elapsed_ms,
            creatures_per_second=creatures_per_second,
        )

"""
Simulation API endpoints.

Provides endpoints for running batched physics simulations using PyTorch.
"""

import time
from typing import Annotated

from fastapi import APIRouter, Depends

from app.schemas.simulation import (
    BatchSimulationRequest,
    BatchSimulationResponse,
    SimulationConfig,
    SimulationResult,
)
from app.schemas.genome import CreatureGenome
from app.services.simulator import SimulatorService

router = APIRouter()


def get_simulator() -> SimulatorService:
    """Dependency to get the simulator service."""
    return SimulatorService()


@router.post("/batch", response_model=BatchSimulationResponse)
def simulate_batch(
    request: BatchSimulationRequest,
    simulator: Annotated[SimulatorService, Depends(get_simulator)],
):
    """
    Simulate a batch of creatures and return their fitness results.

    Uses PyTorch batched physics for efficient parallel simulation.
    """
    return simulator.simulate_batch_sync(request)


@router.post("/single", response_model=SimulationResult)
def simulate_single(
    genome: CreatureGenome,
    config: SimulationConfig | None = None,
    simulator: Annotated[SimulatorService, Depends(get_simulator)] = None,
):
    """
    Simulate a single creature.

    This is a convenience endpoint that wraps the batch endpoint.
    """
    if simulator is None:
        simulator = SimulatorService()

    if config is None:
        config = SimulationConfig()

    request = BatchSimulationRequest(genomes=[genome], config=config)
    response = simulator.simulate_batch_sync(request)

    return response.results[0]

import time
from typing import Annotated

from fastapi import APIRouter, Depends

from app.schemas.simulation import (
    BatchSimulationRequest,
    BatchSimulationResponse,
    SimulationResult,
)
from app.services.simulator import SimulatorService

router = APIRouter()


def get_simulator() -> SimulatorService:
    """Dependency to get the simulator service."""
    return SimulatorService()


@router.post("/batch", response_model=BatchSimulationResponse)
async def simulate_batch(
    request: BatchSimulationRequest,
    simulator: Annotated[SimulatorService, Depends(get_simulator)],
):
    """Simulate a batch of creatures and return their fitness results."""
    start_time = time.time()

    results = await simulator.simulate_batch(
        genomes=[g.model_dump() for g in request.genomes],
        config=request.config.model_dump(),
    )

    elapsed_ms = int((time.time() - start_time) * 1000)
    creatures_per_second = len(request.genomes) / (elapsed_ms / 1000) if elapsed_ms > 0 else 0

    return BatchSimulationResponse(
        results=[SimulationResult(**r) for r in results],
        total_time_ms=elapsed_ms,
        creatures_per_second=creatures_per_second,
    )


@router.post("/single", response_model=SimulationResult)
async def simulate_single(
    genome: dict,
    duration: float = 8.0,
    record_frames: bool = True,
    simulator: Annotated[SimulatorService, Depends(get_simulator)] = None,
):
    """Simulate a single creature."""
    if simulator is None:
        simulator = SimulatorService()

    results = await simulator.simulate_batch(
        genomes=[genome],
        config={
            "duration": duration,
            "record_frames": record_frames,
            "frame_rate": 15,
            "pellet_count": 5,
            "ground_size": 30.0,
            "max_allowed_frequency": 3.0,
        },
    )

    return SimulationResult(**results[0])

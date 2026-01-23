import json
import time
import uuid
import zlib
from typing import Annotated

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, WebSocket
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.database import get_db
from app.models import Creature, CreatureFrame, Generation, Run
from app.schemas.genome import CreatureGenome
from app.schemas.simulation import SimulationConfig
from app.services.genetics import GeneticsService
from app.services.simulator import SimulatorService

router = APIRouter()


async def run_generation(
    run_id: str,
    db: AsyncSession,
    genetics: GeneticsService,
    simulator: SimulatorService,
) -> dict:
    """Run a single generation of evolution."""
    # Get the run
    result = await db.execute(select(Run).where(Run.id == run_id))
    run = result.scalar_one_or_none()
    if not run:
        raise HTTPException(status_code=404, detail="Run not found")

    config = SimulationConfig(**run.config)
    current_gen = run.current_generation

    # Get genomes for this generation
    if current_gen == 0:
        # Generate initial population
        genomes = genetics.generate_initial_population(
            size=config.population_size,
            constraints={
                "min_nodes": config.min_nodes,
                "max_nodes": config.max_nodes,
                "max_muscles": config.max_muscles,
            },
        )
    else:
        # Get previous generation creatures
        prev_result = await db.execute(
            select(Creature)
            .where(Creature.run_id == run_id, Creature.generation == current_gen - 1)
            .order_by(Creature.fitness.desc())
        )
        prev_creatures = prev_result.scalars().all()

        if not prev_creatures:
            raise HTTPException(status_code=400, detail="No creatures in previous generation")

        # Evolve to get new genomes
        genomes = genetics.evolve_population(
            creatures=[{"genome": c.genome, "fitness": c.fitness} for c in prev_creatures],
            config=config.model_dump(),
        )

    # Simulate all creatures
    start_time = time.time()
    sim_results = await simulator.simulate_batch(
        genomes=genomes,
        config={
            "duration": config.simulation_duration,
            "record_frames": True,
            "frame_rate": 15,
            "pellet_count": config.pellet_count,
            "arena_size": config.arena_size,
            "max_allowed_frequency": config.max_allowed_frequency,
        },
    )
    simulation_time_ms = int((time.time() - start_time) * 1000)

    # Calculate statistics
    fitnesses = [r["fitness"] for r in sim_results]
    fitnesses.sort()
    best_fitness = max(fitnesses)
    avg_fitness = sum(fitnesses) / len(fitnesses)
    worst_fitness = min(fitnesses)
    median_fitness = fitnesses[len(fitnesses) // 2]

    # Calculate creature type distribution
    creature_types: dict[str, int] = {}
    for genome in genomes:
        node_count = str(len(genome["nodes"]))
        creature_types[node_count] = creature_types.get(node_count, 0) + 1

    # Create generation record
    generation = Generation(
        run_id=run_id,
        generation=current_gen,
        best_fitness=best_fitness,
        avg_fitness=avg_fitness,
        worst_fitness=worst_fitness,
        median_fitness=median_fitness,
        creature_types=creature_types,
        simulation_time_ms=simulation_time_ms,
    )
    db.add(generation)

    # Determine which creatures get frame storage
    sorted_results = sorted(
        zip(genomes, sim_results),
        key=lambda x: x[1]["fitness"],
        reverse=True,
    )
    keep_frames_ids = set()

    # Top N
    for genome, _ in sorted_results[: settings.frames_keep_top]:
        keep_frames_ids.add(genome["id"])

    # Bottom N
    for genome, _ in sorted_results[-settings.frames_keep_bottom :]:
        keep_frames_ids.add(genome["id"])

    # Random N from middle
    middle = sorted_results[settings.frames_keep_top : -settings.frames_keep_bottom]
    import random

    random.shuffle(middle)
    for genome, _ in middle[: settings.frames_keep_random]:
        keep_frames_ids.add(genome["id"])

    # Create creature records
    for genome, sim_result in zip(genomes, sim_results):
        creature = Creature(
            id=genome["id"],
            run_id=run_id,
            generation=current_gen,
            genome=genome,
            fitness=sim_result["fitness"],
            pellets_collected=sim_result["pellets_collected"],
            disqualified=sim_result["disqualified"],
            disqualified_reason=sim_result.get("disqualified_reason"),
            survival_streak=genome.get("survival_streak", 0),
            is_elite=False,  # Will be set in evolution
            parent_ids=genome.get("parent_ids", []),
        )
        db.add(creature)

        # Store frames if this creature is in the keep set
        if genome["id"] in keep_frames_ids and "frames" in sim_result:
            frames_data = zlib.compress(json.dumps(sim_result["frames"]).encode())
            pellet_data = None
            if "pellet_frames" in sim_result:
                pellet_data = zlib.compress(json.dumps(sim_result["pellet_frames"]).encode())

            creature_frame = CreatureFrame(
                creature_id=genome["id"],
                frames_data=frames_data,
                frame_count=sim_result.get("frame_count", 0),
                frame_rate=15,
                pellet_frames=pellet_data,
            )
            db.add(creature_frame)

    # Update run
    run.current_generation = current_gen + 1
    run.generation_count = current_gen + 1

    if best_fitness > run.best_fitness:
        run.best_fitness = best_fitness
        # Find the best creature
        best_creature = max(zip(genomes, sim_results), key=lambda x: x[1]["fitness"])
        run.best_creature_id = best_creature[0]["id"]
        run.best_creature_generation = current_gen

    await db.commit()

    return {
        "generation": current_gen,
        "best_fitness": best_fitness,
        "avg_fitness": avg_fitness,
        "worst_fitness": worst_fitness,
        "median_fitness": median_fitness,
        "simulation_time_ms": simulation_time_ms,
        "creature_count": len(genomes),
    }


@router.post("/{run_id}/step")
async def evolution_step(
    run_id: str,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Run a single generation of evolution."""
    genetics = GeneticsService()
    simulator = SimulatorService()

    result = await run_generation(run_id, db, genetics, simulator)
    return result


@router.post("/{run_id}/run")
async def run_evolution(
    run_id: str,
    generations: int,
    background_tasks: BackgroundTasks,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Start running evolution for N generations in the background."""
    # Verify run exists
    result = await db.execute(select(Run).where(Run.id == run_id))
    run = result.scalar_one_or_none()
    if not run:
        raise HTTPException(status_code=404, detail="Run not found")

    # Update status
    run.status = "running"
    await db.commit()

    # TODO: Add background task to run generations
    # For now, we'll use WebSocket for real-time updates

    return {"message": f"Started evolution for {generations} generations", "run_id": run_id}


@router.websocket("/{run_id}/ws")
async def evolution_websocket(
    websocket: WebSocket,
    run_id: str,
):
    """WebSocket for real-time evolution updates."""
    await websocket.accept()

    try:
        while True:
            # Wait for commands from client
            data = await websocket.receive_json()
            command = data.get("command")

            if command == "step":
                # Run one generation and send results
                # Note: Would need to create a new db session here
                await websocket.send_json({
                    "type": "generation_complete",
                    "data": {"message": "WebSocket evolution not yet implemented"},
                })

            elif command == "stop":
                await websocket.send_json({"type": "stopped"})
                break

    except Exception as e:
        await websocket.send_json({"type": "error", "message": str(e)})
    finally:
        await websocket.close()

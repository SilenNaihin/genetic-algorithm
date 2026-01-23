from typing import Annotated
import statistics
import uuid
import zlib
import json

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.models import Creature, CreatureFrame, Generation, Run
from app.schemas.generation import GenerationRead

router = APIRouter()


# =============================================================================
# Schemas for saving generations
# =============================================================================


class CreatureResultCreate(BaseModel):
    """Input schema for a single creature's simulation result."""
    genome: dict
    fitness: float
    pellets_collected: int = 0
    disqualified: bool = False
    disqualified_reason: str | None = None
    frames: list[list[float]] | None = None  # Compact frame format
    pellet_data: list[dict] | None = None


class GenerationCreate(BaseModel):
    """Input schema for saving a complete generation."""
    generation: int
    creatures: list[CreatureResultCreate]
    simulation_time_ms: int = 0


# =============================================================================
# POST endpoint for saving generations
# =============================================================================


@router.post("")
async def save_generation(
    run_id: str,
    data: GenerationCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """
    Save a complete generation with all creatures to the database.

    This is the primary endpoint for frontend to persist simulation results.
    """
    # Verify run exists
    run_result = await db.execute(select(Run).where(Run.id == run_id))
    run = run_result.scalar_one_or_none()
    if not run:
        raise HTTPException(status_code=404, detail="Run not found")

    # Calculate fitness statistics
    fitness_values = [c.fitness for c in data.creatures if not c.disqualified]
    if not fitness_values:
        fitness_values = [0.0]

    sorted_fitness = sorted(fitness_values, reverse=True)
    best_fitness = sorted_fitness[0]
    worst_fitness = sorted_fitness[-1]
    avg_fitness = statistics.mean(fitness_values)
    median_fitness = statistics.median(fitness_values)

    # Calculate creature type distribution (node count -> count)
    creature_types = {}
    for c in data.creatures:
        node_count = len(c.genome.get("nodes", []))
        creature_types[str(node_count)] = creature_types.get(str(node_count), 0) + 1

    # Check if generation already exists
    existing = await db.execute(
        select(Generation)
        .where(Generation.run_id == run_id, Generation.generation == data.generation)
    )
    if existing.scalar_one_or_none():
        # Delete existing generation (will cascade to creatures)
        await db.execute(
            select(Generation)
            .where(Generation.run_id == run_id, Generation.generation == data.generation)
        )
        gen_to_delete = await db.execute(
            select(Generation)
            .where(Generation.run_id == run_id, Generation.generation == data.generation)
        )
        gen = gen_to_delete.scalar_one_or_none()
        if gen:
            await db.delete(gen)
            await db.flush()

    # Create generation record
    generation = Generation(
        run_id=run_id,
        generation=data.generation,
        best_fitness=best_fitness,
        avg_fitness=avg_fitness,
        worst_fitness=worst_fitness,
        median_fitness=median_fitness,
        creature_types=creature_types,
        simulation_time_ms=data.simulation_time_ms,
    )
    db.add(generation)
    await db.flush()

    # Track best creature and longest survivor for this generation
    gen_best_creature_id = None
    gen_best_fitness = run.best_fitness or 0.0
    gen_longest_survivor_id = None
    gen_longest_streak = run.longest_survivor_streak or 0

    # Create creature records
    for c in data.creatures:
        creature_id = str(uuid.uuid4())

        # Get survival streak from genome
        survival_streak = c.genome.get("survival_streak", c.genome.get("survivalStreak", 0))

        creature = Creature(
            id=creature_id,
            run_id=run_id,
            generation=data.generation,
            genome=c.genome,
            fitness=c.fitness,
            pellets_collected=c.pellets_collected,
            disqualified=c.disqualified,
            disqualified_reason=c.disqualified_reason,
            survival_streak=survival_streak,
        )
        db.add(creature)

        # Track best creature (only non-disqualified)
        if not c.disqualified and c.fitness > gen_best_fitness:
            gen_best_fitness = c.fitness
            gen_best_creature_id = creature_id

        # Track longest survivor
        if survival_streak > gen_longest_streak:
            gen_longest_streak = survival_streak
            gen_longest_survivor_id = creature_id

        # Save frames if provided
        if c.frames and len(c.frames) > 0:
            # Compress frames as JSON -> bytes -> zlib
            frames_json = json.dumps(c.frames)
            frames_compressed = zlib.compress(frames_json.encode('utf-8'))

            # Compress pellet data if provided
            pellet_compressed = None
            if c.pellet_data:
                pellet_json = json.dumps(c.pellet_data)
                pellet_compressed = zlib.compress(pellet_json.encode('utf-8'))

            frame_record = CreatureFrame(
                creature_id=creature_id,
                frames_data=frames_compressed,
                frame_count=len(c.frames),
                frame_rate=15,  # Default frame rate
                pellet_frames=pellet_compressed,
            )
            db.add(frame_record)

    # Update run's generation count and best creature/longest survivor
    run.generation_count = max(run.generation_count, data.generation + 1)

    if gen_best_creature_id:
        run.best_fitness = gen_best_fitness
        run.best_creature_id = gen_best_creature_id
        run.best_creature_generation = data.generation

    if gen_longest_survivor_id:
        run.longest_survivor_streak = gen_longest_streak
        run.longest_survivor_id = gen_longest_survivor_id
        run.longest_survivor_generation = data.generation

    await db.commit()

    return {
        "status": "saved",
        "run_id": run_id,
        "generation": data.generation,
        "creature_count": len(data.creatures),
    }


@router.get("", response_model=list[GenerationRead])
async def list_generations(
    run_id: str,
    db: Annotated[AsyncSession, Depends(get_db)],
    skip: int = 0,
    limit: int = 1000,
):
    """List all generations for a run."""
    # Verify run exists
    run_result = await db.execute(select(Run).where(Run.id == run_id))
    if not run_result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Run not found")

    result = await db.execute(
        select(Generation)
        .where(Generation.run_id == run_id)
        .order_by(Generation.generation)
        .offset(skip)
        .limit(limit)
    )
    generations = result.scalars().all()

    # Get creature counts
    count_result = await db.execute(
        select(Creature.generation, func.count(Creature.id))
        .where(Creature.run_id == run_id)
        .group_by(Creature.generation)
    )
    counts = dict(count_result.all())

    # Add creature counts to response
    response = []
    for gen in generations:
        gen_dict = {
            "run_id": gen.run_id,
            "generation": gen.generation,
            "created_at": gen.created_at,
            "best_fitness": gen.best_fitness,
            "avg_fitness": gen.avg_fitness,
            "worst_fitness": gen.worst_fitness,
            "median_fitness": gen.median_fitness,
            "creature_types": gen.creature_types,
            "simulation_time_ms": gen.simulation_time_ms,
            "creature_count": counts.get(gen.generation, 0),
        }
        response.append(GenerationRead(**gen_dict))

    return response


# NOTE: These routes MUST be defined BEFORE /{generation} to avoid path conflicts
@router.get("/fitness-history")
async def get_fitness_history(
    run_id: str,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Get fitness history for graphing."""
    result = await db.execute(
        select(
            Generation.generation,
            Generation.best_fitness,
            Generation.avg_fitness,
            Generation.worst_fitness,
            Generation.median_fitness,
        )
        .where(Generation.run_id == run_id)
        .order_by(Generation.generation)
    )
    rows = result.all()

    return [
        {
            "generation": row.generation,
            "best": row.best_fitness,
            "avg": row.avg_fitness,
            "worst": row.worst_fitness,
            "median": row.median_fitness,
        }
        for row in rows
    ]


@router.get("/creature-types-history")
async def get_creature_types_history(
    run_id: str,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Get creature type distribution history for graphing."""
    result = await db.execute(
        select(Generation.generation, Generation.creature_types)
        .where(Generation.run_id == run_id)
        .order_by(Generation.generation)
    )
    rows = result.all()

    return [
        {"generation": row.generation, "types": row.creature_types}
        for row in rows
    ]


@router.get("/{generation}", response_model=GenerationRead)
async def get_generation(
    run_id: str,
    generation: int,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Get a specific generation."""
    result = await db.execute(
        select(Generation)
        .where(Generation.run_id == run_id, Generation.generation == generation)
    )
    gen = result.scalar_one_or_none()
    if not gen:
        raise HTTPException(status_code=404, detail="Generation not found")

    # Get creature count
    count_result = await db.execute(
        select(func.count(Creature.id))
        .where(Creature.run_id == run_id, Creature.generation == generation)
    )
    creature_count = count_result.scalar() or 0

    return GenerationRead(
        run_id=gen.run_id,
        generation=gen.generation,
        created_at=gen.created_at,
        best_fitness=gen.best_fitness,
        avg_fitness=gen.avg_fitness,
        worst_fitness=gen.worst_fitness,
        median_fitness=gen.median_fitness,
        creature_types=gen.creature_types,
        simulation_time_ms=gen.simulation_time_ms,
        creature_count=creature_count,
    )


@router.get("/{generation}/creatures")
async def get_generation_creatures(
    run_id: str,
    generation: int,
    db: Annotated[AsyncSession, Depends(get_db)],
    include_frames: bool = False,
):
    """Get all creatures for a specific generation."""
    result = await db.execute(
        select(Creature)
        .where(Creature.run_id == run_id, Creature.generation == generation)
        .order_by(Creature.fitness.desc())
        .options(selectinload(Creature.frames) if include_frames else selectinload(Creature.frames))
    )
    creatures = result.scalars().all()

    response = []
    for c in creatures:
        creature_dict = {
            "id": c.id,
            "run_id": c.run_id,
            "generation": c.generation,
            "genome": c.genome,
            "fitness": c.fitness,
            "pellets_collected": c.pellets_collected,
            "disqualified": c.disqualified,
            "disqualified_reason": c.disqualified_reason,
            "survival_streak": c.survival_streak,
            "is_elite": c.is_elite,
            "parent_ids": c.parent_ids,
            "has_frames": c.frames is not None,
        }
        response.append(creature_dict)

    return response

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.models import Creature, Generation, Run
from app.schemas.generation import GenerationRead

router = APIRouter()


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

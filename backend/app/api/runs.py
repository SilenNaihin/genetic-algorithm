import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.models import Run, Generation, Creature, CreaturePerformance, CreatureFrame
from app.schemas.run import RunCreate, RunRead, RunUpdate


class ForkRequest(BaseModel):
    """Request body for forking a run."""
    name: str
    up_to_generation: int

router = APIRouter()


@router.get("", response_model=list[RunRead])
async def list_runs(
    db: Annotated[AsyncSession, Depends(get_db)],
    skip: int = 0,
    limit: int = 100,
):
    """List all evolution runs."""
    result = await db.execute(
        select(Run).order_by(Run.created_at.desc()).offset(skip).limit(limit)
    )
    return result.scalars().all()


@router.post("", response_model=RunRead, status_code=201)
async def create_run(
    run_in: RunCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Create a new evolution run."""
    run = Run(
        id=str(uuid.uuid4()),
        name=run_in.name,
        config=run_in.config.model_dump(),
    )
    db.add(run)
    await db.flush()
    await db.refresh(run)
    return run


@router.get("/{run_id}", response_model=RunRead)
async def get_run(
    run_id: str,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Get a specific run by ID."""
    result = await db.execute(select(Run).where(Run.id == run_id))
    run = result.scalar_one_or_none()
    if not run:
        raise HTTPException(status_code=404, detail="Run not found")
    return run


@router.patch("/{run_id}", response_model=RunRead)
async def update_run(
    run_id: str,
    run_in: RunUpdate,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Update a run's name or status."""
    result = await db.execute(select(Run).where(Run.id == run_id))
    run = result.scalar_one_or_none()
    if not run:
        raise HTTPException(status_code=404, detail="Run not found")

    if run_in.name is not None:
        run.name = run_in.name
    if run_in.status is not None:
        run.status = run_in.status

    await db.flush()
    await db.refresh(run)
    return run


@router.delete("/{run_id}", status_code=204)
async def delete_run(
    run_id: str,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Delete a run and all its generations."""
    result = await db.execute(select(Run).where(Run.id == run_id))
    run = result.scalar_one_or_none()
    if not run:
        raise HTTPException(status_code=404, detail="Run not found")

    await db.delete(run)
    await db.flush()


@router.post("/{run_id}/fork", response_model=RunRead, status_code=201)
async def fork_run(
    run_id: str,
    fork_request: ForkRequest,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """
    Fork a run up to a specific generation.

    Creates a new run with copies of all generations and creatures
    up to and including the specified generation. This allows
    branching evolution from a specific point.
    """
    # Get original run
    result = await db.execute(select(Run).where(Run.id == run_id))
    original = result.scalar_one_or_none()
    if not original:
        raise HTTPException(status_code=404, detail="Run not found")

    # Validate generation number
    if fork_request.up_to_generation < 0:
        raise HTTPException(status_code=400, detail="Generation must be non-negative")
    if fork_request.up_to_generation >= original.generation_count:
        raise HTTPException(
            status_code=400,
            detail=f"Generation {fork_request.up_to_generation} does not exist. Run has {original.generation_count} generations (0-{original.generation_count - 1})."
        )

    # Create new run
    new_run_id = str(uuid.uuid4())
    new_run = Run(
        id=new_run_id,
        name=fork_request.name,
        config=original.config,
        generation_count=fork_request.up_to_generation + 1,
        current_generation=fork_request.up_to_generation,
        status="idle",
    )
    db.add(new_run)

    # Map old creature IDs to new creature IDs (for tracking best/longest survivor)
    creature_id_map: dict[str, str] = {}

    # Copy generations up to specified point
    gen_result = await db.execute(
        select(Generation)
        .where(Generation.run_id == run_id)
        .where(Generation.generation <= fork_request.up_to_generation)
        .order_by(Generation.generation)
    )
    generations = gen_result.scalars().all()

    best_fitness = 0.0
    best_creature_id = None
    best_creature_gen = None
    longest_survivor_id = None
    longest_survivor_streak = 0
    longest_survivor_gen = None

    for gen in generations:
        # Create new generation
        new_gen = Generation(
            run_id=new_run_id,
            generation=gen.generation,
            best_fitness=gen.best_fitness,
            avg_fitness=gen.avg_fitness,
            worst_fitness=gen.worst_fitness,
            median_fitness=gen.median_fitness,
            creature_types=gen.creature_types,
            simulation_time_ms=gen.simulation_time_ms,
        )
        db.add(new_gen)

        # Get performances for this generation
        perf_result = await db.execute(
            select(CreaturePerformance)
            .where(
                CreaturePerformance.run_id == run_id,
                CreaturePerformance.generation == gen.generation
            )
            .options(
                selectinload(CreaturePerformance.creature),
                selectinload(CreaturePerformance.frames),
            )
        )
        performances = perf_result.scalars().all()

        # Copy creatures and performances
        for perf in performances:
            creature = perf.creature
            old_creature_id = creature.id

            # Check if we already created this creature in a previous generation (survivor)
            if old_creature_id in creature_id_map:
                new_creature_id = creature_id_map[old_creature_id]
            else:
                new_creature_id = str(uuid.uuid4())
                creature_id_map[old_creature_id] = new_creature_id

                # Map parent IDs to new IDs (if they exist in the map)
                new_parent_ids = [
                    creature_id_map.get(pid, pid) for pid in creature.parent_ids
                ]

                # Create creature identity record
                new_creature = Creature(
                    id=new_creature_id,
                    run_id=new_run_id,
                    genome=creature.genome,
                    birth_generation=creature.birth_generation,
                    death_generation=creature.death_generation,
                    survival_streak=creature.survival_streak,
                    is_elite=creature.is_elite,
                    parent_ids=new_parent_ids,
                )
                db.add(new_creature)

            # Create performance record for this generation
            new_perf = CreaturePerformance(
                creature_id=new_creature_id,
                generation=gen.generation,
                run_id=new_run_id,
                fitness=perf.fitness,
                pellets_collected=perf.pellets_collected,
                disqualified=perf.disqualified,
                disqualified_reason=perf.disqualified_reason,
            )
            db.add(new_perf)

            # Track best creature
            if perf.fitness > best_fitness:
                best_fitness = perf.fitness
                best_creature_id = new_creature_id
                best_creature_gen = gen.generation

            # Track longest survivor
            if creature.survival_streak > longest_survivor_streak:
                longest_survivor_streak = creature.survival_streak
                longest_survivor_id = new_creature_id
                longest_survivor_gen = gen.generation

            # Copy frames if they exist
            if perf.frames:
                new_frames = CreatureFrame(
                    creature_id=new_creature_id,
                    generation=gen.generation,
                    frames_data=perf.frames.frames_data,
                    frame_count=perf.frames.frame_count,
                    frame_rate=perf.frames.frame_rate,
                    pellet_frames=perf.frames.pellet_frames,
                )
                db.add(new_frames)

    # Update run with best creature and longest survivor
    new_run.best_fitness = best_fitness
    new_run.best_creature_id = best_creature_id
    new_run.best_creature_generation = best_creature_gen
    new_run.longest_survivor_id = longest_survivor_id
    new_run.longest_survivor_streak = longest_survivor_streak
    new_run.longest_survivor_generation = longest_survivor_gen

    await db.flush()
    await db.refresh(new_run)
    return new_run

import json
import zlib
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.models import Creature, CreaturePerformance, CreatureFrame
from app.schemas.creature import CreatureRead, CreatureWithFrames, FrameData

router = APIRouter()


def build_creature_read(creature: Creature, performance: CreaturePerformance) -> CreatureRead:
    """Build CreatureRead from Creature identity and CreaturePerformance data."""
    return CreatureRead(
        id=creature.id,
        run_id=creature.run_id,
        generation=performance.generation,
        genome=creature.genome,
        fitness=performance.fitness,
        pellets_collected=performance.pellets_collected,
        disqualified=performance.disqualified,
        disqualified_reason=performance.disqualified_reason,
        survival_streak=creature.survival_streak,
        is_elite=creature.is_elite,
        parent_ids=creature.parent_ids,
        has_frames=performance.frames is not None,
        birth_generation=creature.birth_generation,
        death_generation=creature.death_generation,
    )


@router.get("/{creature_id}", response_model=CreatureRead)
async def get_creature(
    creature_id: str,
    db: Annotated[AsyncSession, Depends(get_db)],
    generation: int | None = Query(None, description="Specific generation to get performance for"),
):
    """
    Get a creature by ID (without frames).

    If generation is provided, returns performance for that generation.
    Otherwise, returns the latest performance.
    """
    # Get the creature identity
    result = await db.execute(
        select(Creature).where(Creature.id == creature_id)
    )
    creature = result.scalar_one_or_none()
    if not creature:
        raise HTTPException(status_code=404, detail="Creature not found")

    # Get performance (specific generation or latest)
    if generation is not None:
        perf_result = await db.execute(
            select(CreaturePerformance)
            .where(
                CreaturePerformance.creature_id == creature_id,
                CreaturePerformance.generation == generation
            )
            .options(selectinload(CreaturePerformance.frames))
        )
    else:
        perf_result = await db.execute(
            select(CreaturePerformance)
            .where(CreaturePerformance.creature_id == creature_id)
            .order_by(CreaturePerformance.generation.desc())
            .limit(1)
            .options(selectinload(CreaturePerformance.frames))
        )

    performance = perf_result.scalar_one_or_none()
    if not performance:
        raise HTTPException(status_code=404, detail="No performance data found for creature")

    return build_creature_read(creature, performance)


@router.get("/{creature_id}/with-frames", response_model=CreatureWithFrames)
async def get_creature_with_frames(
    creature_id: str,
    db: Annotated[AsyncSession, Depends(get_db)],
    generation: int | None = Query(None, description="Specific generation to get frames for"),
):
    """
    Get a creature with its frame data for replay.

    If generation is provided, returns frames for that generation.
    Otherwise, returns frames from the latest generation that has them.
    """
    # Get the creature identity
    result = await db.execute(
        select(Creature).where(Creature.id == creature_id)
    )
    creature = result.scalar_one_or_none()
    if not creature:
        raise HTTPException(status_code=404, detail="Creature not found")

    # Get performance with frames
    if generation is not None:
        perf_result = await db.execute(
            select(CreaturePerformance)
            .where(
                CreaturePerformance.creature_id == creature_id,
                CreaturePerformance.generation == generation
            )
            .options(selectinload(CreaturePerformance.frames))
        )
        performance = perf_result.scalar_one_or_none()
    else:
        # Find latest performance that has frames
        perf_result = await db.execute(
            select(CreaturePerformance)
            .where(CreaturePerformance.creature_id == creature_id)
            .order_by(CreaturePerformance.generation.desc())
            .options(selectinload(CreaturePerformance.frames))
        )
        performances = perf_result.scalars().all()
        performance = None
        for p in performances:
            if p.frames is not None:
                performance = p
                break
        if performance is None and performances:
            performance = performances[0]

    if not performance:
        raise HTTPException(status_code=404, detail="No performance data found for creature")

    frames = None
    if performance.frames:
        try:
            node_frames_raw = zlib.decompress(performance.frames.frames_data)
            node_frames = json.loads(node_frames_raw)

            pellet_frames = None
            if performance.frames.pellet_frames:
                pellet_frames_raw = zlib.decompress(performance.frames.pellet_frames)
                pellet_frames = json.loads(pellet_frames_raw)

            frames = FrameData(
                frame_count=performance.frames.frame_count,
                frame_rate=performance.frames.frame_rate,
                node_frames=node_frames,
                pellet_frames=pellet_frames,
            )
        except Exception as e:
            print(f"Error decompressing frames for {creature_id}: {e}")

    return CreatureWithFrames(
        id=creature.id,
        run_id=creature.run_id,
        generation=performance.generation,
        genome=creature.genome,
        fitness=performance.fitness,
        pellets_collected=performance.pellets_collected,
        disqualified=performance.disqualified,
        disqualified_reason=performance.disqualified_reason,
        survival_streak=creature.survival_streak,
        is_elite=creature.is_elite,
        parent_ids=creature.parent_ids,
        has_frames=performance.frames is not None,
        birth_generation=creature.birth_generation,
        death_generation=creature.death_generation,
        frames=frames,
    )


@router.get("/{creature_id}/frames")
async def get_creature_frames(
    creature_id: str,
    db: Annotated[AsyncSession, Depends(get_db)],
    generation: int | None = Query(None, description="Specific generation to get frames for"),
):
    """
    Get frame data for a creature (for replay).

    If generation is provided, returns frames for that generation.
    Otherwise, returns frames from the latest generation that has them.
    """
    # Build query for frames
    if generation is not None:
        frame_result = await db.execute(
            select(CreatureFrame)
            .where(
                CreatureFrame.creature_id == creature_id,
                CreatureFrame.generation == generation
            )
        )
        frame = frame_result.scalar_one_or_none()
    else:
        # Find latest frame record
        frame_result = await db.execute(
            select(CreatureFrame)
            .where(CreatureFrame.creature_id == creature_id)
            .order_by(CreatureFrame.generation.desc())
            .limit(1)
        )
        frame = frame_result.scalar_one_or_none()

    if not frame:
        raise HTTPException(status_code=404, detail="No frames available for this creature")

    try:
        frames_raw = zlib.decompress(frame.frames_data)
        frames_data = json.loads(frames_raw)

        pellet_frames = None
        if frame.pellet_frames:
            pellet_frames_raw = zlib.decompress(frame.pellet_frames)
            pellet_frames = json.loads(pellet_frames_raw)

        fitness_over_time = None
        if frame.fitness_over_time:
            fitness_over_time_raw = zlib.decompress(frame.fitness_over_time)
            fitness_over_time = json.loads(fitness_over_time_raw)

        activations_per_frame = None
        if frame.activations_per_frame:
            activations_raw = zlib.decompress(frame.activations_per_frame)
            activations_per_frame = json.loads(activations_raw)

        return {
            "frames_data": frames_data,
            "frame_count": frame.frame_count,
            "frame_rate": frame.frame_rate,
            "pellet_frames": pellet_frames,
            "fitness_over_time": fitness_over_time,
            "activations_per_frame": activations_per_frame,
            "generation": frame.generation,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error decompressing frames: {e}")


@router.get("/run/{run_id}/best")
async def get_best_creature(
    run_id: str,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Get the best creature ever for a run (highest fitness in any generation)."""
    # Query best performance
    perf_result = await db.execute(
        select(CreaturePerformance)
        .where(CreaturePerformance.run_id == run_id)
        .order_by(CreaturePerformance.fitness.desc())
        .limit(1)
        .options(selectinload(CreaturePerformance.frames))
    )
    performance = perf_result.scalar_one_or_none()
    if not performance:
        raise HTTPException(status_code=404, detail="No creatures found")

    # Get creature identity
    creature_result = await db.execute(
        select(Creature).where(Creature.id == performance.creature_id)
    )
    creature = creature_result.scalar_one_or_none()
    if not creature:
        raise HTTPException(status_code=404, detail="Creature not found")

    return build_creature_read(creature, performance)


@router.get("/run/{run_id}/longest-survivor")
async def get_longest_survivor(
    run_id: str,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Get the longest surviving creature for a run."""
    # survival_streak is on Creature
    result = await db.execute(
        select(Creature)
        .where(Creature.run_id == run_id)
        .order_by(Creature.survival_streak.desc())
        .limit(1)
    )
    creature = result.scalar_one_or_none()
    if not creature:
        raise HTTPException(status_code=404, detail="No creatures found")

    # Get BEST performance for this creature (highest fitness, not latest generation)
    # This ensures replay shows the generation where it performed best
    perf_result = await db.execute(
        select(CreaturePerformance)
        .where(CreaturePerformance.creature_id == creature.id)
        .order_by(CreaturePerformance.fitness.desc())
        .limit(1)
        .options(selectinload(CreaturePerformance.frames))
    )
    performance = perf_result.scalar_one_or_none()
    if not performance:
        raise HTTPException(status_code=404, detail="No performance data found")

    return build_creature_read(creature, performance)


@router.get("/{creature_id}/ancestors")
async def get_creature_ancestors(
    creature_id: str,
    db: Annotated[AsyncSession, Depends(get_db)],
    max_depth: int = 50,
):
    """
    Get ancestor chain for a creature.
    Returns a flat list of ancestors with their info for building a family tree.
    """
    visited = set()
    ancestors = []
    to_visit = [creature_id]

    while to_visit and len(ancestors) < max_depth:
        current_id = to_visit.pop(0)
        if current_id in visited:
            continue
        visited.add(current_id)

        result = await db.execute(
            select(Creature).where(Creature.id == current_id)
        )
        creature = result.scalar_one_or_none()
        if not creature:
            continue

        # Get best performance for this creature (highest fitness)
        perf_result = await db.execute(
            select(CreaturePerformance)
            .where(CreaturePerformance.creature_id == current_id)
            .order_by(CreaturePerformance.fitness.desc())
            .limit(1)
        )
        performance = perf_result.scalar_one_or_none()

        genome = creature.genome or {}
        color = genome.get("color", {"h": 0.5, "s": 0.7, "l": 0.5})
        nodes = genome.get("nodes", [])
        muscles = genome.get("muscles", [])

        ancestors.append({
            "id": creature.id,
            "birth_generation": creature.birth_generation,
            "death_generation": creature.death_generation,
            "survival_streak": creature.survival_streak,
            "fitness": performance.fitness if performance else 0,
            "pellets_collected": performance.pellets_collected if performance else 0,
            "node_count": len(nodes),
            "muscle_count": len(muscles),
            "color": color,
            "parent_ids": creature.parent_ids or [],
        })

        if creature.parent_ids:
            for parent_id in creature.parent_ids:
                if parent_id not in visited:
                    to_visit.append(parent_id)

    return {"ancestors": ancestors}

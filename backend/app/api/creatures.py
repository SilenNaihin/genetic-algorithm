import json
import zlib
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.models import Creature, CreatureFrame
from app.schemas.creature import CreatureRead, CreatureWithFrames, FrameData

router = APIRouter()


@router.get("/{creature_id}", response_model=CreatureRead)
async def get_creature(
    creature_id: str,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Get a creature by ID (without frames)."""
    result = await db.execute(
        select(Creature)
        .where(Creature.id == creature_id)
        .options(selectinload(Creature.frames))
    )
    creature = result.scalar_one_or_none()
    if not creature:
        raise HTTPException(status_code=404, detail="Creature not found")

    return CreatureRead(
        id=creature.id,
        run_id=creature.run_id,
        generation=creature.generation,
        genome=creature.genome,
        fitness=creature.fitness,
        pellets_collected=creature.pellets_collected,
        disqualified=creature.disqualified,
        disqualified_reason=creature.disqualified_reason,
        survival_streak=creature.survival_streak,
        is_elite=creature.is_elite,
        parent_ids=creature.parent_ids,
        has_frames=creature.frames is not None,
    )


@router.get("/{creature_id}/with-frames", response_model=CreatureWithFrames)
async def get_creature_with_frames(
    creature_id: str,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Get a creature with its frame data for replay."""
    result = await db.execute(
        select(Creature)
        .where(Creature.id == creature_id)
        .options(selectinload(Creature.frames))
    )
    creature = result.scalar_one_or_none()
    if not creature:
        raise HTTPException(status_code=404, detail="Creature not found")

    frames = None
    if creature.frames:
        # Decompress and parse frame data
        try:
            node_frames_raw = zlib.decompress(creature.frames.frames_data)
            node_frames = json.loads(node_frames_raw)

            pellet_frames = None
            if creature.frames.pellet_frames:
                pellet_frames_raw = zlib.decompress(creature.frames.pellet_frames)
                pellet_frames = json.loads(pellet_frames_raw)

            frames = FrameData(
                frame_count=creature.frames.frame_count,
                frame_rate=creature.frames.frame_rate,
                node_frames=node_frames,
                pellet_frames=pellet_frames,
            )
        except Exception as e:
            # Log error but don't fail the request
            print(f"Error decompressing frames for {creature_id}: {e}")

    return CreatureWithFrames(
        id=creature.id,
        run_id=creature.run_id,
        generation=creature.generation,
        genome=creature.genome,
        fitness=creature.fitness,
        pellets_collected=creature.pellets_collected,
        disqualified=creature.disqualified,
        disqualified_reason=creature.disqualified_reason,
        survival_streak=creature.survival_streak,
        is_elite=creature.is_elite,
        parent_ids=creature.parent_ids,
        has_frames=creature.frames is not None,
        frames=frames,
    )


@router.get("/{creature_id}/frames")
async def get_creature_frames(
    creature_id: str,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Get frame data for a creature (for replay)."""
    result = await db.execute(
        select(Creature)
        .where(Creature.id == creature_id)
        .options(selectinload(Creature.frames))
    )
    creature = result.scalar_one_or_none()
    if not creature:
        raise HTTPException(status_code=404, detail="Creature not found")

    if not creature.frames:
        raise HTTPException(status_code=404, detail="No frames available for this creature")

    # Decompress and parse frame data
    try:
        frames_raw = zlib.decompress(creature.frames.frames_data)
        frames_data = json.loads(frames_raw)

        return {
            "frames_data": frames_data,
            "frame_count": creature.frames.frame_count,
            "frame_rate": creature.frames.frame_rate,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error decompressing frames: {e}")


@router.get("/run/{run_id}/best")
async def get_best_creature(
    run_id: str,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Get the best creature ever for a run."""
    result = await db.execute(
        select(Creature)
        .where(Creature.run_id == run_id)
        .order_by(Creature.fitness.desc())
        .limit(1)
    )
    creature = result.scalar_one_or_none()
    if not creature:
        raise HTTPException(status_code=404, detail="No creatures found")

    return CreatureRead(
        id=creature.id,
        run_id=creature.run_id,
        generation=creature.generation,
        genome=creature.genome,
        fitness=creature.fitness,
        pellets_collected=creature.pellets_collected,
        disqualified=creature.disqualified,
        disqualified_reason=creature.disqualified_reason,
        survival_streak=creature.survival_streak,
        is_elite=creature.is_elite,
        parent_ids=creature.parent_ids,
        has_frames=False,
    )


@router.get("/run/{run_id}/longest-survivor")
async def get_longest_survivor(
    run_id: str,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Get the longest surviving creature for a run."""
    result = await db.execute(
        select(Creature)
        .where(Creature.run_id == run_id)
        .order_by(Creature.survival_streak.desc())
        .limit(1)
    )
    creature = result.scalar_one_or_none()
    if not creature:
        raise HTTPException(status_code=404, detail="No creatures found")

    return CreatureRead(
        id=creature.id,
        run_id=creature.run_id,
        generation=creature.generation,
        genome=creature.genome,
        fitness=creature.fitness,
        pellets_collected=creature.pellets_collected,
        disqualified=creature.disqualified,
        disqualified_reason=creature.disqualified_reason,
        survival_streak=creature.survival_streak,
        is_elite=creature.is_elite,
        parent_ids=creature.parent_ids,
        has_frames=False,
    )


@router.get("/{creature_id}/ancestors")
async def get_creature_ancestors(
    creature_id: str,
    db: Annotated[AsyncSession, Depends(get_db)],
    max_depth: int = 50,
):
    """
    Get ancestor chain for a creature.
    Returns a flat list of ancestors with their info for building a family tree.
    This is much more efficient than loading all generations.
    """
    # Track visited to avoid cycles
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

        # Extract just the fields needed for family tree
        genome = creature.genome or {}
        color = genome.get("color", {"h": 0.5, "s": 0.7, "l": 0.5})
        nodes = genome.get("nodes", [])
        muscles = genome.get("muscles", [])

        ancestors.append({
            "id": creature.id,
            "generation": creature.generation,
            "fitness": creature.fitness,
            "pellets_collected": creature.pellets_collected,
            "node_count": len(nodes),
            "muscle_count": len(muscles),
            "color": color,
            "parent_ids": creature.parent_ids or [],
        })

        # Queue parents for visiting
        if creature.parent_ids:
            for parent_id in creature.parent_ids:
                if parent_id not in visited:
                    to_visit.append(parent_id)

    return {"ancestors": ancestors}

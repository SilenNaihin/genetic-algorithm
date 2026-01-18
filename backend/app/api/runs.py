import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.models import Run
from app.schemas.run import RunCreate, RunRead, RunUpdate

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


@router.post("/{run_id}/fork", response_model=RunRead, status_code=201)
async def fork_run(
    run_id: str,
    name: str,
    up_to_generation: int,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Fork a run up to a specific generation."""
    # Get original run with generations
    result = await db.execute(
        select(Run).where(Run.id == run_id).options(selectinload(Run.generations))
    )
    original = result.scalar_one_or_none()
    if not original:
        raise HTTPException(status_code=404, detail="Run not found")

    # Create new run
    new_run = Run(
        id=str(uuid.uuid4()),
        name=name,
        config=original.config,
        generation_count=up_to_generation + 1,
        current_generation=up_to_generation,
    )
    db.add(new_run)

    # TODO: Copy generations and creatures up to specified point
    # This requires copying Generation and Creature records

    await db.flush()
    await db.refresh(new_run)
    return new_run

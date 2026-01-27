from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import JSON, DateTime, Float, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base

if TYPE_CHECKING:
    from app.models.generation import Generation


class Run(Base):
    """A single evolution run containing multiple generations."""

    __tablename__ = "runs"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)

    # Configuration stored as JSON
    config: Mapped[dict] = mapped_column(JSON, nullable=False)

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    # Progress tracking
    generation_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    current_generation: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    # Best results
    best_fitness: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    best_creature_id: Mapped[str | None] = mapped_column(String(36), nullable=True)
    best_creature_generation: Mapped[int | None] = mapped_column(Integer, nullable=True)

    # Longest survivor
    longest_survivor_id: Mapped[str | None] = mapped_column(String(36), nullable=True)
    longest_survivor_streak: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    longest_survivor_generation: Mapped[int | None] = mapped_column(Integer, nullable=True)

    # Status
    status: Mapped[str] = mapped_column(
        String(20), default="idle", nullable=False
    )  # idle, running, paused, completed

    # Adaptive mutation state (persists between generations)
    adaptive_boost_level: Mapped[float] = mapped_column(Float, default=1.0, nullable=False)
    gens_since_boost_change: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    # NEAT innovation counters (persisted across generations)
    innovation_counter_connection: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    innovation_counter_node: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    # Relationships
    generations: Mapped[list["Generation"]] = relationship(
        "Generation", back_populates="run", cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return f"<Run {self.id}: {self.name} (gen {self.generation_count})>"

from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import JSON, DateTime, Float, ForeignKey, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base

if TYPE_CHECKING:
    from app.models.creature import CreaturePerformance
    from app.models.run import Run


class Generation(Base):
    """A single generation within an evolution run."""

    __tablename__ = "generations"

    # Composite primary key
    run_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("runs.id", ondelete="CASCADE"), primary_key=True
    )
    generation: Mapped[int] = mapped_column(Integer, primary_key=True)

    # Timestamp
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    # Fitness statistics
    best_fitness: Mapped[float] = mapped_column(Float, nullable=False)
    avg_fitness: Mapped[float] = mapped_column(Float, nullable=False)
    worst_fitness: Mapped[float] = mapped_column(Float, nullable=False)
    median_fitness: Mapped[float] = mapped_column(Float, nullable=False)

    # Creature type distribution (node count -> count)
    creature_types: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)

    # Simulation duration for this generation
    simulation_time_ms: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    # Relationships
    run: Mapped["Run"] = relationship("Run", back_populates="generations")
    performances: Mapped[list["CreaturePerformance"]] = relationship(
        "CreaturePerformance", back_populates="generation_rel", cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return f"<Generation {self.run_id}:{self.generation} (best={self.best_fitness:.1f})>"

from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import (
    JSON,
    Boolean,
    DateTime,
    Float,
    ForeignKey,
    ForeignKeyConstraint,
    Integer,
    LargeBinary,
    String,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base

if TYPE_CHECKING:
    from app.models.generation import Generation


class Creature(Base):
    """
    A creature's identity - persists across generations for survivors.

    One record per unique creature. Survivors keep the same ID.
    Per-generation performance data is stored in CreaturePerformance.
    """

    __tablename__ = "creatures"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)

    # Which run this creature belongs to
    run_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("runs.id", ondelete="CASCADE"), nullable=False, index=True
    )

    # Genome stored as JSON (doesn't change for survivors)
    genome: Mapped[dict] = mapped_column(JSON, nullable=False)

    # Lifecycle tracking
    birth_generation: Mapped[int] = mapped_column(Integer, nullable=False)
    death_generation: Mapped[int | None] = mapped_column(Integer, nullable=True)  # null = still alive
    survival_streak: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    is_elite: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    # Parent lineage (from original creation, not per-gen)
    parent_ids: Mapped[list[str]] = mapped_column(JSON, default=list, nullable=False)

    # Timestamp
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    # Relationships
    performances: Mapped[list["CreaturePerformance"]] = relationship(
        "CreaturePerformance", back_populates="creature", cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return f"<Creature {self.id} (streak={self.survival_streak})>"


class CreaturePerformance(Base):
    """
    Per-generation performance data for a creature.

    One record per creature per generation they participate in.
    Survivors have multiple records (one per generation survived).
    """

    __tablename__ = "creature_performances"

    # Composite primary key
    creature_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("creatures.id", ondelete="CASCADE"), primary_key=True
    )
    generation: Mapped[int] = mapped_column(Integer, primary_key=True)

    # Link to run for easier queries
    run_id: Mapped[str] = mapped_column(String(36), nullable=False, index=True)

    # Simulation results for this generation
    fitness: Mapped[float] = mapped_column(Float, nullable=False, index=True)
    pellets_collected: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    disqualified: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    disqualified_reason: Mapped[str | None] = mapped_column(String(100), nullable=True)

    # Timestamp
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    # Composite foreign key constraint to generations table
    __table_args__ = (
        ForeignKeyConstraint(
            ["run_id", "generation"],
            ["generations.run_id", "generations.generation"],
            ondelete="CASCADE",
        ),
    )

    # Relationships
    creature: Mapped["Creature"] = relationship("Creature", back_populates="performances")
    generation_rel: Mapped["Generation"] = relationship("Generation", back_populates="performances")
    frames: Mapped["CreatureFrame | None"] = relationship(
        "CreatureFrame", back_populates="performance", uselist=False, cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return f"<CreaturePerformance {self.creature_id}@gen{self.generation} (fitness={self.fitness:.1f})>"


class CreatureFrame(Base):
    """Frame data for creature replay, stored separately for selective storage."""

    __tablename__ = "creature_frames"

    # Composite primary key matching CreaturePerformance
    creature_id: Mapped[str] = mapped_column(String(36), primary_key=True)
    generation: Mapped[int] = mapped_column(Integer, primary_key=True)

    # Compressed frame data as binary blob
    frames_data: Mapped[bytes] = mapped_column(LargeBinary, nullable=False)

    # Frame metadata
    frame_count: Mapped[int] = mapped_column(Integer, nullable=False)
    frame_rate: Mapped[int] = mapped_column(Integer, default=15, nullable=False)

    # Pellet positions at each frame (optional, for replay)
    pellet_frames: Mapped[bytes | None] = mapped_column(LargeBinary, nullable=True)

    # Fitness values per frame (compressed JSON array)
    fitness_over_time: Mapped[bytes | None] = mapped_column(LargeBinary, nullable=True)

    # Composite foreign key
    __table_args__ = (
        ForeignKeyConstraint(
            ["creature_id", "generation"],
            ["creature_performances.creature_id", "creature_performances.generation"],
            ondelete="CASCADE",
        ),
    )

    # Relationship
    performance: Mapped["CreaturePerformance"] = relationship(
        "CreaturePerformance", back_populates="frames"
    )

    def __repr__(self) -> str:
        return f"<CreatureFrame {self.creature_id}@gen{self.generation} ({self.frame_count} frames)>"

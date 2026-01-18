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
    """A creature with its genome and simulation results."""

    __tablename__ = "creatures"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)

    # Foreign keys to generation (composite)
    run_id: Mapped[str] = mapped_column(String(36), nullable=False)
    generation: Mapped[int] = mapped_column(Integer, nullable=False)

    # Genome stored as JSON
    genome: Mapped[dict] = mapped_column(JSON, nullable=False)

    # Simulation results
    fitness: Mapped[float] = mapped_column(Float, nullable=False, index=True)
    pellets_collected: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    disqualified: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    disqualified_reason: Mapped[str | None] = mapped_column(String(100), nullable=True)

    # Survival tracking
    survival_streak: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    is_elite: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    # Parent lineage
    parent_ids: Mapped[list[str]] = mapped_column(JSON, default=list, nullable=False)

    # Timestamp
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    # Composite foreign key constraint
    __table_args__ = (
        ForeignKeyConstraint(
            ["run_id", "generation"],
            ["generations.run_id", "generations.generation"],
            ondelete="CASCADE",
        ),
    )

    # Relationships
    generation_rel: Mapped["Generation"] = relationship("Generation", back_populates="creatures")
    frames: Mapped["CreatureFrame | None"] = relationship(
        "CreatureFrame", back_populates="creature", uselist=False, cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return f"<Creature {self.id} (fitness={self.fitness:.1f})>"


class CreatureFrame(Base):
    """Frame data for creature replay, stored separately for selective storage."""

    __tablename__ = "creature_frames"

    creature_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("creatures.id", ondelete="CASCADE"), primary_key=True
    )

    # Compressed frame data as binary blob
    # Format: [[x,y,z,qx,qy,qz,qw], ...] for each node, for each frame
    frames_data: Mapped[bytes] = mapped_column(LargeBinary, nullable=False)

    # Frame metadata
    frame_count: Mapped[int] = mapped_column(Integer, nullable=False)
    frame_rate: Mapped[int] = mapped_column(Integer, default=15, nullable=False)

    # Pellet positions at each frame (optional, for replay)
    pellet_frames: Mapped[bytes | None] = mapped_column(LargeBinary, nullable=True)

    # Relationship
    creature: Mapped["Creature"] = relationship("Creature", back_populates="frames")

    def __repr__(self) -> str:
        return f"<CreatureFrame {self.creature_id} ({self.frame_count} frames)>"

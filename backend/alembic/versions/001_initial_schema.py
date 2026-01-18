"""Initial schema

Revision ID: 001
Revises:
Create Date: 2025-01-15

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = "001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create runs table
    op.create_table(
        "runs",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("config", postgresql.JSON(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Column("generation_count", sa.Integer(), default=0, nullable=False),
        sa.Column("current_generation", sa.Integer(), default=0, nullable=False),
        sa.Column("best_fitness", sa.Float(), default=0.0, nullable=False),
        sa.Column("best_creature_id", sa.String(36), nullable=True),
        sa.Column("best_creature_generation", sa.Integer(), nullable=True),
        sa.Column("longest_survivor_id", sa.String(36), nullable=True),
        sa.Column("longest_survivor_streak", sa.Integer(), default=0, nullable=False),
        sa.Column("longest_survivor_generation", sa.Integer(), nullable=True),
        sa.Column("status", sa.String(20), default="idle", nullable=False),
    )

    # Create generations table
    op.create_table(
        "generations",
        sa.Column("run_id", sa.String(36), sa.ForeignKey("runs.id", ondelete="CASCADE"), primary_key=True),
        sa.Column("generation", sa.Integer(), primary_key=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Column("best_fitness", sa.Float(), nullable=False),
        sa.Column("avg_fitness", sa.Float(), nullable=False),
        sa.Column("worst_fitness", sa.Float(), nullable=False),
        sa.Column("median_fitness", sa.Float(), nullable=False),
        sa.Column("creature_types", postgresql.JSON(), nullable=False, server_default="{}"),
        sa.Column("simulation_time_ms", sa.Integer(), default=0, nullable=False),
    )
    op.create_index("idx_generations_run_id", "generations", ["run_id"])

    # Create creatures table
    op.create_table(
        "creatures",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("run_id", sa.String(36), nullable=False),
        sa.Column("generation", sa.Integer(), nullable=False),
        sa.Column("genome", postgresql.JSON(), nullable=False),
        sa.Column("fitness", sa.Float(), nullable=False),
        sa.Column("pellets_collected", sa.Integer(), default=0, nullable=False),
        sa.Column("disqualified", sa.Boolean(), default=False, nullable=False),
        sa.Column("disqualified_reason", sa.String(100), nullable=True),
        sa.Column("survival_streak", sa.Integer(), default=0, nullable=False),
        sa.Column("is_elite", sa.Boolean(), default=False, nullable=False),
        sa.Column("parent_ids", postgresql.JSON(), nullable=False, server_default="[]"),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(
            ["run_id", "generation"],
            ["generations.run_id", "generations.generation"],
            ondelete="CASCADE",
        ),
    )
    op.create_index("idx_creatures_fitness", "creatures", ["run_id", "generation", "fitness"])
    op.create_index("idx_creatures_run_gen", "creatures", ["run_id", "generation"])

    # Create creature_frames table
    op.create_table(
        "creature_frames",
        sa.Column(
            "creature_id",
            sa.String(36),
            sa.ForeignKey("creatures.id", ondelete="CASCADE"),
            primary_key=True,
        ),
        sa.Column("frames_data", sa.LargeBinary(), nullable=False),
        sa.Column("frame_count", sa.Integer(), nullable=False),
        sa.Column("frame_rate", sa.Integer(), default=15, nullable=False),
        sa.Column("pellet_frames", sa.LargeBinary(), nullable=True),
    )


def downgrade() -> None:
    op.drop_table("creature_frames")
    op.drop_index("idx_creatures_run_gen")
    op.drop_index("idx_creatures_fitness")
    op.drop_table("creatures")
    op.drop_index("idx_generations_run_id")
    op.drop_table("generations")
    op.drop_table("runs")

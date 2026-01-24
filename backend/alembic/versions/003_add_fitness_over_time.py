"""Add fitness_over_time column to creature_frames

Revision ID: 003
Revises: 002
Create Date: 2025-01-24

Stores the backend-computed fitness values per frame,
so frontend doesn't need to recalculate.
"""

from alembic import op
import sqlalchemy as sa


# revision identifiers
revision = '003'
down_revision = '002'
branch_labels = None
depends_on = None


def upgrade():
    # Add fitness_over_time column to creature_frames
    op.add_column(
        'creature_frames',
        sa.Column('fitness_over_time', sa.LargeBinary(), nullable=True)
    )


def downgrade():
    op.drop_column('creature_frames', 'fitness_over_time')

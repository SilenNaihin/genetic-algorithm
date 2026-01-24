"""Add adaptive mutation state columns to runs

Revision ID: 004
Revises: 003
Create Date: 2025-01-24

Stores the adaptive boost level and cooldown counter for each run,
allowing stateful adaptive mutation that persists between generations.
"""

from alembic import op
import sqlalchemy as sa


# revision identifiers
revision = '004'
down_revision = '003'
branch_labels = None
depends_on = None


def upgrade():
    # Add adaptive_boost_level column (default 1.0 = no boost)
    op.add_column(
        'runs',
        sa.Column('adaptive_boost_level', sa.Float(), nullable=False, server_default='1.0')
    )
    # Add gens_since_boost_change column (cooldown counter)
    op.add_column(
        'runs',
        sa.Column('gens_since_boost_change', sa.Integer(), nullable=False, server_default='0')
    )


def downgrade():
    op.drop_column('runs', 'gens_since_boost_change')
    op.drop_column('runs', 'adaptive_boost_level')

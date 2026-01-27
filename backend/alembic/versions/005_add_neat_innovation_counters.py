"""Add NEAT innovation counter columns to runs

Revision ID: 005
Revises: 56f5a434d092
Create Date: 2026-01-26

Stores the NEAT innovation counters (connection and node) for each run,
allowing consistent innovation number tracking across generations.
"""

from alembic import op
import sqlalchemy as sa


# revision identifiers
revision = '005'
down_revision = '56f5a434d092'
branch_labels = None
depends_on = None


def upgrade():
    # Add innovation_counter_connection column (starts at 0)
    op.add_column(
        'runs',
        sa.Column('innovation_counter_connection', sa.Integer(), nullable=False, server_default='0')
    )
    # Add innovation_counter_node column (starts at 0)
    op.add_column(
        'runs',
        sa.Column('innovation_counter_node', sa.Integer(), nullable=False, server_default='0')
    )


def downgrade():
    op.drop_column('runs', 'innovation_counter_node')
    op.drop_column('runs', 'innovation_counter_connection')

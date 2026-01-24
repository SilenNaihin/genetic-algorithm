"""Add creature_performances table for per-generation history

Revision ID: 002_creature_performances
Revises: 001_initial_schema
Create Date: 2025-01-24

This migration:
1. Creates creature_performances table for per-generation results
2. Modifies creatures table to be identity-focused (removes per-gen fields)
3. Updates creature_frames to use composite key with generation
4. Migrates existing data
"""

from alembic import op
import sqlalchemy as sa


# revision identifiers
revision = '002'
down_revision = '001'
branch_labels = None
depends_on = None


def upgrade():
    # 1. Create creature_performances table
    op.create_table(
        'creature_performances',
        sa.Column('creature_id', sa.String(36), nullable=False),
        sa.Column('generation', sa.Integer(), nullable=False),
        sa.Column('run_id', sa.String(36), nullable=False),
        sa.Column('fitness', sa.Float(), nullable=False),
        sa.Column('pellets_collected', sa.Integer(), nullable=False, default=0),
        sa.Column('disqualified', sa.Boolean(), nullable=False, default=False),
        sa.Column('disqualified_reason', sa.String(100), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint('creature_id', 'generation'),
        sa.ForeignKeyConstraint(['creature_id'], ['creatures.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['run_id', 'generation'], ['generations.run_id', 'generations.generation'], ondelete='CASCADE'),
    )
    op.create_index('ix_creature_performances_fitness', 'creature_performances', ['fitness'])
    op.create_index('ix_creature_performances_run_id', 'creature_performances', ['run_id'])

    # 2. Migrate existing data from creatures to creature_performances
    # Copy fitness data to performances table
    op.execute("""
        INSERT INTO creature_performances (creature_id, generation, run_id, fitness, pellets_collected, disqualified, disqualified_reason, created_at)
        SELECT id, generation, run_id, fitness, pellets_collected, disqualified, disqualified_reason, created_at
        FROM creatures
    """)

    # 3. Add new columns to creatures table
    op.add_column('creatures', sa.Column('birth_generation', sa.Integer(), nullable=True))
    op.add_column('creatures', sa.Column('death_generation', sa.Integer(), nullable=True))

    # Set birth_generation from existing generation column
    op.execute("UPDATE creatures SET birth_generation = generation")

    # Make birth_generation non-nullable
    op.alter_column('creatures', 'birth_generation', nullable=False)

    # 4. Update creature_frames to have composite primary key
    # First, add generation column
    op.add_column('creature_frames', sa.Column('generation', sa.Integer(), nullable=True))

    # Set generation from the creature's current generation
    op.execute("""
        UPDATE creature_frames
        SET generation = (SELECT generation FROM creatures WHERE creatures.id = creature_frames.creature_id)
    """)

    # Make generation non-nullable
    op.alter_column('creature_frames', 'generation', nullable=False)

    # Drop old primary key and foreign key
    op.drop_constraint('creature_frames_pkey', 'creature_frames', type_='primary')
    op.drop_constraint('creature_frames_creature_id_fkey', 'creature_frames', type_='foreignkey')

    # Create new composite primary key
    op.create_primary_key('creature_frames_pkey', 'creature_frames', ['creature_id', 'generation'])

    # Create new foreign key to creature_performances
    op.create_foreign_key(
        'creature_frames_performance_fkey',
        'creature_frames',
        'creature_performances',
        ['creature_id', 'generation'],
        ['creature_id', 'generation'],
        ondelete='CASCADE'
    )

    # 5. Remove old columns from creatures that are now in performances
    op.drop_constraint('creatures_run_id_generation_fkey', 'creatures', type_='foreignkey')
    op.drop_column('creatures', 'generation')
    op.drop_column('creatures', 'fitness')
    op.drop_column('creatures', 'pellets_collected')
    op.drop_column('creatures', 'disqualified')
    op.drop_column('creatures', 'disqualified_reason')

    # Add foreign key to runs instead of generations
    op.create_foreign_key(
        'creatures_run_id_fkey',
        'creatures',
        'runs',
        ['run_id'],
        ['id'],
        ondelete='CASCADE'
    )


def downgrade():
    # This is a complex migration, downgrade would require careful data migration
    # For now, just drop the new table and restore old schema

    # Add back columns to creatures
    op.add_column('creatures', sa.Column('generation', sa.Integer(), nullable=True))
    op.add_column('creatures', sa.Column('fitness', sa.Float(), nullable=True))
    op.add_column('creatures', sa.Column('pellets_collected', sa.Integer(), nullable=True))
    op.add_column('creatures', sa.Column('disqualified', sa.Boolean(), nullable=True))
    op.add_column('creatures', sa.Column('disqualified_reason', sa.String(100), nullable=True))

    # Copy data back from performances (use latest performance per creature)
    op.execute("""
        UPDATE creatures c
        SET generation = p.generation,
            fitness = p.fitness,
            pellets_collected = p.pellets_collected,
            disqualified = p.disqualified,
            disqualified_reason = p.disqualified_reason
        FROM (
            SELECT DISTINCT ON (creature_id) *
            FROM creature_performances
            ORDER BY creature_id, generation DESC
        ) p
        WHERE c.id = p.creature_id
    """)

    # Drop foreign key from creatures to runs
    op.drop_constraint('creatures_run_id_fkey', 'creatures', type_='foreignkey')

    # Restore foreign key to generations
    op.create_foreign_key(
        'creatures_run_id_generation_fkey',
        'creatures',
        'generations',
        ['run_id', 'generation'],
        ['run_id', 'generation'],
        ondelete='CASCADE'
    )

    # Remove new columns
    op.drop_column('creatures', 'birth_generation')
    op.drop_column('creatures', 'death_generation')

    # Fix creature_frames
    op.drop_constraint('creature_frames_performance_fkey', 'creature_frames', type_='foreignkey')
    op.drop_constraint('creature_frames_pkey', 'creature_frames', type_='primary')
    op.drop_column('creature_frames', 'generation')
    op.create_primary_key('creature_frames_pkey', 'creature_frames', ['creature_id'])
    op.create_foreign_key(
        'creature_frames_creature_id_fkey',
        'creature_frames',
        'creatures',
        ['creature_id'],
        ['id'],
        ondelete='CASCADE'
    )

    # Drop performances table
    op.drop_index('ix_creature_performances_run_id', 'creature_performances')
    op.drop_index('ix_creature_performances_fitness', 'creature_performances')
    op.drop_table('creature_performances')

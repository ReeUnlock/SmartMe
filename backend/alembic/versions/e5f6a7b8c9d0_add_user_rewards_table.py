"""add_user_rewards_table

Revision ID: e5f6a7b8c9d0
Revises: d4e5f6a7b8c9
Create Date: 2026-03-14 22:00:00.000000
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = 'e5f6a7b8c9d0'
down_revision: Union[str, None] = 'd4e5f6a7b8c9'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table('user_rewards',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('sparks', sa.Integer(), server_default='0', nullable=False),
        sa.Column('level', sa.Integer(), server_default='1', nullable=False),
        sa.Column('streak', sa.Integer(), server_default='0', nullable=False),
        sa.Column('streak_last_date', sa.Date(), nullable=True),
        sa.Column('xp', sa.Integer(), server_default='0', nullable=False),
        sa.Column('achievements', postgresql.JSONB(), server_default='[]', nullable=False),
        sa.Column('challenges_state', postgresql.JSONB(), server_default='{}', nullable=False),
        sa.Column('avatar_key', sa.String(length=32), server_default='sol', nullable=False),
        sa.Column('seen_avatar_unlocks', postgresql.JSONB(), server_default='[]', nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('user_id', name='uq_user_rewards'),
    )
    op.create_index(op.f('ix_user_rewards_id'), 'user_rewards', ['id'], unique=False)
    op.create_index('ix_user_rewards_user_id', 'user_rewards', ['user_id'], unique=False)


def downgrade() -> None:
    op.drop_index('ix_user_rewards_user_id', table_name='user_rewards')
    op.drop_index(op.f('ix_user_rewards_id'), table_name='user_rewards')
    op.drop_table('user_rewards')

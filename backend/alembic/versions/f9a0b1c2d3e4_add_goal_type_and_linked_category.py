"""add_goal_type_and_linked_category_to_goals

Revision ID: f9a0b1c2d3e4
Revises: e8f9a0b1c2d3
Create Date: 2026-03-10 18:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = 'f9a0b1c2d3e4'
down_revision: Union[str, None] = 'e8f9a0b1c2d3'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('goals', sa.Column('goal_type', sa.String(20), server_default='manual', nullable=False))
    op.add_column('goals', sa.Column('linked_category_id', sa.Integer(), nullable=True))
    op.create_foreign_key(
        'fk_goals_linked_category_id',
        'goals', 'expense_categories',
        ['linked_category_id'], ['id'],
        ondelete='SET NULL',
    )
    op.create_index('ix_goals_linked_category_id', 'goals', ['linked_category_id'])


def downgrade() -> None:
    op.drop_index('ix_goals_linked_category_id', table_name='goals')
    op.drop_constraint('fk_goals_linked_category_id', 'goals', type_='foreignkey')
    op.drop_column('goals', 'linked_category_id')
    op.drop_column('goals', 'goal_type')

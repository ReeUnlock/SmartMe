"""add_recurring_id_to_expenses

Revision ID: e8f9a0b1c2d3
Revises: d7e1f2a3b4c5
Create Date: 2026-03-10 14:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = 'e8f9a0b1c2d3'
down_revision: Union[str, None] = 'd7e1f2a3b4c5'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('expenses', sa.Column('recurring_id', sa.Integer(), nullable=True))
    op.create_index('ix_expenses_recurring_id', 'expenses', ['recurring_id'])


def downgrade() -> None:
    op.drop_index('ix_expenses_recurring_id', table_name='expenses')
    op.drop_column('expenses', 'recurring_id')

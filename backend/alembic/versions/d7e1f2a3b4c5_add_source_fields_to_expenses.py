"""add_source_fields_to_expenses

Revision ID: d7e1f2a3b4c5
Revises: 43a4288e970a
Create Date: 2026-03-10 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = 'd7e1f2a3b4c5'
down_revision: Union[str, None] = '43a4288e970a'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('expenses', sa.Column('source', sa.String(50), nullable=True))
    op.add_column('expenses', sa.Column('source_id', sa.Integer(), nullable=True))
    op.create_index('ix_expenses_source', 'expenses', ['source', 'source_id'])


def downgrade() -> None:
    op.drop_index('ix_expenses_source', table_name='expenses')
    op.drop_column('expenses', 'source_id')
    op.drop_column('expenses', 'source')

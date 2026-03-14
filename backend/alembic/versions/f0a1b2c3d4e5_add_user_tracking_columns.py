"""add_user_tracking_columns

Revision ID: f0a1b2c3d4e5
Revises: e5f6a7b8c9d0
Create Date: 2026-03-14 23:00:00.000000
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'f0a1b2c3d4e5'
down_revision: Union[str, None] = 'e5f6a7b8c9d0'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('users', sa.Column('last_seen_at', sa.DateTime(timezone=True), nullable=True))
    op.add_column('users', sa.Column('voice_calls_total', sa.Integer(), server_default='0', nullable=False))
    op.add_column('users', sa.Column('receipt_scans_total', sa.Integer(), server_default='0', nullable=False))
    op.add_column('users', sa.Column('login_count', sa.Integer(), server_default='0', nullable=False))


def downgrade() -> None:
    op.drop_column('users', 'login_count')
    op.drop_column('users', 'receipt_scans_total')
    op.drop_column('users', 'voice_calls_total')
    op.drop_column('users', 'last_seen_at')

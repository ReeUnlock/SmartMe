"""add_voice_calls_today_columns

Revision ID: g2a3b4c5d6e7
Revises: f1b2c3d4e5f6
Create Date: 2026-03-20 12:00:00.000000
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "g2a3b4c5d6e7"
down_revision: Union[str, None] = "f1b2c3d4e5f6"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("users", sa.Column("voice_calls_today", sa.Integer(), nullable=False, server_default="0"))
    op.add_column("users", sa.Column("voice_calls_today_date", sa.Date(), nullable=True))


def downgrade() -> None:
    op.drop_column("users", "voice_calls_today_date")
    op.drop_column("users", "voice_calls_today")

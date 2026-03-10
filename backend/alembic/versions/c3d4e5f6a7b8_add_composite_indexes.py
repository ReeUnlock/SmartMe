"""add composite indexes for query performance

Revision ID: c3d4e5f6a7b8
Revises: b2c3d4e5f6a7
Create Date: 2026-03-10 13:00:00.000000

"""
from typing import Sequence, Union

from alembic import op


# revision identifiers, used by Alembic.
revision: str = "c3d4e5f6a7b8"
down_revision: Union[str, None] = "b2c3d4e5f6a7"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_index(
        "ix_expenses_user_category_date",
        "expenses",
        ["user_id", "category_id", "date"],
    )


def downgrade() -> None:
    op.drop_index("ix_expenses_user_category_date", table_name="expenses")

"""multi_user_auth_tokens

Revision ID: d4e5f6a7b8c9
Revises: 257290e4561e
Create Date: 2026-03-14 18:00:00.000000
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'd4e5f6a7b8c9'
down_revision: Union[str, None] = '257290e4561e'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add email verification columns to users
    op.add_column('users', sa.Column('is_email_verified', sa.Boolean(), nullable=False, server_default='false'))
    op.add_column('users', sa.Column('email_verified_at', sa.DateTime(timezone=True), nullable=True))

    # Mark existing user id=12 (rafal) as verified
    op.execute("UPDATE users SET is_email_verified = TRUE, email_verified_at = NOW() WHERE id = 12")

    # Create auth_tokens table
    op.create_table('auth_tokens',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('token', sa.String(length=255), nullable=False),
        sa.Column('token_type', sa.String(length=50), nullable=False),
        sa.Column('expires_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('used_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_auth_tokens_token', 'auth_tokens', ['token'], unique=True)
    op.create_index('ix_auth_tokens_user_id', 'auth_tokens', ['user_id'], unique=False)

    # Add user_id to feedback table for multi-user support
    op.add_column('feedback', sa.Column('user_id', sa.Integer(), nullable=True))
    op.create_foreign_key('fk_feedback_user_id', 'feedback', 'users', ['user_id'], ['id'], ondelete='SET NULL')
    op.create_index('ix_feedback_user_id', 'feedback', ['user_id'], unique=False)


def downgrade() -> None:
    op.drop_index('ix_feedback_user_id', table_name='feedback')
    op.drop_constraint('fk_feedback_user_id', 'feedback', type_='foreignkey')
    op.drop_column('feedback', 'user_id')
    op.drop_index('ix_auth_tokens_user_id', table_name='auth_tokens')
    op.drop_index('ix_auth_tokens_token', table_name='auth_tokens')
    op.drop_table('auth_tokens')
    op.drop_column('users', 'email_verified_at')
    op.drop_column('users', 'is_email_verified')

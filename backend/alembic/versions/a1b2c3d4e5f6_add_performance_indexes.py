"""Add performance indexes on foreign keys and query columns

Revision ID: a1b2c3d4e5f6
Revises: 05f6f4827843
Create Date: 2026-03-09 20:00:00.000000
"""
from typing import Sequence, Union

from alembic import op


# revision identifiers, used by Alembic.
revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, None] = '05f6f4827843'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Events
    op.create_index('ix_events_user_id', 'events', ['user_id'])
    op.create_index('ix_events_start_at', 'events', ['start_at'])
    op.create_index('ix_events_user_start', 'events', ['user_id', 'start_at'])

    # Shopping
    op.create_index('ix_shopping_lists_user_id', 'shopping_lists', ['user_id'])
    op.create_index('ix_shopping_categories_user_id', 'shopping_categories', ['user_id'])
    op.create_index('ix_shopping_items_user_id', 'shopping_items', ['user_id'])
    op.create_index('ix_shopping_items_list_id', 'shopping_items', ['list_id'])

    # Expenses
    op.create_index('ix_household_members_user_id', 'household_members', ['user_id'])
    op.create_index('ix_expense_categories_user_id', 'expense_categories', ['user_id'])
    op.create_index('ix_expenses_user_id', 'expenses', ['user_id'])
    op.create_index('ix_expenses_date', 'expenses', ['date'])
    op.create_index('ix_expenses_user_date', 'expenses', ['user_id', 'date'])
    op.create_index('ix_recurring_expenses_user_id', 'recurring_expenses', ['user_id'])
    op.create_index('ix_monthly_budgets_user_id', 'monthly_budgets', ['user_id'])

    # Plans
    op.create_index('ix_goals_user_id', 'goals', ['user_id'])
    op.create_index('ix_milestones_goal_id', 'milestones', ['goal_id'])
    op.create_index('ix_milestones_user_id', 'milestones', ['user_id'])
    op.create_index('ix_bucket_items_user_id', 'bucket_items', ['user_id'])


def downgrade() -> None:
    # Plans
    op.drop_index('ix_bucket_items_user_id', 'bucket_items')
    op.drop_index('ix_milestones_user_id', 'milestones')
    op.drop_index('ix_milestones_goal_id', 'milestones')
    op.drop_index('ix_goals_user_id', 'goals')

    # Expenses
    op.drop_index('ix_monthly_budgets_user_id', 'monthly_budgets')
    op.drop_index('ix_recurring_expenses_user_id', 'recurring_expenses')
    op.drop_index('ix_expenses_user_date', 'expenses')
    op.drop_index('ix_expenses_date', 'expenses')
    op.drop_index('ix_expenses_user_id', 'expenses')
    op.drop_index('ix_expense_categories_user_id', 'expense_categories')
    op.drop_index('ix_household_members_user_id', 'household_members')

    # Shopping
    op.drop_index('ix_shopping_items_list_id', 'shopping_items')
    op.drop_index('ix_shopping_items_user_id', 'shopping_items')
    op.drop_index('ix_shopping_categories_user_id', 'shopping_categories')
    op.drop_index('ix_shopping_lists_user_id', 'shopping_lists')

    # Events
    op.drop_index('ix_events_user_start', 'events')
    op.drop_index('ix_events_start_at', 'events')
    op.drop_index('ix_events_user_id', 'events')

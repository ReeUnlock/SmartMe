from datetime import datetime
from enum import Enum
from typing import Optional

from pydantic import BaseModel


class VoiceActionType(str, Enum):
    add_event = "add_event"
    update_event = "update_event"
    delete_event = "delete_event"
    delete_all_events = "delete_all_events"
    list_events = "list_events"
    # Shopping actions
    create_shopping_list = "create_shopping_list"
    add_shopping_items = "add_shopping_items"
    delete_shopping_items = "delete_shopping_items"
    check_shopping_items = "check_shopping_items"
    uncheck_shopping_items = "uncheck_shopping_items"
    # Expense actions
    add_expense = "add_expense"
    add_recurring_expense = "add_recurring_expense"
    delete_recurring_expense = "delete_recurring_expense"
    set_budget = "set_budget"
    list_expenses = "list_expenses"
    generate_recurring_expenses = "generate_recurring_expenses"
    # Shopping → Expense bridge
    save_shopping_as_expense = "save_shopping_as_expense"
    # Plans actions
    add_goal = "add_goal"
    update_goal = "update_goal"
    delete_goal = "delete_goal"
    toggle_goal = "toggle_goal"
    add_bucket_item = "add_bucket_item"
    delete_bucket_item = "delete_bucket_item"
    toggle_bucket_item = "toggle_bucket_item"
    list_goals = "list_goals"
    unknown = "unknown"


class TemporalInterpretation(BaseModel):
    """Metadata describing how a temporal expression was interpreted."""
    source_text: Optional[str] = None
    pattern_type: Optional[str] = None  # single_date, explicit_dates, date_range, weekday_recurring, interval_recurring, duration_span
    resolved_dates: Optional[list[str]] = None  # ISO 8601 date strings
    range_start: Optional[str] = None
    range_end: Optional[str] = None
    weekdays: Optional[list[str]] = None  # e.g. ["thursday", "friday"]
    interval: Optional[int] = None  # e.g. 2 for "co drugi dzień"
    needs_clarification: Optional[bool] = None
    clarification_reason: Optional[str] = None
    default_assumption: Optional[str] = None
    # Set by backend validator
    validator_corrected: Optional[bool] = None  # True if validator rebuilt dates
    validator_note: Optional[str] = None  # Human-readable correction summary
    past_dates_excluded: Optional[int] = None  # Count of past dates that were excluded


class ShoppingItemParam(BaseModel):
    name: str
    quantity: Optional[float] = None
    unit: Optional[str] = None
    category: Optional[str] = None


class VoiceProposedAction(BaseModel):
    action: VoiceActionType
    transcript: str
    confidence_note: Optional[str] = None
    # Calendar fields
    title: Optional[str] = None
    start_at: Optional[datetime] = None
    end_at: Optional[datetime] = None
    all_day: Optional[bool] = None
    description: Optional[str] = None
    location: Optional[str] = None
    category: Optional[str] = None
    event_id: Optional[int] = None
    date_query: Optional[str] = None
    color: Optional[str] = None
    icon: Optional[str] = None
    # Temporal interpretation metadata (calendar)
    temporal_interpretation: Optional[TemporalInterpretation] = None
    # Validation metadata (set by backend validator)
    validation_errors: Optional[list[str]] = None
    # Shopping fields
    list_name: Optional[str] = None
    items: Optional[list[ShoppingItemParam]] = None
    # Expense fields
    amount: Optional[float] = None
    expense_date: Optional[str] = None
    expense_category: Optional[str] = None
    paid_by: Optional[str] = None
    is_shared: Optional[bool] = None
    expense_description: Optional[str] = None
    recurring_name: Optional[str] = None
    day_of_month: Optional[int] = None
    budget_amount: Optional[float] = None
    budget_year: Optional[int] = None
    budget_month: Optional[int] = None
    # Plans fields
    goal_title: Optional[str] = None
    goal_description: Optional[str] = None
    goal_category: Optional[str] = None
    goal_color: Optional[str] = None
    goal_target_value: Optional[float] = None
    goal_current_value: Optional[float] = None
    goal_unit: Optional[str] = None
    goal_deadline: Optional[str] = None
    goal_id: Optional[int] = None
    bucket_title: Optional[str] = None
    bucket_description: Optional[str] = None
    bucket_category: Optional[str] = None
    bucket_id: Optional[int] = None


class VoiceConfirmAction(BaseModel):
    action: VoiceActionType
    transcript: str
    confidence_note: Optional[str] = None
    # Calendar fields
    title: Optional[str] = None
    start_at: Optional[datetime] = None
    end_at: Optional[datetime] = None
    all_day: Optional[bool] = None
    description: Optional[str] = None
    location: Optional[str] = None
    category: Optional[str] = None
    event_id: Optional[int] = None
    date_query: Optional[str] = None
    color: Optional[str] = None
    icon: Optional[str] = None
    # Shopping fields
    list_name: Optional[str] = None
    items: Optional[list[ShoppingItemParam]] = None
    # Expense fields
    amount: Optional[float] = None
    expense_date: Optional[str] = None
    expense_category: Optional[str] = None
    paid_by: Optional[str] = None
    is_shared: Optional[bool] = None
    expense_description: Optional[str] = None
    recurring_name: Optional[str] = None
    day_of_month: Optional[int] = None
    budget_amount: Optional[float] = None
    budget_year: Optional[int] = None
    budget_month: Optional[int] = None
    # Plans fields
    goal_title: Optional[str] = None
    goal_description: Optional[str] = None
    goal_category: Optional[str] = None
    goal_color: Optional[str] = None
    goal_target_value: Optional[float] = None
    goal_current_value: Optional[float] = None
    goal_unit: Optional[str] = None
    goal_deadline: Optional[str] = None
    goal_id: Optional[int] = None
    bucket_title: Optional[str] = None
    bucket_description: Optional[str] = None
    bucket_category: Optional[str] = None
    bucket_id: Optional[int] = None


class VoiceProcessResponse(BaseModel):
    transcript: str
    actions: list[VoiceProposedAction]


class VoiceExecuteResult(BaseModel):
    success: bool
    message: str
    data: Optional[dict] = None

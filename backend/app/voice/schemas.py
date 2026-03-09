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
    # Expense actions
    add_expense = "add_expense"
    add_recurring_expense = "add_recurring_expense"
    delete_recurring_expense = "delete_recurring_expense"
    set_budget = "set_budget"
    list_expenses = "list_expenses"
    unknown = "unknown"


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


class VoiceProcessResponse(BaseModel):
    transcript: str
    actions: list[VoiceProposedAction]


class VoiceExecuteResult(BaseModel):
    success: bool
    message: str
    data: Optional[dict] = None

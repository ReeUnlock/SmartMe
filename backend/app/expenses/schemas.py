from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel, Field


# ─── Household Members ──────────────────────────────────────

class MemberCreate(BaseModel):
    name: str = Field(min_length=1, max_length=100)


class MemberUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=1, max_length=100)


class MemberOut(BaseModel):
    id: int
    name: str
    created_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


# ─── Expense Categories ─────────────────────────────────────

class ExpenseCategoryCreate(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    icon: Optional[str] = Field(default=None, max_length=50)
    color: Optional[str] = Field(default=None, max_length=30)
    sort_order: int = 0


class ExpenseCategoryUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=1, max_length=100)
    icon: Optional[str] = Field(default=None, max_length=50)
    color: Optional[str] = Field(default=None, max_length=30)
    sort_order: Optional[int] = None


class ExpenseCategoryOut(BaseModel):
    id: int
    name: str
    icon: Optional[str] = None
    color: Optional[str] = None
    sort_order: int
    created_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


# ─── Expenses ────────────────────────────────────────────────

class ExpenseCreate(BaseModel):
    amount: float = Field(gt=0)
    description: Optional[str] = Field(default=None, max_length=500)
    date: date
    is_shared: bool = False
    category_id: Optional[int] = None
    paid_by_id: Optional[int] = None
    source: Optional[str] = Field(default=None, max_length=50)
    source_id: Optional[int] = None


class ExpenseUpdate(BaseModel):
    amount: Optional[float] = Field(default=None, gt=0)
    description: Optional[str] = Field(default=None, max_length=500)
    date: Optional[date] = None
    is_shared: Optional[bool] = None
    category_id: Optional[int] = None
    paid_by_id: Optional[int] = None


class ExpenseOut(BaseModel):
    id: int
    amount: float
    description: Optional[str] = None
    date: date
    is_shared: bool
    category_id: Optional[int] = None
    paid_by_id: Optional[int] = None
    source: Optional[str] = None
    source_id: Optional[int] = None
    recurring_id: Optional[int] = None
    category: Optional[ExpenseCategoryOut] = None
    paid_by: Optional[MemberOut] = None
    created_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


# ─── Recurring Expenses ─────────────────────────────────────

class RecurringExpenseCreate(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    amount: float = Field(gt=0)
    day_of_month: int = Field(default=1, ge=1, le=31)
    is_shared: bool = False
    category_id: Optional[int] = None
    paid_by_id: Optional[int] = None


class RecurringExpenseUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=1, max_length=255)
    amount: Optional[float] = Field(default=None, gt=0)
    day_of_month: Optional[int] = Field(default=None, ge=1, le=31)
    is_shared: Optional[bool] = None
    category_id: Optional[int] = None
    paid_by_id: Optional[int] = None


class RecurringExpenseOut(BaseModel):
    id: int
    name: str
    amount: float
    day_of_month: int
    is_shared: bool
    category_id: Optional[int] = None
    paid_by_id: Optional[int] = None
    category: Optional[ExpenseCategoryOut] = None
    paid_by: Optional[MemberOut] = None
    created_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


# ─── Generate Recurring ─────────────────────────────────────

class GenerateRecurringRequest(BaseModel):
    year: int
    month: int = Field(ge=1, le=12)


class GenerateRecurringResponse(BaseModel):
    generated: int
    skipped: int
    expenses: list[ExpenseOut]


# ─── Monthly Budget ──────────────────────────────────────────

class BudgetSet(BaseModel):
    amount: float = Field(gt=0, le=10_000_000)


class BudgetOut(BaseModel):
    id: int
    year: int
    month: int
    amount: float
    created_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


# ─── Summary / Stats ────────────────────────────────────────

class CategorySummary(BaseModel):
    category_id: Optional[int] = None
    category_name: str
    category_icon: Optional[str] = None
    category_color: Optional[str] = None
    total: float
    count: int


class MemberSummary(BaseModel):
    member_id: Optional[int] = None
    member_name: str
    total: float
    count: int


class DailySummary(BaseModel):
    date: date
    total: float


class MonthSummary(BaseModel):
    year: int
    month: int
    total: float
    recurring_total: float
    budget: Optional[float] = None
    by_category: list[CategorySummary]
    by_member: list[MemberSummary]
    daily: list[DailySummary]


class MonthComparison(BaseModel):
    current: MonthSummary
    previous: MonthSummary
    diff_total: float
    diff_percent: Optional[float] = None

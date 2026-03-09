from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel, Field


# --- Milestones ---

class MilestoneCreate(BaseModel):
    title: str = Field(min_length=1, max_length=255)
    sort_order: int = 0


class MilestoneUpdate(BaseModel):
    title: Optional[str] = Field(default=None, min_length=1, max_length=255)
    is_completed: Optional[bool] = None
    sort_order: Optional[int] = None


class MilestoneOut(BaseModel):
    id: int
    title: str
    is_completed: bool
    sort_order: int
    goal_id: int
    created_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


# --- Goals ---

class GoalCreate(BaseModel):
    title: str = Field(min_length=1, max_length=255)
    description: Optional[str] = None
    category: Optional[str] = Field(default=None, max_length=50)
    color: Optional[str] = Field(default=None, max_length=30)
    target_value: Optional[float] = None
    current_value: float = 0
    unit: Optional[str] = Field(default=None, max_length=30)
    deadline: Optional[date] = None


class GoalUpdate(BaseModel):
    title: Optional[str] = Field(default=None, min_length=1, max_length=255)
    description: Optional[str] = None
    category: Optional[str] = Field(default=None, max_length=50)
    color: Optional[str] = Field(default=None, max_length=30)
    target_value: Optional[float] = None
    current_value: Optional[float] = None
    unit: Optional[str] = Field(default=None, max_length=30)
    deadline: Optional[date] = None
    is_completed: Optional[bool] = None
    sort_order: Optional[int] = None


class GoalOut(BaseModel):
    id: int
    title: str
    description: Optional[str] = None
    category: Optional[str] = None
    color: Optional[str] = None
    target_value: Optional[float] = None
    current_value: float
    unit: Optional[str] = None
    deadline: Optional[date] = None
    is_completed: bool
    sort_order: int
    milestones: list[MilestoneOut] = []
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


# --- Bucket Items ---

class BucketItemCreate(BaseModel):
    title: str = Field(min_length=1, max_length=255)
    description: Optional[str] = None
    category: Optional[str] = Field(default=None, max_length=50)


class BucketItemUpdate(BaseModel):
    title: Optional[str] = Field(default=None, min_length=1, max_length=255)
    description: Optional[str] = None
    category: Optional[str] = Field(default=None, max_length=50)
    is_completed: Optional[bool] = None
    completed_date: Optional[date] = None
    sort_order: Optional[int] = None


class BucketItemOut(BaseModel):
    id: int
    title: str
    description: Optional[str] = None
    category: Optional[str] = None
    is_completed: bool
    completed_date: Optional[date] = None
    sort_order: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


# --- Summary (integration) ---

class PlansSummaryOut(BaseModel):
    total_goals: int
    completed_goals: int
    active_goals: int
    total_bucket_items: int
    completed_bucket_items: int
    upcoming_deadlines: list[GoalOut] = []

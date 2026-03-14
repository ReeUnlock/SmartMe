from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class UserAdminRow(BaseModel):
    id: int
    username: str
    email: str
    plan: str
    is_email_verified: bool
    created_at: Optional[datetime]
    last_seen_at: Optional[datetime]
    login_count: int
    voice_calls_total: int
    receipt_scans_total: int
    onboarding_completed: bool
    # Counts
    events_count: int
    expenses_count: int
    shopping_lists_count: int
    goals_count: int
    feedback_count: int
    # Rewards
    rewards_level: Optional[int]
    rewards_sparks: Optional[int]
    rewards_streak: Optional[int]
    # Subscription
    subscription_status: Optional[str]
    subscription_end: Optional[datetime]
    # AI cost
    estimated_cost_usd: float

    model_config = {"from_attributes": True}


class UserDetailRow(UserAdminRow):
    recent_expenses: list[dict]
    recent_events: list[dict]
    avatar_key: Optional[str]
    achievements_count: int


class UsersListResponse(BaseModel):
    users: list[UserAdminRow]
    total: int
    page: int
    per_page: int
    pages: int


class GlobalStats(BaseModel):
    # Users
    total_users: int
    verified_users: int
    pro_users: int
    free_users: int
    new_users_last_7d: int
    new_users_last_30d: int
    active_last_7d: int
    active_last_30d: int
    # Activity
    total_events: int
    total_expenses: int
    total_shopping_lists: int
    total_goals: int
    total_voice_calls: int
    total_receipt_scans: int
    total_feedback: int
    # Feedback breakdown
    feedback_by_category: dict[str, int]
    # AI cost
    total_estimated_cost_usd: float
    # Subscriptions
    active_subscriptions: int
    canceled_subscriptions: int


class FeedbackRow(BaseModel):
    id: int
    message: str
    category: str
    email: Optional[str]
    user_agent: Optional[str]
    created_at: Optional[datetime]

    model_config = {"from_attributes": True}


class FeedbackListResponse(BaseModel):
    feedback: list[FeedbackRow]
    total: int
    page: int
    per_page: int
    pages: int


class AdminHealthResponse(BaseModel):
    status: str
    db_users: int
    timestamp: str

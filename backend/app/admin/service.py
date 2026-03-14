import math
from datetime import datetime, timedelta, timezone
from typing import Optional

from sqlalchemy import func, case
from sqlalchemy.orm import Session

from app.auth.models import User
from app.calendar.models import Event
from app.expenses.models import Expense
from app.shopping.models import ShoppingList
from app.plans.models import Goal
from app.feedback.models import Feedback
from app.billing.models import Subscription
from app.rewards.models import UserRewards

# ── OpenAI pricing (hardcoded, March 2026) ────────────────────────────────

OPENAI_PRICING = {
    "whisper": {
        "per_minute_usd": 0.006,
        "avg_call_duration_minutes": 0.5,
    },
    "gpt4o_mini": {
        "input_per_1m_usd": 0.150,
        "output_per_1m_usd": 0.600,
        "avg_input_tokens": 800,
        "avg_output_tokens": 150,
    },
}


def estimate_user_cost(voice_calls: int, receipt_scans: int) -> float:
    """Estimate OpenAI cost in USD for a user. Receipts use local Tesseract ($0)."""
    whisper_cost = (
        voice_calls
        * OPENAI_PRICING["whisper"]["per_minute_usd"]
        * OPENAI_PRICING["whisper"]["avg_call_duration_minutes"]
    )
    pricing = OPENAI_PRICING["gpt4o_mini"]
    gpt_input_cost = (voice_calls * pricing["avg_input_tokens"] / 1_000_000) * pricing["input_per_1m_usd"]
    gpt_output_cost = (voice_calls * pricing["avg_output_tokens"] / 1_000_000) * pricing["output_per_1m_usd"]
    return round(whisper_cost + gpt_input_cost + gpt_output_cost, 6)


# ── Users list ─────────────────────────────────────────────────────────────

def get_users_list(
    db: Session,
    page: int = 1,
    per_page: int = 50,
    search: Optional[str] = None,
    plan: Optional[str] = None,
    sort_by: str = "created_at",
    sort_dir: str = "desc",
) -> dict:
    """Return paginated list of users with counts and rewards."""
    # Subqueries for counts
    events_sq = (
        db.query(Event.user_id, func.count(Event.id).label("cnt"))
        .group_by(Event.user_id)
        .subquery()
    )
    expenses_sq = (
        db.query(Expense.user_id, func.count(Expense.id).label("cnt"))
        .group_by(Expense.user_id)
        .subquery()
    )
    shopping_sq = (
        db.query(ShoppingList.user_id, func.count(ShoppingList.id).label("cnt"))
        .group_by(ShoppingList.user_id)
        .subquery()
    )
    goals_sq = (
        db.query(Goal.user_id, func.count(Goal.id).label("cnt"))
        .group_by(Goal.user_id)
        .subquery()
    )
    feedback_sq = (
        db.query(Feedback.user_id, func.count(Feedback.id).label("cnt"))
        .group_by(Feedback.user_id)
        .subquery()
    )

    query = (
        db.query(
            User,
            func.coalesce(events_sq.c.cnt, 0).label("events_count"),
            func.coalesce(expenses_sq.c.cnt, 0).label("expenses_count"),
            func.coalesce(shopping_sq.c.cnt, 0).label("shopping_lists_count"),
            func.coalesce(goals_sq.c.cnt, 0).label("goals_count"),
            func.coalesce(feedback_sq.c.cnt, 0).label("feedback_count"),
            UserRewards.level.label("rewards_level"),
            UserRewards.sparks.label("rewards_sparks"),
            UserRewards.streak.label("rewards_streak"),
            Subscription.status.label("subscription_status"),
            Subscription.current_period_end.label("subscription_end"),
        )
        .outerjoin(events_sq, User.id == events_sq.c.user_id)
        .outerjoin(expenses_sq, User.id == expenses_sq.c.user_id)
        .outerjoin(shopping_sq, User.id == shopping_sq.c.user_id)
        .outerjoin(goals_sq, User.id == goals_sq.c.user_id)
        .outerjoin(feedback_sq, User.id == feedback_sq.c.user_id)
        .outerjoin(UserRewards, User.id == UserRewards.user_id)
        .outerjoin(Subscription, User.id == Subscription.user_id)
    )

    # Filters
    if search:
        like = f"%{search}%"
        query = query.filter((User.email.ilike(like)) | (User.username.ilike(like)))
    if plan:
        query = query.filter(User.plan == plan)

    # Total count
    total = query.count()

    # Sorting
    sort_column_map = {
        "created_at": User.created_at,
        "last_seen_at": User.last_seen_at,
        "email": User.email,
    }
    sort_col = sort_column_map.get(sort_by, User.created_at)
    if sort_dir == "asc":
        query = query.order_by(sort_col.asc())
    else:
        query = query.order_by(sort_col.desc())

    # Pagination
    pages = max(1, math.ceil(total / per_page))
    offset = (page - 1) * per_page
    rows = query.offset(offset).limit(per_page).all()

    users = []
    for row in rows:
        user = row[0]
        users.append({
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "plan": user.plan,
            "is_email_verified": user.is_email_verified,
            "created_at": user.created_at,
            "last_seen_at": user.last_seen_at,
            "login_count": user.login_count,
            "voice_calls_total": user.voice_calls_total,
            "receipt_scans_total": user.receipt_scans_total,
            "onboarding_completed": user.onboarding_completed,
            "events_count": row[1],
            "expenses_count": row[2],
            "shopping_lists_count": row[3],
            "goals_count": row[4],
            "feedback_count": row[5],
            "rewards_level": row[6],
            "rewards_sparks": row[7],
            "rewards_streak": row[8],
            "subscription_status": row[9],
            "subscription_end": row[10],
            "estimated_cost_usd": estimate_user_cost(user.voice_calls_total, user.receipt_scans_total),
        })

    return {
        "users": users,
        "total": total,
        "page": page,
        "per_page": per_page,
        "pages": pages,
    }


# ── User detail ────────────────────────────────────────────────────────────

def get_user_detail(db: Session, user_id: int) -> Optional[dict]:
    """Return detailed info for a single user."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        return None

    events_count = db.query(func.count(Event.id)).filter(Event.user_id == user_id).scalar() or 0
    expenses_count = db.query(func.count(Expense.id)).filter(Expense.user_id == user_id).scalar() or 0
    shopping_count = db.query(func.count(ShoppingList.id)).filter(ShoppingList.user_id == user_id).scalar() or 0
    goals_count = db.query(func.count(Goal.id)).filter(Goal.user_id == user_id).scalar() or 0
    feedback_count = db.query(func.count(Feedback.id)).filter(Feedback.user_id == user_id).scalar() or 0

    rewards = db.query(UserRewards).filter(UserRewards.user_id == user_id).first()
    subscription = db.query(Subscription).filter(Subscription.user_id == user_id).first()

    # Recent expenses
    recent_expenses_rows = (
        db.query(Expense)
        .filter(Expense.user_id == user_id)
        .order_by(Expense.date.desc())
        .limit(10)
        .all()
    )
    recent_expenses = [
        {"date": str(e.date), "amount": float(e.amount), "description": e.description, "category": None}
        for e in recent_expenses_rows
    ]

    # Recent events
    recent_events_rows = (
        db.query(Event)
        .filter(Event.user_id == user_id)
        .order_by(Event.start_at.desc())
        .limit(10)
        .all()
    )
    recent_events = [
        {"title": e.title, "start_at": str(e.start_at)}
        for e in recent_events_rows
    ]

    # Achievements count from JSONB
    achievements_count = 0
    avatar_key = None
    if rewards:
        achievements = rewards.achievements or []
        achievements_count = len(achievements)
        avatar_key = rewards.avatar_key

    return {
        "id": user.id,
        "username": user.username,
        "email": user.email,
        "plan": user.plan,
        "is_email_verified": user.is_email_verified,
        "created_at": user.created_at,
        "last_seen_at": user.last_seen_at,
        "login_count": user.login_count,
        "voice_calls_total": user.voice_calls_total,
        "receipt_scans_total": user.receipt_scans_total,
        "onboarding_completed": user.onboarding_completed,
        "events_count": events_count,
        "expenses_count": expenses_count,
        "shopping_lists_count": shopping_count,
        "goals_count": goals_count,
        "feedback_count": feedback_count,
        "rewards_level": rewards.level if rewards else None,
        "rewards_sparks": rewards.sparks if rewards else None,
        "rewards_streak": rewards.streak if rewards else None,
        "subscription_status": subscription.status if subscription else None,
        "subscription_end": subscription.current_period_end if subscription else None,
        "estimated_cost_usd": estimate_user_cost(user.voice_calls_total, user.receipt_scans_total),
        "recent_expenses": recent_expenses,
        "recent_events": recent_events,
        "avatar_key": avatar_key,
        "achievements_count": achievements_count,
    }


# ── Global stats ───────────────────────────────────────────────────────────

def get_global_stats(db: Session) -> dict:
    """Return global application statistics."""
    now = datetime.now(timezone.utc)
    seven_days_ago = now - timedelta(days=7)
    thirty_days_ago = now - timedelta(days=30)

    total_users = db.query(func.count(User.id)).scalar() or 0
    verified_users = db.query(func.count(User.id)).filter(User.is_email_verified == True).scalar() or 0
    pro_users = db.query(func.count(User.id)).filter(User.plan == "pro").scalar() or 0
    free_users = total_users - pro_users

    new_7d = db.query(func.count(User.id)).filter(User.created_at >= seven_days_ago).scalar() or 0
    new_30d = db.query(func.count(User.id)).filter(User.created_at >= thirty_days_ago).scalar() or 0
    active_7d = db.query(func.count(User.id)).filter(User.last_seen_at >= seven_days_ago).scalar() or 0
    active_30d = db.query(func.count(User.id)).filter(User.last_seen_at >= thirty_days_ago).scalar() or 0

    total_events = db.query(func.count(Event.id)).scalar() or 0
    total_expenses = db.query(func.count(Expense.id)).scalar() or 0
    total_shopping = db.query(func.count(ShoppingList.id)).scalar() or 0
    total_goals = db.query(func.count(Goal.id)).scalar() or 0

    # Voice and receipt totals from users
    total_voice = db.query(func.coalesce(func.sum(User.voice_calls_total), 0)).scalar()
    total_receipts = db.query(func.coalesce(func.sum(User.receipt_scans_total), 0)).scalar()

    total_feedback = db.query(func.count(Feedback.id)).scalar() or 0

    # Feedback by category
    fb_rows = (
        db.query(Feedback.category, func.count(Feedback.id))
        .group_by(Feedback.category)
        .all()
    )
    feedback_by_category = {cat: cnt for cat, cnt in fb_rows}

    # AI cost
    total_cost = estimate_user_cost(total_voice, total_receipts)

    # Subscriptions
    active_subs = db.query(func.count(Subscription.id)).filter(Subscription.status == "active").scalar() or 0
    canceled_subs = db.query(func.count(Subscription.id)).filter(Subscription.status == "canceled").scalar() or 0

    return {
        "total_users": total_users,
        "verified_users": verified_users,
        "pro_users": pro_users,
        "free_users": free_users,
        "new_users_last_7d": new_7d,
        "new_users_last_30d": new_30d,
        "active_last_7d": active_7d,
        "active_last_30d": active_30d,
        "total_events": total_events,
        "total_expenses": total_expenses,
        "total_shopping_lists": total_shopping,
        "total_goals": total_goals,
        "total_voice_calls": total_voice,
        "total_receipt_scans": total_receipts,
        "total_feedback": total_feedback,
        "feedback_by_category": feedback_by_category,
        "total_estimated_cost_usd": total_cost,
        "active_subscriptions": active_subs,
        "canceled_subscriptions": canceled_subs,
    }


# ── Feedback list ──────────────────────────────────────────────────────────

def get_feedback_list(
    db: Session,
    page: int = 1,
    per_page: int = 50,
    category: Optional[str] = None,
) -> dict:
    """Return paginated feedback list."""
    query = db.query(Feedback)
    if category:
        query = query.filter(Feedback.category == category)

    total = query.count()
    pages = max(1, math.ceil(total / per_page))
    offset = (page - 1) * per_page

    rows = query.order_by(Feedback.created_at.desc()).offset(offset).limit(per_page).all()

    feedback = [
        {
            "id": f.id,
            "message": f.message,
            "category": f.category,
            "email": f.email,
            "user_agent": f.user_agent,
            "created_at": f.created_at,
        }
        for f in rows
    ]

    return {
        "feedback": feedback,
        "total": total,
        "page": page,
        "per_page": per_page,
        "pages": pages,
    }

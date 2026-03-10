from datetime import date, timedelta
from calendar import monthrange

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, extract
from sqlalchemy.orm import Session

from app.database import get_db
from app.auth.models import User
from app.auth.dependencies import get_current_user
from app.plans.models import Goal, Milestone, BucketItem
from app.plans.schemas import (
    GoalCreate, GoalUpdate, GoalOut,
    MilestoneCreate, MilestoneUpdate, MilestoneOut,
    BucketItemCreate, BucketItemUpdate, BucketItemOut,
    PlansSummaryOut,
)
from app.expenses.models import Expense, ExpenseCategory

router = APIRouter(prefix="/api/plans", tags=["plans"])


def _enrich_goals_with_expenses(db: Session, user_id: int, goals: list[Goal]) -> list[dict]:
    """For spending_limit goals, compute current month expense totals and attach to output."""
    spending_goals = [g for g in goals if g.goal_type == "spending_limit" and g.linked_category_id]

    # Batch-load expense totals for all spending_limit categories in one query
    expense_totals: dict[int, float] = {}
    category_names: dict[int, str] = {}

    if spending_goals:
        today = date.today()
        month_start = date(today.year, today.month, 1)
        month_end = date(today.year, today.month, monthrange(today.year, today.month)[1])

        cat_ids = list({g.linked_category_id for g in spending_goals})

        # Sum expenses per category for current month
        rows = (
            db.query(Expense.category_id, func.coalesce(func.sum(Expense.amount), 0.0))
            .filter(
                Expense.user_id == user_id,
                Expense.category_id.in_(cat_ids),
                Expense.date >= month_start,
                Expense.date <= month_end,
            )
            .group_by(Expense.category_id)
            .all()
        )
        expense_totals = {cat_id: round(total, 2) for cat_id, total in rows}

        # Load category names
        cats = (
            db.query(ExpenseCategory.id, ExpenseCategory.name)
            .filter(ExpenseCategory.id.in_(cat_ids))
            .all()
        )
        category_names = {cat_id: name for cat_id, name in cats}

    results = []
    for goal in goals:
        data = GoalOut.model_validate(goal).model_dump()
        if goal.goal_type == "spending_limit" and goal.linked_category_id:
            data["computed_expense_total"] = expense_totals.get(goal.linked_category_id, 0.0)
            data["linked_category_name"] = category_names.get(goal.linked_category_id)
        elif goal.linked_category_id:
            data["linked_category_name"] = category_names.get(goal.linked_category_id)
        results.append(data)
    return results


# ─── Summary / Integration ───────────────────────────────────────

@router.get("/summary", response_model=PlansSummaryOut)
def get_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    goals = db.query(Goal).filter(Goal.user_id == current_user.id).all()
    bucket_items = db.query(BucketItem).filter(BucketItem.user_id == current_user.id).all()

    completed_goals = [g for g in goals if g.is_completed]
    active_goals = [g for g in goals if not g.is_completed]

    # Goals with deadlines in the next 30 days
    today = date.today()
    upcoming = [
        g for g in active_goals
        if g.deadline and today <= g.deadline <= today + timedelta(days=30)
    ]
    upcoming.sort(key=lambda g: g.deadline)

    return PlansSummaryOut(
        total_goals=len(goals),
        completed_goals=len(completed_goals),
        active_goals=len(active_goals),
        total_bucket_items=len(bucket_items),
        completed_bucket_items=len([b for b in bucket_items if b.is_completed]),
        upcoming_deadlines=upcoming,
    )


# ─── Goals ────────────────────────────────────────────────────────

@router.get("/goals", response_model=list[GoalOut])
def list_goals(
    skip: int = Query(0, ge=0),
    limit: int = Query(200, ge=1, le=500),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    goals = (
        db.query(Goal)
        .filter(Goal.user_id == current_user.id)
        .order_by(Goal.is_completed, Goal.sort_order, Goal.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )
    return _enrich_goals_with_expenses(db, current_user.id, goals)


@router.post("/goals", response_model=GoalOut, status_code=status.HTTP_201_CREATED)
def create_goal(
    data: GoalCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    goal = Goal(**data.model_dump(), user_id=current_user.id)
    db.add(goal)
    db.commit()
    db.refresh(goal)
    return _enrich_goals_with_expenses(db, current_user.id, [goal])[0]


@router.get("/goals/{goal_id}", response_model=GoalOut)
def get_goal(
    goal_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    goal = (
        db.query(Goal)
        .filter(Goal.id == goal_id, Goal.user_id == current_user.id)
        .first()
    )
    if not goal:
        raise HTTPException(status_code=404, detail="Cel nie został znaleziony.")
    return _enrich_goals_with_expenses(db, current_user.id, [goal])[0]


@router.put("/goals/{goal_id}", response_model=GoalOut)
def update_goal(
    goal_id: int,
    data: GoalUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    goal = (
        db.query(Goal)
        .filter(Goal.id == goal_id, Goal.user_id == current_user.id)
        .first()
    )
    if not goal:
        raise HTTPException(status_code=404, detail="Cel nie został znaleziony.")
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(goal, field, value)
    db.commit()
    db.refresh(goal)
    return _enrich_goals_with_expenses(db, current_user.id, [goal])[0]


@router.delete("/goals/{goal_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_goal(
    goal_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    goal = (
        db.query(Goal)
        .filter(Goal.id == goal_id, Goal.user_id == current_user.id)
        .first()
    )
    if not goal:
        raise HTTPException(status_code=404, detail="Cel nie został znaleziony.")
    db.delete(goal)
    db.commit()


# ─── Milestones ───────────────────────────────────────────────────

@router.post("/goals/{goal_id}/milestones", response_model=MilestoneOut, status_code=status.HTTP_201_CREATED)
def add_milestone(
    goal_id: int,
    data: MilestoneCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    goal = (
        db.query(Goal)
        .filter(Goal.id == goal_id, Goal.user_id == current_user.id)
        .first()
    )
    if not goal:
        raise HTTPException(status_code=404, detail="Cel nie został znaleziony.")
    milestone = Milestone(**data.model_dump(), goal_id=goal_id, user_id=current_user.id)
    db.add(milestone)
    db.commit()
    db.refresh(milestone)
    return milestone


@router.put("/milestones/{milestone_id}", response_model=MilestoneOut)
def update_milestone(
    milestone_id: int,
    data: MilestoneUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    ms = (
        db.query(Milestone)
        .filter(Milestone.id == milestone_id, Milestone.user_id == current_user.id)
        .first()
    )
    if not ms:
        raise HTTPException(status_code=404, detail="Kamień milowy nie został znaleziony.")
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(ms, field, value)
    db.commit()
    db.refresh(ms)
    return ms


@router.delete("/milestones/{milestone_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_milestone(
    milestone_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    ms = (
        db.query(Milestone)
        .filter(Milestone.id == milestone_id, Milestone.user_id == current_user.id)
        .first()
    )
    if not ms:
        raise HTTPException(status_code=404, detail="Kamień milowy nie został znaleziony.")
    db.delete(ms)
    db.commit()


@router.patch("/milestones/{milestone_id}/toggle", response_model=MilestoneOut)
def toggle_milestone(
    milestone_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    ms = (
        db.query(Milestone)
        .filter(Milestone.id == milestone_id, Milestone.user_id == current_user.id)
        .first()
    )
    if not ms:
        raise HTTPException(status_code=404, detail="Kamień milowy nie został znaleziony.")
    ms.is_completed = not ms.is_completed
    db.commit()
    db.refresh(ms)
    return ms


# ─── Bucket List ──────────────────────────────────────────────────

@router.get("/bucket", response_model=list[BucketItemOut])
def list_bucket_items(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return (
        db.query(BucketItem)
        .filter(BucketItem.user_id == current_user.id)
        .order_by(BucketItem.is_completed, BucketItem.sort_order, BucketItem.created_at.desc())
        .all()
    )


@router.post("/bucket", response_model=BucketItemOut, status_code=status.HTTP_201_CREATED)
def create_bucket_item(
    data: BucketItemCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    item = BucketItem(**data.model_dump(), user_id=current_user.id)
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


@router.put("/bucket/{item_id}", response_model=BucketItemOut)
def update_bucket_item(
    item_id: int,
    data: BucketItemUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    item = (
        db.query(BucketItem)
        .filter(BucketItem.id == item_id, BucketItem.user_id == current_user.id)
        .first()
    )
    if not item:
        raise HTTPException(status_code=404, detail="Element nie został znaleziony.")
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(item, field, value)
    db.commit()
    db.refresh(item)
    return item


@router.delete("/bucket/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_bucket_item(
    item_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    item = (
        db.query(BucketItem)
        .filter(BucketItem.id == item_id, BucketItem.user_id == current_user.id)
        .first()
    )
    if not item:
        raise HTTPException(status_code=404, detail="Element nie został znaleziony.")
    db.delete(item)
    db.commit()


@router.patch("/bucket/{item_id}/toggle", response_model=BucketItemOut)
def toggle_bucket_item(
    item_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    item = (
        db.query(BucketItem)
        .filter(BucketItem.id == item_id, BucketItem.user_id == current_user.id)
        .first()
    )
    if not item:
        raise HTTPException(status_code=404, detail="Element nie został znaleziony.")
    item.is_completed = not item.is_completed
    if item.is_completed:
        item.completed_date = date.today()
    else:
        item.completed_date = None
    db.commit()
    db.refresh(item)
    return item

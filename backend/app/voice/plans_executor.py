import logging
from datetime import date

from sqlalchemy.orm import Session

from app.auth.models import User
from app.plans.models import Goal, Milestone, BucketItem
from app.voice.schemas import VoiceConfirmAction

logger = logging.getLogger(__name__)


def _goal_to_dict(goal: Goal) -> dict:
    return {
        "id": goal.id,
        "title": goal.title,
        "description": goal.description,
        "category": goal.category,
        "color": goal.color,
        "target_value": goal.target_value,
        "current_value": goal.current_value,
        "unit": goal.unit,
        "deadline": str(goal.deadline) if goal.deadline else None,
        "is_completed": goal.is_completed,
    }


def _bucket_to_dict(item: BucketItem) -> dict:
    return {
        "id": item.id,
        "title": item.title,
        "description": item.description,
        "category": item.category,
        "is_completed": item.is_completed,
    }


def _find_goal_by_id_or_title(
    db: Session, user: User, action: VoiceConfirmAction
) -> Goal | None:
    if action.goal_id:
        return (
            db.query(Goal)
            .filter(Goal.id == action.goal_id, Goal.user_id == user.id)
            .first()
        )
    if action.goal_title:
        return (
            db.query(Goal)
            .filter(
                Goal.user_id == user.id,
                Goal.title.ilike(f"%{action.goal_title}%"),
            )
            .order_by(Goal.created_at.desc())
            .first()
        )
    return None


def _find_bucket_by_id_or_title(
    db: Session, user: User, action: VoiceConfirmAction
) -> BucketItem | None:
    if action.bucket_id:
        return (
            db.query(BucketItem)
            .filter(BucketItem.id == action.bucket_id, BucketItem.user_id == user.id)
            .first()
        )
    if action.bucket_title:
        return (
            db.query(BucketItem)
            .filter(
                BucketItem.user_id == user.id,
                BucketItem.title.ilike(f"%{action.bucket_title}%"),
            )
            .order_by(BucketItem.created_at.desc())
            .first()
        )
    return None


def execute_add_goal(db: Session, user: User, action: VoiceConfirmAction) -> dict:
    if not action.goal_title:
        raise ValueError("Brak tytułu celu.")

    deadline = None
    if action.goal_deadline:
        try:
            deadline = date.fromisoformat(action.goal_deadline)
        except ValueError:
            pass

    goal = Goal(
        title=action.goal_title,
        description=action.goal_description,
        category=action.goal_category,
        color=action.goal_color,
        target_value=action.goal_target_value,
        current_value=action.goal_current_value or 0,
        unit=action.goal_unit,
        deadline=deadline,
        user_id=user.id,
    )
    db.add(goal)
    db.commit()
    db.refresh(goal)

    logger.info(f"Voice: created goal '{goal.title}' (id={goal.id})")
    return _goal_to_dict(goal)


def execute_update_goal(db: Session, user: User, action: VoiceConfirmAction) -> dict:
    goal = _find_goal_by_id_or_title(db, user, action)
    if not goal:
        raise ValueError("Nie znaleziono celu do zaktualizowania.")

    if action.goal_title and action.goal_id:
        goal.title = action.goal_title
    if action.goal_description is not None:
        goal.description = action.goal_description
    if action.goal_category is not None:
        goal.category = action.goal_category
    if action.goal_color is not None:
        goal.color = action.goal_color
    if action.goal_target_value is not None:
        goal.target_value = action.goal_target_value
    if action.goal_current_value is not None:
        goal.current_value = action.goal_current_value
    if action.goal_unit is not None:
        goal.unit = action.goal_unit
    if action.goal_deadline is not None:
        try:
            goal.deadline = date.fromisoformat(action.goal_deadline)
        except ValueError:
            pass

    db.commit()
    db.refresh(goal)

    logger.info(f"Voice: updated goal '{goal.title}' (id={goal.id})")
    return _goal_to_dict(goal)


def execute_delete_goal(db: Session, user: User, action: VoiceConfirmAction) -> dict:
    goal = _find_goal_by_id_or_title(db, user, action)
    if not goal:
        raise ValueError("Nie znaleziono celu do usunięcia.")

    result = _goal_to_dict(goal)
    db.delete(goal)
    db.commit()

    logger.info(f"Voice: deleted goal '{result['title']}' (id={result['id']})")
    return result


def execute_toggle_goal(db: Session, user: User, action: VoiceConfirmAction) -> dict:
    goal = _find_goal_by_id_or_title(db, user, action)
    if not goal:
        raise ValueError("Nie znaleziono celu.")

    goal.is_completed = not goal.is_completed
    db.commit()
    db.refresh(goal)

    status = "ukończony" if goal.is_completed else "aktywny"
    logger.info(f"Voice: toggled goal '{goal.title}' → {status} (id={goal.id})")
    return _goal_to_dict(goal)


def execute_add_bucket_item(db: Session, user: User, action: VoiceConfirmAction) -> dict:
    if not action.bucket_title:
        raise ValueError("Brak tytułu pozycji bucket listy.")

    item = BucketItem(
        title=action.bucket_title,
        description=action.bucket_description,
        category=action.bucket_category,
        user_id=user.id,
    )
    db.add(item)
    db.commit()
    db.refresh(item)

    logger.info(f"Voice: created bucket item '{item.title}' (id={item.id})")
    return _bucket_to_dict(item)


def execute_delete_bucket_item(db: Session, user: User, action: VoiceConfirmAction) -> dict:
    item = _find_bucket_by_id_or_title(db, user, action)
    if not item:
        raise ValueError("Nie znaleziono pozycji na liście marzeń.")

    result = _bucket_to_dict(item)
    db.delete(item)
    db.commit()

    logger.info(f"Voice: deleted bucket item '{result['title']}' (id={result['id']})")
    return result


def execute_toggle_bucket_item(db: Session, user: User, action: VoiceConfirmAction) -> dict:
    item = _find_bucket_by_id_or_title(db, user, action)
    if not item:
        raise ValueError("Nie znaleziono pozycji na liście marzeń.")

    item.is_completed = not item.is_completed
    item.completed_date = date.today() if item.is_completed else None
    db.commit()
    db.refresh(item)

    status = "zrealizowane" if item.is_completed else "niezrealizowane"
    logger.info(f"Voice: toggled bucket item '{item.title}' → {status} (id={item.id})")
    return _bucket_to_dict(item)


def execute_list_goals(db: Session, user: User, action: VoiceConfirmAction) -> dict:
    goals = (
        db.query(Goal)
        .filter(Goal.user_id == user.id)
        .order_by(Goal.is_completed.asc(), Goal.created_at.desc())
        .limit(20)
        .all()
    )

    bucket_items = (
        db.query(BucketItem)
        .filter(BucketItem.user_id == user.id)
        .order_by(BucketItem.is_completed.asc(), BucketItem.created_at.desc())
        .limit(20)
        .all()
    )

    return {
        "goals_count": len(goals),
        "bucket_count": len(bucket_items),
        "goals": [_goal_to_dict(g) for g in goals],
        "bucket_items": [_bucket_to_dict(b) for b in bucket_items],
    }

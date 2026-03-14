from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.auth.dependencies import get_current_user
from app.auth.models import User
from app.rewards.models import UserRewards
from app.rewards.schemas import RewardsOut, RewardsUpdate

router = APIRouter(prefix="/api/rewards", tags=["rewards"])


def get_or_create_rewards(db: Session, user_id: int) -> UserRewards:
    row = db.query(UserRewards).filter(UserRewards.user_id == user_id).first()
    if not row:
        row = UserRewards(user_id=user_id)
        db.add(row)
        db.commit()
        db.refresh(row)
    return row


@router.get("", response_model=RewardsOut)
def get_rewards(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    row = get_or_create_rewards(db, current_user.id)
    return row


@router.patch("", response_model=RewardsOut)
def patch_rewards(
    data: RewardsUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    row = get_or_create_rewards(db, current_user.id)

    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(row, field, value)

    db.commit()
    db.refresh(row)
    return row

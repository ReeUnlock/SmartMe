from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.auth.models import User
from app.config import settings
from app.auth.schemas import (
    SetupRequest, LoginRequest, ResetRequest, PasswordChangeRequest,
    TokenResponse, UserOut,
)
from app.auth.security import hash_password, verify_password, create_access_token
from app.auth.dependencies import get_current_user
from app.auth.rate_limit import login_limiter, setup_limiter, password_change_limiter

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/setup", response_model=TokenResponse)
def setup(data: SetupRequest, request: Request, db: Session = Depends(get_db)):
    setup_limiter.check(request)
    if db.query(User).first():
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Konto już istnieje. Użyj logowania.",
        )
    user = User(
        username=data.username,
        email=data.email,
        hashed_password=hash_password(data.password),
        onboarding_completed=False,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return TokenResponse(access_token=create_access_token(user.id))


@router.post("/login", response_model=TokenResponse)
def login(data: LoginRequest, request: Request, db: Session = Depends(get_db)):
    login_limiter.check(request)
    user = db.query(User).filter(
        (User.username == data.username) | (User.email == data.username)
    ).first()
    if not user or not verify_password(data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Nieprawidłowa nazwa użytkownika lub hasło",
        )
    return TokenResponse(access_token=create_access_token(user.id))


@router.get("/me", response_model=UserOut)
def me(current_user: User = Depends(get_current_user)):
    return current_user


@router.post("/change-password")
def change_password(
    data: PasswordChangeRequest,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    password_change_limiter.check(request)
    if not verify_password(data.current_password, current_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Obecne hasło jest nieprawidłowe.",
        )
    if data.current_password == data.new_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Nowe hasło musi się różnić od obecnego.",
        )
    current_user.hashed_password = hash_password(data.new_password)
    db.commit()
    return {"message": "Hasło zostało zmienione."}


@router.post("/complete-onboarding", response_model=UserOut)
def complete_onboarding(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    current_user.onboarding_completed = True
    db.commit()
    db.refresh(current_user)
    return current_user


@router.post("/reset")
def reset_account(
    data: ResetRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Delete account and all related data. Requires auth + password confirmation."""

    if not verify_password(data.password, current_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Nieprawidłowe hasło. Reset anulowany.",
        )

    from app.shopping.models import ShoppingItem, ShoppingList, ShoppingCategory
    from app.calendar.models import Event
    from app.expenses.models import (
        Expense, RecurringExpense, MonthlyBudget, ExpenseCategory, HouseholdMember,
    )
    from app.plans.models import Milestone, Goal, BucketItem

    uid = current_user.id
    db.query(Milestone).filter(Milestone.user_id == uid).delete()
    db.query(Goal).filter(Goal.user_id == uid).delete()
    db.query(BucketItem).filter(BucketItem.user_id == uid).delete()
    db.query(Expense).filter(Expense.user_id == uid).delete()
    db.query(RecurringExpense).filter(RecurringExpense.user_id == uid).delete()
    db.query(MonthlyBudget).filter(MonthlyBudget.user_id == uid).delete()
    db.query(ExpenseCategory).filter(ExpenseCategory.user_id == uid).delete()
    db.query(HouseholdMember).filter(HouseholdMember.user_id == uid).delete()
    db.query(ShoppingItem).filter(ShoppingItem.user_id == uid).delete()
    db.query(ShoppingList).filter(ShoppingList.user_id == uid).delete()
    db.query(ShoppingCategory).filter(ShoppingCategory.user_id == uid).delete()
    db.query(Event).filter(Event.user_id == uid).delete()
    from app.feedback.models import Feedback
    db.query(Feedback).delete()  # feedback has no user_id, clear all
    db.query(User).filter(User.id == uid).delete()
    db.commit()
    return {"message": "Konto usunięte. Możesz utworzyć nowe."}


@router.get("/status")
def auth_status(db: Session = Depends(get_db)):
    """Check if setup has been completed (any user exists)."""
    has_user = db.query(User).first() is not None
    return {"setup_completed": has_user}

from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.auth.models import User
from app.auth.schemas import (
    RegisterRequest, SetupRequest, LoginRequest, ResetRequest,
    PasswordChangeRequest, ForgotPasswordRequest, VerifyEmailRequest,
    ResendVerificationRequest, ResetPasswordRequest,
    TokenResponse, UserOut, AuthStatusResponse,
)
from app.auth.security import hash_password, verify_password, create_access_token
from app.auth.dependencies import get_current_user
from app.auth.tokens import create_auth_token, verify_auth_token, consume_auth_token
from app.auth.rate_limit import (
    login_limiter, setup_limiter, register_limiter, password_change_limiter,
    forgot_password_limiter, resend_verification_limiter, verify_email_limiter,
    reset_password_limiter,
)

router = APIRouter(prefix="/api/auth", tags=["auth"])


# ── Registration (replaces /setup) ──────────────────────────────────────────

@router.post("/register", status_code=status.HTTP_201_CREATED)
def register(data: RegisterRequest, request: Request, db: Session = Depends(get_db)):
    register_limiter.check(request)

    if db.query(User).filter(User.email == data.email).first():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email już zajęty",
        )
    if db.query(User).filter(User.username == data.username).first():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Nazwa użytkownika już zajęta",
        )

    user = User(
        username=data.username,
        email=data.email,
        hashed_password=hash_password(data.password),
        onboarding_completed=False,
        is_email_verified=False,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_auth_token(db, user.id, "email_verification")
    from app.common.email import send_verification_email
    send_verification_email(user.email, user.username, token)

    return {"message": "Konto utworzone. Sprawdź email aby aktywować konto."}


@router.post("/setup", status_code=status.HTTP_201_CREATED, deprecated=True)
def setup(data: SetupRequest, request: Request, db: Session = Depends(get_db)):
    """Deprecated — kept as alias for backward compatibility. Use /register instead."""
    setup_limiter.check(request)

    if db.query(User).filter(User.email == data.email).first():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email już zajęty",
        )
    if db.query(User).filter(User.username == data.username).first():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Nazwa użytkownika już zajęta",
        )

    user = User(
        username=data.username,
        email=data.email,
        hashed_password=hash_password(data.password),
        onboarding_completed=False,
        is_email_verified=False,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_auth_token(db, user.id, "email_verification")
    from app.common.email import send_verification_email
    send_verification_email(user.email, user.username, token)

    return {"message": "Konto utworzone. Sprawdź email aby aktywować konto.", "deprecated": True}


# ── Email verification ──────────────────────────────────────────────────────

@router.post("/verify-email")
def verify_email(data: VerifyEmailRequest, request: Request, db: Session = Depends(get_db)):
    verify_email_limiter.check(request)
    auth_token = verify_auth_token(db, data.token, "email_verification")
    if not auth_token:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Token nieważny lub wygasł",
        )
    user = db.query(User).filter(User.id == auth_token.user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Token nieważny lub wygasł")

    user.is_email_verified = True
    user.email_verified_at = datetime.now(timezone.utc)
    consume_auth_token(db, auth_token)

    from app.common.email import send_welcome
    send_welcome(user.email, user.username)

    return {"message": "Email zweryfikowany. Możesz się zalogować."}


@router.post("/resend-verification")
def resend_verification(data: ResendVerificationRequest, request: Request, db: Session = Depends(get_db)):
    resend_verification_limiter.check(request)
    user = db.query(User).filter(User.email == data.email).first()
    if user and not user.is_email_verified:
        token = create_auth_token(db, user.id, "email_verification")
        from app.common.email import send_verification_email
        send_verification_email(user.email, user.username, token)

    # Always return 200 — don't reveal if email exists
    return {"message": "Jeśli email istnieje w systemie, wysłaliśmy link weryfikacyjny."}


# ── Login ────────────────────────────────────────────────────────────────────

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
    if not user.is_email_verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Potwierdź adres email przed zalogowaniem. Sprawdź skrzynkę pocztową.",
        )
    user.login_count = (user.login_count or 0) + 1
    db.commit()
    return TokenResponse(access_token=create_access_token(user.id))


# ── Password reset (token-based) ────────────────────────────────────────────

@router.post("/forgot-password")
def forgot_password(data: ForgotPasswordRequest, request: Request, db: Session = Depends(get_db)):
    """Send password reset email. Always returns 200."""
    forgot_password_limiter.check(request)
    user = db.query(User).filter(User.email == data.email).first()
    if user and user.is_email_verified:
        token = create_auth_token(db, user.id, "password_reset")
        from app.common.email import send_password_reset_email
        send_password_reset_email(user.email, user.username, token)

    return {"message": "Jeśli email istnieje w systemie, wysłaliśmy link do resetu hasła."}


@router.post("/reset-password")
def reset_password(data: ResetPasswordRequest, request: Request, db: Session = Depends(get_db)):
    """Reset password using token from email."""
    reset_password_limiter.check(request)
    auth_token = verify_auth_token(db, data.token, "password_reset")
    if not auth_token:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Token nieważny lub wygasł",
        )
    user = db.query(User).filter(User.id == auth_token.user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Token nieważny lub wygasł")

    user.hashed_password = hash_password(data.new_password)
    consume_auth_token(db, auth_token)
    return {"message": "Hasło zostało zmienione. Możesz się zalogować."}


# ── User info ────────────────────────────────────────────────────────────────

@router.get("/me", response_model=UserOut)
def me(current_user: User = Depends(get_current_user)):
    return current_user


@router.get("/status")
def auth_status(current_user: User = Depends(get_current_user)):
    """Return authenticated user's status."""
    return AuthStatusResponse(
        is_authenticated=True,
        is_email_verified=current_user.is_email_verified,
        username=current_user.username,
        plan=current_user.plan,
    )


# ── Password & account management ───────────────────────────────────────────

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
    from app.auth.models import AuthToken

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
    from app.billing.models import Subscription
    db.query(Subscription).filter(Subscription.user_id == uid).delete()
    from app.feedback.models import Feedback
    db.query(Feedback).filter(Feedback.user_id == uid).delete()
    db.query(AuthToken).filter(AuthToken.user_id == uid).delete()
    db.query(User).filter(User.id == uid).delete()
    db.commit()
    return {"message": "Konto usunięte. Możesz utworzyć nowe."}


# ── Dev/test-only: auto-verify email (never available in production) ─────────

@router.post("/test-verify-email")
def test_verify_email(data: dict, db: Session = Depends(get_db)):
    """Auto-verify a user's email. Only available in non-production environments.
    Used by E2E tests that cannot receive real emails."""
    from app.config import settings
    if settings.ENV == "production":
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND)

    email = data.get("email")
    if not email:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email required")

    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    user.is_email_verified = True
    user.email_verified_at = datetime.now(timezone.utc)
    db.commit()
    return {"message": "Email verified (test-only)"}


@router.post("/test-reset-rate-limits")
def test_reset_rate_limits():
    """Reset all rate limiters. Only available in non-production environments.
    Used by E2E tests that share the same backend instance."""
    from app.config import settings
    if settings.ENV == "production":
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND)

    login_limiter._attempts.clear()
    setup_limiter._attempts.clear()
    register_limiter._attempts.clear()
    password_change_limiter._attempts.clear()
    forgot_password_limiter._attempts.clear()
    resend_verification_limiter._attempts.clear()
    verify_email_limiter._attempts.clear()
    reset_password_limiter._attempts.clear()
    return {"message": "Rate limits cleared (test-only)"}

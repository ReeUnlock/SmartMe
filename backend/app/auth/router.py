from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.auth.models import User
from app.auth.schemas import SetupRequest, LoginRequest, TokenResponse, UserOut
from app.auth.security import hash_password, verify_password, create_access_token
from app.auth.dependencies import get_current_user

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/setup", response_model=TokenResponse)
def setup(data: SetupRequest, db: Session = Depends(get_db)):
    if db.query(User).first():
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Konto już istnieje. Użyj logowania.",
        )
    user = User(
        username=data.username,
        email=data.email,
        hashed_password=hash_password(data.password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return TokenResponse(access_token=create_access_token(user.id))


@router.post("/login", response_model=TokenResponse)
def login(data: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == data.username).first()
    if not user or not verify_password(data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Nieprawidłowa nazwa użytkownika lub hasło",
        )
    return TokenResponse(access_token=create_access_token(user.id))


@router.get("/me", response_model=UserOut)
def me(current_user: User = Depends(get_current_user)):
    return current_user


@router.delete("/reset")
def reset_account(db: Session = Depends(get_db)):
    """Delete all users and related data so setup can be run again."""
    from app.shopping.models import ShoppingItem, ShoppingList, ShoppingCategory
    from app.calendar.models import Event

    db.query(ShoppingItem).delete()
    db.query(ShoppingList).delete()
    db.query(ShoppingCategory).delete()
    db.query(Event).delete()
    count = db.query(User).delete()
    db.commit()
    if count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Brak konta do usunięcia.",
        )
    return {"message": "Konto usunięte. Możesz utworzyć nowe."}


@router.get("/status")
def auth_status(db: Session = Depends(get_db)):
    """Check if setup has been completed (any user exists)."""
    has_user = db.query(User).first() is not None
    return {"setup_completed": has_user}

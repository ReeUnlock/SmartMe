from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database import get_db
from app.auth.models import User
from app.admin.auth import verify_admin_key
from app.admin.schemas import (
    UsersListResponse,
    UserAdminRow,
    UserDetailRow,
    GlobalStats,
    FeedbackListResponse,
    AdminHealthResponse,
    DeleteUserResponse,
)
from app.admin.service import (
    get_users_list,
    get_user_detail,
    get_global_stats,
    get_feedback_list,
)

router = APIRouter(prefix="/api/admin", tags=["admin"])


@router.get("/health", response_model=AdminHealthResponse)
def admin_health(
    db: Session = Depends(get_db),
    _key=Depends(verify_admin_key),
):
    """Quick admin health check."""
    db_users = db.query(func.count(User.id)).scalar() or 0
    return AdminHealthResponse(
        status="ok",
        db_users=db_users,
        timestamp=datetime.now(timezone.utc).isoformat(),
    )


@router.get("/users", response_model=UsersListResponse)
def list_users(
    page: int = Query(1, ge=1),
    per_page: int = Query(50, ge=1, le=100),
    search: str = Query(None),
    plan: str = Query(None),
    sort_by: str = Query("created_at"),
    sort_dir: str = Query("desc"),
    db: Session = Depends(get_db),
    _key=Depends(verify_admin_key),
):
    """List all users with pagination and filtering."""
    if sort_by not in ("created_at", "last_seen_at", "email"):
        sort_by = "created_at"
    if sort_dir not in ("asc", "desc"):
        sort_dir = "desc"

    result = get_users_list(db, page, per_page, search, plan, sort_by, sort_dir)
    return result


@router.get("/users/{user_id}", response_model=UserDetailRow)
def get_user(
    user_id: int,
    db: Session = Depends(get_db),
    _key=Depends(verify_admin_key),
):
    """Get detailed info for a single user."""
    result = get_user_detail(db, user_id)
    if not result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
    return result


@router.delete("/users/{user_id}", response_model=DeleteUserResponse)
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    _key=Depends(verify_admin_key),
):
    """Delete a user and all their data (cascade)."""
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
    email = user.email
    db.delete(user)
    db.commit()
    return DeleteUserResponse(deleted=True, user_id=user_id, email=email)


@router.get("/stats", response_model=GlobalStats)
def global_stats(
    db: Session = Depends(get_db),
    _key=Depends(verify_admin_key),
):
    """Global application statistics."""
    return get_global_stats(db)


@router.get("/feedback", response_model=FeedbackListResponse)
def list_feedback(
    page: int = Query(1, ge=1),
    per_page: int = Query(50, ge=1, le=100),
    category: str = Query(None),
    db: Session = Depends(get_db),
    _key=Depends(verify_admin_key),
):
    """List all feedback entries."""
    return get_feedback_list(db, page, per_page, category)

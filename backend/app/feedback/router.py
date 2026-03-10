from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session

from app.database import get_db
from app.auth.rate_limit import RateLimiter
from app.feedback.models import Feedback
from app.feedback.schemas import FeedbackCreate, FeedbackOut

router = APIRouter(prefix="/api/feedback", tags=["feedback"])

feedback_limiter = RateLimiter(max_attempts=5, window_seconds=60)


@router.post("", response_model=FeedbackOut, status_code=201)
def create_feedback(
    payload: FeedbackCreate,
    request: Request,
    db: Session = Depends(get_db),
):
    feedback_limiter.check(request)

    user_agent = payload.user_agent or request.headers.get("user-agent", "")[:500]

    feedback = Feedback(
        message=payload.message,
        category=payload.category,
        email=payload.email or None,
        user_agent=user_agent,
    )
    db.add(feedback)
    db.commit()
    db.refresh(feedback)
    return feedback

from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Index
from sqlalchemy.sql import func
from app.database import Base


class Feedback(Base):
    __tablename__ = "feedback"

    id = Column(Integer, primary_key=True, index=True)
    message = Column(Text, nullable=False)
    category = Column(String(50), nullable=False)
    email = Column(String(255), nullable=True)
    user_agent = Column(String(500), nullable=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    __table_args__ = (
        Index("ix_feedback_user_id", "user_id"),
    )

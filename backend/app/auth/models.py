from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Index
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base
from app.common.models import TimestampMixin


class User(Base, TimestampMixin):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, nullable=False)
    email = Column(String(120), unique=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    is_active = Column(Boolean, default=True)
    onboarding_completed = Column(Boolean, default=False, nullable=False, server_default="false")
    plan = Column(String(20), nullable=False, default="free", server_default="free")
    is_email_verified = Column(Boolean, nullable=False, default=False, server_default="false")
    email_verified_at = Column(DateTime(timezone=True), nullable=True)

    auth_tokens = relationship("AuthToken", back_populates="user", cascade="all, delete-orphan")


class AuthToken(Base):
    __tablename__ = "auth_tokens"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    token = Column(String(255), unique=True, nullable=False, index=True)
    token_type = Column(String(50), nullable=False)  # 'email_verification' | 'password_reset'
    expires_at = Column(DateTime(timezone=True), nullable=False)
    used_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="auth_tokens")

    __table_args__ = (
        Index("ix_auth_tokens_user_id", "user_id"),
    )

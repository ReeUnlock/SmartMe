from sqlalchemy import Column, Integer, String, Boolean
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

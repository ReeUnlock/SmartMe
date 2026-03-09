from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey
from app.database import Base
from app.common.models import TimestampMixin


class Event(Base, TimestampMixin):
    __tablename__ = "events"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    start_at = Column(DateTime(timezone=True), nullable=False)
    end_at = Column(DateTime(timezone=True), nullable=True)
    all_day = Column(Boolean, default=False)
    color = Column(String(20), nullable=True)
    icon = Column(String(10), nullable=True)
    category = Column(String(50), nullable=True)
    location = Column(String(255), nullable=True)
    rrule = Column(String(500), nullable=True)
    google_event_id = Column(String(255), nullable=True, unique=True)
    google_calendar_id = Column(String(255), nullable=True)
    google_sync_token = Column(String(255), nullable=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)

from sqlalchemy import Column, Integer, String, Date, DateTime, ForeignKey, Index, JSON, UniqueConstraint
from sqlalchemy.sql import func
from app.database import Base


class UserRewards(Base):
    __tablename__ = "user_rewards"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    sparks = Column(Integer, nullable=False, default=0, server_default="0")
    level = Column(Integer, nullable=False, default=1, server_default="1")
    streak = Column(Integer, nullable=False, default=0, server_default="0")
    streak_last_date = Column(Date, nullable=True)
    xp = Column(Integer, nullable=False, default=0, server_default="0")
    achievements = Column(JSON, nullable=False, default=list, server_default="[]")
    challenges_state = Column(JSON, nullable=False, default=dict, server_default="{}")
    avatar_key = Column(String(32), nullable=False, default="sol", server_default="sol")
    seen_avatar_unlocks = Column(JSON, nullable=False, default=list, server_default="[]")
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    __table_args__ = (
        UniqueConstraint("user_id", name="uq_user_rewards"),
        Index("ix_user_rewards_user_id", "user_id"),
    )

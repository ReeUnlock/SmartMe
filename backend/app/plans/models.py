from sqlalchemy import (
    Column, Index, Integer, String, Text, Boolean, Float, Date, ForeignKey,
)
from sqlalchemy.orm import relationship
from app.database import Base
from app.common.models import TimestampMixin


class Goal(Base, TimestampMixin):
    __tablename__ = "goals"
    __table_args__ = (
        Index("ix_goals_user_id", "user_id"),
        Index("ix_goals_linked_category_id", "linked_category_id"),
    )

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    category = Column(String(50), nullable=True)  # finanse, zdrowie, rozwoj, podroze, dom, inne
    color = Column(String(30), nullable=True)
    goal_type = Column(String(20), default="manual")  # manual, savings, spending_limit
    target_value = Column(Float, nullable=True)       # e.g. 10000 (zł)
    current_value = Column(Float, default=0)           # e.g. 6200 (zł)
    unit = Column(String(30), nullable=True)           # e.g. "zł", "kg", "km"
    deadline = Column(Date, nullable=True)
    is_completed = Column(Boolean, default=False)
    sort_order = Column(Integer, default=0)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    linked_category_id = Column(
        Integer,
        ForeignKey("expense_categories.id", ondelete="SET NULL"),
        nullable=True,
    )

    milestones = relationship(
        "Milestone", back_populates="goal", cascade="all, delete-orphan",
        order_by="Milestone.sort_order",
    )


class Milestone(Base, TimestampMixin):
    __tablename__ = "milestones"
    __table_args__ = (
        Index("ix_milestones_goal_id", "goal_id"),
        Index("ix_milestones_user_id", "user_id"),
    )

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    is_completed = Column(Boolean, default=False)
    sort_order = Column(Integer, default=0)
    goal_id = Column(Integer, ForeignKey("goals.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    goal = relationship("Goal", back_populates="milestones")


class BucketItem(Base, TimestampMixin):
    __tablename__ = "bucket_items"
    __table_args__ = (
        Index("ix_bucket_items_user_id", "user_id"),
    )

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    category = Column(String(50), nullable=True)  # podroze, rozwoj, zdrowie, finanse, inne
    is_completed = Column(Boolean, default=False)
    completed_date = Column(Date, nullable=True)
    sort_order = Column(Integer, default=0)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)

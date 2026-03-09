from sqlalchemy import (
    Column, Index, Integer, String, Float, Boolean, Date, ForeignKey, UniqueConstraint,
)
from sqlalchemy.orm import relationship
from app.database import Base
from app.common.models import TimestampMixin


class HouseholdMember(Base, TimestampMixin):
    __tablename__ = "household_members"
    __table_args__ = (
        Index("ix_household_members_user_id", "user_id"),
    )

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    expenses = relationship("Expense", back_populates="paid_by")
    recurring_expenses = relationship("RecurringExpense", back_populates="paid_by")


class ExpenseCategory(Base, TimestampMixin):
    __tablename__ = "expense_categories"
    __table_args__ = (
        Index("ix_expense_categories_user_id", "user_id"),
    )

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    icon = Column(String(50), nullable=True)
    color = Column(String(30), nullable=True)
    sort_order = Column(Integer, default=0)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    expenses = relationship("Expense", back_populates="category")
    recurring_expenses = relationship("RecurringExpense", back_populates="category")


class Expense(Base, TimestampMixin):
    __tablename__ = "expenses"
    __table_args__ = (
        Index("ix_expenses_user_id", "user_id"),
        Index("ix_expenses_date", "date"),
        Index("ix_expenses_user_date", "user_id", "date"),
    )

    id = Column(Integer, primary_key=True, index=True)
    amount = Column(Float, nullable=False)
    description = Column(String(500), nullable=True)
    date = Column(Date, nullable=False)
    is_shared = Column(Boolean, default=False)
    category_id = Column(Integer, ForeignKey("expense_categories.id", ondelete="SET NULL"), nullable=True)
    paid_by_id = Column(Integer, ForeignKey("household_members.id", ondelete="SET NULL"), nullable=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    category = relationship("ExpenseCategory", back_populates="expenses")
    paid_by = relationship("HouseholdMember", back_populates="expenses")


class RecurringExpense(Base, TimestampMixin):
    __tablename__ = "recurring_expenses"
    __table_args__ = (
        Index("ix_recurring_expenses_user_id", "user_id"),
    )

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    amount = Column(Float, nullable=False)
    day_of_month = Column(Integer, default=1)
    is_shared = Column(Boolean, default=False)
    category_id = Column(Integer, ForeignKey("expense_categories.id", ondelete="SET NULL"), nullable=True)
    paid_by_id = Column(Integer, ForeignKey("household_members.id", ondelete="SET NULL"), nullable=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    category = relationship("ExpenseCategory", back_populates="recurring_expenses")
    paid_by = relationship("HouseholdMember", back_populates="recurring_expenses")


class MonthlyBudget(Base, TimestampMixin):
    __tablename__ = "monthly_budgets"
    __table_args__ = (
        UniqueConstraint("user_id", "year", "month", name="uq_budget_user_year_month"),
        Index("ix_monthly_budgets_user_id", "user_id"),
    )

    id = Column(Integer, primary_key=True, index=True)
    year = Column(Integer, nullable=False)
    month = Column(Integer, nullable=False)
    amount = Column(Float, nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)

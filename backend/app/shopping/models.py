from sqlalchemy import Column, Index, Integer, String, Boolean, Float, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base
from app.common.models import TimestampMixin


class ShoppingList(Base, TimestampMixin):
    __tablename__ = "shopping_lists"
    __table_args__ = (
        Index("ix_shopping_lists_user_id", "user_id"),
    )

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    store_name = Column(String(100), nullable=True)
    is_completed = Column(Boolean, default=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    items = relationship("ShoppingItem", back_populates="shopping_list", cascade="all, delete-orphan")


class ShoppingCategory(Base, TimestampMixin):
    __tablename__ = "shopping_categories"
    __table_args__ = (
        Index("ix_shopping_categories_user_id", "user_id"),
    )

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    icon = Column(String(50), nullable=True)
    sort_order = Column(Integer, default=0)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    items = relationship("ShoppingItem", back_populates="category")


class ShoppingItem(Base, TimestampMixin):
    __tablename__ = "shopping_items"
    __table_args__ = (
        Index("ix_shopping_items_user_id", "user_id"),
        Index("ix_shopping_items_list_id", "list_id"),
    )

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    quantity = Column(Float, nullable=True)
    unit = Column(String(30), nullable=True)
    is_checked = Column(Boolean, default=False)
    sort_order = Column(Integer, default=0)
    list_id = Column(Integer, ForeignKey("shopping_lists.id", ondelete="CASCADE"), nullable=False)
    category_id = Column(Integer, ForeignKey("shopping_categories.id", ondelete="SET NULL"), nullable=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    shopping_list = relationship("ShoppingList", back_populates="items")
    category = relationship("ShoppingCategory", back_populates="items")

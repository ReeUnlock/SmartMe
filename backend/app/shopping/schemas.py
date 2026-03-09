from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


# --- Categories ---

class CategoryCreate(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    icon: Optional[str] = Field(default=None, max_length=50)
    sort_order: int = 0


class CategoryUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=1, max_length=100)
    icon: Optional[str] = Field(default=None, max_length=50)
    sort_order: Optional[int] = None


class CategoryOut(BaseModel):
    id: int
    name: str
    icon: Optional[str] = None
    sort_order: int
    created_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


# --- Items ---

class ItemCreate(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    quantity: Optional[float] = None
    unit: Optional[str] = Field(default=None, max_length=30)
    category_id: Optional[int] = None


class ItemUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=1, max_length=255)
    quantity: Optional[float] = None
    unit: Optional[str] = Field(default=None, max_length=30)
    is_checked: Optional[bool] = None
    category_id: Optional[int] = None
    sort_order: Optional[int] = None


class ItemOut(BaseModel):
    id: int
    name: str
    quantity: Optional[float] = None
    unit: Optional[str] = None
    is_checked: bool
    sort_order: int
    list_id: int
    category_id: Optional[int] = None
    created_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


# --- Lists ---

class ListCreate(BaseModel):
    name: str = Field(min_length=1, max_length=255)


class ListUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=1, max_length=255)
    is_completed: Optional[bool] = None


class ListOut(BaseModel):
    id: int
    name: str
    is_completed: bool
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    items: list[ItemOut] = []

    model_config = {"from_attributes": True}

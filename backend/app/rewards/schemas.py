from datetime import date
from typing import Any, Optional
from pydantic import BaseModel


class RewardsOut(BaseModel):
    sparks: int
    level: int
    streak: int
    streak_last_date: Optional[date] = None
    xp: int
    achievements: Any
    challenges_state: dict[str, Any]
    avatar_key: str
    seen_avatar_unlocks: list[Any]

    model_config = {"from_attributes": True}


class RewardsUpdate(BaseModel):
    sparks: Optional[int] = None
    level: Optional[int] = None
    streak: Optional[int] = None
    streak_last_date: Optional[date] = None
    xp: Optional[int] = None
    achievements: Optional[Any] = None
    challenges_state: Optional[dict[str, Any]] = None
    avatar_key: Optional[str] = None
    seen_avatar_unlocks: Optional[list[Any]] = None

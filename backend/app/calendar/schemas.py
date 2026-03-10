from datetime import datetime
from typing import Optional

from dateutil.rrule import rrulestr
from pydantic import BaseModel, Field, field_validator


def _validate_rrule(value: str | None) -> str | None:
    if value is None:
        return None
    try:
        rrulestr(value, ignoretz=True)
    except (ValueError, TypeError) as e:
        raise ValueError(f"Nieprawidłowy format RRULE: {e}")
    return value


class EventCreate(BaseModel):
    title: str = Field(min_length=1, max_length=255)
    start_at: datetime
    end_at: Optional[datetime] = None
    all_day: bool = False
    description: Optional[str] = None
    color: Optional[str] = Field(default=None, max_length=20)
    icon: Optional[str] = Field(default=None, max_length=30)
    category: Optional[str] = Field(default=None, max_length=50)
    location: Optional[str] = Field(default=None, max_length=255)
    rrule: Optional[str] = Field(default=None, max_length=500)

    @field_validator("rrule")
    @classmethod
    def validate_rrule(cls, v):
        return _validate_rrule(v)


class EventUpdate(BaseModel):
    title: Optional[str] = Field(default=None, min_length=1, max_length=255)
    start_at: Optional[datetime] = None
    end_at: Optional[datetime] = None
    all_day: Optional[bool] = None
    description: Optional[str] = None
    color: Optional[str] = Field(default=None, max_length=20)
    icon: Optional[str] = Field(default=None, max_length=30)
    category: Optional[str] = Field(default=None, max_length=50)
    location: Optional[str] = Field(default=None, max_length=255)
    rrule: Optional[str] = Field(default=None, max_length=500)

    @field_validator("rrule")
    @classmethod
    def validate_rrule(cls, v):
        return _validate_rrule(v)


class EventOut(BaseModel):
    id: int
    title: str
    description: Optional[str] = None
    start_at: datetime
    end_at: Optional[datetime] = None
    all_day: bool
    color: Optional[str] = None
    icon: Optional[str] = None
    category: Optional[str] = None
    location: Optional[str] = None
    rrule: Optional[str] = None
    google_event_id: Optional[str] = None
    google_calendar_id: Optional[str] = None
    google_sync_token: Optional[str] = None
    user_id: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    virtual_date: Optional[datetime] = None

    model_config = {"from_attributes": True}

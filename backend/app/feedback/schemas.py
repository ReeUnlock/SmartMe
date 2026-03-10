from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class FeedbackCreate(BaseModel):
    message: str = Field(..., min_length=1, max_length=2000)
    category: str = Field(..., pattern="^(bug|idea|opinion|broken)$")
    email: Optional[str] = Field(None, max_length=255)
    user_agent: Optional[str] = Field(None, max_length=500)


class FeedbackOut(BaseModel):
    id: int
    message: str
    category: str
    email: Optional[str]
    user_agent: Optional[str]
    created_at: datetime

    model_config = {"from_attributes": True}

from pydantic import BaseModel, EmailStr, Field
from datetime import datetime


class SetupRequest(BaseModel):
    username: str = Field(min_length=3, max_length=50)
    email: EmailStr
    password: str = Field(min_length=6, max_length=72)


class LoginRequest(BaseModel):
    username: str = Field(min_length=1, max_length=120)
    password: str = Field(min_length=1, max_length=72)


class ResetRequest(BaseModel):
    password: str = Field(min_length=1, max_length=72)


class PasswordChangeRequest(BaseModel):
    current_password: str = Field(min_length=1, max_length=72)
    new_password: str = Field(min_length=6, max_length=72)


class ForgotPasswordRequest(BaseModel):
    email: EmailStr
    new_password: str = Field(min_length=6, max_length=72)


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserOut(BaseModel):
    id: int
    username: str
    email: str
    is_active: bool
    onboarding_completed: bool
    created_at: datetime

    model_config = {"from_attributes": True}

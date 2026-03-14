from pydantic import BaseModel, EmailStr, Field
from datetime import datetime


class RegisterRequest(BaseModel):
    username: str = Field(min_length=3, max_length=50)
    email: EmailStr
    password: str = Field(min_length=8, max_length=72)


class SetupRequest(BaseModel):
    """Deprecated — use RegisterRequest instead."""
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
    new_password: str = Field(min_length=8, max_length=72)


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class VerifyEmailRequest(BaseModel):
    token: str = Field(min_length=1)


class ResendVerificationRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str = Field(min_length=1)
    new_password: str = Field(min_length=8, max_length=72)


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserOut(BaseModel):
    id: int
    username: str
    email: str
    is_active: bool
    onboarding_completed: bool
    plan: str = "free"
    is_email_verified: bool = False
    created_at: datetime

    model_config = {"from_attributes": True}


class AuthStatusResponse(BaseModel):
    is_authenticated: bool
    is_email_verified: bool
    username: str
    plan: str

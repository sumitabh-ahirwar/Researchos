from datetime import datetime
from typing import Optional

from pydantic import BaseModel, EmailStr, Field, field_validator

# bcrypt only reads the first 72 bytes of a password. The service layer
# pre-hashes with SHA-256 so longer passphrases are not silently truncated,
# but a sane upper bound still keeps request bodies small.
MIN_PASSWORD_LENGTH = 8
MAX_PASSWORD_LENGTH = 256


class SignupRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=80)
    email: EmailStr
    password: str = Field(..., min_length=MIN_PASSWORD_LENGTH, max_length=MAX_PASSWORD_LENGTH)

    @field_validator("name")
    @classmethod
    def strip_name(cls, value: str) -> str:
        cleaned = value.strip()
        if len(cleaned) < 2:
            raise ValueError("Name must be at least 2 characters.")
        return cleaned


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=1, max_length=MAX_PASSWORD_LENGTH)


class UserPublic(BaseModel):
    """
    The only user shape that ever leaves the API.

    Deliberately has no password field, so a stored hash cannot be leaked by
    accidentally serialising the raw database document.
    """

    id: str
    name: str
    email: EmailStr
    created_at: datetime


class AuthResponse(BaseModel):
    success: bool
    user: Optional[UserPublic] = None
    message: str = ""

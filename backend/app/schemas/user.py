"""Schemas de usuarios."""

from pydantic import BaseModel, EmailStr

from app.schemas.auth import UserResponse


class UserUpdate(BaseModel):
    """Schema para actualizar usuario."""

    full_name: str | None = None
    email: EmailStr | None = None


class UserInDB(UserResponse):
    """Schema de usuario con datos internos."""

    hashed_password: str
    provider: str | None = None
    provider_id: str | None = None

    class Config:
        from_attributes = True

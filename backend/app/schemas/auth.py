"""Schemas de autenticación y usuarios."""

from pydantic import BaseModel, EmailStr, Field


class UserBase(BaseModel):
    """Base de schema de usuario."""

    email: EmailStr
    full_name: str | None = None


class UserCreate(UserBase):
    """Schema para registro de usuario."""

    password: str = Field(..., min_length=8, max_length=128)


class UserLogin(BaseModel):
    """Schema para login de usuario."""

    email: EmailStr
    password: str


class UserResponse(UserBase):
    """Schema de respuesta de usuario."""

    id: int
    is_active: bool
    is_superuser: bool

    class Config:
        from_attributes = True


class Token(BaseModel):
    """Schema de token JWT."""

    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class TokenPayload(BaseModel):
    """Payload del token JWT."""

    sub: str | None = None
    exp: int | None = None


class RefreshToken(BaseModel):
    """Schema para refresh token."""

    refresh_token: str

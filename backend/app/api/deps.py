"""Dependencias de la API."""

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.core.security import decode_token
from app.core.config import get_settings
from app.models.user import User

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")


def get_db() -> Session:
    """Obtiene una sesión de base de datos.
    
    Placeholder - se implementará con SQLAlchemy session cuando
    configuremos la conexión a DB en producción.
    """
    # TODO: Implementar con SQLAlchemy session
    pass


async def get_current_user(token: str = Depends(oauth2_scheme)) -> User:
    """Obtiene el usuario actual desde el token JWT."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    payload = decode_token(token)
    if payload is None:
        raise credentials_exception
    
    user_id: str | None = payload.get("sub")
    if user_id is None:
        raise credentials_exception
    
    # TODO: Buscar usuario en DB cuando tengamos sesiones
    # Por ahora retornamos un placeholder para no romper
    user = User(
        id=int(user_id),
        email="user@example.com",
        hashed_password="",
        is_active=True,
        is_superuser=False,
    )
    return user


async def get_current_active_user(
    current_user: User = Depends(get_current_user),
) -> User:
    """Obtiene el usuario actual activo."""
    if not current_user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user

"""Servicio de autenticación."""

from sqlalchemy.orm import Session

from app.core.security import get_password_hash, verify_password, create_access_token, create_refresh_token
from app.models.user import User
from app.schemas.auth import UserCreate, UserLogin


class AuthService:
    """Servicio para operaciones de autenticación."""

    def __init__(self, db: Session):
        self.db = db

    def get_user_by_email(self, email: str) -> User | None:
        """Busca un usuario por email."""
        return self.db.query(User).filter(User.email == email).first()

    def get_user_by_id(self, user_id: int) -> User | None:
        """Busca un usuario por ID."""
        return self.db.query(User).filter(User.id == user_id).first()

    def create_user(self, user_data: UserCreate) -> User:
        """Crea un nuevo usuario con contraseña hasheada."""
        hashed_password = get_password_hash(user_data.password)
        db_user = User(
            email=user_data.email,
            hashed_password=hashed_password,
            full_name=user_data.full_name,
            is_active=True,
            is_superuser=False,
        )
        self.db.add(db_user)
        self.db.commit()
        self.db.refresh(db_user)
        return db_user

    def authenticate(self, credentials: UserLogin) -> User | None:
        """Autentica un usuario con email y contraseña."""
        user = self.get_user_by_email(credentials.email)
        if not user:
            return None
        if not user.hashed_password:
            return None
        if not verify_password(credentials.password, user.hashed_password):
            return None
        return user

    def create_tokens(self, user_id: int) -> dict[str, str]:
        """Genera access y refresh tokens para un usuario."""
        return {
            "access_token": create_access_token(user_id),
            "refresh_token": create_refresh_token(user_id),
        }

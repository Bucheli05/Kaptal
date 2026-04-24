"""Configuración de base de datos."""

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session

from app.core.config import get_settings

settings = get_settings()

engine = create_engine(settings.DATABASE_URL, pool_pre_ping=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db() -> Session:
    """Generador de sesiones de base de datos para FastAPI dependencies."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

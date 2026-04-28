"""Configuración central de la aplicación."""

from functools import lru_cache

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Configuración de la aplicación cargada desde variables de entorno."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # App
    APP_NAME: str = "Breezely API"
    APP_VERSION: str = "0.1.0"
    DEBUG: bool = False
    ENVIRONMENT: str = "development"

    # Security
    SECRET_KEY: str = "change-me-in-production"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    ALGORITHM: str = "HS256"

    # Database
    DATABASE_URL: str = "postgresql://breezely:breezely@localhost:5432/breezely"

    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"

    # CORS — comma-separated string from .env parsed into list
    CORS_ORIGINS: str = (
        "http://localhost:3000,"
        "http://localhost:8080,"
        "http://localhost:8081,"
        "http://localhost:5173"
    )

    @property
    def cors_origins_list(self) -> list[str]:
        """Parse CORS_ORIGINS string into list."""
        return [o.strip() for o in self.CORS_ORIGINS.split(",") if o.strip()]

    # OAuth Google
    GOOGLE_CLIENT_ID: str = ""
    GOOGLE_CLIENT_SECRET: str = ""
    GOOGLE_REDIRECT_URI: str = "http://localhost:8001/api/v1/auth/google/callback"

    # OAuth Apple
    APPLE_CLIENT_ID: str = ""
    APPLE_TEAM_ID: str = ""
    APPLE_KEY_ID: str = ""
    APPLE_PRIVATE_KEY: str = ""
    APPLE_REDIRECT_URI: str = "http://localhost:8001/api/v1/auth/apple/callback"

    # IBKR
    IBKR_BASE_URL: str = "https://localhost:5000/v1/api"


@lru_cache
def get_settings() -> Settings:
    """Retorna configuración cacheada."""
    return Settings()

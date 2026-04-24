"""Router de healthcheck detallado."""

from fastapi import APIRouter

from app.core.config import get_settings

router = APIRouter()


@router.get("/")
async def health() -> dict[str, str]:
    """Healthcheck detallado."""
    settings = get_settings()
    return {
        "status": "healthy",
        "version": settings.APP_VERSION,
        "environment": settings.ENVIRONMENT,
    }

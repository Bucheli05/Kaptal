"""Routers de la API v1."""

from fastapi import APIRouter

from app.api.v1 import health, auth, broker, portfolio

router = APIRouter()

router.include_router(health.router, prefix="/health", tags=["health"])
router.include_router(auth.router, prefix="/auth", tags=["auth"])
router.include_router(broker.router, prefix="/broker", tags=["broker"])
router.include_router(portfolio.router, prefix="/portfolio", tags=["portfolio"])

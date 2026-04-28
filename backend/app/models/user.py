"""Modelo de Usuario actualizado con soporte OAuth."""

from __future__ import annotations

from typing import Any

from sqlalchemy import Boolean, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base


class User(Base):
    """Modelo de usuario con soporte para auth propia y OAuth."""

    __tablename__ = "users"

    email: Mapped[str] = mapped_column(
        String(255), unique=True, index=True, nullable=False,
    )
    hashed_password: Mapped[str | None] = mapped_column(
        String(255), nullable=True,
    )
    full_name: Mapped[str | None] = mapped_column(
        String(255), nullable=True,
    )
    is_active: Mapped[bool] = mapped_column(
        Boolean, default=True, nullable=False,
    )
    is_superuser: Mapped[bool] = mapped_column(
        Boolean, default=False, nullable=False,
    )

    # OAuth fields
    provider: Mapped[str | None] = mapped_column(
        String(50), nullable=True,
    )  # google, apple
    provider_id: Mapped[str | None] = mapped_column(
        String(255), nullable=True,
    )

    # Relations
    broker_connections: Mapped[list[Any]] = relationship(
        "BrokerConnection", back_populates="user",
        cascade="all, delete-orphan",
    )

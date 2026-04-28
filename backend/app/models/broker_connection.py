"""Modelo de conexión con brokers."""

from __future__ import annotations

import enum
from typing import Any

from sqlalchemy import ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base


class BrokerType(str, enum.Enum):
    """Tipos de broker soportados."""

    IBKR = "ibkr"


class ConnectionStatus(str, enum.Enum):
    """Estados de la conexión con broker."""

    CONNECTED = "connected"
    DISCONNECTED = "disconnected"
    ERROR = "error"


class BrokerConnection(Base):
    """Conexión de un usuario con un broker."""

    __tablename__ = "broker_connections"

    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id"), nullable=False,
    )
    broker_type: Mapped[str] = mapped_column(
        String(20), nullable=False, default=BrokerType.IBKR.value,
    )
    status: Mapped[str] = mapped_column(
        String(20), nullable=False,
        default=ConnectionStatus.DISCONNECTED.value,
    )

    # Flex Web Service credentials (encrypted at rest in a real app,
    # plain for MVP)
    flex_token: Mapped[str | None] = mapped_column(Text, nullable=True)
    flex_query_id: Mapped[str | None] = mapped_column(Text, nullable=True)
    account_id: Mapped[str | None] = mapped_column(
        String(50), nullable=True,
    )

    # Relations
    user: Mapped[Any] = relationship(
        "User", back_populates="broker_connections",
    )
    positions: Mapped[list[Any]] = relationship(
        "Position", back_populates="broker_connection",
        cascade="all, delete-orphan",
    )
    snapshots: Mapped[list[Any]] = relationship(
        "PortfolioSnapshot", back_populates="broker_connection",
        cascade="all, delete-orphan",
    )

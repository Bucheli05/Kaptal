"""Modelo de posiciones (holdings)."""

from __future__ import annotations

from typing import Any

from sqlalchemy import ForeignKey, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base


class Position(Base):
    """Posición individual de un instrumento en el portafolio."""

    __tablename__ = "positions"

    broker_connection_id: Mapped[int] = mapped_column(
        ForeignKey("broker_connections.id"), nullable=False,
    )

    symbol: Mapped[str] = mapped_column(String(20), nullable=False)
    description: Mapped[str | None] = mapped_column(
        String(255), nullable=True,
    )
    asset_class: Mapped[str | None] = mapped_column(
        String(50), nullable=True,
    )
    sector: Mapped[str | None] = mapped_column(
        String(100), nullable=True,
    )
    currency: Mapped[str | None] = mapped_column(
        String(10), nullable=True,
    )

    quantity: Mapped[float] = mapped_column(Numeric(18, 6), nullable=False)
    avg_cost: Mapped[float | None] = mapped_column(
        Numeric(18, 6), nullable=True,
    )
    market_price: Mapped[float | None] = mapped_column(
        Numeric(18, 6), nullable=True,
    )
    market_value: Mapped[float | None] = mapped_column(
        Numeric(18, 6), nullable=True,
    )
    unrealized_pnl: Mapped[float | None] = mapped_column(
        Numeric(18, 6), nullable=True,
    )
    realized_pnl: Mapped[float | None] = mapped_column(
        Numeric(18, 6), nullable=True,
    )
    cost_basis_price: Mapped[float | None] = mapped_column(
        Numeric(18, 6), nullable=True,
    )
    fifo_pnl_unrealized: Mapped[float | None] = mapped_column(
        Numeric(18, 6), nullable=True,
    )
    daily_price_change_pct: Mapped[float | None] = mapped_column(
        Numeric(18, 6), nullable=True,
    )

    # Relation
    broker_connection: Mapped[Any] = relationship(
        "BrokerConnection", back_populates="positions",
    )

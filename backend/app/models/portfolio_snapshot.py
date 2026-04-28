"""Modelo de snapshot del portafolio."""

from __future__ import annotations

from datetime import UTC, datetime
from typing import Any

from sqlalchemy import DateTime, ForeignKey, Numeric
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base


class PortfolioSnapshot(Base):
    """Snapshot diario del portafolio para historial del gráfico."""

    __tablename__ = "portfolio_snapshots"

    broker_connection_id: Mapped[int] = mapped_column(
        ForeignKey("broker_connections.id"), nullable=False,
    )

    total_value: Mapped[float] = mapped_column(
        Numeric(18, 6), nullable=False,
    )
    cash_balance: Mapped[float | None] = mapped_column(
        Numeric(18, 6), nullable=True,
    )
    daily_pnl: Mapped[float | None] = mapped_column(
        Numeric(18, 6), nullable=True,
    )
    daily_pnl_pct: Mapped[float | None] = mapped_column(
        Numeric(10, 4), nullable=True,
    )
    snapshot_date: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(UTC),
        nullable=False,
    )

    # Relation
    broker_connection: Mapped[Any] = relationship(
        "BrokerConnection", back_populates="snapshots",
    )

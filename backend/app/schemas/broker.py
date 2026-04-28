"""Schemas de broker y portafolio."""

from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, Field

# ============================================================================
# Broker Connection
# ============================================================================

class BrokerConnectionCreate(BaseModel):
    """Schema para conectar un broker."""

    broker_type: str = Field(default="ibkr", pattern="^(ibkr)$")
    flex_token: str
    flex_query_id: str
    account_id: str | None = None


class BrokerConnectionUpdate(BaseModel):
    """Schema para actualizar credenciales del broker."""

    flex_token: str | None = None
    flex_query_id: str | None = None
    account_id: str | None = None


class BrokerConnectionResponse(BaseModel):
    """Schema de respuesta de conexión con broker."""

    id: int
    user_id: int
    broker_type: str
    status: str
    account_id: str | None = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class BrokerStatusResponse(BaseModel):
    """Schema de estado de la conexión."""

    connected: bool
    broker_type: str | None = None
    account_id: str | None = None
    last_sync: datetime | None = None
    message: str | None = None


# ============================================================================
# Position
# ============================================================================

class PositionResponse(BaseModel):
    """Schema de posición individual."""

    id: int
    symbol: str
    description: str | None = None
    asset_class: str | None = None
    sector: str | None = None
    currency: str | None = None
    quantity: Decimal
    avg_cost: Decimal | None = None
    market_price: Decimal | None = None
    market_value: Decimal | None = None
    unrealized_pnl: Decimal | None = None
    realized_pnl: Decimal | None = None

    class Config:
        from_attributes = True


class PositionCreate(BaseModel):
    """Schema para crear posición internamente."""

    symbol: str
    description: str | None = None
    asset_class: str | None = None
    sector: str | None = None
    currency: str | None = None
    quantity: Decimal
    avg_cost: Decimal | None = None
    market_price: Decimal | None = None
    market_value: Decimal | None = None
    unrealized_pnl: Decimal | None = None
    realized_pnl: Decimal | None = None


# ============================================================================
# Portfolio Summary
# ============================================================================

class PortfolioSummaryResponse(BaseModel):
    """Schema de resumen del portafolio."""

    total_value: Decimal
    cash_balance: Decimal | None = None
    daily_pnl: Decimal | None = None
    daily_pnl_pct: Decimal | None = None
    total_return_pct: Decimal | None = None
    positions_count: int
    last_sync: datetime | None = None


class PortfolioSnapshotResponse(BaseModel):
    """Schema de snapshot histórico."""

    snapshot_date: datetime
    total_value: Decimal
    daily_pnl: Decimal | None = None
    daily_pnl_pct: Decimal | None = None

    class Config:
        from_attributes = True


# ============================================================================
# Sync
# ============================================================================

class SyncResponse(BaseModel):
    """Schema de respuesta de sincronización."""

    success: bool
    positions_synced: int
    message: str

"""Router de portafolio."""

from datetime import UTC, datetime, timedelta, timezone
from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.db import get_db
from app.core.deps import get_current_user
from app.models.broker_connection import BrokerConnection, ConnectionStatus
from app.models.portfolio_snapshot import PortfolioSnapshot
from app.models.position import Position
from app.models.user import User
from app.schemas.broker import (
    PortfolioSnapshotResponse,
    PortfolioSummaryResponse,
    PositionResponse,
    SyncResponse,
)
from app.services.ibkr_flex_service import IbkrFlexService

router = APIRouter()


def _get_connection(db: Session, user_id: int) -> BrokerConnection:
    conn = (
        db.query(BrokerConnection).filter(BrokerConnection.user_id == user_id).first()
    )
    if not conn:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=(
                "No broker connection found. " "Please connect your IBKR account first."
            ),
        )
    return conn


@router.post("/sync", response_model=SyncResponse)
async def sync_portfolio(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> dict:
    """Sincroniza posiciones y resumen desde IBKR Flex Web Service."""
    conn = _get_connection(db, current_user.id)

    try:
        service = IbkrFlexService(conn.flex_token, conn.flex_query_id)
        report = service.fetch_report()
    except Exception as e:
        conn.status = ConnectionStatus.ERROR.value
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Failed to fetch data from IBKR: {str(e)}",
        )

    # Borrar posiciones anteriores
    db.query(Position).filter(Position.broker_connection_id == conn.id).delete()

    positions_data = report.get("positions", [])
    for pos in positions_data:
        db_position = Position(
            broker_connection_id=conn.id,
            symbol=pos.get("symbol") or "UNKNOWN",
            description=pos.get("description"),
            asset_class=pos.get("asset_class"),
            sector=pos.get("sector"),
            currency=pos.get("currency"),
            quantity=pos.get("quantity") or Decimal("0"),
            avg_cost=pos.get("avg_cost"),
            market_price=pos.get("market_price"),
            market_value=pos.get("market_value"),
            unrealized_pnl=pos.get("unrealized_pnl"),
            realized_pnl=pos.get("realized_pnl"),
        )
        db.add(db_position)

    # Calcular totals
    total_value = Decimal("0")
    cost_basis = Decimal("0")
    for pos in positions_data:
        mv = pos.get("market_value")
        if mv:
            total_value += mv
        ac = pos.get("avg_cost")
        qty = pos.get("quantity")
        if ac and qty:
            cost_basis += ac * qty

    summary = report.get("summary", {})
    cash = summary.get("cash") or Decimal("0")
    net_liquidation = summary.get("net_liquidation") or total_value

    # Limpiar snapshots duplicados del dia actual y crear uno nuevo
    # Usar UTC-5 (hora local del usuario) para definir el inicio del dia
    local_tz = timezone(timedelta(hours=-5))
    now_local = datetime.now(local_tz)
    today_start = now_local.replace(
        hour=0, minute=0, second=0, microsecond=0
    ).astimezone(UTC)

    # Borrar todos los snapshots de hoy (evita duplicados)
    db.query(PortfolioSnapshot).filter(
        PortfolioSnapshot.broker_connection_id == conn.id,
        PortfolioSnapshot.snapshot_date >= today_start,
    ).delete()

    # Calcular daily_pnl comparando con el ultimo snapshot de un dia anterior
    prev_snapshot = (
        db.query(PortfolioSnapshot)
        .filter(
            PortfolioSnapshot.broker_connection_id == conn.id,
            PortfolioSnapshot.snapshot_date < today_start,
        )
        .order_by(PortfolioSnapshot.snapshot_date.desc())
        .first()
    )

    daily_pnl: Decimal | None = None
    daily_pnl_pct: Decimal | None = None
    if prev_snapshot is not None:
        daily_pnl = net_liquidation - prev_snapshot.total_value
        if prev_snapshot.total_value > 0:
            daily_pnl_pct = daily_pnl / prev_snapshot.total_value * 100

    # Crear snapshot fresco del dia
    snapshot = PortfolioSnapshot(
        broker_connection_id=conn.id,
        total_value=net_liquidation,
        cash_balance=cash,
        daily_pnl=daily_pnl,
        daily_pnl_pct=daily_pnl_pct,
        snapshot_date=datetime.now(UTC),
    )
    db.add(snapshot)

    conn.status = ConnectionStatus.CONNECTED.value
    db.commit()

    return {
        "success": True,
        "positions_synced": len(positions_data),
        "message": f"Synced {len(positions_data)} positions successfully",
    }


@router.get("/positions", response_model=list[PositionResponse])
async def get_positions(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[Position]:
    """Obtiene las posiciones actuales del portafolio."""
    conn = _get_connection(db, current_user.id)
    positions = (
        db.query(Position).filter(Position.broker_connection_id == conn.id).all()
    )
    return positions


@router.get("/summary", response_model=PortfolioSummaryResponse)
async def get_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> dict:
    """Obtiene el resumen del portafolio."""
    conn = _get_connection(db, current_user.id)

    positions = (
        db.query(Position).filter(Position.broker_connection_id == conn.id).all()
    )

    total_value = Decimal("0")
    cost_basis = Decimal("0")
    for pos in positions:
        if pos.market_value:
            total_value += pos.market_value
        if pos.avg_cost and pos.quantity:
            cost_basis += pos.avg_cost * pos.quantity

    total_return_pct = Decimal("0")
    if cost_basis > 0:
        total_return_pct = ((total_value - cost_basis) / cost_basis) * 100

    # Obtener último snapshot para cash y daily_pnl
    last_snapshot = (
        db.query(PortfolioSnapshot)
        .filter(PortfolioSnapshot.broker_connection_id == conn.id)
        .order_by(PortfolioSnapshot.snapshot_date.desc())
        .first()
    )

    fallback_value = last_snapshot.total_value if last_snapshot else Decimal("0")
    return {
        "total_value": total_value or fallback_value,
        "cash_balance": last_snapshot.cash_balance if last_snapshot else None,
        "daily_pnl": last_snapshot.daily_pnl if last_snapshot else None,
        "daily_pnl_pct": last_snapshot.daily_pnl_pct if last_snapshot else None,
        "total_return_pct": total_return_pct,
        "positions_count": len(positions),
        "last_sync": last_snapshot.snapshot_date if last_snapshot else None,
    }


@router.get("/history", response_model=list[PortfolioSnapshotResponse])
async def get_history(
    limit: int = 90,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[PortfolioSnapshot]:
    """Obtiene el historial de snapshots del portafolio."""
    conn = _get_connection(db, current_user.id)
    snapshots = (
        db.query(PortfolioSnapshot)
        .filter(PortfolioSnapshot.broker_connection_id == conn.id)
        .order_by(PortfolioSnapshot.snapshot_date.asc())
        .limit(limit)
        .all()
    )
    return snapshots

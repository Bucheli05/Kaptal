"""Router de portafolio."""

import logging
from datetime import UTC, datetime, timedelta
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

logger = logging.getLogger(__name__)

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

    # Extraer metadatos del FlexStatement
    statement_period = report.get("statement_period")
    from_date = report.get("from_date")
    to_date = report.get("to_date")

    logger.info("Flex statement: period=%s fromDate=%s toDate=%s",
                statement_period, from_date, to_date)

    # Verificar que el period sea LastBusinessDay
    if statement_period != "LastBusinessDay":
        logger.warning("Flex statement period is '%s', expected 'LastBusinessDay'",
                      statement_period)

    # Usar toDate del XML como fecha del snapshot (formato: YYYYMMDD)
    snapshot_date = datetime.now(UTC)
    if to_date:
        try:
            snapshot_date = datetime.strptime(to_date, "%Y%m%d").replace(tzinfo=UTC)
            logger.info("Using toDate as snapshot date: %s", snapshot_date)
        except ValueError:
            logger.warning("Could not parse toDate: %s", to_date)

    day_start = snapshot_date.replace(hour=0, minute=0, second=0, microsecond=0)
    day_end = day_start + timedelta(days=1)

    # Obtener snapshot anterior para calcular daily_pnl
    prev_snapshot = (
        db.query(PortfolioSnapshot)
        .filter(
            PortfolioSnapshot.broker_connection_id == conn.id,
            PortfolioSnapshot.snapshot_date < day_start,
        )
        .order_by(PortfolioSnapshot.snapshot_date.desc())
        .first()
    )

    # Guardar posiciones anteriores para calcular variación diaria
    prev_positions = {
        p.symbol: p
        for p in db.query(Position).filter(
            Position.broker_connection_id == conn.id
        ).all()
    }

    # Borrar posiciones anteriores
    db.query(Position).filter(Position.broker_connection_id == conn.id).delete()

    positions_data = report.get("positions", [])
    for pos in positions_data:
        symbol = pos.get("symbol") or "UNKNOWN"
        market_price = pos.get("market_price")

        # Calcular variación diaria del precio comparando con snapshot anterior
        daily_price_change_pct = None
        if symbol in prev_positions and market_price is not None:
            prev_price = prev_positions[symbol].market_price
            if prev_price is not None and prev_price > 0:
                daily_price_change_pct = (
                    (market_price - prev_price) / prev_price
                ) * 100

        db_position = Position(
            broker_connection_id=conn.id,
            symbol=symbol,
            description=pos.get("description"),
            asset_class=pos.get("asset_class"),
            sector=pos.get("sector"),
            currency=pos.get("currency"),
            quantity=pos.get("quantity") or Decimal("0"),
            avg_cost=pos.get("avg_cost"),
            market_price=market_price,
            market_value=pos.get("market_value"),
            unrealized_pnl=pos.get("unrealized_pnl"),
            realized_pnl=pos.get("realized_pnl"),
            cost_basis_price=pos.get("cost_basis_price"),
            fifo_pnl_unrealized=pos.get("fifo_pnl_unrealized"),
            daily_price_change_pct=daily_price_change_pct,
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

    # Borrar snapshots del mismo dia para evitar duplicados
    db.query(PortfolioSnapshot).filter(
        PortfolioSnapshot.broker_connection_id == conn.id,
        PortfolioSnapshot.snapshot_date >= day_start,
        PortfolioSnapshot.snapshot_date < day_end,
    ).delete()

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
        snapshot_date=snapshot_date,
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

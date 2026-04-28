"""Router de conexión con brokers."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.db import get_db
from app.core.deps import get_current_user
from app.models.broker_connection import BrokerConnection, ConnectionStatus
from app.models.user import User
from app.schemas.broker import (
    BrokerConnectionCreate,
    BrokerConnectionResponse,
    BrokerStatusResponse,
)
from app.services.ibkr_flex_service import IbkrFlexService

router = APIRouter()


@router.post("/connect", response_model=BrokerConnectionResponse)
async def connect_broker(
    data: BrokerConnectionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> BrokerConnection:
    """Conecta una cuenta de IBKR mediante Flex Web Service."""
    # Verificar credenciales con IBKR
    try:
        service = IbkrFlexService(data.flex_token, data.flex_query_id)
        service._send_request()
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid IBKR credentials: {str(e)}",
        )

    # Eliminar conexión previa si existe
    existing = (
        db.query(BrokerConnection)
        .filter(BrokerConnection.user_id == current_user.id)
        .first()
    )
    if existing:
        db.delete(existing)
        db.commit()

    conn = BrokerConnection(
        user_id=current_user.id,
        broker_type=data.broker_type,
        status=ConnectionStatus.CONNECTED.value,
        flex_token=data.flex_token,
        flex_query_id=data.flex_query_id,
        account_id=data.account_id,
    )
    db.add(conn)
    db.commit()
    db.refresh(conn)
    return conn


@router.delete("/disconnect", status_code=status.HTTP_204_NO_CONTENT)
async def disconnect_broker(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> None:
    """Desconecta el broker del usuario."""
    conn = (
        db.query(BrokerConnection)
        .filter(BrokerConnection.user_id == current_user.id)
        .first()
    )
    if not conn:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No broker connection found",
        )
    db.delete(conn)
    db.commit()


@router.get("/status", response_model=BrokerStatusResponse)
async def broker_status(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> dict:
    """Obtiene el estado de la conexión con el broker."""
    conn = (
        db.query(BrokerConnection)
        .filter(BrokerConnection.user_id == current_user.id)
        .first()
    )
    if not conn:
        return {
            "connected": False,
            "message": "No broker connected",
        }

    # Verificar que las credenciales siguen funcionando
    try:
        service = IbkrFlexService(conn.flex_token, conn.flex_query_id)
        service._send_request()
        conn.status = ConnectionStatus.CONNECTED.value
        db.commit()
        return {
            "connected": True,
            "broker_type": conn.broker_type,
            "account_id": conn.account_id,
            "last_sync": conn.updated_at,
            "message": "Connected",
        }
    except Exception:
        conn.status = ConnectionStatus.ERROR.value
        db.commit()
        return {
            "connected": False,
            "broker_type": conn.broker_type,
            "account_id": conn.account_id,
            "message": "Connection error",
        }

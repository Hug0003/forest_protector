# backend/app/api/v1/alerts.py
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional

from app.database import get_db

router = APIRouter()

@router.get("/alerts")
async def list_alerts(
    status: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db)
):
    """Liste tous les alertes"""
    return {
        "alerts": [],
        "total": 0
    }

@router.get("/alerts/{alert_id}")
async def get_alert(alert_id: int, db: AsyncSession = Depends(get_db)):
    """Récupère les détails d'une alerte"""
    return {
        "id": alert_id,
        "message": "Alert",
        "severity": "warning"
    }

@router.post("/alerts/{alert_id}/acknowledge")
async def acknowledge_alert(alert_id: int, db: AsyncSession = Depends(get_db)):
    """Marque une alerte comme traitée"""
    return {
        "id": alert_id,
        "status": "acknowledged"
    }

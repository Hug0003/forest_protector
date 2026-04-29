# backend/app/api/v1/alerts.py
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from typing import Optional

from app.database import get_db

router = APIRouter()

@router.get("/alerts")
async def list_alerts(
    status: Optional[str] = Query(None),
    limit: int = Query(100),
    db: AsyncSession = Depends(get_db)
):
    """Liste toutes les alertes avec les infos du capteur et de la forêt"""
    where_clause = "WHERE a.status = :status" if status else ""
    params = {"limit": limit}
    if status:
        params["status"] = status

    query = text(f"""
        SELECT
            a.id,
            a.severity,
            a.message,
            a.metric_value,
            a.status,
            a.triggered_at,
            a.resolved_at,
            s.uid AS sensor_uid,
            f.name AS forest_name
        FROM alerts a
        LEFT JOIN sensors s ON a.sensor_id = s.id
        LEFT JOIN forests f ON s.forest_id = f.id
        {where_clause}
        ORDER BY a.triggered_at DESC
        LIMIT :limit
    """)

    result = await db.execute(query, params)
    rows = result.fetchall()

    return {
        "alerts": [
            {
                "id": row.id,
                "severity": row.severity,
                "message": row.message,
                "metric_value": row.metric_value,
                "status": row.status,
                "triggered_at": row.triggered_at.isoformat() if row.triggered_at else None,
                "resolved_at": row.resolved_at.isoformat() if row.resolved_at else None,
                "sensor_uid": row.sensor_uid,
                "forest_name": row.forest_name,
            }
            for row in rows
        ],
        "total": len(rows)
    }


@router.get("/alerts/{alert_id}")
async def get_alert(alert_id: int, db: AsyncSession = Depends(get_db)):
    """Récupère les détails d'une alerte"""
    query = text("""
        SELECT
            a.id, a.severity, a.message, a.metric_value,
            a.status, a.triggered_at, a.resolved_at,
            s.uid AS sensor_uid,
            f.name AS forest_name
        FROM alerts a
        LEFT JOIN sensors s ON a.sensor_id = s.id
        LEFT JOIN forests f ON s.forest_id = f.id
        WHERE a.id = :id
    """)
    result = await db.execute(query, {"id": alert_id})
    row = result.fetchone()
    if not row:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Alert not found")

    return {
        "id": row.id,
        "severity": row.severity,
        "message": row.message,
        "metric_value": row.metric_value,
        "status": row.status,
        "triggered_at": row.triggered_at.isoformat() if row.triggered_at else None,
        "resolved_at": row.resolved_at.isoformat() if row.resolved_at else None,
        "sensor_uid": row.sensor_uid,
        "forest_name": row.forest_name,
    }


@router.post("/alerts/{alert_id}/acknowledge")
async def acknowledge_alert(alert_id: int, db: AsyncSession = Depends(get_db)):
    """Marque une alerte comme traitée"""
    await db.execute(
        text("UPDATE alerts SET status = 'acknowledged', acknowledged_at = NOW() WHERE id = :id"),
        {"id": alert_id}
    )
    await db.commit()
    return {"id": alert_id, "status": "acknowledged"}

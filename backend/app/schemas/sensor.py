from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional
from datetime import datetime, timedelta

from app.database import get_db
from app.services.aggregation_service import AggregationService

router = APIRouter()

# ✅ Route STATIQUE en premier — avant toute route avec {paramètre}
@router.get("/sensors/status/technical")
async def get_technical_dashboard(db: AsyncSession = Depends(get_db)):
    """Dashboard technique : capteurs hors ligne, batterie faible"""
    offline     = await AggregationService.get_offline_sensors(db)
    low_battery = await AggregationService.get_low_battery_sensors(db)

    return {
        "summary": {
            "offline_count":     len(offline),
            "low_battery_count": len(low_battery),
        },
        "offline":     offline,
        "low_battery": low_battery
    }

# ✅ Routes DYNAMIQUES après
@router.get("/sensors/{sensor_id}/data")
async def get_sensor_data(
    sensor_id: int,
    start_time: Optional[datetime] = Query(None),
    end_time: Optional[datetime] = Query(None),
    interval: str = Query("1h", pattern="^(1m|5m|15m|1h|6h|1d)$"),
    db: AsyncSession = Depends(get_db)
):
    """Récupère les données d'un capteur avec agrégation temporelle"""
    if not start_time:
        start_time = datetime.utcnow() - timedelta(days=7)
    if not end_time:
        end_time = datetime.utcnow()

    return await AggregationService.get_sensor_timeseries(
        db, sensor_id, start_time, end_time, interval
    )

@router.get("/zones/{zone_id}/average")
async def get_zone_average(
    zone_id: int,
    metric: str = Query(..., pattern="^(temperature|air_humidity|soil_moisture)$"),
    db: AsyncSession = Depends(get_db)
):
    """Calcule la moyenne des capteurs d'une zone sur 24h"""
    return await AggregationService.get_zone_average(db, zone_id, metric)
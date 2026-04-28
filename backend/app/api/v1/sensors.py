from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from typing import Optional
from datetime import datetime, timedelta

from app.database import get_db
from app.services.aggregation_service import AggregationService

router = APIRouter()

@router.get("/sensors/status/technical")
async def get_technical_dashboard(db: AsyncSession = Depends(get_db)):
    offline     = await AggregationService.get_offline_sensors(db)
    low_battery = await AggregationService.get_low_battery_sensors(db)
    return {
        "summary": {
            "offline_count":     len(offline),
            "low_battery_count": len(low_battery)
        },
        "offline":     offline,
        "low_battery": low_battery
    }

@router.get("/sensors")
async def list_sensors(
    status:      Optional[str] = Query(None),
    sensor_type: Optional[int] = Query(None),
    db: AsyncSession = Depends(get_db)
):
    where = ["1=1"]
    params: dict = {}
    if status:
        where.append("s.status = :status")
        params["status"] = status
    if sensor_type:
        where.append("s.sensor_type_id = :sensor_type")
        params["sensor_type"] = sensor_type

    query = text(f"""
        SELECT
            s.id, s.uid, s.status, s.last_seen,
            s.zone_id, s.forest_id, s.sensor_type_id,
            ST_Y(s.location::geometry) AS lat,
            ST_X(s.location::geometry) AS lng,
            (
                SELECT sd.battery_level FROM sensor_data sd
                WHERE sd.sensor_id = s.id
                ORDER BY sd.time DESC LIMIT 1
            ) AS battery_level
        FROM sensors s
        WHERE {' AND '.join(where)}
        ORDER BY s.id
    """)
    result = await db.execute(query, params)
    rows   = result.fetchall()
    return [
        {
            "id":             row.id,
            "uid":            row.uid,
            "status":         row.status,
            "last_seen":      row.last_seen.isoformat() if row.last_seen else None,
            "lat":            row.lat,
            "lng":            row.lng,
            "zone_id":        row.zone_id,
            "forest_id":      row.forest_id,
            "sensor_type_id": row.sensor_type_id,
            "battery_level":  row.battery_level
        }
        for row in rows
    ]

@router.get("/sensors/{sensor_id}/data")
async def get_sensor_data(
    sensor_id:  int,
    start_time: Optional[datetime] = Query(None),
    end_time:   Optional[datetime] = Query(None),
    interval:   str = Query("1h", pattern="^(1m|5m|15m|1h|6h|1d)$"),
    db: AsyncSession = Depends(get_db)
):
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
    metric:  str = Query(..., pattern="^(temperature|air_humidity|soil_moisture)$"),
    db: AsyncSession = Depends(get_db)
):
    return await AggregationService.get_zone_average(db, zone_id, metric)

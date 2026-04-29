from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text

from app.database import get_db
from app.schemas.fire_prediction import (
    FireSpreadPredictionRequest,
    FireSpreadPredictionResponse,
)
from app.services.fire_prediction_service import FirePredictionInput, FirePredictionService


router = APIRouter()


@router.post("/forests/{forest_id}/predict-fire-spread", response_model=FireSpreadPredictionResponse)
async def predict_fire_spread(
    forest_id: int,
    payload: FireSpreadPredictionRequest,
    db: AsyncSession = Depends(get_db),
):
    forest_result = await db.execute(
        text("SELECT id, name, forest_type FROM forests WHERE id = :id"),
        {"id": forest_id},
    )
    forest = forest_result.fetchone()
    if not forest:
        raise HTTPException(status_code=404, detail="Forest not found")

    prediction = FirePredictionService.predict(
        FirePredictionInput(
            forest_type=payload.forest_type or forest.forest_type,
            wind_speed_kmh=payload.wind_speed_kmh,
            wind_direction_deg=payload.wind_direction_deg,
            weather=payload.weather,
            temperature_c=payload.temperature_c,
            forest_humidity_pct=payload.forest_humidity_pct,
            origin_zone=payload.origin_zone,
            time_horizon_minutes=payload.time_horizon_minutes,
            fuel_moisture_pct=payload.fuel_moisture_pct,
        )
    )

    return {
        "forest_id": forest.id,
        "forest_name": forest.name,
        "forest_type": payload.forest_type or forest.forest_type,
        "origin_zone": payload.origin_zone,
        "weather": payload.weather,
        "temperature_c": payload.temperature_c,
        "wind_speed_kmh": payload.wind_speed_kmh,
        "wind_direction_deg": payload.wind_direction_deg,
        "forest_humidity_pct": payload.forest_humidity_pct,
        "time_horizon_minutes": payload.time_horizon_minutes,
        **prediction,
    }
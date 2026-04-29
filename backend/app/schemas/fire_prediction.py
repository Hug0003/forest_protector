from typing import Optional

from pydantic import BaseModel, Field


class FireSpreadPredictionRequest(BaseModel):
    forest_type: Optional[str] = None
    wind_speed_kmh: float = Field(..., ge=0)
    wind_direction_deg: float = Field(..., ge=0, le=360)
    weather: str
    temperature_c: Optional[float] = None
    forest_humidity_pct: float = Field(..., ge=0, le=100)
    origin_zone: str
    time_horizon_minutes: int = Field(60, ge=5, le=720)
    fuel_moisture_pct: Optional[float] = Field(None, ge=0, le=100)


class FireSpreadPredictionResponse(BaseModel):
    forest_id: int
    forest_name: str
    forest_type: Optional[str] = None
    origin_zone: str
    weather: str
    temperature_c: Optional[float] = None
    wind_speed_kmh: float
    wind_direction_deg: float
    forest_humidity_pct: float
    predicted_spread_direction_deg: float
    predicted_spread_direction_label: str
    predicted_spread_speed_kmh: float
    predicted_spread_speed_m_per_h: float
    estimated_distance_m: float
    predicted_affected_zone: str
    confidence: float
    risk_level: str
    time_horizon_minutes: int
    explanation: str
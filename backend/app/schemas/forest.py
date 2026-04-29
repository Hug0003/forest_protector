from pydantic import BaseModel
from typing import Optional, List

class ForestCreate(BaseModel):
    name: str
    description: Optional[str] = None
    total_area: Optional[float] = None
    forest_type: Optional[str] = None
    # GeoJSON polygon coordinates
    coordinates: List[List[List[float]]]

class ForestResponse(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    total_area: Optional[float] = None
    forest_type: Optional[str] = None
    geojson: Optional[dict] = None

class SensorCreate(BaseModel):
    uid: str
    sensor_type_id: int
    forest_id: int
    zone_id: Optional[int] = None
    lat: float
    lng: float
    notes: Optional[str] = None

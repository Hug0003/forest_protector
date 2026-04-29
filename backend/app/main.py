from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1 import forests, sensors, fire_prediction, alerts
from app.database import engine
from sqlalchemy import text

app = FastAPI(
    title="Forest Monitoring API",
    description="Forest monitoring IoT system",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:8100",
        "http://localhost:80",
        "http://localhost",
        "https://forest-fire.hugomeuriel.fr",
        "http://forest-fire.hugomeuriel.fr",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(sensors.router, prefix="/api/v1", tags=["Sensors"])
app.include_router(forests.router, prefix="/api/v1", tags=["Forests"])
app.include_router(fire_prediction.router, prefix="/api/v1", tags=["Fire Prediction"])
app.include_router(alerts.router, prefix="/api/v1", tags=["Alerts"])


@app.get("/health")
async def health_check():
    return {"status": "ok", "service": "forest-monitoring-api"}

@app.on_event("startup")
async def startup_event():
    async with engine.begin() as conn:
        try:
            await conn.execute(text("ALTER TABLE forests ADD COLUMN IF NOT EXISTS forest_type VARCHAR(100);"))
        except Exception as e:
            print(f"Migration error (could be ignored if column already exists): {e}")

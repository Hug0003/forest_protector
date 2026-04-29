from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1 import forests, sensors

app = FastAPI(
    title="Forest Monitoring API",
    description="Forest monitoring IoT system",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:8100", "http://localhost:80"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(sensors.router, prefix="/api/v1", tags=["Sensors"])
app.include_router(forests.router, prefix="/api/v1", tags=["Forests"])


@app.get("/health")
async def health_check():
    return {"status": "ok", "service": "forest-monitoring-api"}

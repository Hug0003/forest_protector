from fastapi import FastAPI

app = FastAPI(
    title="Forest Monitoring API",
    description="Système de monitoring forestier IoT",
    version="1.0.0"
)

@app.get("/health")
async def health_check():
    return {"status": "ok", "service": "forest-monitoring-api"}

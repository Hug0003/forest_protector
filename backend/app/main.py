# backend/app/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
import logging

# Configuration du logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Forest Monitoring API",
    description="API pour le monitoring de capteurs forestiers",
    version="1.0.0"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # En production, spécifier les domaines autorisés
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Health check endpoint (DOIT être présent)
@app.get("/health")
async def health_check():
    return {"status": "ok", "service": "forest-monitoring-api"}

# Import des routers
from app.api.v1 import sensors, forests, alerts, auth

app.include_router(sensors.router, prefix="/api/v1", tags=["sensors"])
app.include_router(forests.router, prefix="/api/v1", tags=["forests"])
app.include_router(alerts.router, prefix="/api/v1", tags=["alerts"])
app.include_router(auth.router, prefix="/api/v1", tags=["auth"])

@app.on_event("startup")
async def startup_event():
    logger.info("🌲 Forest Monitoring API démarrée")
    logger.info(f"📍 Serveur actif sur http://0.0.0.0:8000")
    
    # Test de connexion DB au démarrage
    try:
        from app.database import engine
        async with engine.begin() as conn:
            await conn.execute(text("SELECT 1"))
        logger.info("✅ Connexion à la base de données OK")
    except Exception as e:
        logger.error(f"❌ Erreur de connexion à la base de données: {e}")
        # Ne pas crasher au démarrage, juste logger l'erreur

@app.on_event("shutdown")
async def shutdown_event():
    logger.info("🛑 Arrêt de l'API")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
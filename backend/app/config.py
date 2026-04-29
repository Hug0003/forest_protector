# backend/app/config.py
from pydantic_settings import BaseSettings
import os
from typing import Optional

class Settings(BaseSettings):
    """Configuration centralisée de l'application"""
    
    # Base de données
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL",
        "postgresql+asyncpg://forest_admin:password@localhost:5432/forest_monitoring"
    )
    
    # JWT
    JWT_SECRET: str = os.getenv("JWT_SECRET", "your-secret-key-change-in-prod")
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRATION_HOURS: int = 24
    
    # API externe
    WEATHER_API_KEY: Optional[str] = os.getenv("WEATHER_API_KEY", None)
    
    # Environnement
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
    DEBUG: bool = ENVIRONMENT == "development"

    # SMTP
    SMTP_HOST: str = os.getenv("SMTP_HOST", "smtp.gmail.com")
    SMTP_PORT: int = int(os.getenv("SMTP_PORT", 587))
    SMTP_USER: Optional[str] = os.getenv("SMTP_USER", None)
    SMTP_PASSWORD: Optional[str] = os.getenv("SMTP_PASSWORD", None)
    SMTP_DESTINATION: Optional[str] = os.getenv("SMTP_DESTINATION", None)
    
    class Config:
        env_file = ".env"
        case_sensitive = True

# Instance globale des settings
settings = Settings()

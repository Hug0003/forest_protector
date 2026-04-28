# backend/app/database.py
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import declarative_base
from app.config import settings
import logging

logger = logging.getLogger(__name__)

# Créer l'engine async
engine = create_async_engine(
    settings.DATABASE_URL,
    echo=True,  # Log des requêtes SQL
    future=True,
    pool_pre_ping=True,  # Vérifier la connexion avant utilisation
)

# Session maker
async_session = async_sessionmaker(
    engine, 
    class_=AsyncSession, 
    expire_on_commit=False
)

Base = declarative_base()

# Dependency pour obtenir une session
async def get_db():
    async with async_session() as session:
        try:
            yield session
        finally:
            await session.close()
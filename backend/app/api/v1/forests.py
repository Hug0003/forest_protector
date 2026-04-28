# backend/app/api/v1/forests.py
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List

from app.database import get_db

router = APIRouter()

@router.get("/forests")
async def list_forests(db: AsyncSession = Depends(get_db)):
    """Liste tous les forêts"""
    return {
        "forests": [],
        "total": 0
    }

@router.get("/forests/{forest_id}")
async def get_forest(forest_id: int, db: AsyncSession = Depends(get_db)):
    """Récupère les détails d'une forêt"""
    return {
        "id": forest_id,
        "name": "Forest",
        "zones": []
    }

@router.post("/forests")
async def create_forest(data: dict, db: AsyncSession = Depends(get_db)):
    """Crée une nouvelle forêt"""
    return {
        "id": 1,
        "message": "Forest created"
    }

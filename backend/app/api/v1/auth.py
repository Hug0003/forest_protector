# backend/app/api/v1/auth.py
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional

from app.database import get_db

router = APIRouter()

@router.post("/auth/login")
async def login(credentials: dict, db: AsyncSession = Depends(get_db)):
    """Authentification utilisateur"""
    return {
        "access_token": "token",
        "token_type": "bearer"
    }

@router.post("/auth/logout")
async def logout():
    """Déconnexion utilisateur"""
    return {
        "message": "Logged out"
    }

@router.post("/auth/refresh")
async def refresh_token(refresh_token: str):
    """Renouvelle le token d'accès"""
    return {
        "access_token": "new_token",
        "token_type": "bearer"
    }

@router.get("/auth/me")
async def get_current_user(db: AsyncSession = Depends(get_db)):
    """Récupère le profil de l'utilisateur courant"""
    return {
        "id": 1,
        "username": "user",
        "email": "user@example.com"
    }

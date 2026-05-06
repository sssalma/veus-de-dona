from fastapi import APIRouter, Depends, HTTPException
from uuid import UUID
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.visita import VisitaCreate, VisitaResponse
from app.services import visites as visites_service
from app.services.auth import get_current_user
from app.models.usuari import Usuari
from typing import List

router = APIRouter(
    prefix="/visites",
    tags=["visites"]
)

@router.post("/", response_model=VisitaResponse, status_code=201)
def registrar_visita(
    visita_data: VisitaCreate,
    db: Session = Depends(get_db),
    current_user: Usuari = Depends(get_current_user)
):
    """Registers a visit with automatically inferred mode"""
    visita = visites_service.registrar_visita(
        db,
        current_user,
        str(visita_data.parada_id),
        visita_data.lat,
        visita_data.lng
    )
    if not visita:
        raise HTTPException(status_code=404, detail="Parada no trobada")
    return visita

@router.get("/me", response_model=List[VisitaResponse])
def get_meves_visites(
    db: Session = Depends(get_db),
    current_user: Usuari = Depends(get_current_user)
):
    """Returns all visits for the current user"""
    return visites_service.get_visites_by_usuari(db, UUID(str(current_user.id)))
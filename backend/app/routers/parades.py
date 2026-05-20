from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.parada import ParadaResponse
from app.services import parades as parades_service
from app.services.auth import get_current_user, require_rol
from app.services.storage import get_file_url
from app.models.usuari import Usuari, RolUsuari
from typing import List

router = APIRouter(
    prefix="/parades",
    tags=["parades"]
)

#public endpoints
@router.get("/", response_model=List[ParadaResponse])
def get_parades(db: Session = Depends(get_db)):
    """Returns all active stops ordered by route order"""
    return parades_service.get_all_parades(db)

@router.get("/{parada_id}", response_model=ParadaResponse)
def get_parada(parada_id: str, db: Session = Depends(get_db)):
    """Returns a single stop by ID"""
    parada = parades_service.get_parada_by_id(db, parada_id)
    if not parada:
        raise HTTPException(status_code=404, detail="Parada no trobada")
    return parada

# editor/admin only endpoint

@router.get("/{parada_id}/foto")
def get_parada_foto(parada_id: str, db: Session = Depends(get_db)):
    """Returns a presigned URL for the parada photo"""
    parada = parades_service.get_parada_by_id(db, parada_id)
    if not parada:
        raise HTTPException(status_code=404, detail="Parada no trobada")
    if not parada.foto_minio_key:
        raise HTTPException(status_code=404, detail="Aquesta parada no té foto")
    url = get_file_url(parada.foto_minio_key)
    if not url:
        raise HTTPException(status_code=500, detail="Error en generar la URL de la foto")
    return {"url": url}

@router.patch("/{parada_id}/activa")
def toggle_parada(
    parada_id: str,
    activa: bool,
    db: Session = Depends(get_db),
    current_user: Usuari = Depends(require_rol(RolUsuari.EDITOR, RolUsuari.ADMINISTRADOR))
):
    """Enables or disables a stop - editor/admin only"""
    parada = parades_service.toggle_parada_activa(db, parada_id, activa)
    if not parada:
        raise HTTPException(status_code=404, detail="Parada no trobada")
    return parada
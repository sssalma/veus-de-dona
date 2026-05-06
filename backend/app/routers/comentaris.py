from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.comentari import ComentariCreate, ComentariResponse
from app.services import comentaris as comentaris_service
from app.services.auth import get_current_user, require_rol
from app.models.usuari import Usuari, RolUsuari
from typing import List

router = APIRouter(
    prefix="/comentaris",
    tags=["comentaris"]
)

@router.post("/", response_model=ComentariResponse, status_code=201)
def afegir_comentari(
    comentari_data: ComentariCreate,
    db: Session = Depends(get_db),
    current_user: Usuari = Depends(get_current_user)
):
    """Adds a comment to a stop"""
    comentari = comentaris_service.afegir_comentari(
        db,
        current_user,
        str(comentari_data.parada_id),
        comentari_data.contingut
    )
    if not comentari:
        raise HTTPException(status_code=404, detail="Parada no trobada")
    return comentari

@router.delete("/{comentari_id}", status_code=204)
def eliminar_comentari(
    comentari_id: str,
    db: Session = Depends(get_db),
    current_user: Usuari = Depends(
        require_rol(RolUsuari.EDITOR, RolUsuari.ADMINISTRADOR)
    )
):
    """Deletes a comment - editor/admin only"""
    deleted = comentaris_service.eliminar_comentari(db, comentari_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Comentari no trobat")

@router.get("/parada/{parada_id}", response_model=List[ComentariResponse])
def get_comentaris(parada_id: str, db: Session = Depends(get_db)):
    """Returns all comments for a stop"""
    return comentaris_service.get_comentaris_by_parada(db, parada_id)
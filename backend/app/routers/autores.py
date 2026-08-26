from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.autora import AutoraResponse, AutoraUpdate
from app.services import autores as autores_service
from app.services.auth import require_rol
from app.services.storage import get_file_url
from app.models.usuari import Usuari, RolUsuari
from typing import List

router = APIRouter(
    prefix="/autores",
    tags=["autores"]
)

@router.get("/", response_model=List[AutoraResponse])
def get_autores(db: Session = Depends(get_db)):
    """Returns all authors ordered by surname"""
    return autores_service.get_all_autores(db)

@router.get("/{autora_id}", response_model=AutoraResponse)
def get_autora(autora_id: str, db: Session = Depends(get_db)):
    """Returns a single author by ID"""
    autora = autores_service.get_autora_by_id(db, autora_id)
    if not autora:
        raise HTTPException(status_code=404, detail="Autora no trobada")
    return autora

@router.get("/{autora_id}/foto")
def get_autora_foto(autora_id: str, db: Session = Depends(get_db)):
    """Returns a presigned URL for the author's portrait"""
    autora = autores_service.get_autora_by_id(db, autora_id)
    if not autora:
        raise HTTPException(status_code=404, detail="Autora no trobada")
    if not autora.foto_minio_key:
        raise HTTPException(status_code=404, detail="Aquesta autora no té foto")
    url = get_file_url(str(autora.foto_minio_key))
    if not url:
        raise HTTPException(status_code=500, detail="Error en generar la URL de la foto")
    return {"url": url}

@router.post("/{autora_id}/foto", response_model=AutoraResponse)
async def pujar_foto_autora(
    autora_id: str,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: Usuari = Depends(require_rol(RolUsuari.EDITOR, RolUsuari.ADMINISTRADOR))
):
    """Uploads a new portrait for an author, replacing the previous one - editor/admin only"""
    file_bytes = await file.read()
    autora = autores_service.update_autora_foto(
        db, autora_id, file_bytes, file.filename or "foto.jpg", file.content_type or "image/jpeg"
    )
    if not autora:
        raise HTTPException(status_code=404, detail="Autora no trobada o error al pujar la foto")
    return autora

@router.patch("/{autora_id}", response_model=AutoraResponse)
def update_autora(
    autora_id: str,
    dades: AutoraUpdate,
    db: Session = Depends(get_db),
    current_user: Usuari = Depends(require_rol(RolUsuari.EDITOR, RolUsuari.ADMINISTRADOR))
):
    """Updates an author's fields - editor/admin only"""
    autora = autores_service.update_autora(db, autora_id, dades.model_dump(exclude_unset=True))
    if not autora:
        raise HTTPException(status_code=404, detail="Autora no trobada")
    return autora
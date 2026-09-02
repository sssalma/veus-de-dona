from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.parada import ParadaResponse, ParadaUpdate
from app.services import parades as parades_service
from app.services.auth import get_current_user, require_rol
from app.services.storage import get_file_url
from app.models.usuari import Usuari, RolUsuari
from typing import List

router = APIRouter(
    prefix="/parades",
    tags=["parades"]
)

@router.get("/", response_model=List[ParadaResponse])
def get_parades(db: Session = Depends(get_db)):
    """Torna les parades actives, per ordre de ruta."""
    return parades_service.get_all_parades(db)

@router.get("/totes", response_model=List[ParadaResponse])
def get_totes_les_parades(
    db: Session = Depends(get_db),
    current_user: Usuari = Depends(require_rol(RolUsuari.EDITOR, RolUsuari.ADMINISTRADOR))
):
    """Torna totes les parades, també les desactivades. Només editor i administració."""
    return parades_service.get_totes_les_parades(db)

@router.get("/{parada_id}", response_model=ParadaResponse)
def get_parada(parada_id: str, db: Session = Depends(get_db)):
    """Torna una parada per identificador."""
    parada = parades_service.get_parada_by_id(db, parada_id)
    if not parada:
        raise HTTPException(status_code=404, detail="Parada no trobada")
    return parada


@router.get("/{parada_id}/foto")
def get_parada_foto(parada_id: str, db: Session = Depends(get_db)):
    """Torna una URL pre-signada de la foto de la parada."""
    parada = parades_service.get_parada_by_id(db, parada_id)
    if not parada:
        raise HTTPException(status_code=404, detail="Parada no trobada")
    if not parada.foto_minio_key:
        raise HTTPException(status_code=404, detail="Aquesta parada no té foto")
    url = get_file_url(parada.foto_minio_key)
    if not url:
        raise HTTPException(status_code=500, detail="Error en generar la URL de la foto")
    return {"url": url}

@router.patch("/{parada_id}", response_model=ParadaResponse)
def update_parada(
    parada_id: str,
    dades: ParadaUpdate,
    db: Session = Depends(get_db),
    current_user: Usuari = Depends(require_rol(RolUsuari.EDITOR, RolUsuari.ADMINISTRADOR))
):
    """Actualitza els camps editables d'una parada. Només editor i administració."""
    parada = parades_service.update_parada(db, parada_id, dades.model_dump(exclude_unset=True))
    if not parada:
        raise HTTPException(status_code=404, detail="Parada no trobada")
    return parada

@router.post("/{parada_id}/foto", response_model=ParadaResponse)
async def pujar_foto_parada(
    parada_id: str,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: Usuari = Depends(require_rol(RolUsuari.EDITOR, RolUsuari.ADMINISTRADOR))
):
    """Puja una foto nova de la parada i esborra l'anterior. Només editor i administració."""
    file_bytes = await file.read()
    parada = parades_service.update_parada_foto(
        db, parada_id, file_bytes, file.filename or "foto.jpg", file.content_type or "image/jpeg"
    )
    if not parada:
        raise HTTPException(status_code=404, detail="Parada no trobada o error al pujar la foto")
    return parada

@router.patch("/{parada_id}/activa")
def toggle_parada(
    parada_id: str,
    activa: bool,
    db: Session = Depends(get_db),
    current_user: Usuari = Depends(require_rol(RolUsuari.EDITOR, RolUsuari.ADMINISTRADOR))
):
    """Activa o desactiva una parada. Només editor i administració."""
    parada = parades_service.toggle_parada_activa(db, parada_id, activa)
    if not parada:
        raise HTTPException(status_code=404, detail="Parada no trobada")
    return parada
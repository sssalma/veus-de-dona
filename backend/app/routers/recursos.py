from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.recurs import RecursResponse
from app.services import recursos as recursos_service
from app.services.auth import get_current_user, require_rol
from app.models.usuari import Usuari, RolUsuari
from app.models.recurs import TipusRecurs
from typing import List

router = APIRouter(
    prefix="/recursos",
    tags=["recursos"]
)

@router.post("/", response_model=RecursResponse, status_code=201)
async def pujar_recurs(
    text_id: str = Form(...),
    tipus: TipusRecurs = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: Usuari = Depends(
        require_rol(RolUsuari.EDITOR, RolUsuari.ADMINISTRADOR)
    )
):
    """Puja un fitxer a MinIO. Només editor i administració."""
    file_bytes = await file.read()
    recurs = recursos_service.pujar_recurs(
        db,
        text_id,
        file_bytes,
        file.filename or "recurs",
        file.content_type or "application/octet-stream",
        tipus
    )
    if not recurs:
        raise HTTPException(status_code=404, detail="Text no trobat o error al pujar el fitxer")
    return recurs

@router.delete("/{recurs_id}", status_code=204)
def esborrar_recurs(
    recurs_id: str,
    db: Session = Depends(get_db),
    current_user: Usuari = Depends(
        require_rol(RolUsuari.EDITOR, RolUsuari.ADMINISTRADOR)
    )
):
    """Esborra un recurs de MinIO i de PostgreSQL. Només editor i administració."""
    deleted = recursos_service.esborrar_recurs(db, recurs_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Recurs no trobat")

@router.get("/{recurs_id}/url")
def get_recurs_url(recurs_id: str, db: Session = Depends(get_db)):
    """Torna una URL pre-signada per reproduir el recurs."""
    url = recursos_service.get_recurs_url(db, recurs_id)
    if not url:
        raise HTTPException(status_code=404, detail="Recurs no trobat")
    return {"url": url}

@router.get("/text/{text_id}", response_model=List[RecursResponse])
def get_recursos_by_text(text_id: str, db: Session = Depends(get_db)):
    """Torna els recursos d'un text."""
    return recursos_service.get_recursos_by_text(db, text_id)
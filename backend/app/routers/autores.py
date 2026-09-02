from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.autora import (
    AutoraResponse,
    AutoraUpdate,
    TraduccioAutora,
    TraduccioAutoraUpdate,
)
from app.services import autores as autores_service
from app.services.auth import require_rol
from app.services.storage import get_file_url
from app.models.usuari import Usuari, RolUsuari, Idioma
from typing import List

router = APIRouter(
    prefix="/autores",
    tags=["autores"]
)

@router.get("/", response_model=List[AutoraResponse])
def get_autores(idioma: Idioma = Idioma.CA, db: Session = Depends(get_db)):
    """Torna les autores per cognom, amb la biografia en l'idioma demanat quan
    n'hi ha traducció."""
    autores = autores_service.get_all_autores(db)
    return [autores_service.aplica_idioma(a, idioma) for a in autores]

@router.get("/{autora_id}", response_model=AutoraResponse)
def get_autora(autora_id: str, idioma: Idioma = Idioma.CA, db: Session = Depends(get_db)):
    """Torna una autora, amb la biografia en l'idioma demanat."""
    autora = autores_service.get_autora_by_id(db, autora_id)
    if not autora:
        raise HTTPException(status_code=404, detail="Autora no trobada")
    return autores_service.aplica_idioma(autora, idioma)

@router.get("/{autora_id}/foto")
def get_autora_foto(autora_id: str, db: Session = Depends(get_db)):
    """Torna una URL pre-signada del retrat de l'autora."""
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
    """Puja un retrat nou i esborra l'anterior. Només editor i administració."""
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
    """Actualitza els camps d'una autora. Només editor i administració."""
    autora = autores_service.update_autora(db, autora_id, dades.model_dump(exclude_unset=True))
    if not autora:
        raise HTTPException(status_code=404, detail="Autora no trobada")
    return autora


# Traduccions de la biografia: només edició. El català no té endpoint propi,
# viu a autora.bio. Els textos literaris no s'editen: venen del web del
# projecte amb `scripts/scraper_traduccions_textos.py`.

@router.get("/{autora_id}/traduccions", response_model=List[TraduccioAutora])
def get_traduccions(
    autora_id: str,
    db: Session = Depends(get_db),
    current_user: Usuari = Depends(require_rol(RolUsuari.EDITOR, RolUsuari.ADMINISTRADOR))
):
    """Totes les biografies traduïdes d'una autora. Només editor i administració."""
    if not autores_service.get_autora_by_id(db, autora_id):
        raise HTTPException(status_code=404, detail="Autora no trobada")
    return autores_service.get_traduccions(db, autora_id)


@router.put("/{autora_id}/traduccions/{idioma}", response_model=TraduccioAutora)
def set_traduccio(
    autora_id: str,
    idioma: Idioma,
    dades: TraduccioAutoraUpdate,
    db: Session = Depends(get_db),
    current_user: Usuari = Depends(require_rol(RolUsuari.EDITOR, RolUsuari.ADMINISTRADOR))
):
    """Crea o reescriu la biografia d'una autora en un idioma."""
    if idioma == Idioma.CA:
        raise HTTPException(
            status_code=400,
            detail="La biografia en catala s'edita a la fitxa de l'autora"
        )
    traduccio = autores_service.set_traduccio(db, autora_id, idioma, dades.bio)
    if not traduccio:
        raise HTTPException(status_code=404, detail="Autora no trobada")
    return traduccio


@router.delete("/{autora_id}/traduccions/{idioma}", status_code=204)
def esborra_traduccio(
    autora_id: str,
    idioma: Idioma,
    db: Session = Depends(get_db),
    current_user: Usuari = Depends(require_rol(RolUsuari.EDITOR, RolUsuari.ADMINISTRADOR))
):
    """Treu una traducció; la fitxa torna a ensenyar el català."""
    if not autores_service.esborra_traduccio(db, autora_id, idioma):
        raise HTTPException(status_code=404, detail="Traduccio no trobada")

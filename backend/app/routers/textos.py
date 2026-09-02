from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.text import TextResponse, TextUpdate
from app.services import textos as textos_service
from app.services.auth import require_rol
from app.models.usuari import Usuari, RolUsuari, Idioma
from typing import List

router = APIRouter(
    prefix="/textos",
    tags=["textos"]
)

# El text va en l'idioma demanat quan el web del projecte en publica la
# traducció. Sense `idioma` va el català, que és el que ha de veure el panell
# d'edició, on s'edita l'original.

@router.get("/", response_model=List[TextResponse])
def get_textos(idioma: Idioma = Idioma.CA, db: Session = Depends(get_db)):
    """Torna tots els textos, per ordre de ruta."""
    textos = textos_service.get_all_textos(db)
    return [textos_service.aplica_idioma(t, idioma) for t in textos]

@router.get("/parada/{parada_id}", response_model=List[TextResponse])
def get_textos_by_parada(parada_id: str, idioma: Idioma = Idioma.CA, db: Session = Depends(get_db)):
    """Torna els textos d'una parada."""
    textos = textos_service.get_textos_by_parada(db, parada_id)
    return [textos_service.aplica_idioma(t, idioma) for t in textos]

@router.get("/autora/{autora_id}", response_model=List[TextResponse])
def get_textos_by_autora(autora_id: str, idioma: Idioma = Idioma.CA, db: Session = Depends(get_db)):
    """Torna els textos d'una autora."""
    textos = textos_service.get_textos_by_autora(db, autora_id)
    return [textos_service.aplica_idioma(t, idioma) for t in textos]

@router.get("/{text_id}", response_model=TextResponse)
def get_text(text_id: str, idioma: Idioma = Idioma.CA, db: Session = Depends(get_db)):
    """Torna un text per identificador."""
    text = textos_service.get_text_by_id(db, text_id)
    if not text:
        raise HTTPException(status_code=404, detail="Text no trobat")
    return textos_service.aplica_idioma(text, idioma)

@router.patch("/{text_id}", response_model=TextResponse)
def update_text(
    text_id: str,
    dades: TextUpdate,
    db: Session = Depends(get_db),
    current_user: Usuari = Depends(require_rol(RolUsuari.EDITOR, RolUsuari.ADMINISTRADOR))
):
    """Actualitza els camps d'un text. Només editor i administració."""
    text = textos_service.update_text(db, text_id, dades.model_dump(exclude_unset=True))
    if not text:
        raise HTTPException(status_code=404, detail="Text no trobat")
    return text
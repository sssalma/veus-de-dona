from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.like import LikeResponse
from app.schemas.text import TextResponse
from app.services import likes as likes_service
from app.services import textos as textos_service
from app.services.auth import get_current_user
from app.models.usuari import Usuari, Idioma
from typing import List

router = APIRouter(
    prefix="/likes",
    tags=["likes"]
)

# Va abans de les rutes amb parametre perque "/me" no s'interpreti com un
# identificador de text.
@router.get("/me", response_model=List[TextResponse])
def get_textos_preferits(
    idioma: Idioma = Idioma.CA,
    db: Session = Depends(get_db),
    current_user: Usuari = Depends(get_current_user)
):
    """Els textos que ha marcat qui ho demana, del mes recent al mes antic."""
    textos = likes_service.get_textos_preferits(db, current_user)
    return [textos_service.aplica_idioma(text, idioma) for text in textos]

@router.post("/{text_id}", response_model=LikeResponse, status_code=201)
def donar_like(
    text_id: str,
    db: Session = Depends(get_db),
    current_user: Usuari = Depends(get_current_user)
):
    """Adds a like to a text"""
    like = likes_service.donar_like(db, current_user, text_id)
    if not like:
        raise HTTPException(status_code=404, detail="Text no trobat")
    return like

@router.delete("/{text_id}", status_code=204)
def treure_like(
    text_id: str,
    db: Session = Depends(get_db),
    current_user: Usuari = Depends(get_current_user)
):
    """Removes a like from a text"""
    deleted = likes_service.treure_like(db, current_user, text_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Like no trobat")

@router.get("/{text_id}/count")
def get_likes_count(text_id: str, db: Session = Depends(get_db)):
    """Returns the number of likes for a text"""
    return {"text_id": text_id, "likes": likes_service.get_likes_by_text(db, text_id)}

@router.get("/{text_id}/check")
def check_like(
    text_id: str,
    db: Session = Depends(get_db),
    current_user: Usuari = Depends(get_current_user)
):
    """Returns whether the current user has liked a text"""
    liked = likes_service.has_liked(db, current_user, text_id)
    count = likes_service.get_likes_by_text(db, text_id)
    return {"liked": liked, "count": count}
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.text import TextResponse
from app.services import textos as textos_service
from typing import List

router = APIRouter(
    prefix="/textos",
    tags=["textos"]
)

@router.get("/parada/{parada_id}", response_model=List[TextResponse])
def get_textos_by_parada(parada_id: str, db: Session = Depends(get_db)):
    """Returns all texts for a given stop"""
    return textos_service.get_textos_by_parada(db, parada_id)

@router.get("/autora/{autora_id}", response_model=List[TextResponse])
def get_textos_by_autora(autora_id: str, db: Session = Depends(get_db)):
    """Returns all texts for a given author"""
    return textos_service.get_textos_by_autora(db, autora_id)

@router.get("/{text_id}", response_model=TextResponse)
def get_text(text_id: str, db: Session = Depends(get_db)):
    """Returns a single text by ID"""
    text = textos_service.get_text_by_id(db, text_id)
    if not text:
        raise HTTPException(status_code=404, detail="Text no trobat")
    return text
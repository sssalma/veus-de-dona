from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.autora import AutoraResponse
from app.services import autores as autores_service
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
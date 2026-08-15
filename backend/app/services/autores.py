from sqlalchemy.orm import Session
from app.models.autora import Autora

def get_all_autores(db: Session):
    """Returns all authors ordered by surname"""
    return db.query(Autora)\
        .order_by(Autora.cognom)\
        .all()

def get_autora_by_id(db: Session, autora_id: str):
    """Returns a single author by ID or None if not found"""
    return db.query(Autora)\
        .filter(Autora.id == autora_id)\
        .first()

def update_autora(db: Session, autora_id: str, dades: dict) -> Autora | None:
    """Updates the given fields of an author, returns None if not found"""
    autora = get_autora_by_id(db, autora_id)
    if not autora:
        return None
    for camp, valor in dades.items():
        setattr(autora, camp, valor)
    db.commit()
    db.refresh(autora)
    return autora
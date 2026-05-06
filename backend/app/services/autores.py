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
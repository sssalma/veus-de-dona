from sqlalchemy.orm import Session
from app.models.text import Text

def get_textos_by_parada(db: Session, parada_id: str):
    """Returns all texts for a given stop"""
    return db.query(Text)\
        .filter(Text.parada_id == parada_id)\
        .all()

def get_textos_by_autora(db: Session, autora_id: str):
    """Returns all texts for a given author"""
    return db.query(Text)\
        .filter(Text.autora_id == autora_id)\
        .all()

def get_text_by_id(db: Session, text_id: str):
    """Returns a single text by ID or None if not found"""
    return db.query(Text)\
        .filter(Text.id == text_id)\
        .first()
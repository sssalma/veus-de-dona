from sqlalchemy.orm import Session
from app.models.text import Text
from app.models.parada import Parada

def get_all_textos(db: Session):
    """Returns every text, ordered by route order then title.
    Without this the admin screen had to ask for one endpoint per stop."""
    return db.query(Text)\
        .join(Parada, Text.parada_id == Parada.id)\
        .order_by(Parada.ordre, Text.titol)\
        .all()

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

def update_text(db: Session, text_id: str, dades: dict) -> Text | None:
    """Updates the given fields of a text, returns None if not found"""
    text = get_text_by_id(db, text_id)
    if not text:
        return None
    for camp, valor in dades.items():
        setattr(text, camp, valor)
    db.commit()
    db.refresh(text)
    return text
from sqlalchemy.orm import Session
from app.models.parada import Parada

def get_all_parades(db: Session):
    """Returns all active stops ordered by route order"""
    return db.query(Parada)\
        .filter(Parada.activa == True)\
        .order_by(Parada.ordre)\
        .all()

def get_parada_by_id(db: Session, parada_id: str):
    """Returns a single stop by ID or None if not found"""
    return db.query(Parada)\
        .filter(Parada.id == parada_id)\
        .first()
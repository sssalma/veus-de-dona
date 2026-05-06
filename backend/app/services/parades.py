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

def toggle_parada_activa(db: Session, parada_id: str, activa: bool) -> Parada | None:
    """Enables or disables a stop, returns None if not found"""
    parada = get_parada_by_id(db, parada_id)
    if not parada:
        return None
    setattr(parada, 'activa', activa)
    db.commit()
    db.refresh(parada)
    return parada
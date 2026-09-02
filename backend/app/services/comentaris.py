from sqlalchemy.orm import Session
from sqlalchemy.sql import func
from app.models.comentari import Comentari
from app.models.parada import Parada
from app.models.usuari import Usuari
from uuid import UUID

def afegir_comentari(
    db: Session,
    usuari: Usuari,
    parada_id: str,
    contingut: str
) -> Comentari | None:
    """Afegeix un comentari a una parada; None si la parada no hi és."""
    parada = db.query(Parada).filter(Parada.id == parada_id).first()
    if not parada:
        return None

    nou_comentari = Comentari(
        usuari_id=usuari.id,
        parada_id=parada_id,
        contingut=contingut
    )
    db.add(nou_comentari)
    db.commit()
    db.refresh(nou_comentari)
    return nou_comentari

def eliminar_comentari(db: Session, comentari_id: str) -> bool:
    """Esborra un comentari; True si l'ha esborrat."""
    comentari = db.query(Comentari).filter(Comentari.id == comentari_id).first()
    if not comentari:
        return False
    db.delete(comentari)
    db.commit()
    return True

def respondre_comentari(db: Session, comentari_id: str, resposta: str) -> Comentari | None:
    """Escriu o reescriu la resposta a un comentari; None si no hi és."""
    comentari = db.query(Comentari).filter(Comentari.id == comentari_id).first()
    if not comentari:
        return None
    setattr(comentari, "resposta_editor", resposta)
    setattr(comentari, "resposta_data", func.now())
    db.commit()
    db.refresh(comentari)
    return comentari

def get_comentaris_by_parada(db: Session, parada_id: str):
    """Torna els comentaris d'una parada, per data."""
    return db.query(Comentari)\
        .filter(Comentari.parada_id == parada_id)\
        .order_by(Comentari.data_creacio.desc())\
        .all()

def get_all_comentaris(db: Session):
    """Tots els comentaris, del més recent al més antic, per moderar-los."""
    return db.query(Comentari)\
        .order_by(Comentari.data_creacio.desc())\
        .all()
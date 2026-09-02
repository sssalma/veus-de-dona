from sqlalchemy.orm import Session
from app.models.like import Like
from app.models.text import Text
from app.models.usuari import Usuari
from uuid import UUID

def donar_like(db: Session, usuari: Usuari, text_id: str) -> Like | None:
    """Marca un text; None si el text no hi és."""
    text = db.query(Text).filter(Text.id == text_id).first()
    if not text:
        return None

    # ja marcat?
    like_existent = db.query(Like).filter(
        Like.usuari_id == usuari.id,
        Like.text_id == text_id
    ).first()
    if like_existent:
        return like_existent

    nou_like = Like(
        usuari_id=usuari.id,
        text_id=text_id
    )
    db.add(nou_like)
    db.commit()
    db.refresh(nou_like)
    return nou_like

def treure_like(db: Session, usuari: Usuari, text_id: str) -> bool:
    """Desmarca un text; True si l'ha tret."""
    like = db.query(Like).filter(
        Like.usuari_id == usuari.id,
        Like.text_id == text_id
    ).first()
    if not like:
        return False
    db.delete(like)
    db.commit()
    return True

def get_likes_by_text(db: Session, text_id: str) -> int:
    """Torna quantes vegades s'ha marcat un text."""
    return db.query(Like).filter(Like.text_id == text_id).count()

def has_liked(db: Session, usuari: Usuari, text_id: str) -> bool:
    """Diu si la persona ja ha marcat el text."""
    return db.query(Like).filter(
        Like.usuari_id == usuari.id,
        Like.text_id == text_id
    ).first() is not None

def get_textos_preferits(db: Session, usuari: Usuari):
    """Els textos que ha marcat una persona, del més recent al més antic.

    El like es desa amb la seva data des de la migració inicial, però fins ara
    no el llegia ningú: es podia marcar un text i no tornar-lo a trobar mai.
    Això és l'única consulta que faltava per convertir-los en una antologia.
    """
    return (
        db.query(Text)
        .join(Like, Like.text_id == Text.id)
        .filter(Like.usuari_id == usuari.id)
        .order_by(Like.data_creacio.desc())
        .all()
    )

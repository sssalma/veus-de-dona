from sqlalchemy.orm import Session
from app.models.like import Like
from app.models.text import Text
from app.models.usuari import Usuari
from uuid import UUID

def donar_like(db: Session, usuari: Usuari, text_id: str) -> Like | None:
    """Adds a like to a text, returns None if text not found"""
    text = db.query(Text).filter(Text.id == text_id).first()
    if not text:
        return None

    # check if already liked
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
    """Removes a like from a text, returns True if deleted"""
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
    """Returns the number of likes for a text"""
    return db.query(Like).filter(Like.text_id == text_id).count()

def has_liked(db: Session, usuari: Usuari, text_id: str) -> bool:
    """Returns True if the user has already liked the text"""
    return db.query(Like).filter(
        Like.usuari_id == usuari.id,
        Like.text_id == text_id
    ).first() is not None

def get_textos_preferits(db: Session, usuari: Usuari):
    """Els textos que ha marcat una persona, del mes recent al mes antic.

    El like es desa amb la seva data des de la migracio inicial, pero fins ara
    no el llegia ningu: es podia marcar un text i no tornar-lo a trobar mai.
    Aixo es l'unica consulta que faltava per convertir-los en una antologia.
    """
    return (
        db.query(Text)
        .join(Like, Like.text_id == Text.id)
        .filter(Like.usuari_id == usuari.id)
        .order_by(Like.data_creacio.desc())
        .all()
    )

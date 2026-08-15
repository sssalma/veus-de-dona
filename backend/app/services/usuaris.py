from sqlalchemy.orm import Session
from app.models.usuari import Usuari, RolUsuari, Idioma

def get_all_usuaris(db: Session):
    """Returns all users"""
    return db.query(Usuari).order_by(Usuari.data_registre.desc()).all()

def get_usuari_by_id(db: Session, usuari_id: str) -> Usuari | None:
    return db.query(Usuari).filter(Usuari.id == usuari_id).first()

def set_actiu(db: Session, usuari_id: str, actiu: bool) -> Usuari | None:
    """Activates/deactivates a user account"""
    usuari = get_usuari_by_id(db, usuari_id)
    if not usuari:
        return None
    setattr(usuari, "actiu", actiu)
    db.commit()
    db.refresh(usuari)
    return usuari

def set_rol(db: Session, usuari_id: str, rol: RolUsuari) -> Usuari | None:
    """Changes a user's role - admin only, caller must enforce that"""
    usuari = get_usuari_by_id(db, usuari_id)
    if not usuari:
        return None
    setattr(usuari, "rol", rol)
    db.commit()
    db.refresh(usuari)
    return usuari

def set_idioma(db: Session, usuari: Usuari, idioma: Idioma) -> Usuari:
    """Self-service language change"""
    setattr(usuari, "idioma", idioma)
    db.commit()
    db.refresh(usuari)
    return usuari

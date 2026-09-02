from sqlalchemy.orm import Session
from app.models.usuari import Usuari, RolUsuari, Idioma
from app.services.auth import hash_password

def get_all_usuaris(db: Session):
    """Torna tots els comptes."""
    return db.query(Usuari).order_by(Usuari.data_registre.desc()).all()

def get_usuari_by_id(db: Session, usuari_id: str) -> Usuari | None:
    return db.query(Usuari).filter(Usuari.id == usuari_id).first()

def set_actiu(db: Session, usuari_id: str, actiu: bool) -> Usuari | None:
    """Activa o desactiva un compte."""
    usuari = get_usuari_by_id(db, usuari_id)
    if not usuari:
        return None
    setattr(usuari, "actiu", actiu)
    db.commit()
    db.refresh(usuari)
    return usuari

def set_rol(db: Session, usuari_id: str, rol: RolUsuari) -> Usuari | None:
    """Canvia el rol d'un compte. Qui la crida ha de comprovar que és administració."""
    usuari = get_usuari_by_id(db, usuari_id)
    if not usuari:
        return None
    setattr(usuari, "rol", rol)
    db.commit()
    db.refresh(usuari)
    return usuari

def update_perfil(db: Session, usuari: Usuari, dades: dict) -> Usuari:
    """Actualitza els camps del propi perfil."""
    for camp, valor in dades.items():
        setattr(usuari, camp, valor)
    db.commit()
    db.refresh(usuari)
    return usuari

def set_idioma(db: Session, usuari: Usuari, idioma: Idioma) -> Usuari:
    """Canvia l'idioma del propi compte."""
    setattr(usuari, "idioma", idioma)
    db.commit()
    db.refresh(usuari)
    return usuari

def set_password(db: Session, usuari_id: str, password_nova: str) -> Usuari | None:
    """Reescriu la contrasenya d'un compte. La fa servir l'administració per
    tornar l'accés a qui l'ha perdut, perquè no hi ha recuperació autoservei.

    Els testimonis ja emesos per a aquell compte segueixen vàlids fins que
    caduquen: l'API no manté cap llista de revocació."""
    usuari = get_usuari_by_id(db, usuari_id)
    if not usuari:
        return None
    setattr(usuari, "password_hash", hash_password(password_nova))
    db.commit()
    db.refresh(usuari)
    return usuari

import uuid
from sqlalchemy.orm import Session
from app.models.autora import Autora
from app.models.autora_traduccio import AutoraTraduccio
from app.models.usuari import Idioma
from app.services.storage import upload_file, delete_file

def get_all_autores(db: Session):
    """Torna les autores per cognom."""
    return db.query(Autora)\
        .order_by(Autora.cognom)\
        .all()

def get_autora_by_id(db: Session, autora_id: str):
    """Torna una autora, o None si no hi és."""
    return db.query(Autora)\
        .filter(Autora.id == autora_id)\
        .first()

def update_autora(db: Session, autora_id: str, dades: dict) -> Autora | None:
    """Actualitza els camps donats d'una autora; None si no hi és."""
    autora = get_autora_by_id(db, autora_id)
    if not autora:
        return None
    for camp, valor in dades.items():
        setattr(autora, camp, valor)
    db.commit()
    db.refresh(autora)
    return autora

def update_autora_foto(db: Session, autora_id: str, file_bytes: bytes, filename: str, content_type: str) -> Autora | None:
    """Puja un retrat nou, actualitza foto_minio_key i esborra l'anterior.
    El mateix ordre que la foto de parada: primer es puja, després s'actualitza
    la fila i només llavors es treu l'objecte vell, de manera que l'autora no
    apunti mai a un fitxer que no hi és."""
    autora = get_autora_by_id(db, autora_id)
    if not autora:
        return None

    extension = filename.split('.')[-1] if '.' in filename else 'jpg'
    minio_key = f"autores/{autora_id}/{uuid.uuid4()}.{extension}"

    success = upload_file(file_bytes, minio_key, content_type)
    if not success:
        return None

    key_antiga = autora.foto_minio_key
    setattr(autora, 'foto_minio_key', minio_key)
    db.commit()
    db.refresh(autora)

    if key_antiga:
        delete_file(str(key_antiga))

    return autora


def aplica_idioma(autora: Autora, idioma: Idioma) -> Autora:
    """Deixa a `bio` la biografia en l'idioma demanat, si n'hi ha.

    No es desa: només es toca l'objecte que ja s'està a punt de serialitzar.
    `bio_idioma` diu en quin idioma ha quedat, perquè el client pugui avisar
    quan ensenya el català per manca de traducció.
    """
    autora.bio_idioma = Idioma.CA
    if idioma == Idioma.CA:
        return autora
    for traduccio in autora.traduccions:
        if traduccio.idioma == idioma:
            autora.bio = traduccio.bio
            autora.bio_idioma = idioma
            break
    return autora


def get_traduccions(db: Session, autora_id: str):
    """Totes les traduccions d'una autora. Per al panell d'edició."""
    return db.query(AutoraTraduccio)        .filter(AutoraTraduccio.autora_id == autora_id)        .all()


def set_traduccio(db: Session, autora_id: str, idioma: Idioma, bio: str):
    """Crea o reescriu la biografia d'una autora en un idioma.

    El català no passa per aquí: viu a `autora.bio` i s'edita amb la resta de
    la fitxa. Tenir-lo als dos llocs seria tenir dues veritats."""
    autora = get_autora_by_id(db, autora_id)
    if not autora:
        return None

    traduccio = db.query(AutoraTraduccio).filter(
        AutoraTraduccio.autora_id == autora_id,
        AutoraTraduccio.idioma == idioma,
    ).first()

    if traduccio:
        setattr(traduccio, "bio", bio)
    else:
        traduccio = AutoraTraduccio(autora_id=autora_id, idioma=idioma, bio=bio)
        db.add(traduccio)

    db.commit()
    db.refresh(traduccio)
    return traduccio


def esborra_traduccio(db: Session, autora_id: str, idioma: Idioma) -> bool:
    """Treu una traducció. La fitxa torna a ensenyar el català."""
    traduccio = db.query(AutoraTraduccio).filter(
        AutoraTraduccio.autora_id == autora_id,
        AutoraTraduccio.idioma == idioma,
    ).first()
    if not traduccio:
        return False
    db.delete(traduccio)
    db.commit()
    return True

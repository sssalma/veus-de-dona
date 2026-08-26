import uuid
from sqlalchemy.orm import Session
from app.models.autora import Autora
from app.models.autora_traduccio import AutoraTraduccio
from app.models.usuari import Idioma
from app.services.storage import upload_file, delete_file

def get_all_autores(db: Session):
    """Returns all authors ordered by surname"""
    return db.query(Autora)\
        .order_by(Autora.cognom)\
        .all()

def get_autora_by_id(db: Session, autora_id: str):
    """Returns a single author by ID or None if not found"""
    return db.query(Autora)\
        .filter(Autora.id == autora_id)\
        .first()

def update_autora(db: Session, autora_id: str, dades: dict) -> Autora | None:
    """Updates the given fields of an author, returns None if not found"""
    autora = get_autora_by_id(db, autora_id)
    if not autora:
        return None
    for camp, valor in dades.items():
        setattr(autora, camp, valor)
    db.commit()
    db.refresh(autora)
    return autora

def update_autora_foto(db: Session, autora_id: str, file_bytes: bytes, filename: str, content_type: str) -> Autora | None:
    """Uploads a new portrait to MinIO, updates foto_minio_key and deletes the old one.
    Same order of operations as the parada photo: upload first, update the row,
    and only then remove the previous object, so the author never points at a
    file that does not exist."""
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

    No es desa: nomes es toca l'objecte que ja s'esta a punt de serialitzar, de
    manera que la fila de la base de dades no es mou. `bio_idioma` diu en quin
    idioma ha quedat, perque el client pugui avisar que ensenya el catala quan
    la traduccio encara no existeix en comptes de fer-la passar per traduida.
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
    """Totes les traduccions d'una autora. Per al panell d'edicio."""
    return db.query(AutoraTraduccio)        .filter(AutoraTraduccio.autora_id == autora_id)        .all()


def set_traduccio(db: Session, autora_id: str, idioma: Idioma, bio: str):
    """Crea o reescriu la biografia d'una autora en un idioma.

    El catala no passa per aqui: viu a `autora.bio` i s'edita amb la resta de
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
    """Treu una traduccio. La fitxa torna a ensenyar el catala."""
    traduccio = db.query(AutoraTraduccio).filter(
        AutoraTraduccio.autora_id == autora_id,
        AutoraTraduccio.idioma == idioma,
    ).first()
    if not traduccio:
        return False
    db.delete(traduccio)
    db.commit()
    return True

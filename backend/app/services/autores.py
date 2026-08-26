import uuid
from sqlalchemy.orm import Session
from app.models.autora import Autora
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
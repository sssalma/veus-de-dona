import uuid
from sqlalchemy.orm import Session
from app.models.parada import Parada
from app.services.storage import upload_file, delete_file

def get_all_parades(db: Session):
    """Returns all active stops ordered by route order"""
    return db.query(Parada)\
        .filter(Parada.activa == True)\
        .order_by(Parada.ordre)\
        .all()

def get_totes_les_parades(db: Session):
    """Returns every stop, active or not, ordered by route order - editor/admin only"""
    return db.query(Parada)\
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

def update_parada(db: Session, parada_id: str, dades: dict) -> Parada | None:
    """Updates the given fields of a stop, returns None if not found"""
    parada = get_parada_by_id(db, parada_id)
    if not parada:
        return None
    for camp, valor in dades.items():
        setattr(parada, camp, valor)
    db.commit()
    db.refresh(parada)
    return parada

def update_parada_foto(db: Session, parada_id: str, file_bytes: bytes, filename: str, content_type: str) -> Parada | None:
    """Uploads a new photo to MinIO, updates foto_minio_key and deletes the old photo"""
    parada = get_parada_by_id(db, parada_id)
    if not parada:
        return None

    extension = filename.split('.')[-1] if '.' in filename else 'jpg'
    minio_key = f"parades/{parada_id}/{uuid.uuid4()}.{extension}"

    success = upload_file(file_bytes, minio_key, content_type)
    if not success:
        return None

    key_antiga = parada.foto_minio_key
    setattr(parada, 'foto_minio_key', minio_key)
    db.commit()
    db.refresh(parada)

    if key_antiga:
        delete_file(str(key_antiga))

    return parada
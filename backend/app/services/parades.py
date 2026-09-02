import uuid
from sqlalchemy.orm import Session
from app.models.parada import Parada
from app.services.storage import upload_file, delete_file

def get_all_parades(db: Session):
    """Torna les parades actives, per ordre de ruta."""
    return db.query(Parada)\
        .filter(Parada.activa == True)\
        .order_by(Parada.ordre)\
        .all()

def get_totes_les_parades(db: Session):
    """Totes les parades, actives o no, per ordre de ruta."""
    return db.query(Parada)\
        .order_by(Parada.ordre)\
        .all()

def get_parada_by_id(db: Session, parada_id: str):
    """Torna una parada, o None si no hi és."""
    return db.query(Parada)\
        .filter(Parada.id == parada_id)\
        .first()

def toggle_parada_activa(db: Session, parada_id: str, activa: bool) -> Parada | None:
    """Activa o desactiva una parada; None si no hi és."""
    parada = get_parada_by_id(db, parada_id)
    if not parada:
        return None
    setattr(parada, 'activa', activa)
    db.commit()
    db.refresh(parada)
    return parada

def update_parada(db: Session, parada_id: str, dades: dict) -> Parada | None:
    """Actualitza els camps donats d'una parada; None si no hi és."""
    parada = get_parada_by_id(db, parada_id)
    if not parada:
        return None
    for camp, valor in dades.items():
        setattr(parada, camp, valor)
    db.commit()
    db.refresh(parada)
    return parada

def update_parada_foto(db: Session, parada_id: str, file_bytes: bytes, filename: str, content_type: str) -> Parada | None:
    """Puja una foto a MinIO, actualitza foto_minio_key i esborra l'anterior."""
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
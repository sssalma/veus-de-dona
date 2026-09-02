from sqlalchemy.orm import Session
from app.models.recurs import Recurs, TipusRecurs
from app.models.text import Text
from app.services.storage import upload_file, delete_file, get_file_url
import uuid

def pujar_recurs(
    db: Session,
    text_id: str,
    file_bytes: bytes,
    filename: str,
    content_type: str,
    tipus: TipusRecurs
) -> Recurs | None:
    """Puja un fitxer a MinIO i en desa el Recurs a PostgreSQL."""
    text = db.query(Text).filter(Text.id == text_id).first()
    if not text:
        return None

    # clau única dins del bucket: tipus/text_id/uuid_nomfitxer
    extension = filename.split('.')[-1]
    minio_key = f"{tipus.value.lower()}/{text_id}/{uuid.uuid4()}.{extension}"

    # primer MinIO: si falla, no es desa cap fila
    success = upload_file(file_bytes, minio_key, content_type)
    if not success:
        return None

    nou_recurs = Recurs(
        tipus=tipus,
        minio_key=minio_key,
        text_id=text_id
    )
    db.add(nou_recurs)
    db.commit()
    db.refresh(nou_recurs)
    return nou_recurs

def esborrar_recurs(db: Session, recurs_id: str) -> bool:
    """Esborra el fitxer de MinIO i després la fila de PostgreSQL."""
    recurs = db.query(Recurs).filter(Recurs.id == recurs_id).first()
    if not recurs:
        return False

    # primer MinIO
    delete_file(str(recurs.minio_key))

    # i després la fila
    db.delete(recurs)
    db.commit()
    return True

def get_recurs_url(db: Session, recurs_id: str) -> str | None:
    """Torna una URL pre-signada per reproduir el recurs."""
    recurs = db.query(Recurs).filter(Recurs.id == recurs_id).first()
    if not recurs:
        return None
    return get_file_url(str(recurs.minio_key))

def get_recursos_by_text(db: Session, text_id: str):
    """Torna els recursos d'un text."""
    return db.query(Recurs).filter(Recurs.text_id == text_id).all()
from pydantic import BaseModel
from uuid import UUID
from app.models.usuari import Idioma

class AutoraBase(BaseModel):
    nom: str
    cognom: str
    bio: str | None = None
    anys_vida: str | None = None
    foto_minio_key: str | None = None

class AutoraResponse(AutoraBase):
    id: UUID
    # En quin idioma va la `bio` que s'entrega: sense traducció torna el
    # català, i el client ho ha de poder advertir.
    bio_idioma: Idioma = Idioma.CA

    class Config:
        from_attributes = True

class AutoraUpdate(BaseModel):
    nom: str | None = None
    cognom: str | None = None
    bio: str | None = None
    anys_vida: str | None = None
    foto_minio_key: str | None = None


class TraduccioAutora(BaseModel):
    """Una biografia en un idioma que no és el català."""
    idioma: Idioma
    bio: str

    class Config:
        from_attributes = True


class TraduccioAutoraUpdate(BaseModel):
    bio: str

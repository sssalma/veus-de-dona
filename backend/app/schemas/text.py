from pydantic import BaseModel
from uuid import UUID
from app.models.usuari import Idioma
from app.schemas.autora import AutoraResponse

class TextBase(BaseModel):
    titol: str
    obra_origen: str | None = None
    contingut: str
    youtube_url: str | None = None
    parada_id: UUID
    autora_id: UUID

class TextResponse(TextBase):
    id: UUID
    autora: AutoraResponse
    # En quin idioma van el `titol` i el `contingut` que s'entreguen. Quan el
    # web del projecte no publica l'obra traduida es torna el catala, i el
    # client ho ha de poder dir en comptes de fer passar l'original per
    # traduccio.
    contingut_idioma: Idioma = Idioma.CA

    class Config:
        from_attributes = True

class TextUpdate(BaseModel):
    titol: str | None = None
    obra_origen: str | None = None
    contingut: str | None = None
    youtube_url: str | None = None
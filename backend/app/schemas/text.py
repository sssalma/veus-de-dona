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
    # En quin idioma van el `titol` i el `contingut`: si el web del projecte no
    # publica l'obra traduïda torna el català, i el client ho ha d'advertir.
    contingut_idioma: Idioma = Idioma.CA

    class Config:
        from_attributes = True

class TextUpdate(BaseModel):
    titol: str | None = None
    obra_origen: str | None = None
    contingut: str | None = None
    youtube_url: str | None = None
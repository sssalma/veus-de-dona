from pydantic import BaseModel
from uuid import UUID
from datetime import datetime

class ComentariCreate(BaseModel):
    contingut: str
    parada_id: UUID

class ComentariResponse(BaseModel):
    id: UUID
    contingut: str
    data_creacio: datetime
    parada_id: UUID
    usuari_id: UUID
    resposta_editor: str | None = None
    resposta_data: datetime | None = None

    class Config:
        from_attributes = True

class ComentariResposta(BaseModel):
    resposta_editor: str
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

    class Config:
        from_attributes = True
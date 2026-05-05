from pydantic import BaseModel
from uuid import UUID
from datetime import datetime

class LikeCreate(BaseModel):
    text_id: UUID

class LikeResponse(BaseModel):
    usuari_id: UUID
    text_id: UUID
    data_creacio: datetime

    class Config:
        from_attributes = True
from pydantic import BaseModel
from uuid import UUID
from app.models.recurs import TipusRecurs

class RecursBase(BaseModel):
    tipus: TipusRecurs
    minio_key: str
    text_id: UUID

class RecursResponse(RecursBase):
    id: UUID

    class Config:
        from_attributes = True
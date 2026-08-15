from pydantic import BaseModel
from uuid import UUID

class AutoraBase(BaseModel):
    nom: str
    cognom: str
    bio: str | None = None
    anys_vida: str | None = None
    foto_minio_key: str | None = None

class AutoraResponse(AutoraBase):
    id: UUID

    class Config:
        from_attributes = True

class AutoraUpdate(BaseModel):
    nom: str | None = None
    cognom: str | None = None
    bio: str | None = None
    anys_vida: str | None = None
    foto_minio_key: str | None = None
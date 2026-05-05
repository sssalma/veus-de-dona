from pydantic import BaseModel
from uuid import UUID
from datetime import datetime
from app.models.visita import Mode

class VisitaCreate(BaseModel):
    parada_id: UUID
    mode: Mode

class VisitaResponse(BaseModel):
    id: UUID
    timestamp: datetime
    mode: Mode
    parada_id: UUID
    usuari_id: UUID

    class Config:
        from_attributes = True
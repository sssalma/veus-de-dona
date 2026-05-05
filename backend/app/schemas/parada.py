from pydantic import BaseModel
from uuid import UUID
from app.models.parada import CoordenadesParada

class ParadaBase(BaseModel):
    ordre: int
    nom_espai: str
    coordenades: CoordenadesParada
    foto_minio_key: str | None = None
    activa: bool = True

class ParadaResponse(ParadaBase):
    id: UUID

    class Config:
        from_attributes = True
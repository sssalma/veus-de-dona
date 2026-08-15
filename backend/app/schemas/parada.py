from pydantic import BaseModel, model_validator
from uuid import UUID
from app.models.parada import CoordenadesParada, COORDENADES_GPS

class ParadaBase(BaseModel):
    ordre: int
    nom_espai: str
    coordenades: CoordenadesParada
    foto_minio_key: str | None = None
    activa: bool = True

class ParadaResponse(ParadaBase):
    id: UUID
    lat: float | None = None
    lng: float | None = None

    class Config:
        from_attributes = True

    @model_validator(mode="after")
    def _omple_coordenades_gps(self):
        coord = COORDENADES_GPS.get(self.coordenades)
        if coord:
            self.lat, self.lng = coord
        return self

class ParadaUpdate(BaseModel):
    nom_espai: str | None = None
    foto_minio_key: str | None = None
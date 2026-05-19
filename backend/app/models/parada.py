import uuid
from sqlalchemy import Column, String, Boolean, Integer, Enum as SAEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.database import Base
import enum

# Python enum for GPS coordinates of the 10 fixed route stops
class CoordenadesParada(str, enum.Enum):
    BALCO_MEDITERRANI  = "BALCO_MEDITERRANI"
    AMFITEATRE         = "AMFITEATRE"
    BAIXADA_PEIXATERIA = "BAIXADA_PEIXATERIA"
    PLACA_REI          = "PLACA_REI"
    PLACA_ANGELS       = "PLACA_ANGELS"
    PLACA_FORUM        = "PLACA_FORUM"
    CARRER_CALDERERS   = "CARRER_CALDERERS"
    PLA_SEU            = "PLA_SEU"
    CARRER_MAJOR       = "CARRER_MAJOR"
    PLACA_FONT         = "PLACA_FONT"

# GPS coordinates for each stop - immutable at application level
COORDENADES_GPS = {
    CoordenadesParada.BALCO_MEDITERRANI:  (41.11657, 1.24282),
    CoordenadesParada.AMFITEATRE:         (41.11712, 1.24538),
    CoordenadesParada.BAIXADA_PEIXATERIA: (41.11868, 1.24492),
    CoordenadesParada.PLACA_REI:          (41.11939, 1.24434),
    CoordenadesParada.PLACA_ANGELS:       (41.11997, 1.24447),
    CoordenadesParada.PLACA_FORUM:        (41.12048, 1.24478),
    CoordenadesParada.CARRER_CALDERERS:   (41.12078, 1.24422),
    CoordenadesParada.PLA_SEU:            (41.11963, 1.24523),
    CoordenadesParada.CARRER_MAJOR:       (41.11901, 1.24468),
    CoordenadesParada.PLACA_FONT:         (41.11832, 1.24381),
}

class Parada(Base):
    __tablename__ = "parada"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    ordre = Column(Integer, nullable=False, unique=True)
    nom_espai = Column(String, nullable=False)
    coordenades = Column(SAEnum(CoordenadesParada), nullable=False)
    foto_minio_key = Column(String, nullable=True)
    activa = Column(Boolean, default=True, nullable=False)

    # composition: texts and visits belong to this stop
    textos = relationship("Text", back_populates="parada", cascade="all, delete-orphan")
    visites = relationship("Visita", back_populates="parada")
    comentaris = relationship("Comentari", back_populates="parada")
import uuid
from sqlalchemy import Column, String, Boolean, Integer, Enum as SAEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.database import Base
import enum

# les 10 parades fixes de la ruta
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

# Coordenades de cada parada, fixes a l'aplicació. Contrastades amb la
# ubicació real de cada espai.
COORDENADES_GPS = {
    CoordenadesParada.BALCO_MEDITERRANI:  (41.1138851, 1.256671),
    CoordenadesParada.AMFITEATRE:         (41.1153354, 1.25851),
    CoordenadesParada.BAIXADA_PEIXATERIA: (41.1163399, 1.2568917),
    CoordenadesParada.PLACA_REI:          (41.116808, 1.258319),
    CoordenadesParada.PLACA_ANGELS:       (41.1171984, 1.2589309),
    CoordenadesParada.PLACA_FORUM:        (41.1178175, 1.2588566),
    CoordenadesParada.CARRER_CALDERERS:   (41.1180695, 1.257971),
    CoordenadesParada.PLA_SEU:            (41.1186339, 1.2577864),
    CoordenadesParada.CARRER_MAJOR:       (41.1183336, 1.2574592),
    CoordenadesParada.PLACA_FONT:         (41.1173419, 1.2545396),
}

class Parada(Base):
    __tablename__ = "parada"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    ordre = Column(Integer, nullable=False, unique=True)
    nom_espai = Column(String, nullable=False)
    coordenades = Column(SAEnum(CoordenadesParada), nullable=False)
    foto_minio_key = Column(String, nullable=True)
    activa = Column(Boolean, default=True, nullable=False)

    # composició: els textos i les visites pertanyen a la parada
    textos = relationship("Text", back_populates="parada", cascade="all, delete-orphan")
    visites = relationship("Visita", back_populates="parada")
    comentaris = relationship("Comentari", back_populates="parada")
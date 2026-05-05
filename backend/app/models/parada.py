import uuid
from sqlalchemy import Column, String, Boolean, Integer, Enum as SAEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.database import Base
import enum

# Python enum for GPS coordinates of the 10 fixed route stops
class CoordenadesParada(str, enum.Enum):
    BALCO_MEDITERRANI = "BALCO_MEDITERRANI"
    AMFITEATRE_ROMA = "AMFITEATRE_ROMA"
    PL_FONT = "PL_FONT"
    PL_SEDASSOS = "PL_SEDASSOS"
    ESCALES_CATEDRAL = "ESCALES_CATEDRAL"
    C_CAVALLERS = "C_CAVALLERS"
    PORTAL_ROSER = "PORTAL_ROSER"
    C_DAMES = "C_DAMES"
    PL_PALLOL = "PL_PALLOL"
    C_SANT_LLORENC = "C_SANT_LLORENC"

# GPS coordinates for each stop - immutable at application level
COORDENADES_GPS = {
    CoordenadesParada.BALCO_MEDITERRANI: (41.1165, 1.2428),
    CoordenadesParada.AMFITEATRE_ROMA: (41.1171, 1.2454),
    CoordenadesParada.PL_FONT: (41.1189, 1.2441),
    CoordenadesParada.PL_SEDASSOS: (41.1182, 1.2436),
    CoordenadesParada.ESCALES_CATEDRAL: (41.1196, 1.2448),
    CoordenadesParada.C_CAVALLERS: (41.1201, 1.2443),
    CoordenadesParada.PORTAL_ROSER: (41.1178, 1.2431),
    CoordenadesParada.C_DAMES: (41.1209, 1.2438),
    CoordenadesParada.PL_PALLOL: (41.1215, 1.2445),
    CoordenadesParada.C_SANT_LLORENC: (41.1221, 1.2452),
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
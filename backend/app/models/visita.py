import uuid
from sqlalchemy import Column, DateTime, Enum as SAEnum, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base
import enum

# modes de visita, deduïts per detectar_mode()
class Mode(str, enum.Enum):
    REMOT = "REMOT"
    GUIAT = "GUIAT"
    LLIURE = "LLIURE"

class Visita(Base):
    __tablename__ = "visita"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    # el genera PostgreSQL en inserir
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
    # es dedueix, no l'envia qui visita
    mode = Column(SAEnum(Mode), nullable=False)

    # claus foranes: classe associativa entre visitant i parada
    usuari_id = Column(UUID(as_uuid=True), ForeignKey("usuari.id"), nullable=False)
    parada_id = Column(UUID(as_uuid=True), ForeignKey("parada.id"), nullable=False)

    # relacions
    usuari = relationship("Usuari", back_populates="visites")
    parada = relationship("Parada", back_populates="visites")
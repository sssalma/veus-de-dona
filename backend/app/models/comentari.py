import uuid
from sqlalchemy import Column, String, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base

class Comentari(Base):
    __tablename__ = "comentari"

    # té UUID propi perquè una persona pot comentar més d'un cop la mateixa parada
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    contingut = Column(String, nullable=False)
    data_creacio = Column(DateTime(timezone=True), server_default=func.now())
    resposta_editor = Column(String, nullable=True)
    resposta_data = Column(DateTime(timezone=True), nullable=True)

    # claus foranes: classe associativa entre usuari i parada
    usuari_id = Column(UUID(as_uuid=True), ForeignKey("usuari.id"), nullable=False)
    parada_id = Column(UUID(as_uuid=True), ForeignKey("parada.id"), nullable=False)

    # relacions
    usuari = relationship("Usuari", back_populates="comentaris")
    parada = relationship("Parada", back_populates="comentaris")

    @property
    def usuari_nom(self):
        return self.usuari.nom if self.usuari else None

    @property
    def usuari_cognom(self):
        return self.usuari.cognom if self.usuari else None
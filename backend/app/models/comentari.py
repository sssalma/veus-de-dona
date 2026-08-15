import uuid
from sqlalchemy import Column, String, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base

class Comentari(Base):
    __tablename__ = "comentari"

    # has its own UUID because the same user can comment
    # the same parada multiple times
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    contingut = Column(String, nullable=False)
    data_creacio = Column(DateTime(timezone=True), server_default=func.now())
    resposta_editor = Column(String, nullable=True)
    resposta_data = Column(DateTime(timezone=True), nullable=True)

    # foreign keys - associative class between usuari and parada
    usuari_id = Column(UUID(as_uuid=True), ForeignKey("usuari.id"), nullable=False)
    parada_id = Column(UUID(as_uuid=True), ForeignKey("parada.id"), nullable=False)

    # relationships
    usuari = relationship("Usuari", back_populates="comentaris")
    parada = relationship("Parada", back_populates="comentaris")
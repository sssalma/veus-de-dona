import uuid
from sqlalchemy import Column, String, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.database import Base

class Text(Base):
    __tablename__ = "text"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    titol = Column(String, nullable=False)
    obra_origen = Column(String, nullable=True)
    contingut = Column(String, nullable=False)
    youtube_url = Column(String, nullable=True)

    # claus foranes: el text pertany a una parada i a una autora
    parada_id = Column(UUID(as_uuid=True), ForeignKey("parada.id"), nullable=False)
    autora_id = Column(UUID(as_uuid=True), ForeignKey("autora.id"), nullable=False)

    # relacions
    parada = relationship("Parada", back_populates="textos")
    autora = relationship("Autora", back_populates="textos")

    # el mateix text en un altre idioma, quan el web del projecte el publica
    traduccions = relationship(
        "TextTraduccio", back_populates="text", cascade="all, delete-orphan"
    )

    # composició: esborrar el text esborra els seus recursos
    recursos = relationship("Recurs", back_populates="text", cascade="all, delete-orphan")

    # classes associatives
    likes = relationship("Like", back_populates="text")
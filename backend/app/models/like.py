from sqlalchemy import Column, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base

class Like(Base):
    __tablename__ = "like"

    # clau primària composta: no pot haver-hi dos likes de la mateixa persona
    # sobre el mateix text
    usuari_id = Column(
        UUID(as_uuid=True),
        ForeignKey("usuari.id"),
        primary_key=True
    )
    text_id = Column(
        UUID(as_uuid=True),
        ForeignKey("text.id"),
        primary_key=True
    )
    # únic atribut de la classe associativa
    data_creacio = Column(DateTime(timezone=True), server_default=func.now())

    # relacions
    usuari = relationship("Usuari", back_populates="likes")
    text = relationship("Text", back_populates="likes")
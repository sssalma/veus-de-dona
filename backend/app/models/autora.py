import uuid
from sqlalchemy import Column, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.database import Base

class Autora(Base):
    __tablename__ = "autora"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    nom = Column(String, nullable=False)
    cognom = Column(String, nullable=False)
    bio = Column(Text, nullable=True)
    anys_vida = Column(String, nullable=True)
    foto_minio_key = Column(String, nullable=True)

    # one autora has one or more texts in the route
    textos = relationship("Text", back_populates="autora")

    # the Catalan biography lives in `bio`; the rest, one row per language
    traduccions = relationship(
        "AutoraTraduccio",
        back_populates="autora",
        cascade="all, delete-orphan",
    )

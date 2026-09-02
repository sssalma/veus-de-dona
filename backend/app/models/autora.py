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

    # una autora té un o més textos a la ruta
    textos = relationship("Text", back_populates="autora")

    # el català viu a `bio`; la resta, una fila per idioma
    traduccions = relationship(
        "AutoraTraduccio",
        back_populates="autora",
        cascade="all, delete-orphan",
    )

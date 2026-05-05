import uuid
from sqlalchemy import Column, String, Boolean, DateTime, Enum as SAEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base
import enum

# Python enum for user roles - maps to PostgreSQL enum type
class RolUsuari(str, enum.Enum):
    VISITANT = "VISITANT"
    EDITOR = "EDITOR"
    ADMINISTRADOR = "ADMINISTRADOR"

# Python enum for supported languages
class Idioma(str, enum.Enum):
    CA = "CA"
    ES = "ES"
    EN = "EN"

class Usuari(Base):
    __tablename__ = "usuari"

    # primary key as UUID - avoids enumerable IDs and supports distributed systems
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String, unique=True, nullable=False, index=True)
    nom = Column(String, nullable=False)
    cognom = Column(String, nullable=False)
    password_hash = Column(String, nullable=False)
    idioma = Column(SAEnum(Idioma), nullable=False, default=Idioma.CA)
    rol = Column(SAEnum(RolUsuari), nullable=False, default=RolUsuari.VISITANT)
    data_registre = Column(DateTime(timezone=True), server_default=func.now())
    actiu = Column(Boolean, default=True, nullable=False)

    # visitor-specific attributes (null for editor and admin)
    procedencia = Column(String, nullable=True)
    es_alumne = Column(Boolean, nullable=True)

    # relationships
    visites = relationship("Visita", back_populates="usuari")
    likes = relationship("Like", back_populates="usuari")
    comentaris = relationship("Comentari", back_populates="usuari")
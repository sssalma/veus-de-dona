import uuid
from sqlalchemy import Column, String, Enum as SAEnum, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.database import Base
import enum

# tipus de recurs multimèdia
class TipusRecurs(str, enum.Enum):
    AUDIO = "AUDIO"
    VIDEO = "VIDEO"

class Recurs(Base):
    __tablename__ = "recurs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tipus = Column(SAEnum(TipusRecurs), nullable=False)
    # clau de l'objecte dins del bucket; la URL es construeix en cada petició
    minio_key = Column(String, nullable=False)

    # clau forana: el recurs pertany a un text (composició)
    text_id = Column(UUID(as_uuid=True), ForeignKey("text.id"), nullable=False)

    # relació
    text = relationship("Text", back_populates="recursos")
import uuid
from sqlalchemy import Column, String, Enum as SAEnum, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.database import Base
import enum

# Python enum for multimedia resource types
class TipusRecurs(str, enum.Enum):
    AUDIO = "AUDIO"
    VIDEO = "VIDEO"

class Recurs(Base):
    __tablename__ = "recurs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tipus = Column(SAEnum(TipusRecurs), nullable=False)
    # minio_key stores the object key within the bucket
    # URL is constructed at runtime: MINIO_URL/MINIO_BUCKET/minio_key
    minio_key = Column(String, nullable=False)

    # foreign key - recurs belongs to one text (composition)
    text_id = Column(UUID(as_uuid=True), ForeignKey("text.id"), nullable=False)

    # relationship
    text = relationship("Text", back_populates="recursos")
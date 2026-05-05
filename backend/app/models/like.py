from sqlalchemy import Column, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base

class Like(Base):
    __tablename__ = "like"

    # composite primary key - a visitant can only like a text once
    # no UUID needed - identity IS the combination of both foreign keys
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
    # only attribute of the associative class
    data_creacio = Column(DateTime(timezone=True), server_default=func.now())

    # relationships
    usuari = relationship("Usuari", back_populates="likes")
    text = relationship("Text", back_populates="likes")
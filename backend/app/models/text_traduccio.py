from sqlalchemy import Column, String, Text as SAText, ForeignKey, Enum as SAEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.database import Base
from app.models.usuari import Idioma


class TextTraduccio(Base):
    """Un text literari en un idioma que no és el català.

    Les versions angleses són les que publica el web del projecte, no
    traduccions pròpies, i per això no hi ha panell d'edició: entren amb
    `scripts/scraper_traduccions_textos.py`.

    `obra_origen` no hi és: és el títol del llibre publicat, que se cita en
    català.
    """

    __tablename__ = "text_traduccio"

    # clau composta: una versió per text i idioma
    text_id = Column(
        UUID(as_uuid=True),
        ForeignKey("text.id", ondelete="CASCADE"),
        primary_key=True,
    )
    idioma = Column(SAEnum(Idioma), primary_key=True)
    titol = Column(String, nullable=False)
    contingut = Column(SAText, nullable=False)

    text = relationship("Text", back_populates="traduccions")

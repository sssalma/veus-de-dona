from sqlalchemy import Column, Text, ForeignKey, Enum as SAEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.database import Base
from app.models.usuari import Idioma


class AutoraTraduccio(Base):
    """La biografia d'una autora en un idioma que no és el català.

    Una taula i no una columna per idioma, perquè afegir un idioma no sigui una
    migració. Els textos literaris tenen la seva pròpia taula, `text_traduccio`.
    """

    __tablename__ = "autora_traduccio"

    # clau composta: una biografia per autora i idioma
    autora_id = Column(
        UUID(as_uuid=True),
        ForeignKey("autora.id", ondelete="CASCADE"),
        primary_key=True,
    )
    idioma = Column(SAEnum(Idioma), primary_key=True)
    bio = Column(Text, nullable=False)

    autora = relationship("Autora", back_populates="traduccions")

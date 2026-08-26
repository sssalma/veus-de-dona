from sqlalchemy import Column, Text, ForeignKey, Enum as SAEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.database import Base
from app.models.usuari import Idioma


class AutoraTraduccio(Base):
    """A biography in a language other than Catalan.

    A table rather than one column per language, so that adding a language is
    not a migration.

    Only the biography lives here. The literary texts are not translated: the
    project reproduces them under an implicit permission that does not extend
    to derivative works, and a translation is one.
    """

    __tablename__ = "autora_traduccio"

    # composite key: one biography per author and language, no duplicates
    autora_id = Column(
        UUID(as_uuid=True),
        ForeignKey("autora.id", ondelete="CASCADE"),
        primary_key=True,
    )
    idioma = Column(SAEnum(Idioma), primary_key=True)
    bio = Column(Text, nullable=False)

    autora = relationship("Autora", back_populates="traduccions")

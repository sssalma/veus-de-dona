from sqlalchemy import Column, Text, ForeignKey, Enum as SAEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.database import Base
from app.models.usuari import Idioma


class AutoraTraduccio(Base):
    """A biography in a language other than Catalan.

    A table rather than one column per language, so that adding a language is
    not a migration.

    Only the biography lives here. The literary texts have a table of their
    own, `text_traduccio`, filled from the project's website: their English
    versions are the entity's, not ours. Writing them here -where the editing
    panel writes- would make them look like something this project may change.
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

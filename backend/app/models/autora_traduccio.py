from sqlalchemy import Column, Text, ForeignKey, Enum as SAEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.database import Base
from app.models.usuari import Idioma


class AutoraTraduccio(Base):
    """A biography in a language other than Catalan.

    A table rather than one column per language: the promoting project already
    publishes its biographies in six languages, and adding a seventh must not
    mean a migration. It also keeps the row narrow - most authors will have no
    translation at all, and absent rows cost nothing while empty columns do.

    Only the biography lives here. The literary texts are not translated: the
    project reproduces them under an implicit permission that does not extend
    to derivative works, and a translation is one. The titles of the works and
    the names of the stops are not translated either, because a published title
    and a place name do not change language.
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

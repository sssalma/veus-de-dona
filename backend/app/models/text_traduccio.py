from sqlalchemy import Column, String, Text as SAText, ForeignKey, Enum as SAEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.database import Base
from app.models.usuari import Idioma


class TextTraduccio(Base):
    """A literary text in a language other than Catalan.

    The project's own website publishes English versions of most of the works
    on the route. Those are what this table holds: the same reproduction the
    entity already makes, not a translation of ours. Translating the texts
    ourselves would be derivative work, and the permission the project has does
    not reach that far.

    That is also why there is no editing panel for them, unlike the author
    biographies: nobody here writes them. They come from the website with
    `scripts/scraper_traduccions_textos.py`, and if they change there, the
    scraper is run again.

    `obra_origen` stays out: it names the published book, which was published
    in Catalan and is cited by its own title.
    """

    __tablename__ = "text_traduccio"

    # composite key: one version per text and language, no duplicates
    text_id = Column(
        UUID(as_uuid=True),
        ForeignKey("text.id", ondelete="CASCADE"),
        primary_key=True,
    )
    idioma = Column(SAEnum(Idioma), primary_key=True)
    titol = Column(String, nullable=False)
    contingut = Column(SAText, nullable=False)

    text = relationship("Text", back_populates="traduccions")

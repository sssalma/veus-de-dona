from sqlalchemy.orm import Session
from app.models.text import Text
from app.models.parada import Parada
from app.models.usuari import Idioma

def get_all_textos(db: Session):
    """Torna tots els textos, per ordre de ruta i després per títol."""
    return db.query(Text)\
        .join(Parada, Text.parada_id == Parada.id)\
        .order_by(Parada.ordre, Text.titol)\
        .all()

def get_textos_by_parada(db: Session, parada_id: str):
    """Torna els textos d'una parada."""
    return db.query(Text)\
        .filter(Text.parada_id == parada_id)\
        .all()

def get_textos_by_autora(db: Session, autora_id: str):
    """Torna els textos d'una autora."""
    return db.query(Text)\
        .filter(Text.autora_id == autora_id)\
        .all()

def get_text_by_id(db: Session, text_id: str):
    """Torna un text, o None si no hi és."""
    return db.query(Text)\
        .filter(Text.id == text_id)\
        .first()

def update_text(db: Session, text_id: str, dades: dict) -> Text | None:
    """Actualitza els camps donats d'un text; None si no hi és."""
    text = get_text_by_id(db, text_id)
    if not text:
        return None
    for camp, valor in dades.items():
        setattr(text, camp, valor)
    db.commit()
    db.refresh(text)
    return text

def aplica_idioma(text: Text, idioma: Idioma) -> Text:
    """Deixa a `titol` i `contingut` la versió en l'idioma demanat, si n'hi ha.

    No es desa: només es toca l'objecte que ja s'està a punt de serialitzar.
    `contingut_idioma` diu en quin idioma ha quedat, perquè el client pugui
    advertir quan ensenya el català perquè l'obra no està traduïda al web del
    projecte.

    `obra_origen` no es toca: anomena el llibre publicat, que va sortir en
    català i es cita pel seu títol.
    """
    text.contingut_idioma = Idioma.CA
    if idioma == Idioma.CA:
        return text
    for traduccio in text.traduccions:
        if traduccio.idioma == idioma:
            text.titol = traduccio.titol
            text.contingut = traduccio.contingut
            text.contingut_idioma = idioma
            break
    return text

"""Proves unitàries del recurs a l'original quan no hi ha traducció.

`aplica_idioma` rep una autora i un idioma i torna l'autora amb la biografia en
aquell idioma, o l'original si no n'hi ha. No toca la base de dades: els
objectes es construeixen en memòria.
"""
from app.models.autora import Autora
from app.models.autora_traduccio import AutoraTraduccio
from app.models.usuari import Idioma
from app.services.autores import aplica_idioma


def _autora(*traduccions):
    autora = Autora(nom="Olga", cognom="Xirinacs i Díaz", bio="Biografia en català.")
    autora.traduccions = list(traduccions)
    return autora


def test_en_catala_torna_la_biografia_original():
    autora = aplica_idioma(_autora(), Idioma.CA)
    assert autora.bio == "Biografia en català."
    assert autora.bio_idioma == Idioma.CA


def test_amb_traduccio_substitueix_la_biografia():
    traduccio = AutoraTraduccio(idioma=Idioma.ES, bio="Biografía en castellano.")
    autora = aplica_idioma(_autora(traduccio), Idioma.ES)
    assert autora.bio == "Biografía en castellano."
    assert autora.bio_idioma == Idioma.ES


def test_sense_traduccio_cau_a_loriginal_i_ho_marca():
    # el client ha de saber que ensenya el català per manca de traducció
    autora = aplica_idioma(_autora(), Idioma.EN)
    assert autora.bio == "Biografia en català."
    assert autora.bio_idioma == Idioma.CA


def test_amb_diverses_traduccions_tria_la_demanada():
    autora = aplica_idioma(
        _autora(
            AutoraTraduccio(idioma=Idioma.ES, bio="Biografía en castellano."),
            AutoraTraduccio(idioma=Idioma.EN, bio="Biography in English."),
        ),
        Idioma.EN,
    )
    assert autora.bio == "Biography in English."
    assert autora.bio_idioma == Idioma.EN

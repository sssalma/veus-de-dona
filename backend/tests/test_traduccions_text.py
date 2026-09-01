"""Textos literaris multiidioma.

Les versions en angles no les escriu ningu d'aqui: son les que el web del
projecte ja publica, i hi arriben amb `scripts/scraper_traduccions_textos.py`.
Per aixo no hi ha endpoint per crear-les -no hi ha panell d'edicio-, i aqui es
desen directament a la base de dades.
"""
from app.models.text_traduccio import TextTraduccio
from app.models.usuari import Idioma


def _tradueix(db_session, text, titol="The Grey Room IV", contingut="An English text."):
    db_session.add(TextTraduccio(
        text_id=text.id,
        idioma=Idioma.EN,
        titol=titol,
        contingut=contingut,
    ))
    db_session.commit()


def test_sense_idioma_torna_el_catala(client, text):
    resp = client.get(f"/textos/{text.id}")
    assert resp.status_code == 200
    assert resp.json()["contingut"] == text.contingut
    assert resp.json()["contingut_idioma"] == "CA"


def test_amb_traduccio_torna_titol_i_contingut_traduits(client, db_session, text):
    _tradueix(db_session, text)
    resp = client.get(f"/textos/{text.id}?idioma=EN")
    assert resp.status_code == 200
    assert resp.json()["titol"] == "The Grey Room IV"
    assert resp.json()["contingut"] == "An English text."
    assert resp.json()["contingut_idioma"] == "EN"


def test_cau_al_catala_quan_lobra_no_esta_traduida(client, db_session, text):
    """Dues de les disset obres no estan traduides al web. S'ha de veure
    l'original i s'ha de saber que ho es."""
    _tradueix(db_session, text)
    resp = client.get(f"/textos/{text.id}?idioma=ES")
    assert resp.status_code == 200
    assert resp.json()["contingut"] == text.contingut
    assert resp.json()["contingut_idioma"] == "CA"


def test_lobra_origen_no_es_tradueix(client, db_session, text):
    """Anomena el llibre publicat, que va sortir en catala."""
    text.obra_origen = "L'habitació grisa, 2006"
    db_session.commit()
    _tradueix(db_session, text)
    resp = client.get(f"/textos/{text.id}?idioma=EN")
    assert resp.json()["obra_origen"] == "L'habitació grisa, 2006"


def test_la_llista_duna_parada_tambe_aplica_lidioma(client, db_session, text):
    _tradueix(db_session, text)
    resp = client.get(f"/textos/parada/{text.parada_id}?idioma=EN")
    assert resp.status_code == 200
    assert [t["contingut"] for t in resp.json()] == ["An English text."]


def test_la_llista_duna_autora_tambe_aplica_lidioma(client, db_session, text):
    _tradueix(db_session, text)
    resp = client.get(f"/textos/autora/{text.autora_id}?idioma=EN")
    assert resp.status_code == 200
    assert [t["contingut_idioma"] for t in resp.json()] == ["EN"]


def test_el_panell_dedicio_segueix_veient_loriginal(client, db_session, text):
    """El panell demana el text sense idioma. Si li arribes la traduccio, el
    primer cop que hi desessin un canvi es perdria l'original."""
    _tradueix(db_session, text)
    resp = client.get(f"/textos/{text.id}")
    assert resp.json()["titol"] == text.titol
    assert resp.json()["contingut"] == text.contingut


def test_la_traduccio_no_es_desa_a_la_taula_del_text(client, db_session, text):
    """`aplica_idioma` toca l'objecte just abans de serialitzar-lo: si aixo
    arribes a la base de dades, l'original desapareixeria."""
    original = text.contingut
    _tradueix(db_session, text)
    client.get(f"/textos/{text.id}?idioma=EN")
    db_session.expire_all()
    assert text.contingut == original

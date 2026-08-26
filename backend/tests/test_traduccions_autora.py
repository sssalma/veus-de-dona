"""Biografies multiidioma.

Nomes la biografia es tradueix. Els textos literaris no: el projecte els
reprodueix sota un permis implicit que no arriba a l'obra derivada, i una
traduccio ho es.
"""


def test_sense_idioma_torna_el_catala(client, autora):
    resp = client.get(f"/autores/{autora.id}")
    assert resp.status_code == 200
    assert resp.json()["bio"] == autora.bio
    assert resp.json()["bio_idioma"] == "CA"


def test_editor_pot_desar_una_traduccio(client, auth_headers, editor, autora):
    resp = client.put(
        f"/autores/{autora.id}/traduccions/EN",
        json={"bio": "An English biography."},
        headers=auth_headers(editor),
    )
    assert resp.status_code == 200
    assert resp.json() == {"idioma": "EN", "bio": "An English biography."}


def test_la_fitxa_torna_la_traduccio_quan_existeix(client, auth_headers, editor, autora):
    client.put(
        f"/autores/{autora.id}/traduccions/EN",
        json={"bio": "An English biography."},
        headers=auth_headers(editor),
    )
    resp = client.get(f"/autores/{autora.id}?idioma=EN")
    assert resp.status_code == 200
    assert resp.json()["bio"] == "An English biography."
    assert resp.json()["bio_idioma"] == "EN"


def test_cau_al_catala_quan_falta_la_traduccio(client, auth_headers, editor, autora):
    """El cas important: no s'ha d'ensenyar buit ni fer passar el catala per
    traduit. Es dona el catala i es diu que ho es."""
    client.put(
        f"/autores/{autora.id}/traduccions/EN",
        json={"bio": "An English biography."},
        headers=auth_headers(editor),
    )
    resp = client.get(f"/autores/{autora.id}?idioma=ES")
    assert resp.status_code == 200
    assert resp.json()["bio"] == autora.bio
    assert resp.json()["bio_idioma"] == "CA"


def test_desar_dues_vegades_reescriu_i_no_duplica(client, auth_headers, editor, autora):
    for text in ("Primera versio", "Segona versio"):
        client.put(
            f"/autores/{autora.id}/traduccions/EN",
            json={"bio": text},
            headers=auth_headers(editor),
        )
    resp = client.get(f"/autores/{autora.id}/traduccions", headers=auth_headers(editor))
    assert resp.status_code == 200
    assert len(resp.json()) == 1
    assert resp.json()[0]["bio"] == "Segona versio"


def test_el_catala_no_es_desa_com_a_traduccio(client, auth_headers, editor, autora):
    """Viu a autora.bio; tenir-lo als dos llocs serien dues veritats."""
    resp = client.put(
        f"/autores/{autora.id}/traduccions/CA",
        json={"bio": "No hauria d'entrar"},
        headers=auth_headers(editor),
    )
    assert resp.status_code == 400


def test_esborrar_la_traduccio_torna_al_catala(client, auth_headers, editor, autora):
    client.put(
        f"/autores/{autora.id}/traduccions/EN",
        json={"bio": "An English biography."},
        headers=auth_headers(editor),
    )
    resp = client.delete(
        f"/autores/{autora.id}/traduccions/EN", headers=auth_headers(editor)
    )
    assert resp.status_code == 204

    resp = client.get(f"/autores/{autora.id}?idioma=EN")
    assert resp.json()["bio"] == autora.bio
    assert resp.json()["bio_idioma"] == "CA"


def test_la_llista_tambe_respecta_l_idioma(client, auth_headers, editor, autora):
    client.put(
        f"/autores/{autora.id}/traduccions/EN",
        json={"bio": "An English biography."},
        headers=auth_headers(editor),
    )
    resp = client.get("/autores/?idioma=EN")
    assert resp.status_code == 200
    fitxa = next(a for a in resp.json() if a["id"] == str(autora.id))
    assert fitxa["bio"] == "An English biography."
    assert fitxa["bio_idioma"] == "EN"


def test_una_visitant_no_pot_desar_traduccions(client, auth_headers, visitant, autora):
    resp = client.put(
        f"/autores/{autora.id}/traduccions/EN",
        json={"bio": "An English biography."},
        headers=auth_headers(visitant),
    )
    assert resp.status_code == 403


def test_traduccions_sense_token_dona_401(client, autora):
    assert client.get(f"/autores/{autora.id}/traduccions").status_code == 401


def test_idioma_desconegut_es_rebutjat(client, auth_headers, editor, autora):
    resp = client.put(
        f"/autores/{autora.id}/traduccions/PT",
        json={"bio": "Uma biografia."},
        headers=auth_headers(editor),
    )
    assert resp.status_code == 422

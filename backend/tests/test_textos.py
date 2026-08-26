def test_textos_by_parada(client, text, parada):
    resp = client.get(f"/textos/parada/{parada.id}")
    assert resp.status_code == 200
    ids = [t["id"] for t in resp.json()]
    assert str(text.id) in ids


def test_textos_by_autora(client, text, autora):
    resp = client.get(f"/textos/autora/{autora.id}")
    assert resp.status_code == 200
    ids = [t["id"] for t in resp.json()]
    assert str(text.id) in ids


def test_get_text_per_id(client, text):
    resp = client.get(f"/textos/{text.id}")
    assert resp.status_code == 200
    assert resp.json()["titol"] == text.titol


def test_get_text_inexistent_dona_404(client):
    resp = client.get("/textos/00000000-0000-0000-0000-000000000000")
    assert resp.status_code == 404


def test_editor_pot_actualitzar_contingut(client, auth_headers, editor, text):
    resp = client.patch(
        f"/textos/{text.id}",
        json={"contingut": "Contingut actualitzat"},
        headers=auth_headers(editor),
    )
    assert resp.status_code == 200
    assert resp.json()["contingut"] == "Contingut actualitzat"


def test_editor_pot_actualitzar_youtube_url(client, auth_headers, editor, text):
    resp = client.patch(
        f"/textos/{text.id}",
        json={"youtube_url": "https://youtube.com/watch?v=abc123"},
        headers=auth_headers(editor),
    )
    assert resp.status_code == 200
    assert resp.json()["youtube_url"] == "https://youtube.com/watch?v=abc123"


def test_visitant_no_pot_actualitzar_text(client, auth_headers, visitant, text):
    resp = client.patch(
        f"/textos/{text.id}",
        json={"contingut": "Intent no autoritzat"},
        headers=auth_headers(visitant),
    )
    assert resp.status_code == 403


def test_llistat_de_tots_els_textos_es_public(client, text):
    resp = client.get("/textos/")
    assert resp.status_code == 200
    ids = [t["id"] for t in resp.json()]
    assert str(text.id) in ids

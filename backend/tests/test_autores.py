import io


def test_llista_autores_es_publica(client, autora):
    resp = client.get("/autores/")
    assert resp.status_code == 200
    ids = [a["id"] for a in resp.json()]
    assert str(autora.id) in ids


def test_get_autora_per_id(client, autora):
    resp = client.get(f"/autores/{autora.id}")
    assert resp.status_code == 200
    assert resp.json()["nom"] == autora.nom


def test_get_autora_inexistent_dona_404(client):
    resp = client.get("/autores/00000000-0000-0000-0000-000000000000")
    assert resp.status_code == 404


def test_editor_pot_actualitzar_bio(client, auth_headers, editor, autora):
    resp = client.patch(
        f"/autores/{autora.id}",
        json={"bio": "Nova biografia"},
        headers=auth_headers(editor),
    )
    assert resp.status_code == 200
    assert resp.json()["bio"] == "Nova biografia"


def test_visitant_no_pot_actualitzar_autora(client, auth_headers, visitant, autora):
    resp = client.patch(
        f"/autores/{autora.id}",
        json={"bio": "Intent no autoritzat"},
        headers=auth_headers(visitant),
    )
    assert resp.status_code == 403


def test_actualitzar_autora_sense_token_dona_401(client, autora):
    resp = client.patch(f"/autores/{autora.id}", json={"bio": "x"})
    assert resp.status_code == 401


# ---- retrat de l'autora (mateix patró que la foto de parada) ----

def test_editor_pot_pujar_foto_autora(client, auth_headers, editor, autora, monkeypatch):
    monkeypatch.setattr("app.services.autores.upload_file", lambda *a, **k: True)
    monkeypatch.setattr("app.services.autores.delete_file", lambda *a, **k: True)

    resp = client.post(
        f"/autores/{autora.id}/foto",
        files={"file": ("retrat.jpg", io.BytesIO(b"fake-image-bytes"), "image/jpeg")},
        headers=auth_headers(editor),
    )
    assert resp.status_code == 200
    assert resp.json()["foto_minio_key"].startswith(f"autores/{autora.id}/")


def test_visitant_no_pot_pujar_foto_autora(client, auth_headers, visitant, autora, monkeypatch):
    monkeypatch.setattr("app.services.autores.upload_file", lambda *a, **k: True)
    resp = client.post(
        f"/autores/{autora.id}/foto",
        files={"file": ("retrat.jpg", io.BytesIO(b"x"), "image/jpeg")},
        headers=auth_headers(visitant),
    )
    assert resp.status_code == 403


def test_pujar_foto_a_autora_inexistent_dona_404(client, auth_headers, editor, monkeypatch):
    monkeypatch.setattr("app.services.autores.upload_file", lambda *a, **k: True)
    resp = client.post(
        "/autores/00000000-0000-0000-0000-000000000000/foto",
        files={"file": ("retrat.jpg", io.BytesIO(b"x"), "image/jpeg")},
        headers=auth_headers(editor),
    )
    assert resp.status_code == 404


def test_get_foto_autora_sense_foto_dona_404(client, autora):
    resp = client.get(f"/autores/{autora.id}/foto")
    assert resp.status_code == 404


def test_get_foto_autora_es_public(client, db_session, autora, monkeypatch):
    autora.foto_minio_key = "autores/x/retrat.jpg"
    db_session.commit()
    monkeypatch.setattr("app.routers.autores.get_file_url", lambda key: f"https://minio.test/{key}")

    resp = client.get(f"/autores/{autora.id}/foto")
    assert resp.status_code == 200
    assert resp.json()["url"] == "https://minio.test/autores/x/retrat.jpg"

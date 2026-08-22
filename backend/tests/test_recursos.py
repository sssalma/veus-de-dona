import io


def test_editor_pot_pujar_recurs(client, auth_headers, editor, text, monkeypatch):
    monkeypatch.setattr("app.services.recursos.upload_file", lambda *a, **k: True)

    resp = client.post(
        "/recursos/",
        data={"text_id": str(text.id), "tipus": "AUDIO"},
        files={"file": ("poema.mp3", io.BytesIO(b"fake-audio-bytes"), "audio/mpeg")},
        headers=auth_headers(editor),
    )
    assert resp.status_code == 201
    assert resp.json()["tipus"] == "AUDIO"
    assert resp.json()["text_id"] == str(text.id)


def test_visitant_no_pot_pujar_recurs(client, auth_headers, visitant, text, monkeypatch):
    monkeypatch.setattr("app.services.recursos.upload_file", lambda *a, **k: True)
    resp = client.post(
        "/recursos/",
        data={"text_id": str(text.id), "tipus": "AUDIO"},
        files={"file": ("poema.mp3", io.BytesIO(b"x"), "audio/mpeg")},
        headers=auth_headers(visitant),
    )
    assert resp.status_code == 403


def test_pujar_recurs_a_text_inexistent_dona_404(client, auth_headers, editor, monkeypatch):
    monkeypatch.setattr("app.services.recursos.upload_file", lambda *a, **k: True)
    resp = client.post(
        "/recursos/",
        data={"text_id": "00000000-0000-0000-0000-000000000000", "tipus": "AUDIO"},
        files={"file": ("poema.mp3", io.BytesIO(b"x"), "audio/mpeg")},
        headers=auth_headers(editor),
    )
    assert resp.status_code == 404


def test_get_recursos_by_text_es_public(client, db_session, text):
    from app.models.recurs import Recurs, TipusRecurs
    r = Recurs(tipus=TipusRecurs.AUDIO, minio_key="audio/x/y.mp3", text_id=text.id)
    db_session.add(r)
    db_session.commit()

    resp = client.get(f"/recursos/text/{text.id}")
    assert resp.status_code == 200
    assert len(resp.json()) == 1


def test_get_recurs_url(client, db_session, text, monkeypatch):
    from app.models.recurs import Recurs, TipusRecurs
    r = Recurs(tipus=TipusRecurs.AUDIO, minio_key="audio/x/y.mp3", text_id=text.id)
    db_session.add(r)
    db_session.commit()
    db_session.refresh(r)

    monkeypatch.setattr("app.services.recursos.get_file_url", lambda key: f"https://minio.test/{key}")

    resp = client.get(f"/recursos/{r.id}/url")
    assert resp.status_code == 200
    assert resp.json()["url"] == "https://minio.test/audio/x/y.mp3"


def test_get_recurs_url_inexistent_dona_404(client):
    resp = client.get("/recursos/00000000-0000-0000-0000-000000000000/url")
    assert resp.status_code == 404


def test_editor_pot_eliminar_recurs(client, auth_headers, editor, db_session, text, monkeypatch):
    from app.models.recurs import Recurs, TipusRecurs
    r = Recurs(tipus=TipusRecurs.AUDIO, minio_key="audio/x/y.mp3", text_id=text.id)
    db_session.add(r)
    db_session.commit()
    db_session.refresh(r)

    monkeypatch.setattr("app.services.recursos.delete_file", lambda key: True)

    resp = client.delete(f"/recursos/{r.id}", headers=auth_headers(editor))
    assert resp.status_code == 204
    assert client.get(f"/recursos/text/{text.id}").json() == []


def test_visitant_no_pot_eliminar_recurs(client, auth_headers, visitant, db_session, text):
    from app.models.recurs import Recurs, TipusRecurs
    r = Recurs(tipus=TipusRecurs.AUDIO, minio_key="audio/x/y.mp3", text_id=text.id)
    db_session.add(r)
    db_session.commit()
    db_session.refresh(r)

    resp = client.delete(f"/recursos/{r.id}", headers=auth_headers(visitant))
    assert resp.status_code == 403

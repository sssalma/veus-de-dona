import io


def test_llista_parades_es_publica(client, parada):
    resp = client.get("/parades/")
    assert resp.status_code == 200
    ids = [p["id"] for p in resp.json()]
    assert str(parada.id) in ids


def test_llista_parades_nomes_mostra_actives(client, db_session, parada, segona_parada):
    segona_parada.activa = False
    db_session.commit()
    resp = client.get("/parades/")
    ids = [p["id"] for p in resp.json()]
    assert str(parada.id) in ids
    assert str(segona_parada.id) not in ids


def test_get_parada_inclou_coordenades_gps(client, parada):
    resp = client.get(f"/parades/{parada.id}")
    assert resp.status_code == 200
    data = resp.json()
    assert data["lat"] is not None
    assert data["lng"] is not None


def test_get_parada_inexistent_dona_404(client):
    resp = client.get("/parades/00000000-0000-0000-0000-000000000000")
    assert resp.status_code == 404


def test_totes_les_parades_requereix_editor_o_admin(client, auth_headers, visitant, editor, parada):
    resp_visitant = client.get("/parades/totes", headers=auth_headers(visitant))
    assert resp_visitant.status_code == 403

    resp_editor = client.get("/parades/totes", headers=auth_headers(editor))
    assert resp_editor.status_code == 200


def test_totes_les_parades_sense_token_dona_401(client):
    resp = client.get("/parades/totes")
    assert resp.status_code == 401


def test_editor_pot_actualitzar_nom_espai(client, auth_headers, editor, parada):
    resp = client.patch(
        f"/parades/{parada.id}",
        json={"nom_espai": "Nom nou"},
        headers=auth_headers(editor),
    )
    assert resp.status_code == 200
    assert resp.json()["nom_espai"] == "Nom nou"


def test_visitant_no_pot_actualitzar_parada(client, auth_headers, visitant, parada):
    resp = client.patch(
        f"/parades/{parada.id}",
        json={"nom_espai": "Intent no autoritzat"},
        headers=auth_headers(visitant),
    )
    assert resp.status_code == 403


def test_toggle_activa_desactiva_i_reactiva(client, auth_headers, editor, parada):
    resp = client.patch(
        f"/parades/{parada.id}/activa",
        params={"activa": False},
        headers=auth_headers(editor),
    )
    assert resp.status_code == 200
    assert resp.json()["activa"] is False

    resp2 = client.patch(
        f"/parades/{parada.id}/activa",
        params={"activa": True},
        headers=auth_headers(editor),
    )
    assert resp2.status_code == 200
    assert resp2.json()["activa"] is True


def test_get_foto_sense_foto_dona_404(client, parada):
    resp = client.get(f"/parades/{parada.id}/foto")
    assert resp.status_code == 404


# ---- pujar foto (editor) ----

def _fake_image_bytes() -> bytes:
    # 1x1 px transparent PNG - real, valid image bytes
    return bytes.fromhex(
        "89504e470d0a1a0a0000000d4948445200000001000000010802000000907753"
        "de0000000c4944415478da6360000002000155020e2c0000000049454e44ae42"
        "6082"
    )


def test_editor_pot_pujar_foto_i_reemplaça_lantiga(client, auth_headers, editor, parada, monkeypatch):
    uploaded_keys = []
    deleted_keys = []

    def fake_upload_file(file_bytes, minio_key, content_type):
        uploaded_keys.append(minio_key)
        return True

    def fake_delete_file(minio_key):
        deleted_keys.append(minio_key)
        return True

    monkeypatch.setattr("app.services.parades.upload_file", fake_upload_file)
    monkeypatch.setattr("app.services.parades.delete_file", fake_delete_file)

    resp = client.post(
        f"/parades/{parada.id}/foto",
        files={"file": ("foto.png", io.BytesIO(_fake_image_bytes()), "image/png")},
        headers=auth_headers(editor),
    )
    assert resp.status_code == 200
    primera_key = resp.json()["foto_minio_key"]
    assert primera_key is not None
    assert uploaded_keys == [primera_key]
    assert deleted_keys == []  # no old photo to delete yet

    # upload a second photo - the first one should now get deleted
    resp2 = client.post(
        f"/parades/{parada.id}/foto",
        files={"file": ("foto2.png", io.BytesIO(_fake_image_bytes()), "image/png")},
        headers=auth_headers(editor),
    )
    assert resp2.status_code == 200
    segona_key = resp2.json()["foto_minio_key"]
    assert segona_key != primera_key
    assert deleted_keys == [primera_key]


def test_visitant_no_pot_pujar_foto(client, auth_headers, visitant, parada):
    resp = client.post(
        f"/parades/{parada.id}/foto",
        files={"file": ("foto.png", io.BytesIO(_fake_image_bytes()), "image/png")},
        headers=auth_headers(visitant),
    )
    assert resp.status_code == 403


def test_pujar_foto_a_parada_inexistent_dona_404(client, auth_headers, editor, monkeypatch):
    monkeypatch.setattr("app.services.parades.upload_file", lambda *a, **k: True)
    resp = client.post(
        "/parades/00000000-0000-0000-0000-000000000000/foto",
        files={"file": ("foto.png", io.BytesIO(_fake_image_bytes()), "image/png")},
        headers=auth_headers(editor),
    )
    assert resp.status_code == 404

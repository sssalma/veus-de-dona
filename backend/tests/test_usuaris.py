def test_llista_usuaris_nomes_admin(client, auth_headers, visitant, editor, admin):
    assert client.get("/usuaris/", headers=auth_headers(visitant)).status_code == 403
    assert client.get("/usuaris/", headers=auth_headers(editor)).status_code == 403

    resp = client.get("/usuaris/", headers=auth_headers(admin))
    assert resp.status_code == 200
    ids = [u["id"] for u in resp.json()]
    assert str(admin.id) in ids


def test_update_meu_idioma(client, auth_headers, visitant):
    resp = client.patch(
        "/usuaris/me",
        json={"idioma": "ES"},
        headers=auth_headers(visitant),
    )
    assert resp.status_code == 200
    assert resp.json()["idioma"] == "ES"


def test_update_meu_idioma_sense_token_dona_401(client):
    resp = client.patch("/usuaris/me", json={"idioma": "ES"})
    assert resp.status_code == 401


def test_admin_pot_desactivar_usuari(client, auth_headers, admin, visitant):
    resp = client.patch(
        f"/usuaris/{visitant.id}/actiu",
        json={"actiu": False},
        headers=auth_headers(admin),
    )
    assert resp.status_code == 200
    assert resp.json()["actiu"] is False


def test_editor_no_pot_desactivar_usuari(client, auth_headers, editor, visitant):
    resp = client.patch(
        f"/usuaris/{visitant.id}/actiu",
        json={"actiu": False},
        headers=auth_headers(editor),
    )
    assert resp.status_code == 403


def test_desactivar_usuari_inexistent_dona_404(client, auth_headers, admin):
    resp = client.patch(
        "/usuaris/00000000-0000-0000-0000-000000000000/actiu",
        json={"actiu": False},
        headers=auth_headers(admin),
    )
    assert resp.status_code == 404


def test_admin_pot_canviar_rol(client, auth_headers, admin, visitant):
    resp = client.patch(
        f"/usuaris/{visitant.id}/rol",
        json={"rol": "EDITOR"},
        headers=auth_headers(admin),
    )
    assert resp.status_code == 200
    assert resp.json()["rol"] == "EDITOR"


def test_editor_no_pot_canviar_rol(client, auth_headers, editor, visitant):
    resp = client.patch(
        f"/usuaris/{visitant.id}/rol",
        json={"rol": "ADMINISTRADOR"},
        headers=auth_headers(editor),
    )
    assert resp.status_code == 403


# ---- an admin must not be able to lock themselves out ----

def test_admin_no_pot_desactivar_el_seu_propi_compte(client, auth_headers, admin):
    resp = client.patch(
        f"/usuaris/{admin.id}/actiu",
        json={"actiu": False},
        headers=auth_headers(admin),
    )
    assert resp.status_code == 400
    assert client.get("/auth/me", headers=auth_headers(admin)).status_code == 200


def test_admin_no_pot_canviar_el_seu_propi_rol(client, auth_headers, admin):
    resp = client.patch(
        f"/usuaris/{admin.id}/rol",
        json={"rol": "VISITANT"},
        headers=auth_headers(admin),
    )
    assert resp.status_code == 400
    assert client.get("/auth/me", headers=auth_headers(admin)).json()["rol"] == "ADMINISTRADOR"


def test_admin_si_pot_desactivar_un_altre_compte(client, auth_headers, admin, visitant):
    resp = client.patch(
        f"/usuaris/{visitant.id}/actiu",
        json={"actiu": False},
        headers=auth_headers(admin),
    )
    assert resp.status_code == 200
    assert resp.json()["actiu"] is False

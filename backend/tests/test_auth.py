def test_registre_crea_usuari_visitant(client):
    resp = client.post("/auth/register", json={
        "email": "nova@example.com",
        "nom": "Nova",
        "cognom": "Usuaria",
        "password": "Contrasenya123",
    })
    assert resp.status_code == 201
    data = resp.json()
    assert data["rol"] == "VISITANT"
    assert data["email"] == "nova@example.com"
    assert "password" not in data
    assert "password_hash" not in data


def test_registre_amb_email_duplicat_falla(client, visitant):
    resp = client.post("/auth/register", json={
        "email": visitant.email,
        "nom": "Altre",
        "cognom": "Usuari",
        "password": "Contrasenya123",
    })
    assert resp.status_code == 400


def test_login_amb_credencials_correctes(client, visitant):
    resp = client.post("/auth/login", json={
        "email": visitant.email,
        "password": "Testpass123!",
    })
    assert resp.status_code == 200
    data = resp.json()
    assert data["token_type"] == "bearer"
    assert data["access_token"]


def test_login_amb_contrasenya_incorrecta_falla(client, visitant):
    resp = client.post("/auth/login", json={
        "email": visitant.email,
        "password": "contrasenya-incorrecta",
    })
    assert resp.status_code == 401


def test_login_amb_email_inexistent_falla(client):
    resp = client.post("/auth/login", json={
        "email": "ningu@example.com",
        "password": "qualsevol",
    })
    assert resp.status_code == 401


def test_usuari_desactivat_no_pot_iniciar_sessio(client, db_session, visitant):
    visitant.actiu = False
    db_session.commit()
    resp = client.post("/auth/login", json={
        "email": visitant.email,
        "password": "Testpass123!",
    })
    assert resp.status_code == 401


def test_me_retorna_usuari_autenticat(client, auth_headers, editor):
    resp = client.get("/auth/me", headers=auth_headers(editor))
    assert resp.status_code == 200
    assert resp.json()["id"] == str(editor.id)
    assert resp.json()["rol"] == "EDITOR"


def test_me_sense_token_falla(client):
    resp = client.get("/auth/me")
    assert resp.status_code == 401


def test_me_amb_token_invalid_falla(client):
    resp = client.get("/auth/me", headers={"Authorization": "Bearer token-fals"})
    assert resp.status_code == 401


# ---- política de contrasenya (la imposa el servidor, no només l'app) ----

def test_registre_amb_contrasenya_curta_falla(client):
    resp = client.post("/auth/register", json={
        "email": "curta@example.com",
        "nom": "Nova",
        "cognom": "Usuaria",
        "password": "curta1",
    })
    assert resp.status_code == 422


def test_registre_amb_nom_buit_falla(client):
    resp = client.post("/auth/register", json={
        "email": "senseNom@example.com",
        "nom": "",
        "cognom": "Usuaria",
        "password": "Contrasenya123",
    })
    assert resp.status_code == 422


# ---- perfil, autoservei ----

def test_usuari_pot_actualitzar_el_seu_perfil(client, auth_headers, visitant):
    resp = client.patch(
        "/auth/me",
        json={"nom": "Nom Nou", "procedencia": "Reus"},
        headers=auth_headers(visitant),
    )
    assert resp.status_code == 200
    assert resp.json()["nom"] == "Nom Nou"
    assert resp.json()["procedencia"] == "Reus"
    # els camps que no s'envien es queden com estaven
    assert resp.json()["cognom"] == visitant.cognom


def test_actualitzar_perfil_no_permet_canviar_el_rol(client, auth_headers, visitant):
    resp = client.patch(
        "/auth/me",
        json={"rol": "ADMINISTRADOR"},
        headers=auth_headers(visitant),
    )
    assert resp.status_code == 200
    # el camp no forma part de l'esquema i s'ignora
    assert resp.json()["rol"] == "VISITANT"


def test_actualitzar_perfil_sense_token_falla(client):
    resp = client.patch("/auth/me", json={"nom": "Ningu"})
    assert resp.status_code == 401


# ---- canvi de contrasenya ----

def test_canvi_de_contrasenya_correcte(client, auth_headers, visitant):
    resp = client.post(
        "/auth/canvi-contrasenya",
        json={"password_actual": "Testpass123!", "password_nova": "NovaContrasenya1"},
        headers=auth_headers(visitant),
    )
    assert resp.status_code == 204

    # l'antiga ja no serveix i la nova sí
    assert client.post("/auth/login", json={
        "email": visitant.email, "password": "Testpass123!",
    }).status_code == 401
    assert client.post("/auth/login", json={
        "email": visitant.email, "password": "NovaContrasenya1",
    }).status_code == 200


def test_canvi_de_contrasenya_amb_actual_incorrecta_falla(client, auth_headers, visitant):
    resp = client.post(
        "/auth/canvi-contrasenya",
        json={"password_actual": "no-es-aquesta", "password_nova": "NovaContrasenya1"},
        headers=auth_headers(visitant),
    )
    assert resp.status_code == 401
    # l'original segueix servint
    assert client.post("/auth/login", json={
        "email": visitant.email, "password": "Testpass123!",
    }).status_code == 200


def test_canvi_de_contrasenya_nova_massa_curta_falla(client, auth_headers, visitant):
    resp = client.post(
        "/auth/canvi-contrasenya",
        json={"password_actual": "Testpass123!", "password_nova": "curta1"},
        headers=auth_headers(visitant),
    )
    assert resp.status_code == 422

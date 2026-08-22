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

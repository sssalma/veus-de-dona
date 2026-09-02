def test_afegir_comentari(client, auth_headers, visitant, parada):
    resp = client.post(
        "/comentaris/",
        json={"contingut": "Molt bonic aquest espai", "parada_id": str(parada.id)},
        headers=auth_headers(visitant),
    )
    assert resp.status_code == 201
    data = resp.json()
    assert data["contingut"] == "Molt bonic aquest espai"
    assert data["usuari_nom"] == visitant.nom
    # el visitant veu el seu propi comentari signat igual que el veuran els
    # altres: només amb el nom de pila
    assert data["usuari_cognom"] is None


def test_afegir_comentari_sense_token_dona_401(client, parada):
    resp = client.post(
        "/comentaris/",
        json={"contingut": "x", "parada_id": str(parada.id)},
    )
    assert resp.status_code == 401


def test_afegir_comentari_a_parada_inexistent_dona_404(client, auth_headers, visitant):
    resp = client.post(
        "/comentaris/",
        json={"contingut": "x", "parada_id": "00000000-0000-0000-0000-000000000000"},
        headers=auth_headers(visitant),
    )
    assert resp.status_code == 404


def test_get_comentaris_by_parada_es_public(client, auth_headers, visitant, parada):
    client.post(
        "/comentaris/",
        json={"contingut": "Comentari públic", "parada_id": str(parada.id)},
        headers=auth_headers(visitant),
    )
    resp = client.get(f"/comentaris/parada/{parada.id}")
    assert resp.status_code == 200
    assert len(resp.json()) == 1


def test_llista_global_nomes_editor_admin(client, auth_headers, visitant, editor, parada):
    client.post(
        "/comentaris/",
        json={"contingut": "x", "parada_id": str(parada.id)},
        headers=auth_headers(visitant),
    )
    assert client.get("/comentaris/", headers=auth_headers(visitant)).status_code == 403
    resp = client.get("/comentaris/", headers=auth_headers(editor))
    assert resp.status_code == 200
    assert len(resp.json()) == 1


def test_editor_pot_respondre_comentari(client, auth_headers, visitant, editor, parada):
    creat = client.post(
        "/comentaris/",
        json={"contingut": "x", "parada_id": str(parada.id)},
        headers=auth_headers(visitant),
    ).json()

    resp = client.patch(
        f"/comentaris/{creat['id']}/resposta",
        json={"resposta_editor": "Gràcies per la teva visita!"},
        headers=auth_headers(editor),
    )
    assert resp.status_code == 200
    assert resp.json()["resposta_editor"] == "Gràcies per la teva visita!"


def test_visitant_no_pot_respondre_comentari(client, auth_headers, visitant, parada):
    creat = client.post(
        "/comentaris/",
        json={"contingut": "x", "parada_id": str(parada.id)},
        headers=auth_headers(visitant),
    ).json()

    resp = client.patch(
        f"/comentaris/{creat['id']}/resposta",
        json={"resposta_editor": "Intent no autoritzat"},
        headers=auth_headers(visitant),
    )
    assert resp.status_code == 403


def test_editor_pot_eliminar_comentari(client, auth_headers, visitant, editor, parada):
    creat = client.post(
        "/comentaris/",
        json={"contingut": "x", "parada_id": str(parada.id)},
        headers=auth_headers(visitant),
    ).json()

    resp = client.delete(f"/comentaris/{creat['id']}", headers=auth_headers(editor))
    assert resp.status_code == 204

    llista = client.get(f"/comentaris/parada/{parada.id}").json()
    assert llista == []


def test_visitant_no_pot_eliminar_comentari(client, auth_headers, visitant, parada):
    creat = client.post(
        "/comentaris/",
        json={"contingut": "x", "parada_id": str(parada.id)},
        headers=auth_headers(visitant),
    ).json()

    resp = client.delete(f"/comentaris/{creat['id']}", headers=auth_headers(visitant))
    assert resp.status_code == 403


def test_eliminar_comentari_inexistent_dona_404(client, auth_headers, editor):
    resp = client.delete(
        "/comentaris/00000000-0000-0000-0000-000000000000",
        headers=auth_headers(editor),
    )
    assert resp.status_code == 404


# ---- el llistat públic no ha d'exposar el cognom de qui comenta ----

def _comenta(client, auth_headers, usuari, parada, text="Un comentari"):
    return client.post(
        "/comentaris/",
        json={"contingut": text, "parada_id": str(parada.id)},
        headers=auth_headers(usuari),
    ).json()


def test_llistat_public_amaga_cognom_i_id_de_lautor(client, auth_headers, visitant, parada):
    _comenta(client, auth_headers, visitant, parada)

    resp = client.get(f"/comentaris/parada/{parada.id}")
    assert resp.status_code == 200
    c = resp.json()[0]
    # el comentari queda signat amb el nom de pila
    assert c["usuari_nom"] == visitant.nom
    assert c["usuari_cognom"] is None
    assert c["usuari_id"] is None
    # el contingut i la resta segueixen sent públics
    assert c["contingut"] == "Un comentari"


def test_llistat_amb_token_de_visitant_tampoc_mostra_el_cognom(
    client, auth_headers, visitant, parada
):
    _comenta(client, auth_headers, visitant, parada)

    resp = client.get(f"/comentaris/parada/{parada.id}", headers=auth_headers(visitant))
    assert resp.status_code == 200
    assert resp.json()[0]["usuari_cognom"] is None


def test_editor_si_veu_el_cognom_al_llistat_de_la_parada(
    client, auth_headers, visitant, editor, parada
):
    _comenta(client, auth_headers, visitant, parada)

    resp = client.get(f"/comentaris/parada/{parada.id}", headers=auth_headers(editor))
    assert resp.status_code == 200
    c = resp.json()[0]
    assert c["usuari_cognom"] == visitant.cognom
    assert c["usuari_id"] == str(visitant.id)


def test_llistat_de_moderacio_conserva_les_dades_completes(
    client, auth_headers, visitant, editor, parada
):
    _comenta(client, auth_headers, visitant, parada)

    resp = client.get("/comentaris/", headers=auth_headers(editor))
    assert resp.status_code == 200
    c = resp.json()[0]
    assert c["usuari_cognom"] == visitant.cognom
    assert c["usuari_id"] == str(visitant.id)


def test_token_invalid_al_llistat_public_no_falla(client, auth_headers, visitant, parada):
    """L'autenticació és opcional: un token dolent no ha de fer caure la petició,
    només ha de deixar el lector com a anònim."""
    _comenta(client, auth_headers, visitant, parada)

    resp = client.get(
        f"/comentaris/parada/{parada.id}",
        headers={"Authorization": "Bearer token-fals"},
    )
    assert resp.status_code == 200
    assert resp.json()[0]["usuari_cognom"] is None

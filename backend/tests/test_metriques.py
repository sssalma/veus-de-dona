def test_metriques_global_requereix_editor_o_admin(client, auth_headers, visitant, editor):
    assert client.get("/metriques/global", headers=auth_headers(visitant)).status_code == 403
    resp = client.get("/metriques/global", headers=auth_headers(editor))
    assert resp.status_code == 200


def test_metriques_global_conte_totes_les_claus(client, auth_headers, editor):
    data = client.get("/metriques/global", headers=auth_headers(editor)).json()
    assert "usuaris_per_rol" in data
    assert "visites_per_mode" in data
    assert set(data["visites_per_mode"].keys()) == {"REMOT", "GUIAT", "LLIURE"}
    assert "textos_mes_agradats" in data


def test_metriques_global_compta_usuaris_i_visites(client, auth_headers, visitant, editor, parada):
    client.post("/visites/", json={"parada_id": str(parada.id)}, headers=auth_headers(visitant))
    data = client.get("/metriques/global", headers=auth_headers(editor)).json()
    assert data["usuaris_per_rol"]["VISITANT"] >= 1
    assert data["visites_per_mode"]["REMOT"] >= 1


def test_metriques_global_ordena_textos_mes_agradats(client, auth_headers, visitant, editor, text):
    client.post(f"/likes/{text.id}", headers=auth_headers(visitant))
    data = client.get("/metriques/global", headers=auth_headers(editor)).json()
    top = data["textos_mes_agradats"][0]
    assert top["text_id"] == str(text.id)
    assert top["likes"] == 1


def test_metriques_parades_requereix_editor_o_admin(client, auth_headers, visitant, editor):
    assert client.get("/metriques/parades", headers=auth_headers(visitant)).status_code == 403
    assert client.get("/metriques/parades", headers=auth_headers(editor)).status_code == 200


def test_metriques_parades_conte_desglossament_per_parada(client, auth_headers, visitant, editor, parada, text):
    client.post("/visites/", json={"parada_id": str(parada.id)}, headers=auth_headers(visitant))
    client.post(
        "/comentaris/",
        json={"contingut": "x", "parada_id": str(parada.id)},
        headers=auth_headers(visitant),
    )
    client.post(f"/likes/{text.id}", headers=auth_headers(visitant))

    data = client.get("/metriques/parades", headers=auth_headers(editor)).json()
    fila = next(p for p in data if p["parada_id"] == str(parada.id))
    assert fila["visites_per_mode"]["REMOT"] == 1
    assert fila["comentaris"] == 1
    assert fila["likes"] == 1

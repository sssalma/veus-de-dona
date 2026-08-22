def test_donar_like(client, auth_headers, visitant, text):
    resp = client.post(f"/likes/{text.id}", headers=auth_headers(visitant))
    assert resp.status_code == 201
    assert resp.json()["usuari_id"] == str(visitant.id)


def test_donar_like_sense_token_dona_401(client, text):
    resp = client.post(f"/likes/{text.id}")
    assert resp.status_code == 401


def test_donar_like_a_text_inexistent_dona_404(client, auth_headers, visitant):
    resp = client.post(
        "/likes/00000000-0000-0000-0000-000000000000",
        headers=auth_headers(visitant),
    )
    assert resp.status_code == 404


def test_check_like_abans_i_despres(client, auth_headers, visitant, text):
    resp1 = client.get(f"/likes/{text.id}/check", headers=auth_headers(visitant))
    assert resp1.json() == {"liked": False, "count": 0}

    client.post(f"/likes/{text.id}", headers=auth_headers(visitant))

    resp2 = client.get(f"/likes/{text.id}/check", headers=auth_headers(visitant))
    assert resp2.json() == {"liked": True, "count": 1}


def test_treure_like(client, auth_headers, visitant, text):
    client.post(f"/likes/{text.id}", headers=auth_headers(visitant))
    resp = client.delete(f"/likes/{text.id}", headers=auth_headers(visitant))
    assert resp.status_code == 204

    check = client.get(f"/likes/{text.id}/check", headers=auth_headers(visitant))
    assert check.json()["liked"] is False


def test_treure_like_inexistent_dona_404(client, auth_headers, visitant, text):
    resp = client.delete(f"/likes/{text.id}", headers=auth_headers(visitant))
    assert resp.status_code == 404


def test_likes_count_es_public(client, text):
    resp = client.get(f"/likes/{text.id}/count")
    assert resp.status_code == 200
    assert resp.json()["likes"] == 0


def test_donar_like_dues_vegades_no_duplica(client, auth_headers, visitant, text):
    r1 = client.post(f"/likes/{text.id}", headers=auth_headers(visitant))
    r2 = client.post(f"/likes/{text.id}", headers=auth_headers(visitant))
    assert r1.status_code == 201
    assert r2.status_code == 201
    # segona crida no ha de crear un segon like pel mateix usuari/text
    count = client.get(f"/likes/{text.id}/count").json()["likes"]
    assert count == 1

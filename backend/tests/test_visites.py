from app.services.visites import detectar_mode
from app.models.visita import Mode
from app.models.parada import COORDENADES_GPS, CoordenadesParada

BALCO_LAT, BALCO_LNG = COORDENADES_GPS[CoordenadesParada.BALCO_MEDITERRANI]


# ---- detectar_mode: proximitat i ordre de la ruta ----

def test_sense_gps_es_remot(db_session, visitant, parada):
    mode = detectar_mode(db_session, visitant.id, parada, None, None)
    assert mode == Mode.REMOT


def test_gps_lluny_es_remot(db_session, visitant, parada):
    # ~1,1 km al nord de la coordenada real, molt per damunt dels 50 m
    mode = detectar_mode(db_session, visitant.id, parada, BALCO_LAT + 0.01, BALCO_LNG)
    assert mode == Mode.REMOT


def test_gps_a_prop_de_la_primera_parada_es_guiat(db_session, visitant, parada):
    # la primera parada de la ruta sempre és GUIAT si s'hi és a sobre:
    # no cal cap visita anterior
    mode = detectar_mode(db_session, visitant.id, parada, BALCO_LAT, BALCO_LNG)
    assert mode == Mode.GUIAT


def test_segona_parada_sense_visitar_primera_es_lliure(db_session, visitant, parada, segona_parada):
    # la parada 1 hi és i està activa, però no s'ha visitat: va fora d'ordre
    lat, lng = COORDENADES_GPS[segona_parada.coordenades]
    mode = detectar_mode(db_session, visitant.id, segona_parada, lat, lng)
    assert mode == Mode.LLIURE


def test_segona_parada_amb_la_primera_desactivada_es_guiat(
    db_session, visitant, parada, segona_parada
):
    """Regressió: si una editora desactiva una parada, la següent ha de seguir
    essent accessible en mode GUIAT. Abans de la correcció, la consulta buscava
    la parada d'ordre - 1 sense mirar-ne l'estat, i cap visita no tornava a ser
    mai més GUIAT."""
    parada.activa = False
    db_session.commit()

    lat, lng = COORDENADES_GPS[segona_parada.coordenades]
    mode = detectar_mode(db_session, visitant.id, segona_parada, lat, lng)
    assert mode == Mode.GUIAT


def test_segona_parada_despres_de_visitar_primera_es_guiat(client, auth_headers, visitant, parada, segona_parada):
    # primer es registra la visita a la parada 1 per l'endpoint de debò
    lat1, lng1 = COORDENADES_GPS[parada.coordenades]
    client.post(
        "/visites/",
        json={"parada_id": str(parada.id), "lat": lat1, "lng": lng1},
        headers=auth_headers(visitant),
    )

    lat2, lng2 = COORDENADES_GPS[segona_parada.coordenades]
    resp = client.post(
        "/visites/",
        json={"parada_id": str(segona_parada.id), "lat": lat2, "lng": lng2},
        headers=auth_headers(visitant),
    )
    assert resp.status_code == 201
    assert resp.json()["mode"] == "GUIAT"


# ---- endpoint tests ----

def test_registrar_visita_remota(client, auth_headers, visitant, parada):
    resp = client.post(
        "/visites/",
        json={"parada_id": str(parada.id)},
        headers=auth_headers(visitant),
    )
    assert resp.status_code == 201
    assert resp.json()["mode"] == "REMOT"


def test_registrar_visita_sense_token_dona_401(client, parada):
    resp = client.post("/visites/", json={"parada_id": str(parada.id)})
    assert resp.status_code == 401


def test_registrar_visita_a_parada_inexistent_dona_404(client, auth_headers, visitant):
    resp = client.post(
        "/visites/",
        json={"parada_id": "00000000-0000-0000-0000-000000000000"},
        headers=auth_headers(visitant),
    )
    assert resp.status_code == 404


def test_registrar_visita_repetida_no_duplica(client, auth_headers, visitant, parada):
    r1 = client.post("/visites/", json={"parada_id": str(parada.id)}, headers=auth_headers(visitant))
    r2 = client.post("/visites/", json={"parada_id": str(parada.id)}, headers=auth_headers(visitant))
    assert r1.json()["id"] == r2.json()["id"]

    meves = client.get("/visites/me", headers=auth_headers(visitant)).json()
    assert len(meves) == 1


def test_meves_visites_nomes_retorna_les_propies(client, auth_headers, visitant, editor, parada):
    client.post("/visites/", json={"parada_id": str(parada.id)}, headers=auth_headers(visitant))
    resp = client.get("/visites/me", headers=auth_headers(editor))
    assert resp.json() == []

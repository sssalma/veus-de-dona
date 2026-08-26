"""Escenari concret: tres parades fetes en remot i despres hi vaig fisicament."""
import uuid

from app.models.parada import Parada, CoordenadesParada, COORDENADES_GPS


def _crea_parada(db, ordre, coord, nom):
    p = Parada(id=uuid.uuid4(), ordre=ordre, nom_espai=nom, coordenades=coord, activa=True)
    db.add(p)
    db.commit()
    db.refresh(p)
    return p


def _marca(client, headers, parada, lat=None, lng=None):
    cos = {"parada_id": str(parada.id)}
    if lat is not None:
        cos["lat"], cos["lng"] = lat, lng
    return client.post("/visites/", json=cos, headers=headers)


def test_que_passa_si_torno_a_una_parada_feta_en_remot(client, auth_headers, visitant, db_session):
    """Les 3 primeres des de casa i despres soc al costat de la primera."""
    p1 = _crea_parada(db_session, 1, CoordenadesParada.BALCO_MEDITERRANI, "Balco")
    p2 = _crea_parada(db_session, 2, CoordenadesParada.AMFITEATRE, "Amfiteatre")
    p3 = _crea_parada(db_session, 3, CoordenadesParada.BAIXADA_PEIXATERIA, "Peixateria")
    h = auth_headers(visitant)

    for p in (p1, p2, p3):
        assert _marca(client, h, p).json()["mode"] == "REMOT"

    # ara soc fisicament al Balco i el torno a marcar
    lat, lng = COORDENADES_GPS[CoordenadesParada.BALCO_MEDITERRANI]
    resp = _marca(client, h, p1, lat, lng)

    assert resp.status_code == 201
    # segueix sent REMOT: es retorna la visita que ja hi havia
    assert resp.json()["mode"] == "REMOT"
    # i no se n'ha creat cap de nova
    assert len(client.get("/visites/me", headers=h).json()) == 3


def test_quarta_parada_presencial_despres_de_tres_en_remot(client, auth_headers, visitant, db_session):
    """La cadena de GUIAT nomes mira que la parada anterior estigui visitada,
    no de quina manera es va visitar."""
    p1 = _crea_parada(db_session, 1, CoordenadesParada.BALCO_MEDITERRANI, "Balco")
    p2 = _crea_parada(db_session, 2, CoordenadesParada.AMFITEATRE, "Amfiteatre")
    p3 = _crea_parada(db_session, 3, CoordenadesParada.BAIXADA_PEIXATERIA, "Peixateria")
    p4 = _crea_parada(db_session, 4, CoordenadesParada.PLACA_REI, "Placa del Rei")
    h = auth_headers(visitant)

    for p in (p1, p2, p3):
        _marca(client, h, p)

    lat, lng = COORDENADES_GPS[CoordenadesParada.PLACA_REI]
    resp = _marca(client, h, p4, lat, lng)

    assert resp.status_code == 201
    assert resp.json()["mode"] == "GUIAT"


def test_parada_presencial_saltant_se_lanterior_es_lliure(client, auth_headers, visitant, db_session):
    """Si la parada anterior no s'ha tocat de cap manera, es LLIURE."""
    p1 = _crea_parada(db_session, 1, CoordenadesParada.BALCO_MEDITERRANI, "Balco")
    p2 = _crea_parada(db_session, 2, CoordenadesParada.AMFITEATRE, "Amfiteatre")
    h = auth_headers(visitant)

    lat, lng = COORDENADES_GPS[CoordenadesParada.AMFITEATRE]
    resp = _marca(client, h, p2, lat, lng)

    assert resp.json()["mode"] == "LLIURE"

"""Unit tests for the great-circle distance used to infer the visit mode.

These call the function directly: no HTTP client, no database, no fixtures.
"""
from app.services.geo import haversine


def test_distancia_dun_punt_a_ell_mateix_es_zero():
    assert haversine(41.1146, 1.2560, 41.1146, 1.2560) == 0


def test_un_grau_de_latitud_son_uns_111_km():
    # a degree of latitude is ~111.19 km anywhere on the globe
    distancia = haversine(41.0, 1.0, 42.0, 1.0)
    assert 111_000 < distancia < 111_400


def test_la_distancia_es_simetrica():
    anada = haversine(41.1146, 1.2560, 41.1190, 1.2588)
    tornada = haversine(41.1190, 1.2588, 41.1146, 1.2560)
    assert anada == tornada


def test_una_millesima_de_grau_de_longitud_es_de_lordre_del_llindar():
    # at Tarragona's latitude ~0.001 degrees of longitude is a few dozen metres,
    # the scale the 50 m proximity threshold works at
    distancia = haversine(41.0, 1.0000, 41.0, 1.0010)
    assert 80 < distancia < 90

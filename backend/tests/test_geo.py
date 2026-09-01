"""Unit tests for the great-circle distance used to infer the visit mode.

These call the function directly: no HTTP client, no database, no fixtures.
"""
from app.models.parada import COORDENADES_GPS, CoordenadesParada
from app.services.geo import haversine
from app.services.visites import PROXIMITY_THRESHOLD_M


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


# ------------------------------------------------ la decisio de proximitat
# The mode a visit is recorded under hangs on this comparison: closer than the
# threshold and the visit counts as made on the spot, further and it is remote.

def test_a_la_parada_mateixa_es_dins_del_llindar():
    balco = COORDENADES_GPS[CoordenadesParada.BALCO_MEDITERRANI]
    assert haversine(balco[0], balco[1], balco[0], balco[1]) < PROXIMITY_THRESHOLD_M


def test_des_duna_parada_la_seguent_queda_fora_del_llindar():
    balco = COORDENADES_GPS[CoordenadesParada.BALCO_MEDITERRANI]
    amfiteatre = COORDENADES_GPS[CoordenadesParada.AMFITEATRE]
    assert haversine(*balco, *amfiteatre) > PROXIMITY_THRESHOLD_M


def test_el_llindar_confirma_la_presencia_pero_no_identifica_la_parada():
    # Pla de la Seu and Carrer Major are 43 m apart, less than the threshold:
    # standing at one you are also within range of the other. This is not a
    # defect - the mode is worked out for the stop being marked, not guessed -
    # but it does mean proximity alone cannot tell the two apart.
    seu = COORDENADES_GPS[CoordenadesParada.PLA_SEU]
    major = COORDENADES_GPS[CoordenadesParada.CARRER_MAJOR]
    assert haversine(*seu, *major) < PROXIMITY_THRESHOLD_M

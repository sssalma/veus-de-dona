"""Proves unitàries de la distància amb què es dedueix el mode de la visita.

Criden la funció directament: sense client HTTP, sense base de dades i sense
fixtures.
"""
from app.models.parada import COORDENADES_GPS, CoordenadesParada
from app.services.geo import haversine
from app.services.visites import PROXIMITY_THRESHOLD_M


def test_distancia_dun_punt_a_ell_mateix_es_zero():
    assert haversine(41.1146, 1.2560, 41.1146, 1.2560) == 0


def test_un_grau_de_latitud_son_uns_111_km():
    # un grau de latitud són ~111,19 km a qualsevol punt del planeta
    distancia = haversine(41.0, 1.0, 42.0, 1.0)
    assert 111_000 < distancia < 111_400


def test_la_distancia_es_simetrica():
    anada = haversine(41.1146, 1.2560, 41.1190, 1.2588)
    tornada = haversine(41.1190, 1.2588, 41.1146, 1.2560)
    assert anada == tornada


def test_una_millesima_de_grau_de_longitud_es_de_lordre_del_llindar():
    # a la latitud de Tarragona, 0,001 graus de longitud són unes desenes de
    # metres: l'escala a la qual treballa el llindar de 50 m
    distancia = haversine(41.0, 1.0000, 41.0, 1.0010)
    assert 80 < distancia < 90


# ------------------------------------------------ la decisió de proximitat
# El mode amb què es desa una visita depèn d'aquesta comparació: per sota del
# llindar val com a feta al lloc, i per damunt val com a remota.

def test_a_la_parada_mateixa_es_dins_del_llindar():
    balco = COORDENADES_GPS[CoordenadesParada.BALCO_MEDITERRANI]
    assert haversine(balco[0], balco[1], balco[0], balco[1]) < PROXIMITY_THRESHOLD_M


def test_des_duna_parada_la_seguent_queda_fora_del_llindar():
    balco = COORDENADES_GPS[CoordenadesParada.BALCO_MEDITERRANI]
    amfiteatre = COORDENADES_GPS[CoordenadesParada.AMFITEATRE]
    assert haversine(*balco, *amfiteatre) > PROXIMITY_THRESHOLD_M


def test_el_llindar_confirma_la_presencia_pero_no_identifica_la_parada():
    # El Pla de la Seu i el Carrer Major són a 43 m, menys que el llindar: qui
    # és a l'una també és a l'abast de l'altra. No és cap defecte -el mode es
    # calcula per a la parada que es marca, no s'endevina-, però vol dir que la
    # proximitat sola no permet distingir-les.
    seu = COORDENADES_GPS[CoordenadesParada.PLA_SEU]
    major = COORDENADES_GPS[CoordenadesParada.CARRER_MAJOR]
    assert haversine(*seu, *major) < PROXIMITY_THRESHOLD_M

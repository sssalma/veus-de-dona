"""Proves unitàries de com es llegeix una obra traduïda del web del projecte.

Les quatre funcions són pures -entra una cadena o una llista i en surt una
cadena-, així que es proven directament, sense xarxa i sense base de dades.
"""
from scripts.scraper_traduccions_textos import clau, es_referencia, neteja, uneix


# ---------------------------------------------------------------------- clau

def test_el_titol_partit_per_maquetacio_es_el_mateix_titol():
    # el web escriu "RETURN" lletra per lletra i el títol arriba partit
    assert clau("RET U RN") == clau("RETURN")


def test_els_signes_i_les_majuscules_no_compten():
    assert clau("THE GREY ROOM (IV)") == clau("The Grey Room (IV)")


def test_dos_fragments_duna_mateixa_obra_no_es_confonen():
    assert clau("THE GREY ROOM (IV)") != clau("THE GREY ROOM (VI)")


# -------------------------------------------------------------- es_referencia

def test_la_referencia_de_ledicio_es_reconeix():
    assert es_referencia("Enfilall , 2002")


def test_lany_partit_pel_mig_tambe():
    # el web l'escriu "1 999": una cerca de quatre dígits seguits no el trobaria
    assert es_referencia("The friendship of stones , 1 999")


def test_un_vers_amb_un_numero_no_es_una_referencia():
    assert not es_referencia("and the seven hills of the city")


def test_un_paragraf_llarg_no_es_una_referencia():
    # un paràgraf de prosa pot anomenar un any sense ser la referència
    assert not es_referencia(
        "She returned to Barcelona in 1960, after twenty years in Chile, and "
        "found a city that no longer knew her, with streets renamed and shops "
        "she could not place, and started to write again from the beginning."
    )


# -------------------------------------------------------------------- neteja

def test_els_espais_durs_passen_a_espais():
    assert neteja("and  consoles herself") == "and consoles herself"


def test_els_espais_damplada_zero_desapareixen():
    assert neteja("geo​graphy") == "geography"


def test_la_puntuacio_del_web_es_respecta():
    # l'espai abans de la coma és del web; copiar no és corregir
    assert neteja("in vain , the march") == "in vain , the march"


# --------------------------------------------------------------------- uneix

def test_els_versos_van_seguits():
    versos = [
        "As we won't find the light,",
        "we will have to chase the voice.",
        "Let's start the word game",
    ]
    assert uneix(versos) == "\n".join(versos)


def test_els_paragrafs_de_prosa_van_separats():
    paragrafs = [
        "The air enclosed within the arcades, barely cleared by the colored "
        "rays that were thrown from far above, was icy, pleasant.",
        "A scent of humidity made her breathe, deeply, and she raised her eyes "
        "to the great column that rose beside her.",
    ]
    assert uneix(paragrafs) == "\n\n".join(paragrafs)


def test_una_nota_al_peu_llarga_no_converteix_el_poema_en_prosa():
    # la mediana, no la mitjana: un vers llarg entre curts segueix sent vers
    versos = [
        "those who on their honoured brow",
        "sport the typical red barretina*",
        "*(Catalan peasant's hat or beret, worn in the fields and at the fairs)",
    ]
    assert uneix(versos) == "\n".join(versos)

"""Unit tests for the two extraction criteria used when loading the authors.

Both functions are pure - a string in, a string out - so they are tested
directly, without the network, the scraper or the database.
"""
from scripts.scraper_autores import extreure_anys_vida, partir_nom


# --------------------------------------------------------------- partir_nom

def test_cognom_compost_amb_nom_compost():
    # taking the first word as the given name would file her under "A"
    assert partir_nom("Maria Aurèlia Capmany i Farnés") == (
        "Maria Aurèlia",
        "Capmany i Farnés",
    )


def test_cognom_compost_amb_nom_simple():
    assert partir_nom("Olga Xirinacs i Díaz") == ("Olga", "Xirinacs i Díaz")


def test_sense_conjuncio_el_primer_mot_es_el_nom():
    assert partir_nom("Mercè Rodoreda") == ("Mercè", "Rodoreda")


def test_nom_dun_sol_mot_deixa_el_cognom_buit():
    assert partir_nom("Safo") == ("Safo", "")


# -------------------------------------------------------- extreure_anys_vida

def test_parentesi_que_obre_la_biografia():
    # the name has already been stripped, so the parenthesis opens the text
    assert extreure_anys_vida("(1918-2014) Poetessa i traductora.") == "1918-2014"


def test_ignora_els_parentesis_enmig_de_la_prosa():
    # "Ed. Empúries, 2006" is an edition footer, not a life span
    bio = "Va publicar diversos reculls de poemes (Ed. Empúries, 2006)."
    assert extreure_anys_vida(bio) == ""


def test_el_parentesi_biografic_guanya_el_dedicio():
    bio = "(1922-2006) Escriptora. Va publicar a Barcelona (Ed. Proa, 1998)."
    assert extreure_anys_vida(bio) == "1922-2006"


def test_sense_parentesi_busca_lany_a_la_primera_frase():
    assert extreure_anys_vida("Nascuda a Tarragona el 1945, és poeta.") == "1945"


def test_sense_cap_any_torna_cadena_buida():
    assert extreure_anys_vida("Poetessa i traductora tarragonina.") == ""

# -*- coding: utf-8 -*-
"""Versions en anglès dels textos literaris, extretes del web del projecte.

El web de Veus de Dona publica, a l'apartat en anglès, la traducció de 15 de
les 17 obres de la ruta. No les tradueix ningú d'aquí: es reprodueixen tal com
el projecte ja les publica, igual que es fa amb els originals en català.
Traduir-les pel nostre compte seria obra derivada, i el permís amb què es
reprodueixen no hi arriba.

Per això tampoc tenen panell d'edició, a diferència de les biografies de les
autores: són text fix d'una font externa. Si al web canvien, es torna a passar
aquest guió.

Les dues que falten no hi són perquè el web no les té traduïdes:
    - Cinta Mulet, "Vull pujar en aquell terrat" (la pàgina anglesa de
      l'autora només en dona l'original català, al final de KING'S SQUARE)
    - Margarida Aritzeta, "Rapsodia per a un mort II" (el web tradueix el
      fragment III, que no és el que porta la ruta)
Aquestes dues es queden en català a l'aplicació, que ho adverteix.

L'aparellament obra-traducció va escrit a mà a TRADUCCIONS i no es dedueix del
web: els títols anglesos no són la traducció literal del català ("Tatuic" surt
com a "ytiC"), diversos fragments d'una mateixa obra comparteixen enllaç, i
n'hi ha que no en tenen cap. Amb disset obres, una taula explícita és més
fiable -i més fàcil de revisar- que qualsevol heurística.

Ús:
    python -m scripts.scraper_traduccions_textos            # desa
    python -m scripts.scraper_traduccions_textos --prova    # només ho mostra
"""
import os
import re
import statistics
import sys
import time

import requests
from bs4 import BeautifulSoup

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import SessionLocal
from app.models.autora import Autora
from app.models.text import Text
from app.models.text_traduccio import TextTraduccio
from app.models.usuari import Idioma
from scripts.scraper_autores import partir_nom

BASE_URL = "https://sites.google.com/view/veusdedona/page/en-english/en"

HEADERS = {
    "User-Agent": "Mozilla/5.0 (compatible; VeusDona-TFG/1.0)"
}

# `encapcalament` és el títol tal com surt al web, que és com es localitza la
# secció; `titol_en` és el que es desa. Difereixen en majúscules i, a "Ran de
# mar", també perquè l'encapcalament del web té una errada ("LEEL" per "LEVEL")
# que no té sentit arrossegar fins a l'aplicació.
TRADUCCIONS = [
    {
        "autora": "Montserrat Abelló i Soler",
        "titol_ca": "Retorn",
        "pagina": "montserrat-abelló-i-soler-en",
        "encapcalament": "RETURN",
        "titol_en": "Return",
    },
    {
        "autora": "Olga Xirinacs i Díaz",
        "titol_ca": "Música de cambra I",
        "pagina": "olga-xirinacs-i-díaz-en",
        "encapcalament": "CHAMBER MUSIC (I)",
        "titol_en": "Chamber Music I",
    },
    {
        "autora": "Lurdes Malgrat i Escarp",
        "titol_ca": "Silenci",
        "pagina": "lurdes-malgrat-i-escarp-en",
        "encapcalament": "SILENCE",
        "titol_en": "Silence",
    },
    {
        "autora": "Noemi Bagés i Fortacín",
        "titol_ca": "Perdoni a quin segle diu que som? I",
        "pagina": "noemi-bagés-i-fortacín-en",
        "encapcalament": "EXCUSE ME, WHAT CENTURY DID YOU SAY WE ARE IN? (I)",
        "titol_en": "Excuse me, what century did you say we are in? I",
    },
    {
        "autora": "Isabel Ortega i Rion",
        "titol_ca": "Ran de mar",
        "pagina": "isabel-ortega-i-rion-en",
        "encapcalament": "AT SEA LEEL",
        "titol_en": "At Sea Level",
    },
    {
        "autora": "Maria Domènech i Escoté",
        "titol_ca": "Costums tarragonines",
        "pagina": "maria-domènech-i-escoté-en",
        "encapcalament": "CUSTOMS OF TARRAGONA",
        "titol_en": "Customs of Tarragona",
    },
    {
        "autora": "Olga Xirinacs i Díaz",
        "titol_ca": "La placeta dels Àngels",
        "pagina": "olga-xirinacs-i-díaz-en",
        "encapcalament": "ANGELS SQUARE",
        "titol_en": "Angels Square",
    },
    {
        "autora": "Isabel Ortega i Rion",
        "titol_ca": "Tatuic",
        "pagina": "isabel-ortega-i-rion-en",
        # el títol català és "Ciutat" escrit del revés, i el web fa el mateix
        # joc en anglès: és un títol, no una errada
        "encapcalament": "ytiC",
        "titol_en": "ytiC",
    },
    {
        "autora": "Josepa Massanés i Dalmau",
        "titol_ca": "Als bons pagesos",
        "pagina": "josepa-massanés-i-dalmau-en",
        "encapcalament": "TO THE GOOD FARMERS",
        "titol_en": "To the Good Farmers",
    },
    {
        "autora": "Roser Guasch i Bea",
        "titol_ca": "Laberint",
        "pagina": "roser-guasch-i-bea-en",
        "encapcalament": "LABYRINTH",
        "titol_en": "Labyrinth",
    },
    {
        "autora": "Maria Aurèlia Capmany i Farnés",
        "titol_ca": "L'altra ciutat II",
        "pagina": "maria-aurèlia-capmany-i-farnés-en",
        "encapcalament": "THE OTHER CITY (II)",
        "titol_en": "The Other City II",
    },
    {
        "autora": "Montserrat Palau i Vergés",
        "titol_ca": "En nom del pare III",
        "pagina": "montserrat-palau-i-vergés-en",
        "encapcalament": "IN THE NAME OF THE FATHER (III)",
        "titol_en": "In the Name of the Father III",
    },
    {
        "autora": "Mònica Batet i Boada",
        "titol_ca": "L'habitació grisa IV",
        "pagina": "mònica-batet-i-boada-en",
        "encapcalament": "THE GREY ROOM (IV)",
        "titol_en": "The Grey Room IV",
    },
    {
        "autora": "Montserrat Abelló i Soler",
        "titol_ca": "No hem parlat de res",
        "pagina": "montserrat-abelló-i-soler-en",
        "encapcalament": "WE DID NOT TALK ABOUT ANYTHING",
        "titol_en": "We Did Not Talk About Anything",
    },
    {
        "autora": "Mònica Batet i Boada",
        "titol_ca": "L'habitació grisa VI",
        "pagina": "mònica-batet-i-boada-en",
        "encapcalament": "THE GREY ROOM (VI)",
        "titol_en": "The Grey Room VI",
    },
]


def clau(text: str) -> str:
    """El títol reduït al que es pot comparar.

    El web parteix els títols per maquetar-los -"RET U RN", "SILENC E"-, de
    manera que només les lletres i els números són fiables.
    """
    return re.sub(r"[^a-z0-9]", "", text.lower())


# Les obres acaben amb la referència de l'edició ("Enfilall, 2002"), i a
# l'aplicació això ja va a part, al camp obra_origen del text.
ANY_DE_LEDICIO = re.compile(r"(?:\d[  ]*){4}")


# Cap vers d'aquestes obres no arriba als 70 caracters, i cap paràgraf de
# prosa no hi baixa.
LLARGADA_DUN_VERS = 70


def es_referencia(paragraf: str) -> bool:
    """Cert si el paràgraf és la referència de l'edició i no part de l'obra."""
    return len(paragraf) <= 160 and bool(ANY_DE_LEDICIO.search(paragraf))


def neteja(text: str) -> str:
    """Només espais: espais durs, espais d'amplada zero i espais repetits.

    La puntuació i les majúscules es queden com al web. El text és d'altri i
    aquest guió el copia, no l'edita.
    """
    t = text.replace(" ", " ").replace("​", "")
    return re.sub(r"[ \t]{2,}", " ", t).strip()


def descarrega(pagina: str) -> BeautifulSoup:
    """La pàgina anglesa d'una autora."""
    resposta = requests.get(f"{BASE_URL}/{pagina}", headers=HEADERS, timeout=20)
    resposta.raise_for_status()
    resposta.encoding = "utf-8"
    return BeautifulSoup(resposta.text, "html.parser")


def extreu_obra(soup: BeautifulSoup, encapcalament: str) -> list[str] | None:
    """Els paràgrafs d'una obra dins la pàgina d'una autora.

    Cada obra viu en una secció encapcalada pel seu títol. El títol també surt
    a l'índex de la pàgina, allí sense text a sota: per això no n'hi ha prou de
    trobar l'encapcalament i cal que la secció porti paràgrafs.
    """
    for seccio in soup.find_all("div", class_="mYVXT"):
        titol = seccio.find(["h1", "h2", "h3", "h4"])
        if not titol or clau(titol.get_text("")) != clau(encapcalament):
            continue

        paragrafs = []
        for p in seccio.find_all("p", class_="zfr3Q"):
            # els fragments llargs van plegats darrere un "Read more" que es un
            # paràgraf més, i el desplegable no forma part de l'obra
            if clau(p.get_text("")) in ("readmore", "llegirms", "llegirmes"):
                continue
            net = neteja(p.get_text(""))
            if net:
                paragrafs.append(net)

        if not paragrafs:
            continue
        if es_referencia(paragrafs[-1]):
            paragrafs.pop()
        return paragrafs

    return None


def uneix(paragrafs: list[str]) -> str:
    """Els paràgrafs, separats segons si l'obra és vers o prosa.

    Al web tant els versos com els paràgrafs són un <p>, i el marcatge no els
    distingeix. El que els distingeix és la llargada: un vers cap en una línia
    i un paràgraf de prosa, no. Es mira la mediana i no la mitjana perquè una
    obra en vers amb una nota al peu llarga segueix sent vers.
    """
    mediana = statistics.median(len(p) for p in paragrafs)
    separador = "\n" if mediana < LLARGADA_DUN_VERS else "\n\n"
    return separador.join(paragrafs)


def seed(prova: bool = False) -> None:
    db = SessionLocal()
    pagines: dict[str, BeautifulSoup] = {}
    desades = 0
    errors = []

    try:
        print("Extraient les traduccions del web de Veus de Dona...")
        for item in TRADUCCIONS:
            nom, cognom = partir_nom(item["autora"])
            autora = db.query(Autora).filter(
                Autora.nom == nom,
                Autora.cognom == cognom,
            ).first()
            if not autora:
                errors.append(f"Autora '{item['autora']}' no trobada")
                continue

            text = db.query(Text).filter(
                Text.autora_id == autora.id,
                Text.titol == item["titol_ca"],
            ).first()
            if not text:
                errors.append(f"Text '{item['titol_ca']}' no trobat")
                continue

            if item["pagina"] not in pagines:
                pagines[item["pagina"]] = descarrega(item["pagina"])
                time.sleep(1)

            paragrafs = extreu_obra(pagines[item["pagina"]], item["encapcalament"])
            if not paragrafs:
                errors.append(f"'{item['encapcalament']}' no trobat a {item['pagina']}")
                continue

            contingut = uneix(paragrafs)

            if prova:
                print(f"\n=== {item['titol_ca']} -> {item['titol_en']} "
                      f"({len(paragrafs)} paragrafs) ===")
                print(contingut[:300] + ("..." if len(contingut) > 300 else ""))
                continue

            # es reescriu a sobre en comptes d'esborrar i tornar a crear: així
            # el guió es pot repetir sense deixar forats pel mig
            traduccio = db.query(TextTraduccio).filter(
                TextTraduccio.text_id == text.id,
                TextTraduccio.idioma == Idioma.EN,
            ).first()
            if traduccio:
                setattr(traduccio, "titol", item["titol_en"])
                setattr(traduccio, "contingut", contingut)
            else:
                db.add(TextTraduccio(
                    text_id=text.id,
                    idioma=Idioma.EN,
                    titol=item["titol_en"],
                    contingut=contingut,
                ))
            desades += 1
            print(f"  V {item['titol_ca']} -> {item['titol_en']} "
                  f"({len(paragrafs)} paragrafs)")

        if not prova:
            db.commit()
            print(f"\nV {desades} traduccions desades.")

        for error in errors:
            print(f"  X {error}")

    except Exception as e:
        db.rollback()
        print(f"Error: {e}")
    finally:
        db.close()


if __name__ == "__main__":
    seed(prova="--prova" in sys.argv)

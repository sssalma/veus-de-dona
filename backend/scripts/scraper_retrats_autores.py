"""
Retrats de les autores, extrets del web del projecte.

Sense arguments agafa la primera imatge pròpia de cada pàgina i la puja. La
primera és sempre el retrat: comprovat contra el web l'1-09-2026, i verificat
imatge a imatge en tres autores, inclòs el retrat pintat de la Massanés, que és
del segle XIX. És aquesta regla la que permet encadenar-ho amb la resta de la
càrrega, a `scripts/poblar.py`.

Es descarten soles les imatges que surten a més d'una pàgina: són el cromo del
lloc, no el retrat de ningú.

Si el web es reordena, la regla deixa de valer i el guió pujaria una portada de
llibre sense dir res. Per això hi ha un camí de revisió, en dues fases, que
baixa totes les candidates al disc perquè algú les miri i puja després la que
hagi quedat:

    python -m scripts.scraper_retrats_autores              # primera imatge, directe
    python -m scripts.scraper_retrats_autores --descarrega # totes, a backend/retrats/
    python -m scripts.scraper_retrats_autores --puja       # la que hagi quedat a cada carpeta

Les dues fases de revisió treballen amb fitxers del disc local i per tant
s'executen des de la màquina; el camí directe corre igual de bé dins del
contenidor. La pujada sempre passa per `autores_service.update_autora_foto()`,
el mateix camí que fa servir el panell d'edició, que esborra l'objecte anterior
i per tant no deixa orfes a MinIO.
"""
import argparse
import os
import re
import sys
import time
import unicodedata
from collections import Counter

import requests

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import SessionLocal
from app.models.autora import Autora
from app.services import autores as autores_service

BASE_URL = "https://sites.google.com/view/veusdedona/autores"
HEADERS = {"User-Agent": "Mozilla/5.0"}

CARPETA = os.path.join(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "retrats"
)

AUTORES_SLUGS = [
    "montserrat-abelló-i-soler",
    "margarida-aritzeta-i-abad",
    "noemi-bagés-i-fortacín",
    "mònica-batet-i-boada",
    "maria-aurèlia-capmany-i-farnés",
    "maria-domènech-i-escoté",
    "roser-guasch-i-bea",
    "lurdes-malgrat-i-escarp",
    "josepa-massanés-i-dalmau",
    "cinta-mulet-i-grau",
    "isabel-ortega-i-rion",
    "montserrat-palau-i-vergés",
    "olga-xirinacs-i-díaz",
]

IMATGE = re.compile(r'<img[^>]*src="(https://lh3\.googleusercontent\.com/[^"]+=w\d+)"')

EXTENSIONS = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/gif": "gif",
}


def normalitza(text: str) -> str:
    """Deixa només lletres i dígits, sense accents ni majúscules.

    Serveix per aparellar el nom del directori amb el de la fila: el web escriu
    "noemi-bagés-i-fortacín" i la base de dades pot tenir-hi els accents en
    altres llocs."""
    sense_accents = "".join(
        c for c in unicodedata.normalize("NFD", text) if unicodedata.category(c) != "Mn"
    )
    return re.sub(r"[^a-z0-9]", "", sense_accents.lower())


def imatges_de(slug: str) -> list[str]:
    """Les imatges d'una pàgina, en ordre d'aparició i sense repeticions."""
    url = f"{BASE_URL}/{slug}"
    try:
        resposta = requests.get(url, headers=HEADERS, timeout=20)
        resposta.raise_for_status()
    except Exception as error:
        print(f"  ERROR en llegir {url}: {error}")
        return []
    return list(dict.fromkeys(IMATGE.findall(resposta.text)))


def baixa_imatge(url: str, referent: str) -> tuple[bytes, str] | None:
    """Una imatge, amb reintents. Google respon 403 quan se li demana massa
    de pressa; esperar-se i tornar-hi sol n'hi ha prou."""
    capcaleres = dict(HEADERS, Referer=referent)
    for intent in range(3):
        try:
            resposta = requests.get(url, headers=capcaleres, timeout=30)
            resposta.raise_for_status()
            tipus = resposta.headers.get("Content-Type", "image/jpeg").split(";")[0]
            return resposta.content, EXTENSIONS.get(tipus, "jpg")
        except requests.HTTPError as error:
            if error.response is not None and error.response.status_code == 403:
                time.sleep(3 * (intent + 1))
                continue
            return None
        except Exception:
            return None
    return None


def candidates() -> dict[str, list[str]]:
    """Les imatges pròpies de cada pàgina, en ordre d'aparició.

    El cromo del lloc no s'identifica per cap llista fixa: és el que surt a més
    d'una pàgina. Per això cal llegir-les totes abans de decidir res."""
    print(f"Llegint les {len(AUTORES_SLUGS)} pagines...")
    per_pagina = {}
    for slug in AUTORES_SLUGS:
        per_pagina[slug] = imatges_de(slug)
        print(f"  {slug}: {len(per_pagina[slug])} imatges")

    aparicions = Counter(url for imatges in per_pagina.values() for url in imatges)
    return {
        slug: [url for url in imatges if aparicions[url] == 1]
        for slug, imatges in per_pagina.items()
    }


def autores_per_slug(db) -> dict:
    return {normalitza(f"{a.nom} {a.cognom}"): a for a in db.query(Autora).all()}


def puja_directe() -> int:
    """La primera imatge pròpia de cada pàgina, pujada sense passar pel disc."""
    propies_per_slug = candidates()

    db = SessionLocal()
    per_nom = autores_per_slug(db)

    pujats = 0
    avisos = []
    print()
    for slug, propies in propies_per_slug.items():
        if not propies:
            avisos.append(f"{slug}: cap imatge propia, es queda sense retrat")
            continue

        autora = per_nom.get(normalitza(slug))
        if not autora:
            avisos.append(f"{slug}: no hi ha cap autora que hi correspongui")
            continue

        imatge = baixa_imatge(propies[0], f"{BASE_URL}/{slug}")
        if not imatge:
            avisos.append(f"{slug}: el retrat no s'ha pogut baixar")
            continue

        contingut, extensio = imatge
        tipus = next(t for t, e in EXTENSIONS.items() if e == extensio)
        if autores_service.update_autora_foto(
            db, str(autora.id), contingut, f"retrat.{extensio}", tipus
        ):
            pujats += 1
            print(f"  {autora.nom} {autora.cognom}: retrat pujat")
        else:
            avisos.append(f"{slug}: la pujada ha fallat")
        time.sleep(1)

    db.close()
    print()
    print(f"{pujats} retrats pujats")
    for avis in avisos:
        print(f"  AVIS: {avis}")
    return 0


def descarrega() -> int:
    propies_per_slug = candidates()

    total = 0
    print()
    for slug, propies in propies_per_slug.items():
        desti = os.path.join(CARPETA, slug)
        os.makedirs(desti, exist_ok=True)

        if os.listdir(desti):
            print(f"  {slug}: ja te candidates baixades, s'omet")
            continue

        baixades = 0
        for posicio, url in enumerate(propies, 1):
            imatge = baixa_imatge(url, f"{BASE_URL}/{slug}")
            if not imatge:
                print(f"  ERROR: imatge {posicio} de {slug} no s'ha pogut baixar")
                continue
            contingut, extensio = imatge
            # numerades per les que arriben, no per la posició a la pàgina: una
            # descarrega fallida deixaria forats i el 01 podria no existir
            with open(os.path.join(desti, f"{baixades + 1:02d}.{extensio}"), "wb") as fitxer:
                fitxer.write(contingut)
            baixades += 1
            total += 1
            time.sleep(1)
        print(f"  {slug}: {baixades} candidates")

    print(f"\n{total} imatges a {CARPETA}")
    print("Deixa a cada carpeta nomes el retrat i executa-ho amb --puja.")
    return 0


def puja() -> int:
    if not os.path.isdir(CARPETA):
        print(f"No hi ha {CARPETA}. Executa-ho abans amb --descarrega.")
        return 1

    db = SessionLocal()
    per_nom = autores_per_slug(db)

    pujades = 0
    avisos = []
    for slug in AUTORES_SLUGS:
        desti = os.path.join(CARPETA, slug)
        if not os.path.isdir(desti):
            avisos.append(f"{slug}: no hi ha carpeta")
            continue

        fitxers = sorted(
            f for f in os.listdir(desti)
            if f.rsplit(".", 1)[-1].lower() in EXTENSIONS.values()
        )
        if not fitxers:
            avisos.append(f"{slug}: cap imatge, es queda sense retrat")
            continue
        if len(fitxers) > 1:
            avisos.append(f"{slug}: hi ha {len(fitxers)} imatges, deixa-n'hi una de sola")
            continue

        autora = per_nom.get(normalitza(slug))
        if not autora:
            avisos.append(f"{slug}: no hi ha cap autora que hi correspongui")
            continue

        nom_fitxer = fitxers[0]
        with open(os.path.join(desti, nom_fitxer), "rb") as fitxer:
            contingut = fitxer.read()

        extensio = nom_fitxer.rsplit(".", 1)[-1].lower()
        tipus = next(t for t, e in EXTENSIONS.items() if e == extensio)

        resultat = autores_service.update_autora_foto(
            db, str(autora.id), contingut, nom_fitxer, tipus
        )
        if resultat:
            pujades += 1
            print(f"  {autora.nom} {autora.cognom}: retrat pujat")
        else:
            avisos.append(f"{slug}: la pujada ha fallat")

    db.close()
    print(f"\n{pujades} retrats pujats")
    for avis in avisos:
        print(f"  AVIS: {avis}")
    return 0


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__.split("\n")[1])
    grup = parser.add_mutually_exclusive_group()
    grup.add_argument("--descarrega", action="store_true",
                      help="revisio: baixa totes les candidates a backend/retrats/")
    grup.add_argument("--puja", action="store_true",
                      help="revisio: puja la imatge que hagi quedat a cada carpeta")
    arguments = parser.parse_args()
    if arguments.descarrega:
        return descarrega()
    if arguments.puja:
        return puja()
    return puja_directe()


if __name__ == "__main__":
    sys.exit(main())

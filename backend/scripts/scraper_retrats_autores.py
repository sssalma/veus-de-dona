"""
Retrats de les autores, extrets del web del projecte.

Va en dues fases perque no hi ha manera fiable d'endevinar quina imatge d'una
pagina es el retrat: n'hi ha de portades de llibre i d'altres coses. La primera
fase baixa les candidates i la segona puja les que hagin quedat, de manera que
entremig hi ha una persona mirant-les.

    python -m scripts.scraper_retrats_autores --descarrega
    (esborrar a ma tot el que no sigui el retrat)
    python -m scripts.scraper_retrats_autores --puja

Es descarten soles les imatges que surten a mes d'una pagina: son el cromo del
lloc, no el retrat de ningu. Les que queden van numerades per ordre d'aparicio.
Comprovat contra el web l'1-09-2026: la primera imatge propia d'una pagina es
sempre el retrat, de manera que la revisio consisteix a deixar-hi el 01 i
esborrar la resta. Val la pena mirar-les igualment: son fotografies de persones
i el web les pot reordenar.

Aixo s'executa des de la maquina i no dins del contenidor, perque les imatges
van al disc local. Necessita `backend/.env` apuntant a localhost.

Google limita el ritme de descarrega i respon 403 si se li demanen moltes
imatges seguides, de manera que van d'una en una amb una pausa i amb un parell
de reintents. Per aixo mateix la descarrega salta les autores que ja tenen
candidates baixades: si una passada es queda a mitges, la seguent nomes va a
buscar el que falta.

La pujada passa per `autores_service.update_autora_foto()`, el mateix cami que
fa servir el panell d'edicio, que esborra l'objecte anterior i per tant no
deixa orfes a MinIO.
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
    """Deixa nomes lletres i digits, sense accents ni majuscules.

    Serveix per aparellar el nom del directori amb el de la fila: el web escriu
    "noemi-bagés-i-fortacín" i la base de dades pot tenir-hi els accents en
    altres llocs."""
    sense_accents = "".join(
        c for c in unicodedata.normalize("NFD", text) if unicodedata.category(c) != "Mn"
    )
    return re.sub(r"[^a-z0-9]", "", sense_accents.lower())


def imatges_de(slug: str) -> list[str]:
    """Les imatges d'una pagina, en ordre d'aparicio i sense repeticions."""
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


def descarrega() -> int:
    print(f"Llegint les {len(AUTORES_SLUGS)} pagines...")
    per_pagina = {}
    for slug in AUTORES_SLUGS:
        per_pagina[slug] = imatges_de(slug)
        print(f"  {slug}: {len(per_pagina[slug])} imatges")

    # El que surt a mes d'una pagina es el cromo del lloc, no el retrat.
    aparicions = Counter(url for imatges in per_pagina.values() for url in imatges)

    total = 0
    print()
    for slug, imatges in per_pagina.items():
        propies = [url for url in imatges if aparicions[url] == 1]
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
            # numerades per les que arriben, no per la posicio a la pagina: una
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
    autores = db.query(Autora).all()
    per_nom = {normalitza(f"{a.nom} {a.cognom}"): a for a in autores}

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
    grup = parser.add_mutually_exclusive_group(required=True)
    grup.add_argument("--descarrega", action="store_true",
                      help="baixa les candidates de cada autora a backend/retrats/")
    grup.add_argument("--puja", action="store_true",
                      help="puja la imatge que hagi quedat a cada carpeta")
    arguments = parser.parse_args()
    return descarrega() if arguments.descarrega else puja()


if __name__ == "__main__":
    sys.exit(main())

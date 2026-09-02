"""
Script de scraping per extreure les biografies de les 13 autores
des de la web de Veus de Dona i inserir-les a PostgreSQL.
Execució: python -m scripts.scraper_autores
"""
import sys
import os
import time
import re

import requests
from bs4 import BeautifulSoup

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import SessionLocal
from app.models.autora import Autora

BASE_URL = "https://sites.google.com/view/veusdedona/autores"

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

HEADERS = {
    "User-Agent": "Mozilla/5.0 (compatible; VeusDona-TFG/1.0)"
}

# Un parèntesi amb un any tant pot ser la data de naixement com el premi o
# l'editorial d'un llibre. El biogràfic és el que només va precedit del nom de
# l'autora; les cites d'obres arriben enmig de la prosa.
ANY_ENTRE_PARENTESIS = re.compile(r"\(([^)]*\d{4}[^)]*)\)")
ANY_DE_NAIXEMENT = re.compile(
    r"(?:va n[ée]ixer|neix|nascuda|nasqu)[^.]{0,60}?(\d{4})", re.IGNORECASE
)


def nomes_hi_ha_un_nom(text: str) -> bool:
    """Cert si tot el que hi ha són paraules que comencen en majúscula."""
    return all(paraula[:1].isupper() for paraula in text.split())


def extreure_anys_vida(text: str) -> str:
    """Els anys de vida, del parèntesi que obre la biografia o de la primera
    frase si no n'hi ha."""
    for match in ANY_ENTRE_PARENTESIS.finditer(text):
        if nomes_hi_ha_un_nom(text[:match.start()]):
            return match.group(1)

    match = ANY_DE_NAIXEMENT.search(text)
    return match.group(1) if match else ""


def partir_nom(nom_complet: str) -> tuple[str, str]:
    """Separa el nom del cognom.

    Els cognoms catalans van units amb "i": el cognom són les dues paraules que
    l'envolten i la resta del davant és el nom. Cal per als noms compostos, com
    "Maria Aurèlia Capmany i Farnés"."""
    parts = nom_complet.split()
    if "i" in parts:
        tall = parts.index("i")
        if 0 < tall < len(parts) - 1:
            return " ".join(parts[:tall - 1]), " ".join(parts[tall - 1:])
    return parts[0], " ".join(parts[1:])

def extreure_bio_des_de_seccio(seccio, nom_complet):
    """Agafa el text d'una secció i talla a 'Llegir més' i el nom repetit"""
    text = seccio.get_text(strip=True)
    idx = text.lower().find("llegir més")
    if idx != -1:
        text = text[:idx].strip()
    if text.startswith(nom_complet):
        text = text[len(nom_complet):].strip()
    return text, extreure_anys_vida(text)

def extreure_autora(slug: str) -> dict | None:
    """Descarrega la pàgina d'una autora i n'extreu nom, cognom, anys i bio"""
    url = f"{BASE_URL}/{slug}"
    try:
        response = requests.get(url, headers=HEADERS, timeout=10)
        response.raise_for_status()
    except Exception as e:
        print(f"  X Error en obtenir {url}: {e}")
        return None

    soup = BeautifulSoup(response.text, "html.parser")

    # el title té el nom complet, el h1 de vegades el talla
    title_tag = soup.find("title")
    h1 = soup.find("h1")
    if title_tag and " - " in title_tag.get_text():
        nom_complet = title_tag.get_text(strip=True).split(" - ", 1)[1]
    elif h1:
        nom_complet = h1.get_text(strip=True)
    else:
        print(f"  X No s'ha trobat nom a {url}")
        return None

    nom, cognom = partir_nom(nom_complet)

    # 1r intent: buscar per nom dins les seccions
    sections = soup.find_all("div", class_="mYVXT")
    bio_text = ""
    anys_vida = ""
    for sec in sections:
        text = sec.get_text(strip=True)
        if len(text) > 100 and nom_complet.split()[0] in text:
            bio_text, anys_vida = extreure_bio_des_de_seccio(sec, nom_complet)
            break

    # 2n intent: si la bio és buida o és la secció de referències
    if not bio_text or "REFERÈNCIES" in bio_text:
        for sec in sections[1:]:
            text = sec.get_text(strip=True)
            if len(text) > 100 and "REFERÈNCIES" not in text:
                idx = text.lower().find("llegir més")
                if idx != -1:
                    text = text[:idx].strip()
                bio_text = text
                anys_vida = extreure_anys_vida(text)
                break

    return {
        "nom": nom,
        "cognom": cognom,
        "anys_vida": anys_vida,
        "bio": bio_text if bio_text else None,
    }

def seed():
    """Torna a llegir les biografies del web i actualitza les autores.

    Actualitza les files que ja hi són en comptes d'esborrar-les: així es
    conserven els identificadors, i els textos, les traduccions i el retrat
    segueixen lligats on toca.
    """
    db = SessionLocal()
    try:
        print("Extraient dades de la web de Veus de Dona...")
        noves = 0
        actualitzades = 0

        for slug in AUTORES_SLUGS:
            print(f"  -> {slug}")
            dades = extreure_autora(slug)
            if not dades:
                time.sleep(1)
                continue

            autora = db.query(Autora).filter(
                Autora.nom == dades["nom"],
                Autora.cognom == dades["cognom"],
            ).first()

            if autora:
                for camp, valor in dades.items():
                    setattr(autora, camp, valor)
                actualitzades += 1
                estat = "actualitzada"
            else:
                db.add(Autora(**dades))
                noves += 1
                estat = "nova"

            print(f"    V {dades['nom']} {dades['cognom']} ({dades['anys_vida']}) - {estat}")
            time.sleep(1)

        db.commit()
        print(f"\nV {noves} autores noves, {actualitzades} actualitzades.")

    except Exception as e:
        db.rollback()
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed()

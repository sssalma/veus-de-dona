"""
Script de scraping per extreure les biografies de les 13 autores
des de la web de Veus de Dona i inserir-les a PostgreSQL.
Execució: python -m scripts.scraper_autores
"""
import sys
import os
import time
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

def extreure_anys_vida(text: str) -> str:
    """Busca el primer text entre parentesis que conte un any"""
    import re
    match = re.search(r'\(([^)]*\d{4}[^)]*)\)', text)
    if match:
        return match.group(1)
    return ""

def extreure_bio_des_de_seccio(seccio, nom_complet):
    """Agafa el text d'una seccio i talla a 'Llegir mes' i el nom repetit"""
    text = seccio.get_text(strip=True)
    idx = text.lower().find("llegir més")
    if idx != -1:
        text = text[:idx].strip()
    if text.startswith(nom_complet):
        text = text[len(nom_complet):].strip()
    return text, extreure_anys_vida(text)

def extreure_autora(slug: str) -> dict | None:
    """Descarrega la pagina d'una autora i n'extreu nom, cognom, anys i bio"""
    url = f"{BASE_URL}/{slug}"
    try:
        response = requests.get(url, headers=HEADERS, timeout=10)
        response.raise_for_status()
    except Exception as e:
        print(f"  X Error en obtenir {url}: {e}")
        return None

    soup = BeautifulSoup(response.text, "html.parser")

    # el title te el nom complet, el h1 de vegades el talla
    title_tag = soup.find("title")
    h1 = soup.find("h1")
    if title_tag and " - " in title_tag.get_text():
        nom_complet = title_tag.get_text(strip=True).split(" - ", 1)[1]
    elif h1:
        nom_complet = h1.get_text(strip=True)
    else:
        print(f"  X No s'ha trobat nom a {url}")
        return None

    parts = nom_complet.split()
    nom = parts[0]
    cognom = " ".join(parts[1:])

    # 1r intent: buscar per nom dins les seccions
    sections = soup.find_all("div", class_="mYVXT")
    bio_text = ""
    anys_vida = ""
    for sec in sections:
        text = sec.get_text(strip=True)
        if len(text) > 100 and nom_complet.split()[0] in text:
            bio_text, anys_vida = extreure_bio_des_de_seccio(sec, nom_complet)
            break

    # 2n intent: si la bio es buida o es la seccio de referencies
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
    """Buida la taula d'autores i les torna a scrapejar totes"""
    db = SessionLocal()
    try:
        existing = db.query(Autora).count()
        if existing > 0:
            print(f"Esborrant {existing} autores existents...")
            db.query(Autora).delete()
            db.commit()

        print("Extraient dades de la web de Veus de Dona...")
        inserides = 0

        for slug in AUTORES_SLUGS:
            print(f"  -> {slug}")
            dades = extreure_autora(slug)
            if dades:
                autora = Autora(**dades)
                db.add(autora)
                inserides += 1
                print(f"    V {dades['nom']} {dades['cognom']} ({dades['anys_vida']})")
            time.sleep(1)

        db.commit()
        print(f"\nV {inserides} autores inserides correctament.")

    except Exception as e:
        db.rollback()
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed()

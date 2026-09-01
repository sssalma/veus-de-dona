"""Scrape parada images from the website, upload to MinIO, and update DB."""
import sys
import os
import re
import requests
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import SessionLocal
from app.models.parada import Parada
from app.services import parades as parades_service

# Each parada name → espai page slug on the website
ESPAI_PAGES = {
    "Balcó del Mediterrani": "balc%C3%B3-del-mediterrani",
    "Amfiteatre": "amfiteatre",
    "Baixada de la Peixateria": "baixada-de-la-peixateria",
    "Plaça del Rei": "pla%C3%A7a-del-rei",
    "Placeta dels Àngels": "placeta-dels-%C3%A0ngels",
    "Plaça del Fòrum": "pla%C3%A7a-del-f%C3%B2rum",
    "Carrer Calderers": "carrer-calderers",
    "Pla de la Seu": "pla-de-la-seu",
    "Carrer Major": "carrer-major",
    "Plaça de la Font": "pla%C3%A7a-de-la-font",
}

BASE_URL = "https://sites.google.com/view/veusdedona/espais"


def fetch_main_image(espai_slug: str) -> bytes | None:
    """Fetch the individual espai page and extract the first large image URL."""
    url = f"{BASE_URL}/{espai_slug}"
    print(f"  Fetching {url}...")
    try:
        resp = requests.get(url, timeout=15, headers={"User-Agent": "Mozilla/5.0"})
        resp.raise_for_status()
    except Exception as e:
        print(f"  ERROR fetching page: {e}")
        return None

    html = resp.text

    # Find all img tags with lh3.googleusercontent.com URLs
    # The main image is typically the first large content image (after the h1)
    # Pattern: <img[^>]*src="(https://lh3\.googleusercontent\.com[^"]+w1280)"[^>]*>
    images = re.findall(
        r'<img[^>]*src="(https://lh3\.googleusercontent\.com/sitesv/[^"]+w1280)"[^>]*>',
        html,
    )

    if not images:
        print(f"  WARNING: No images found")
        return None

    # Filter out tiny icons/logos - content images are typically >200px
    # We'll take the first substantial image
    image_url = images[0]
    print(f"  Found image: {image_url[:80]}...")

    try:
        img_resp = requests.get(image_url, timeout=30, headers={"User-Agent": "Mozilla/5.0"})
        img_resp.raise_for_status()
        return img_resp.content
    except Exception as e:
        print(f"  ERROR downloading image: {e}")
        return None


def seed():
    db = SessionLocal()

    parades = db.query(Parada).order_by(Parada.ordre).all()
    updated = 0
    errors = []

    for parada in parades:
        espai_name = parada.nom_espai
        # Match against our ESPAI_PAGES keys (checking if parada name starts with or contains key)
        slug = None
        matched_key = None
        for key, val in ESPAI_PAGES.items():
            if key in espai_name or espai_name.startswith(key.split(" (")[0]):
                slug = val
                matched_key = key
                break

        if not slug:
            errors.append(f"Parada '{espai_name}': no espai page mapping")
            continue

        print(f"\n[{parada.ordre}] {espai_name} -> {matched_key}")

        image_data = fetch_main_image(slug)
        if not image_data:
            errors.append(f"Parada '{espai_name}': could not fetch image")
            continue

        # Passa per la capa de servei, que esborra la foto anterior. Pujar-la
        # aqui deixava un objecte orfe a MinIO a cada passada del guio.
        resultat = parades_service.update_parada_foto(
            db, str(parada.id), image_data, "foto.jpg", "image/jpeg"
        )
        if not resultat:
            errors.append(f"Parada '{espai_name}': MinIO upload failed")
            continue

        updated += 1
        print(f"  OK: foto actualitzada ({len(image_data)} bytes)")

    print(f"\n\nUpdated {updated}/{len(parades)} parades")
    if errors:
        for e in errors:
            print(f"  ERROR: {e}")
    db.close()


if __name__ == "__main__":
    seed()

"""Assigna a cada text el seu vídeo del canal de Veus de Dona a Tarragona."""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import SessionLocal
from scripts.scraper_autores import partir_nom
from app.models.text import Text
from app.models.autora import Autora

YOUTUBE_URLS = {
    ("Montserrat Abelló i Soler", "Retorn"): "xvP7uxxPFk0",
    ("Montserrat Abelló i Soler", "No hem parlat de res"): "tX0cc-bBs1M",
    ("Olga Xirinacs i Díaz", "Música de cambra I"): "dQw21qAEV0g",
    ("Olga Xirinacs i Díaz", "La placeta dels Àngels"): "qkq23kpQjP8",
    ("Lurdes Malgrat i Escarp", "Silenci"): "RWUu56Bg7rQ",
    ("Isabel Ortega i Rion", "Ran de mar"): "QMz70G1x5I0",
    ("Isabel Ortega i Rion", "Tatuic"): "lw8jxCpWvyE",
    ("Cinta Mulet i Grau", "Vull pujar en aquell terrat"): "tcRizLNi2wk",
    ("Margarida Aritzeta i Abad", "Rapsòdia per a un mort II"): "05e6N8hX03I",
    ("Roser Guasch i Bea", "Laberint"): "5xuRKGmE2c8",
    ("Montserrat Palau i Vergés", "En nom del pare III"): "fJSdB-OYrsI",
    ("Mònica Batet i Boada", "L'habitació grisa IV"): "pwgxez1B5L8",
    ("Noemi Bagés i Fortacín", "Perdoni a quin segle diu que som? I"): "B_Sv4OQFXpQ",
    ("Josepa Massanés i Dalmau", "Als bons pagesos"): "orVAlLkg5Xs",
    ("Maria Aurèlia Capmany i Farnés", "L'altra ciutat II"): "07WMMjaMGwE",
    ("Maria Domènech i Escoté", "Costums tarragonines"): "i7itiQSSugk",
    ("Mònica Batet i Boada", "L'habitació grisa VI"): "1Uj7CfDm5Vg",
}

def seed():
    db = SessionLocal()
    updated = 0
    for (nom_complet, titol), video_id in YOUTUBE_URLS.items():
        nom, cognom = partir_nom(nom_complet.strip())
        if not cognom:
            print(f"  Saltant {nom_complet}: format incorrecte")
            continue
        autora = db.query(Autora).filter(Autora.nom == nom, Autora.cognom == cognom).first()
        if not autora:
            print(f"  Autora no trobada: {nom_complet}")
            continue
        text = db.query(Text).filter(Text.autora_id == autora.id, Text.titol == titol).first()
        if not text:
            print(f"  Text no trobat: {titol} de {nom_complet}")
            continue
        url = f"https://www.youtube.com/watch?v={video_id}" if video_id else None
        text.youtube_url = url
        updated += 1
        print(f"  OK {nom_complet} — {titol}")
    db.commit()
    print(f"Actualitzats {updated} textos amb YouTube URLs")
    db.close()

if __name__ == "__main__":
    seed()

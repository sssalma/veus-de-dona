"""Puja els MP3 de les lectures a MinIO i en desa els Recursos."""
import sys
import os
import uuid
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import SessionLocal
from scripts.scraper_autores import partir_nom
from app.models.text import Text
from app.models.autora import Autora
from app.models.recurs import Recurs, TipusRecurs
from app.services.storage import upload_file

AUDIO_DIR = os.path.join(
    os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))),
    "AUDIOS_TFG",
)

# nom del fitxer -> (nom complet de l'autora, títol del text)
MAPPING = {
    "Retorn.mp3": ("Montserrat Abelló i Soler", "Retorn"),
    "Fragment de Música de cambra - Olga Xirinacs.mp3": (
        "Olga Xirinacs i Díaz",
        "Música de cambra I",
    ),
    "ElSilenci.mp3": ("Lurdes Malgrat i Escarp", "Silenci"),
    "PERDONIAQUINSEGLEDIUQUESOM.mp3": (
        "Noemi Bagés i Fortacín",
        "Perdoni a quin segle diu que som? I",
    ),
    "RanDeMar.mp3": ("Isabel Ortega i Rion", "Ran de mar"),
    "Vull pujar en aquell terrat dins Només un fil de llum blanca, 2011 - Cinta Mulet_mp3.mp3": (
        "Cinta Mulet i Grau",
        "Vull pujar en aquell terrat",
    ),
    "Fragments de Costums tarragonins - Maria Domènech_mp3.mp3": (
        "Maria Domènech i Escoté",
        "Costums tarragonines",
    ),
    "La placeta dels Àngels - Olga Xirinacs_mp3.mp3": (
        "Olga Xirinacs i Díaz",
        "La placeta dels Àngels",
    ),
    "rapsodia per a un mort II   Margarida Aritzeta1.mp3": (
        "Margarida Aritzeta i Abad",
        "Rapsòdia per a un mort II",
    ),
    "tatuic.mp3": ("Isabel Ortega i Rion", "Tatuic"),
    "AlsBonsPagesos.mp3": (
        "Josepa Massanés i Dalmau",
        "Als bons pagesos",
    ),
    "Laberint.mp3": ("Roser Guasch i Bea", "Laberint"),
    "LaltraCiutat.mp3": (
        "Maria Aurèlia Capmany i Farnés",
        "L'altra ciutat II",
    ),
    "EnNomDelPare.mp3": (
        "Montserrat Palau i Vergés",
        "En nom del pare III",
    ),
    "LHabitacioGrisa_CarrerMajor.mp3": (
        "Mònica Batet i Boada",
        "L'habitació grisa IV",
    ),
    "NoHemParlatDeRes.mp3": (
        "Montserrat Abelló i Soler",
        "No hem parlat de res",
    ),
    "LHabitacioGrisa_PlacadelaFont.mp3": (
        "Mònica Batet i Boada",
        "L'habitació grisa VI",
    ),
}


def find_autora(db, nom_complet: str) -> Autora | None:
    nom, cognom = partir_nom(nom_complet.strip())
    if not cognom:
        return None
    return db.query(Autora).filter(
        Autora.nom == nom, Autora.cognom == cognom
    ).first()


def seed():
    db = SessionLocal()

    existing = db.query(Recurs).filter(Recurs.tipus == TipusRecurs.AUDIO).count()
    if existing > 0:
        print(f"Ja existeixen {existing} àudios a la BD. No es tornaran a pujar.")
        db.close()
        return

    created = 0
    errors = []

    for filename, (nom_complet, titol) in MAPPING.items():
        autora = find_autora(db, nom_complet)
        if not autora:
            errors.append(f"Autora no trobada: {nom_complet}")
            continue

        text = db.query(Text).filter(
            Text.autora_id == autora.id, Text.titol == titol
        ).first()
        if not text:
            errors.append(f"Text no trobat: {titol} de {nom_complet}")
            continue

        filepath = os.path.join(AUDIO_DIR, filename)
        if not os.path.exists(filepath):
            errors.append(f"Fitxer no trobat: {filepath}")
            continue

        with open(filepath, "rb") as f:
            file_bytes = f.read()

        extension = filename.rsplit(".", 1)[-1]
        minio_key = f"audio/{text.id}/{uuid.uuid4()}.{extension}"

        success = upload_file(file_bytes, minio_key, "audio/mpeg")
        if not success:
            errors.append(f"Error pujant {filename} a MinIO")
            continue

        recurs = Recurs(
            tipus=TipusRecurs.AUDIO,
            minio_key=minio_key,
            text_id=text.id,
        )
        db.add(recurs)
        created += 1
        print(f"  OK {titol} ({filename})")

    db.commit()
    print(f"\nCreats {created} àudios")
    if errors:
        for e in errors:
            print(f"  ERROR: {e}")
    db.close()


if __name__ == "__main__":
    seed()

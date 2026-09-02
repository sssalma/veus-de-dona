"""
Script per insertar les 10 parades de la ruta a la base de dades.
Les coordenades són les de la Part Alta de Tarragona.
Execució: python -m scripts.seed_parades
"""
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import SessionLocal
from app.models.parada import Parada, CoordenadesParada

PARADES = [
    {
        "ordre": 1,
        "nom_espai": "Balcó del Mediterrani",
        "coordenades": CoordenadesParada.BALCO_MEDITERRANI,
    },
    {
        "ordre": 2,
        "nom_espai": "Amfiteatre (des del Passeig de les Palmeres)",
        "coordenades": CoordenadesParada.AMFITEATRE,
    },
    {
        "ordre": 3,
        "nom_espai": "Baixada de la Peixateria / Cos del Bou",
        "coordenades": CoordenadesParada.BAIXADA_PEIXATERIA,
    },
    {
        "ordre": 4,
        "nom_espai": "Plaça del Rei",
        "coordenades": CoordenadesParada.PLACA_REI,
    },
    {
        "ordre": 5,
        "nom_espai": "Placeta dels Àngels",
        "coordenades": CoordenadesParada.PLACA_ANGELS,
    },
    {
        "ordre": 6,
        "nom_espai": "Plaça del Fòrum",
        "coordenades": CoordenadesParada.PLACA_FORUM,
    },
    {
        "ordre": 7,
        "nom_espai": "Carrer Calderers",
        "coordenades": CoordenadesParada.CARRER_CALDERERS,
    },
    {
        "ordre": 8,
        "nom_espai": "Pla de la Seu",
        "coordenades": CoordenadesParada.PLA_SEU,
    },
    {
        "ordre": 9,
        "nom_espai": "Carrer Major",
        "coordenades": CoordenadesParada.CARRER_MAJOR,
    },
    {
        "ordre": 10,
        "nom_espai": "Plaça de la Font",
        "coordenades": CoordenadesParada.PLACA_FONT,
    },
]

def seed():
    """Inserta les 10 parades a la BD si no n'hi ha cap"""
    db = SessionLocal()
    try:
        existing = db.query(Parada).count()
        if existing > 0:
            print(f"Ja hi ha {existing} parades a la base de dades. Omitint seed.")
            return

        for data in PARADES:
            parada = Parada(**data)
            db.add(parada)

        db.commit()
        print(f"V {len(PARADES)} parades inserides correctament.")

    except Exception as e:
        db.rollback()
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed()

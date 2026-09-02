"""
Objectes de MinIO que ja no referència ningú.

Els fitxers són a MinIO i la clau de cada objecte a PostgreSQL, en tres llocs:
`recurs.minio_key` per als àudios, i `foto_minio_key` a `parada` i a `autora`.
Són dos magatzems sense transacció compartida, i per tant poden separar-se en
dos sentits:

  - un objecte que no referència cap fila -un orfe-, que ocupa espai i fa que
    el dipòsit deixi de ser auditable, però que no es veu enlloc;
  - una fila que apunta a un objecte que no hi és -una referència trencada-,
    que sí que trenca la pantalla de qui ho mira.

El codi tria el primer risc a propòsit: puja l'objecte, després desa la fila i
només al final esborra l'anterior, de manera que una fila mai no apunta a un
fitxer que no existeix. Aquest guió informa dels dos casos i, amb `--aplica`,
esborra els orfes. Les referències trencades no s'arreglen des d'aquí: només
es diuen, perquè arreglar-les vol dir tornar a pujar un fitxer que s'ha perdut.

    python -m scripts.neteja_minio
    python -m scripts.neteja_minio --aplica
"""
import argparse
import os
import sys
from collections import defaultdict

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.config import settings
from app.database import SessionLocal
from app.models.autora import Autora
from app.models.parada import Parada
from app.models.recurs import Recurs
from app.services.storage import delete_file, get_minio_client


def claus_referenciades(db) -> dict[str, str]:
    """Cada clau desada a la base de dades, amb qui la referència."""
    referencies = {}
    for recurs in db.query(Recurs).all():
        referencies[str(recurs.minio_key)] = f"recurs {recurs.id}"
    for parada in db.query(Parada).filter(Parada.foto_minio_key.isnot(None)).all():
        referencies[str(parada.foto_minio_key)] = f"parada {parada.nom_espai}"
    for autora in db.query(Autora).filter(Autora.foto_minio_key.isnot(None)).all():
        referencies[str(autora.foto_minio_key)] = f"autora {autora.nom} {autora.cognom}"
    return referencies


def objectes_del_diposit(client) -> dict[str, int]:
    """Cada objecte del dipòsit amb la seva mida. Paginat: la crida directa
    només en torna mil."""
    objectes = {}
    paginador = client.get_paginator("list_objects_v2")
    for pagina in paginador.paginate(Bucket=settings.MINIO_BUCKET):
        for objecte in pagina.get("Contents", []):
            objectes[objecte["Key"]] = objecte["Size"]
    return objectes


def per_prefix(claus) -> dict[str, list[str]]:
    grups = defaultdict(list)
    for clau in claus:
        grups[clau.split("/")[0]].append(clau)
    return grups


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__.split("\n")[1])
    parser.add_argument(
        "--aplica",
        action="store_true",
        help="esborra els objectes orfes; sense la bandera nomes informa",
    )
    arguments = parser.parse_args()

    db = SessionLocal()
    referenciades = claus_referenciades(db)
    db.close()

    objectes = objectes_del_diposit(get_minio_client())

    orfes = sorted(set(objectes) - set(referenciades))
    trencades = sorted(set(referenciades) - set(objectes))

    print(f"Diposit: {len(objectes)} objectes")
    print(f"Referenciats des de la base de dades: {len(referenciades)}")

    if trencades:
        print(f"\nREFERENCIES TRENCADES: {len(trencades)}")
        print("Aixo si que es veu: la fitxa demana un fitxer que no hi es.")
        for clau in trencades:
            print(f"  {clau}  <- {referenciades[clau]}")
    else:
        print("\nCap referencia trencada.")

    if not orfes:
        print("Cap objecte orfe.")
        return 0

    pes = sum(objectes[clau] for clau in orfes)
    print(f"\nORFES: {len(orfes)} objectes, {pes / 1024:.0f} kB")
    for prefix, claus in sorted(per_prefix(orfes).items()):
        print(f"  {prefix}/: {len(claus)}")
        for clau in claus:
            print(f"    {clau} ({objectes[clau] / 1024:.0f} kB)")

    if not arguments.aplica:
        print("\nNomes informe. Per esborrar-los: python -m scripts.neteja_minio --aplica")
        return 0

    esborrats = 0
    for clau in orfes:
        if delete_file(clau):
            esborrats += 1
        else:
            print(f"  ERROR en esborrar {clau}")
    print(f"\n{esborrats} objectes esborrats")
    return 0


if __name__ == "__main__":
    sys.exit(main())

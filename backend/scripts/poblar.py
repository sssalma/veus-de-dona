"""
Carrega tot el contingut de la ruta en una sola passada.

Els guions s'executen en l'ordre en que es necessiten: els textos es vinculen a
autores i a parades, i les traduccions i els audios es vinculen a textos, de
manera que cada pas demana que els anteriors ja hagin passat. La neteja de
biografies va immediatament despres de l'extraccio de les autores perque
l'extraccio perd els espais on el web tenia etiquetes.

Tots els passos son re-executables: comproven que hi ha abans d'escriure, de
manera que si un falla es pot tornar a llancar l'ordre sencera sense duplicar
res ni perdre el que ja hi havia.

`neteja_minio.py` en queda fora a proposit: no carrega res, es manteniment.

Execucio:
    python -m scripts.poblar
    python -m scripts.poblar --admin admin@veusdedona.cat admin1234
"""
import argparse
import importlib
import os
import sys

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

PASSES = [
    ("seed_parades", "seed", {}, "Les 10 parades de la ruta"),
    ("scraper_autores", "seed", {}, "Les 13 autores, extretes del web del projecte"),
    ("neteja_bios", "main", {"aplica": True}, "Neteja tipografica de les biografies"),
    ("seed_textos", "seed", {}, "Els textos, vinculats a autores i parades"),
    ("seed_traduccions_autores", "seed", {}, "Biografies en castella i angles"),
    ("scraper_traduccions_textos", "seed", {}, "Textos en angles publicats pel projecte"),
    ("scraper_retrats_autores", "puja_directe", {}, "Els retrats de les autores"),
    ("seed_audios", "seed", {}, "Els enregistraments de les lectures"),
    ("seed_youtube_urls", "seed", {}, "Enllacos de video de les autores"),
    ("scraper_fotos_parades", "seed", {}, "Fotografies dels espais"),
]


def executa(modul, funcio, arguments, descripcio, numero, total):
    print("\n[%d/%d] %s" % (numero, total, descripcio))
    print("-" * 60)
    getattr(importlib.import_module("scripts." + modul), funcio)(**arguments)


def main():
    parser = argparse.ArgumentParser(
        description="Carrega el contingut de la ruta a la base de dades."
    )
    parser.add_argument(
        "--admin",
        nargs=2,
        metavar=("CORREU", "CONTRASENYA"),
        help="crea tambe el compte amb rol d'administrador",
    )
    args = parser.parse_args()

    passes = list(PASSES)
    if args.admin:
        passes.append(
            ("seed_admin", "seed",
             {"email": args.admin[0], "password": args.admin[1]},
             "Compte d'administrador")
        )

    total = len(passes)
    for numero, (modul, funcio, arguments, descripcio) in enumerate(passes, 1):
        try:
            executa(modul, funcio, arguments, descripcio, numero, total)
        except Exception as error:
            print("\nEl pas «%s» ha fallat: %s" % (descripcio, error))
            print("Resol-ho i torna a llancar «python -m scripts.poblar»:")
            print("els passos que ja han passat no es repeteixen.")
            return 1

    print("\n" + "-" * 60)
    print("Contingut carregat.")
    if not args.admin:
        print("Per crear l'administrador: python -m scripts.poblar --admin CORREU CONTRASENYA")
    return 0


if __name__ == "__main__":
    sys.exit(main())

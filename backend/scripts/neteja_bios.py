# -*- coding: utf-8 -*-
"""Neteja tipogràfica de les biografies de les autores.

El `scraper_autores.py` extreu les biografies del web de l'entitat perdent els
espais on hi havia etiquetes HTML: els títols d'obra anaven en <em> i els
paràgrafs en <p>, de manera que el text arriba amb paraules enganxades
("carrerApodaca", "contemporani.Nascuda"), espais durs i comes sense espai.

Aquest script només corregeix tipografia -espais, puntuació i majúscula
inicial-. No reescriu ni resumeix el contingut, que és obra de tercers.

És idempotent: es pot executar tantes vegades com calgui, i s'ha de tornar a
executar després de cada passada del scraper.

Ús:
    python -m scripts.neteja_bios              # mostra què canviaria
    python -m scripts.neteja_bios --aplica     # desa els canvis
"""
import os
import re
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import SessionLocal
from app.models.autora import Autora

MAJ = 'A-ZÀ-ÖØ-Þ'
MIN = 'a-zà-öø-ÿ'

# Unions que cap regla automàtica pot detectar, perquè les dues paraules van en
# minúscula, o que la regla general separaria pel lloc equivocat.
# Cada entrada és (fragment tal com surt del scraper, fragment correcte).
CORRECCIONS = [
    # Maria Domènech: "Feminal" és la revista (1907-1917), no "Femina"
    ('revistaFeminaladquiriren', 'revista Feminal adquiriren'),
    ('El poble catalàoLa veu', 'El poble català o La veu'),
    # Lurdes Malgrat
    ('fundadora iha dirigitl’Escola', 'fundadora i ha dirigit l’Escola'),
    ('15 monòlegsi traduccions', '15 monòlegs i traduccions'),
    ('a Stalinde Juan Mayorga', 'a Stalin de Juan Mayorga'),
    ('La negrade Luís Miguel', 'La negra de Luís Miguel'),
    ('Paterade Juan Pablo', 'Patera de Juan Pablo'),
    # Josepa Massanés
    ('primer llibrePoesíasa Barcelona', 'primer llibre Poesías a Barcelona'),
    ('anomenat ”El beso maternal”', 'anomenat “El beso maternal”'),
    # Cinta Mulet
    ('ha publicatel monòleg', 'ha publicat el monòleg'),
    # Isabel Ortega
    ('Ciutat de Tarragona,2002', 'Ciutat de Tarragona, 2002'),
    # Montserrat Palau
    ('professora deliteratura', 'professora de literatura'),
    ('docència al\'Institut', 'docència a l\'Institut'),
    ('contes Cadiresconfortables', 'contes Cadires confortables'),
    # Olga Xirinacs
    ('La dotzena de frarei continua', 'La dotzena de frare i continua'),
    ('Una bomba al jardídel 2021', 'Una bomba al jardí del 2021'),
    ('Blaumarídel 2022', 'Blaumarí del 2022'),
]


def neteja(text: str) -> str:
    """Aplica les correccions tipogràfiques a una biografia."""
    if not text:
        return text

    # 1. espais durs i espais de amplada zero -> espai normal
    t = text.replace(' ', ' ').replace(' ', ' ').replace('​', '')

    # 2. correccions puntuals, abans de les regles generals: n'hi ha que
    #    la regla de minúscula+majúscula separaria pel lloc equivocat
    for original, correcte in CORRECCIONS:
        t = t.replace(original, correcte)

    # 3. puntuació enganxada a la paraula següent: "contemporani.Nascuda"
    t = re.sub(r'([.,;:!?])([%s%s])' % (MAJ, MIN), r'\1 \2', t)

    # 4. espai sobrer abans de la puntuació
    t = re.sub(r'\s+([.,;:!?])', r'\1', t)

    # 5. parèntesis enganxats: "grisa(Ed. Empúries" i "(1996)iEn nom"
    t = re.sub(r'([%s%s0-9])\(' % (MAJ, MIN), r'\1 (', t)
    t = re.sub(r'\)([%s%s])' % (MAJ, MIN), r') \1', t)

    # 6. paraula en minúscula enganxada al títol d'una obra: "carrerApodaca"
    t = re.sub(r'([%s])([%s])' % (MIN, MAJ), r'\1 \2', t)

    # 7. espais repetits i extrems
    t = re.sub(r'[ \t]{2,}', ' ', t).strip()

    # 8. majúscula inicial. Si comença amb un parèntesi de dates -"(1918-1991)
    #    fou una escriptora"- la majúscula va a la primera lletra de després.
    m = re.match(r'^(\([^)]*\)\s*)?(.)', t)
    if m and m.group(2).islower():
        pos = m.start(2)
        t = t[:pos] + t[pos].upper() + t[pos + 1:]

    return t


def main(aplica: bool) -> None:
    db = SessionLocal()
    autores = db.query(Autora).order_by(Autora.cognom).all()

    canviades = 0
    for a in autores:
        original = a.bio or ''
        nova = neteja(original)
        if nova == original:
            print('  sense canvis  %s %s' % (a.nom, a.cognom))
            continue

        canviades += 1
        print('\n=== %s %s ===' % (a.nom, a.cognom))
        for abans, despres in diferencies(original, nova):
            print('   - %s' % abans)
            print('   + %s' % despres)

        if aplica:
            a.bio = nova

    if aplica and canviades:
        db.commit()
        print('\n%d biografies actualitzades.' % canviades)
    elif canviades:
        print('\n%d biografies canviarien. Torna-ho a executar amb --aplica per desar-ho.'
              % canviades)
    else:
        print('\nNo hi ha res a corregir.')

    db.close()


def diferencies(abans: str, despres: str):
    """Parelles de fragments que han canviat, per poder revisar-ho a ull."""
    import difflib
    matcher = difflib.SequenceMatcher(None, abans, despres)
    for tag, i1, i2, j1, j2 in matcher.get_opcodes():
        if tag == 'equal':
            continue
        ctx = 34
        yield (
            abans[max(0, i1 - ctx):min(len(abans), i2 + ctx)].replace('\n', ' '),
            despres[max(0, j1 - ctx):min(len(despres), j2 + ctx)].replace('\n', ' '),
        )


if __name__ == '__main__':
    main(aplica='--aplica' in sys.argv)

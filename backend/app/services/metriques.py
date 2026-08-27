from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.usuari import Usuari
from app.models.visita import Visita, Mode
from app.models.like import Like
from app.models.comentari import Comentari
from app.models.parada import Parada
from app.models.text import Text


def get_metriques_global(db: Session) -> dict:
    """Aggregate counts across the whole app: users by role, visits by mode,
    and the most-liked texts."""
    usuaris_per_rol = dict(
        db.query(Usuari.rol, func.count(Usuari.id)).group_by(Usuari.rol).all()
    )
    visites_per_mode = dict(
        db.query(Visita.mode, func.count(Visita.id)).group_by(Visita.mode).all()
    )
    # ensure all modes are present even with zero visits
    visites_per_mode = {mode.value: visites_per_mode.get(mode, 0) for mode in Mode}

    # es_alumne es opcional al registre: nomes es compten els que han dit que si
    usuaris_grup_escolar = (
        db.query(func.count(Usuari.id)).filter(Usuari.es_alumne.is_(True)).scalar()
    )

    textos_mes_agradats = (
        db.query(Text.id, Text.titol, func.count(Like.usuari_id).label("likes"))
        .join(Like, Like.text_id == Text.id)
        .group_by(Text.id, Text.titol)
        .order_by(func.count(Like.usuari_id).desc())
        .limit(10)
        .all()
    )

    return {
        "usuaris_per_rol": {rol.value: count for rol, count in usuaris_per_rol.items()},
        "usuaris_grup_escolar": usuaris_grup_escolar or 0,
        "visites_per_mode": visites_per_mode,
        "textos_mes_agradats": [
            {"text_id": str(text_id), "titol": titol, "likes": likes}
            for text_id, titol, likes in textos_mes_agradats
        ],
    }


def get_metriques_parades(db: Session) -> list[dict]:
    """Per-stop breakdown: visit count by mode, like count, comment count."""
    parades = db.query(Parada).order_by(Parada.ordre).all()

    resultat = []
    for parada in parades:
        visites_per_mode = dict(
            db.query(Visita.mode, func.count(Visita.id))
            .filter(Visita.parada_id == parada.id)
            .group_by(Visita.mode)
            .all()
        )
        visites_per_mode = {mode.value: visites_per_mode.get(mode, 0) for mode in Mode}

        likes_count = (
            db.query(func.count(Like.usuari_id))
            .join(Text, Text.id == Like.text_id)
            .filter(Text.parada_id == parada.id)
            .scalar()
        ) or 0

        comentaris_count = (
            db.query(func.count(Comentari.id))
            .filter(Comentari.parada_id == parada.id)
            .scalar()
        ) or 0

        resultat.append({
            "parada_id": str(parada.id),
            "nom_espai": parada.nom_espai,
            "ordre": parada.ordre,
            "visites_per_mode": visites_per_mode,
            "likes": likes_count,
            "comentaris": comentaris_count,
        })

    return resultat

from sqlalchemy.orm import Session
from app.models.visita import Visita, Mode
from app.models.parada import Parada
from app.models.usuari import Usuari
from app.services.geo import haversine
from uuid import UUID

# GPS proximity threshold in metres
PROXIMITY_THRESHOLD_M = 50

# GPS coordinates for each stop
from app.models.parada import COORDENADES_GPS, CoordenadesParada

def detectar_mode(
    db: Session,
    usuari_id: UUID,
    parada: Parada,
    lat: float | None,
    lng: float | None
) -> Mode:
    """Infers visit mode automatically from GPS state and visit order"""
    if lat is None or lng is None:
        return Mode.REMOT

    # check proximity to the stop
    coord = COORDENADES_GPS[parada.coordenades] # type: ignore
    distance_m = haversine(lat, lng, coord[0], coord[1])

    if distance_m > PROXIMITY_THRESHOLD_M:
        return Mode.REMOT

    # check if previous stop was visited (sequential order)
    parada_ordre = int(str(parada.ordre))
    if parada_ordre == 1:
        return Mode.GUIAT

    visita_anterior = db.query(Visita).join(Parada).filter(
        Visita.usuari_id == usuari_id,
        Parada.ordre == parada.ordre - 1
    ).first()

    return Mode.GUIAT if visita_anterior else Mode.LLIURE

def registrar_visita(
    db: Session,
    usuari: Usuari,
    parada_id: str,
    lat: float | None,
    lng: float | None
) -> Visita | None:
    """Registers a visit with automatically inferred mode"""
    parada = db.query(Parada).filter(Parada.id == parada_id).first()
    if not parada:
        return None

    # check if already visited
    visita_existent = db.query(Visita).filter(
        Visita.usuari_id == usuari.id,
        Visita.parada_id == parada_id
    ).first()
    if visita_existent:
        return visita_existent

    mode = detectar_mode(db, UUID(str(usuari.id)), parada, lat, lng)

    nova_visita = Visita(
        usuari_id=usuari.id,
        parada_id=parada_id,
        mode=mode
    )
    db.add(nova_visita)
    db.commit()
    db.refresh(nova_visita)
    return nova_visita

def get_visites_by_usuari(db: Session, usuari_id: UUID):
    """Returns all visits for a given user"""
    return db.query(Visita).filter(Visita.usuari_id == usuari_id).all()
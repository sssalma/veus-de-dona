from sqlalchemy.orm import Session
from app.models.visita import Visita, Mode
from app.models.parada import Parada
from app.models.usuari import Usuari
from app.services.geo import haversine
from uuid import UUID

# radi en metres per donar una parada per assolida
PROXIMITY_THRESHOLD_M = 50

# coordenades de cada parada
from app.models.parada import COORDENADES_GPS, CoordenadesParada

def detectar_mode(
    db: Session,
    usuari_id: UUID,
    parada: Parada,
    lat: float | None,
    lng: float | None
) -> Mode:
    """Dedueix el mode de la visita a partir del GPS i de l'ordre de la ruta."""
    if lat is None or lng is None:
        return Mode.REMOT

    # distància fins a la parada
    coord = COORDENADES_GPS[parada.coordenades] # type: ignore
    distance_m = haversine(lat, lng, coord[0], coord[1])

    if distance_m > PROXIMITY_THRESHOLD_M:
        return Mode.REMOT

    # l'anterior és la parada ACTIVA més propera per davall: si se'n desactiva
    # una, les de després han de continuar sent assolibles en mode GUIAT
    parada_anterior = db.query(Parada).filter(
        Parada.ordre < parada.ordre,
        Parada.activa == True
    ).order_by(Parada.ordre.desc()).first()

    # no en té cap al davant: és l'inici de la ruta
    if not parada_anterior:
        return Mode.GUIAT

    visita_anterior = db.query(Visita).filter(
        Visita.usuari_id == usuari_id,
        Visita.parada_id == parada_anterior.id
    ).first()

    return Mode.GUIAT if visita_anterior else Mode.LLIURE

def registrar_visita(
    db: Session,
    usuari: Usuari,
    parada_id: str,
    lat: float | None,
    lng: float | None
) -> Visita | None:
    """Registra una visita amb el mode deduït."""
    parada = db.query(Parada).filter(Parada.id == parada_id).first()
    if not parada:
        return None

    # ja visitada?
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
    """Torna les visites d'una persona."""
    return db.query(Visita).filter(Visita.usuari_id == usuari_id).all()
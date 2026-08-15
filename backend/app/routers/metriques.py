from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.services import metriques as metriques_service
from app.services.auth import require_rol
from app.models.usuari import Usuari, RolUsuari

router = APIRouter(
    prefix="/metriques",
    tags=["metriques"]
)

@router.get("/global")
def get_metriques_global(
    db: Session = Depends(get_db),
    current_user: Usuari = Depends(require_rol(RolUsuari.EDITOR, RolUsuari.ADMINISTRADOR))
):
    """Global aggregate metrics - editor/admin only"""
    return metriques_service.get_metriques_global(db)

@router.get("/parades")
def get_metriques_parades(
    db: Session = Depends(get_db),
    current_user: Usuari = Depends(require_rol(RolUsuari.EDITOR, RolUsuari.ADMINISTRADOR))
):
    """Per-stop breakdown metrics - editor/admin only"""
    return metriques_service.get_metriques_parades(db)

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.usuari import UsuariResponse, UsuariRolUpdate, UsuariActiuUpdate, UsuariIdiomaUpdate, UsuariPasswordReset
from app.services import usuaris as usuaris_service
from app.services.auth import get_current_user, require_rol
from app.models.usuari import Usuari, RolUsuari
from typing import List

router = APIRouter(
    prefix="/usuaris",
    tags=["usuaris"]
)

@router.get("/", response_model=List[UsuariResponse])
def get_usuaris(
    db: Session = Depends(get_db),
    current_user: Usuari = Depends(require_rol(RolUsuari.ADMINISTRADOR))
):
    """Lists all users - admin only"""
    return usuaris_service.get_all_usuaris(db)

@router.patch("/me", response_model=UsuariResponse)
def update_meu_idioma(
    idioma_data: UsuariIdiomaUpdate,
    db: Session = Depends(get_db),
    current_user: Usuari = Depends(get_current_user)
):
    """Lets any authenticated user change their own language preference"""
    return usuaris_service.set_idioma(db, current_user, idioma_data.idioma)

@router.patch("/{usuari_id}/actiu", response_model=UsuariResponse)
def toggle_usuari_actiu(
    usuari_id: str,
    actiu_data: UsuariActiuUpdate,
    db: Session = Depends(get_db),
    current_user: Usuari = Depends(require_rol(RolUsuari.ADMINISTRADOR))
):
    """Activates/deactivates a user account - admin only"""
    if str(current_user.id) == usuari_id:
        raise HTTPException(
            status_code=400,
            detail="No pots desactivar el teu propi compte"
        )
    usuari = usuaris_service.set_actiu(db, usuari_id, actiu_data.actiu)
    if not usuari:
        raise HTTPException(status_code=404, detail="Usuari no trobat")
    return usuari

@router.patch("/{usuari_id}/rol", response_model=UsuariResponse)
def canviar_rol(
    usuari_id: str,
    rol_data: UsuariRolUpdate,
    db: Session = Depends(get_db),
    current_user: Usuari = Depends(require_rol(RolUsuari.ADMINISTRADOR))
):
    """Changes a user's role - admin only.
    An admin cannot demote themselves: with a single administrator account that
    would leave the system with no way back into user management."""
    if str(current_user.id) == usuari_id:
        raise HTTPException(
            status_code=400,
            detail="No pots canviar el teu propi rol"
        )
    usuari = usuaris_service.set_rol(db, usuari_id, rol_data.rol)
    if not usuari:
        raise HTTPException(status_code=404, detail="Usuari no trobat")
    return usuari

@router.patch("/{usuari_id}/contrasenya", status_code=204)
def assignar_contrasenya(
    usuari_id: str,
    dades: UsuariPasswordReset,
    db: Session = Depends(get_db),
    current_user: Usuari = Depends(require_rol(RolUsuari.ADMINISTRADOR))
):
    """Sets a new password on someone else's account - admin only.

    There is no self-service password recovery in this system, so somebody who
    forgets their password has no way back in on their own. This is the way
    back: an administrator sets a new one and passes it on.

    It refuses to act on the caller's own account on purpose. Changing your own
    password goes through POST /auth/canvi-contrasenya, which asks for the
    current one first - that check is what stops a stolen session from locking
    the real owner out, and this endpoint must not be a way around it."""
    if str(current_user.id) == usuari_id:
        raise HTTPException(
            status_code=400,
            detail="Per canviar la teva contrasenya has de fer servir el canvi de contrasenya del perfil"
        )
    usuari = usuaris_service.set_password(db, usuari_id, dades.password_nova)
    if not usuari:
        raise HTTPException(status_code=404, detail="Usuari no trobat")

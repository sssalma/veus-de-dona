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
    """Llista tots els comptes. Només administració."""
    return usuaris_service.get_all_usuaris(db)

@router.patch("/me", response_model=UsuariResponse)
def update_meu_idioma(
    idioma_data: UsuariIdiomaUpdate,
    db: Session = Depends(get_db),
    current_user: Usuari = Depends(get_current_user)
):
    """Canvia l'idioma del propi compte."""
    return usuaris_service.set_idioma(db, current_user, idioma_data.idioma)

@router.patch("/{usuari_id}/actiu", response_model=UsuariResponse)
def toggle_usuari_actiu(
    usuari_id: str,
    actiu_data: UsuariActiuUpdate,
    db: Session = Depends(get_db),
    current_user: Usuari = Depends(require_rol(RolUsuari.ADMINISTRADOR))
):
    """Activa o desactiva un compte. Només administració."""
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
    """Canvia el rol d'un compte. Només administració.
    No es pot rebaixar el propi rol: amb un sol compte d'administració, el
    sistema es quedaria sense manera de tornar a la gestió d'usuaris."""
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
    """Assigna una contrasenya nova a un altre compte. Només administració.

    No hi ha recuperació autoservei, així que aquest és el camí de tornada per
    a qui ha oblidat la seva.

    Refusa actuar sobre el propi compte: la contrasenya pròpia es canvia amb
    POST /auth/canvi-contrasenya, que demana l'actual, i aquesta comprovació és
    el que impedeix que una sessió robada en tanqui fora el titular."""
    if str(current_user.id) == usuari_id:
        raise HTTPException(
            status_code=400,
            detail="Per canviar la teva contrasenya has de fer servir el canvi de contrasenya del perfil"
        )
    usuari = usuaris_service.set_password(db, usuari_id, dades.password_nova)
    if not usuari:
        raise HTTPException(status_code=404, detail="Usuari no trobat")

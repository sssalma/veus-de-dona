from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.comentari import ComentariCreate, ComentariResponse, ComentariResposta
from app.services import comentaris as comentaris_service
from app.services.auth import get_current_user, get_current_user_optional, require_rol
from app.models.usuari import Usuari, RolUsuari
from typing import List

router = APIRouter(
    prefix="/comentaris",
    tags=["comentaris"]
)

def _amaga_dades_personals(comentari) -> ComentariResponse:
    """Serialitza un comentari sense el cognom ni l'identificador de l'autor."""
    dades = ComentariResponse.model_validate(comentari)
    dades.usuari_cognom = None
    dades.usuari_id = None
    return dades

@router.get("/", response_model=List[ComentariResponse])
def get_tots_els_comentaris(
    db: Session = Depends(get_db),
    current_user: Usuari = Depends(
        require_rol(RolUsuari.EDITOR, RolUsuari.ADMINISTRADOR)
    )
):
    """Tots els comentaris de totes les parades, per moderar-los. Només editor i administració."""
    return comentaris_service.get_all_comentaris(db)

@router.post("/", response_model=ComentariResponse, status_code=201)
def afegir_comentari(
    comentari_data: ComentariCreate,
    db: Session = Depends(get_db),
    current_user: Usuari = Depends(get_current_user)
):
    """Afegeix un comentari a una parada."""
    comentari = comentaris_service.afegir_comentari(
        db,
        current_user,
        str(comentari_data.parada_id),
        comentari_data.contingut
    )
    if not comentari:
        raise HTTPException(status_code=404, detail="Parada no trobada")

    # amb la mateixa forma que tindrà al llistat, perquè no aparegui signat
    # diferent del que s'acaba d'escriure
    if current_user.rol in (RolUsuari.EDITOR, RolUsuari.ADMINISTRADOR):
        return comentari
    return _amaga_dades_personals(comentari)

@router.delete("/{comentari_id}", status_code=204)
def eliminar_comentari(
    comentari_id: str,
    db: Session = Depends(get_db),
    current_user: Usuari = Depends(
        require_rol(RolUsuari.EDITOR, RolUsuari.ADMINISTRADOR)
    )
):
    """Esborra un comentari. Només editor i administració."""
    deleted = comentaris_service.eliminar_comentari(db, comentari_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Comentari no trobat")

@router.patch("/{comentari_id}/resposta", response_model=ComentariResponse)
def respondre_comentari(
    comentari_id: str,
    resposta_data: ComentariResposta,
    db: Session = Depends(get_db),
    current_user: Usuari = Depends(
        require_rol(RolUsuari.EDITOR, RolUsuari.ADMINISTRADOR)
    )
):
    """Respon un comentari. Només editor i administració."""
    comentari = comentaris_service.respondre_comentari(
        db, comentari_id, resposta_data.resposta_editor
    )
    if not comentari:
        raise HTTPException(status_code=404, detail="Comentari no trobat")
    return comentari

@router.get("/parada/{parada_id}", response_model=List[ComentariResponse])
def get_comentaris(
    parada_id: str,
    db: Session = Depends(get_db),
    current_user: Usuari | None = Depends(get_current_user_optional)
):
    """Torna els comentaris d'una parada. És públic, però el cognom i
    l'identificador de qui escriu només s'inclouen per a editors i
    administració, que els necessiten per moderar."""
    comentaris = comentaris_service.get_comentaris_by_parada(db, parada_id)

    pot_moderar = current_user is not None and current_user.rol in (
        RolUsuari.EDITOR, RolUsuari.ADMINISTRADOR
    )
    if pot_moderar:
        return comentaris
    return [_amaga_dades_personals(c) for c in comentaris]
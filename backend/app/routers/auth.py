from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.usuari import (
    UsuariCreate, UsuariResponse, UsuariLogin, Token,
    UsuariPerfilUpdate, CanviPassword,
)
from app.models.usuari import Usuari
from app.services import auth as auth_service
from app.services import usuaris as usuaris_service

router = APIRouter(
    prefix="/auth",
    tags=["auth"]
)

@router.post("/register", response_model=UsuariResponse, status_code=201)
def register(usuari_data: UsuariCreate, db: Session = Depends(get_db)):
    """Registers a new user with VISITANT role"""
    # check if email already exists
    if auth_service.get_usuari_by_email(db, usuari_data.email):
        raise HTTPException(
            status_code=400,
            detail="Aquest email ja està registrat"
        )
    return auth_service.register_usuari(db, usuari_data)

@router.post("/login", response_model=Token)
def login(credentials: UsuariLogin, db: Session = Depends(get_db)):
    """Validates credentials and returns JWT token"""
    token = auth_service.login_usuari(db, credentials.email, credentials.password)
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credencials incorrectes",
            headers={"WWW-Authenticate": "Bearer"}
        )
    return {"access_token": token, "token_type": "bearer"}

@router.get("/me", response_model=UsuariResponse)
def get_me(current_user: Usuari = Depends(auth_service.get_current_user)):
    """Returns the authenticated user's data"""
    return current_user

@router.patch("/me", response_model=UsuariResponse)
def update_me(
    dades: UsuariPerfilUpdate,
    db: Session = Depends(get_db),
    current_user: Usuari = Depends(auth_service.get_current_user)
):
    """Updates the authenticated user's own profile fields"""
    return usuaris_service.update_perfil(
        db, current_user, dades.model_dump(exclude_unset=True)
    )

@router.post("/canvi-contrasenya", status_code=204)
def canvi_contrasenya(
    dades: CanviPassword,
    db: Session = Depends(get_db),
    current_user: Usuari = Depends(auth_service.get_current_user)
):
    """Changes the authenticated user's own password"""
    ok = auth_service.canviar_password(
        db, current_user, dades.password_actual, dades.password_nova
    )
    if not ok:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="La contrasenya actual no és correcta"
        )
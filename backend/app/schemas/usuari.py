from pydantic import BaseModel, EmailStr
from uuid import UUID
from datetime import datetime
from app.models.usuari import RolUsuari, Idioma

class UsuariCreate(BaseModel):
    email: EmailStr
    nom: str
    cognom: str
    password: str
    idioma: Idioma = Idioma.CA
    procedencia: str | None = None
    es_alumne: bool | None = None

class UsuariLogin(BaseModel):
    email: EmailStr
    password: str

class UsuariResponse(BaseModel):
    id: UUID
    email: EmailStr
    nom: str
    cognom: str
    idioma: Idioma
    rol: RolUsuari
    data_registre: datetime
    actiu: bool
    procedencia: str | None = None
    es_alumne: bool | None = None

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
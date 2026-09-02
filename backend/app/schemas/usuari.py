from pydantic import BaseModel, EmailStr, Field
from uuid import UUID
from datetime import datetime
from app.models.usuari import RolUsuari, Idioma

# Longitud mínima de contrasenya. La imposa el servidor, de manera que no es
# pot evitar cridant l'API directament; l'app aplica la mateixa regla abans.
PASSWORD_MIN_LENGTH = 8

class UsuariCreate(BaseModel):
    email: EmailStr
    nom: str = Field(min_length=1)
    cognom: str = Field(min_length=1)
    password: str = Field(min_length=PASSWORD_MIN_LENGTH)
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

class UsuariRolUpdate(BaseModel):
    rol: RolUsuari

class UsuariActiuUpdate(BaseModel):
    actiu: bool

class UsuariPasswordReset(BaseModel):
    """Contrasenya nova assignada per l'administració a un altre compte.

    A diferència de CanviPassword no demana l'actual, perquè qui té el compte ja
    no la sap. L'endpoint que la fa servir refusa actuar sobre el propi compte.
    """
    password_nova: str = Field(min_length=PASSWORD_MIN_LENGTH)


class UsuariIdiomaUpdate(BaseModel):
    idioma: Idioma

class UsuariPerfilUpdate(BaseModel):
    """Camps que una persona pot canviar del seu compte. El rol, el correu i
    l'estat actiu no hi són: no són autoservei."""
    nom: str | None = Field(default=None, min_length=1)
    cognom: str | None = Field(default=None, min_length=1)
    procedencia: str | None = None
    es_alumne: bool | None = None

class CanviPassword(BaseModel):
    password_actual: str
    password_nova: str = Field(min_length=PASSWORD_MIN_LENGTH)
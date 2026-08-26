from pydantic import BaseModel
from uuid import UUID
from datetime import datetime

class ComentariCreate(BaseModel):
    contingut: str
    parada_id: UUID

class ComentariResponse(BaseModel):
    """Un comentari tal com el retorna l'API.

    `usuari_cognom` i `usuari_id` només s'omplen per a qui té rol d'editor o
    d'administrador. Per a un visitant anònim arriben buits: el llistat de
    comentaris d'una parada és públic i no cal exposar-hi el cognom ni
    l'identificador de qui hi ha escrit. Els comentaris queden signats amb el
    nom de pila.
    """
    id: UUID
    contingut: str
    data_creacio: datetime
    parada_id: UUID
    usuari_id: UUID | None = None
    usuari_nom: str | None = None
    usuari_cognom: str | None = None
    resposta_editor: str | None = None
    resposta_data: datetime | None = None

    class Config:
        from_attributes = True

class ComentariResposta(BaseModel):
    resposta_editor: str
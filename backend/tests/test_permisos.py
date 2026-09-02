"""Proves unitàries de la comprovació de rol que guarda cada acció d'edició.

`require_rol` construeix la dependència de la qual pengen els routers. La
comprovació és pura: rep un compte i el torna o llança. Sense base de dades.
"""
import pytest
from fastapi import HTTPException

from app.models.usuari import RolUsuari, Usuari
from app.services.auth import require_rol


def _usuari(rol):
    return Usuari(email="algu@example.com", nom="Test", cognom="User",
                  password_hash="x", rol=rol)


def test_el_rol_demanat_passa():
    comprova = require_rol(RolUsuari.EDITOR, RolUsuari.ADMINISTRADOR)
    editor = _usuari(RolUsuari.EDITOR)
    assert comprova(current_user=editor) is editor


def test_qualsevol_dels_rols_demanats_passa():
    comprova = require_rol(RolUsuari.EDITOR, RolUsuari.ADMINISTRADOR)
    admin = _usuari(RolUsuari.ADMINISTRADOR)
    assert comprova(current_user=admin) is admin


def test_una_visitant_no_passa():
    comprova = require_rol(RolUsuari.EDITOR, RolUsuari.ADMINISTRADOR)
    with pytest.raises(HTTPException) as error:
        comprova(current_user=_usuari(RolUsuari.VISITANT))
    assert error.value.status_code == 403


def test_un_editor_no_passa_on_nomes_shi_admet_administracio():
    # la llista de rols no és una jerarquia: ser editor no és ser administrador
    comprova = require_rol(RolUsuari.ADMINISTRADOR)
    with pytest.raises(HTTPException) as error:
        comprova(current_user=_usuari(RolUsuari.EDITOR))
    assert error.value.status_code == 403

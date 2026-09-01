"""Unit tests for the role check that guards every editing action.

`require_rol` builds the dependency the routers hang off. The check itself is
pure: it takes a user and either returns it or raises. No database involved.
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
    # the role list is not a hierarchy: being an editor is not being an admin
    comprova = require_rol(RolUsuari.ADMINISTRADOR)
    with pytest.raises(HTTPException) as error:
        comprova(current_user=_usuari(RolUsuari.EDITOR))
    assert error.value.status_code == 403

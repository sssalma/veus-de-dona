"""Unit tests for the password and token helpers.

Pure functions: a value in, a value out. No database, no HTTP client.
"""
from datetime import datetime, timezone

from jose import jwt

from app.config import settings
from app.services.auth import (
    ALGORITHM,
    create_access_token,
    hash_password,
    verify_password,
)


# ------------------------------------------------------------ contrasenyes

def test_el_hash_no_conte_la_contrasenya_en_clar():
    hash_ = hash_password("Testpass123!")
    assert "Testpass123!" not in hash_


def test_verify_accepta_la_contrasenya_correcta():
    assert verify_password("Testpass123!", hash_password("Testpass123!"))


def test_verify_rebutja_una_contrasenya_incorrecta():
    assert not verify_password("Altrapass123!", hash_password("Testpass123!"))


def test_dos_hash_de_la_mateixa_contrasenya_son_diferents():
    # bcrypt salts every hash: two identical passwords must not produce the
    # same string, or the hashes would leak which accounts share a password
    assert hash_password("Testpass123!") != hash_password("Testpass123!")


# ------------------------------------------------------------------ tokens

def test_el_token_conte_les_dades_que_shi_han_posat():
    token = create_access_token({"sub": "algu@example.com"})
    dades = jwt.decode(token, settings.SECRET_KEY, algorithms=[ALGORITHM])
    assert dades["sub"] == "algu@example.com"


def test_el_token_porta_caducitat_futura():
    token = create_access_token({"sub": "algu@example.com"})
    dades = jwt.decode(token, settings.SECRET_KEY, algorithms=[ALGORITHM])
    assert dades["exp"] > datetime.now(timezone.utc).timestamp()


def test_un_token_signat_amb_una_altra_clau_no_es_valida():
    fals = jwt.encode({"sub": "algu@example.com"}, "clau-que-no-es-la-nostra",
                      algorithm=ALGORITHM)
    try:
        jwt.decode(fals, settings.SECRET_KEY, algorithms=[ALGORITHM])
        assert False, "un token amb una altra signatura no s'hauria d'acceptar"
    except Exception:
        pass

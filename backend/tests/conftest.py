import os
import sys
import uuid

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# must be set before any `app.*` module is imported, since app/config.py
# reads them at import time
os.environ["DATABASE_URL"] = "postgresql://admin:admin1234@localhost:5432/veusdedona_test"
os.environ.setdefault("MINIO_URL", "http://localhost:9000")
os.environ.setdefault("MINIO_ACCESS_KEY", "minioadmin")
os.environ.setdefault("MINIO_SECRET_KEY", "minioadmin1234")
os.environ.setdefault("MINIO_BUCKET", "veus-de-dona-test")
os.environ.setdefault("SECRET_KEY", "test-secret-key-not-for-prod")

import pytest
from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker
from fastapi.testclient import TestClient

from app.database import Base, get_db
import app.models  # noqa: F401 - registers every model on Base.metadata
from app.main import app
from app.models.usuari import Usuari, RolUsuari, Idioma
from app.models.parada import Parada, CoordenadesParada
from app.models.autora import Autora
from app.models.text import Text
from app.services.auth import hash_password, create_access_token

TEST_DATABASE_URL = os.environ["DATABASE_URL"]
engine = create_engine(TEST_DATABASE_URL)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# bcrypt hashing is slow (~200ms) - compute the one password hash tests need
# a single time for the whole run instead of once per user fixture
TEST_PASSWORD = "Testpass123!"
TEST_PASSWORD_HASH = hash_password(TEST_PASSWORD)


@pytest.fixture(scope="session")
def setup_database():
    """Creates all tables once for the test DB, drops them at the end of the run.

    Not autouse: the unit tests for the pure functions (distance, name and
    life-span extraction) must run without a database at all."""
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture()
def db_session(setup_database):
    """Each test runs inside a transaction that's rolled back at the end,
    so tests never see each other's data regardless of execution order"""
    connection = engine.connect()
    transaction = connection.begin()
    session = TestingSessionLocal(bind=connection)

    nested = connection.begin_nested()

    @event.listens_for(session, "after_transaction_end")
    def restart_savepoint(sess, trans):
        nonlocal nested
        if not nested.is_active:
            nested = connection.begin_nested()

    yield session

    session.close()
    transaction.rollback()
    connection.close()


@pytest.fixture()
def client(db_session):
    """TestClient wired to the per-test transactional session"""
    def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()


def _crear_usuari(db_session, rol: RolUsuari, **overrides) -> Usuari:
    defaults = dict(
        id=uuid.uuid4(),
        email=f"{uuid.uuid4()}@example.com",
        nom="Test",
        cognom="User",
        password_hash=TEST_PASSWORD_HASH,
        idioma=Idioma.CA,
        rol=rol,
        actiu=True,
    )
    defaults.update(overrides)
    usuari = Usuari(**defaults)
    db_session.add(usuari)
    db_session.commit()
    db_session.refresh(usuari)
    return usuari


@pytest.fixture()
def visitant(db_session) -> Usuari:
    return _crear_usuari(db_session, RolUsuari.VISITANT)


@pytest.fixture()
def editor(db_session) -> Usuari:
    return _crear_usuari(db_session, RolUsuari.EDITOR)


@pytest.fixture()
def admin(db_session) -> Usuari:
    return _crear_usuari(db_session, RolUsuari.ADMINISTRADOR)


def _token_for(usuari: Usuari) -> str:
    return create_access_token({"sub": str(usuari.id), "rol": usuari.rol.value})


@pytest.fixture()
def auth_headers():
    """Usage: client.get(url, headers=auth_headers(some_user))"""
    def _make(usuari: Usuari) -> dict:
        return {"Authorization": f"Bearer {_token_for(usuari)}"}
    return _make


@pytest.fixture()
def parada(db_session) -> Parada:
    p = Parada(
        id=uuid.uuid4(),
        ordre=1,
        nom_espai="Parada de prova",
        coordenades=CoordenadesParada.BALCO_MEDITERRANI,
        activa=True,
    )
    db_session.add(p)
    db_session.commit()
    db_session.refresh(p)
    return p


@pytest.fixture()
def segona_parada(db_session) -> Parada:
    p = Parada(
        id=uuid.uuid4(),
        ordre=2,
        nom_espai="Segona parada de prova",
        coordenades=CoordenadesParada.AMFITEATRE,
        activa=True,
    )
    db_session.add(p)
    db_session.commit()
    db_session.refresh(p)
    return p


@pytest.fixture()
def autora(db_session) -> Autora:
    a = Autora(id=uuid.uuid4(), nom="Autora", cognom="De Prova", bio="Bio de prova")
    db_session.add(a)
    db_session.commit()
    db_session.refresh(a)
    return a


@pytest.fixture()
def text(db_session, parada, autora) -> Text:
    t = Text(
        id=uuid.uuid4(),
        titol="Text de prova",
        contingut="Contingut de prova",
        parada_id=parada.id,
        autora_id=autora.id,
    )
    db_session.add(t)
    db_session.commit()
    db_session.refresh(t)
    return t

"""Bootstrap the first ADMINISTRADOR account.

Creates the user if it doesn't exist, or promotes it to ADMINISTRADOR if it
already exists as VISITANT/EDITOR. Needed once so someone can call the
admin-only PATCH /usuaris/{id}/rol endpoint to create further editors/admins.

Usage:
    python scripts/seed_admin.py <email> <password> [nom] [cognom]
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from pydantic import TypeAdapter, EmailStr, ValidationError
from app.database import SessionLocal
from app.models.usuari import Usuari, RolUsuari
from app.services.auth import hash_password

_email_adapter = TypeAdapter(EmailStr)


def seed(email: str, password: str, nom: str = "Admin", cognom: str = "Veus de Dona"):
    try:
        email = _email_adapter.validate_python(email)
    except ValidationError as e:
        print(f"Email invàlid: {e}")
        sys.exit(1)

    db = SessionLocal()

    usuari = db.query(Usuari).filter(Usuari.email == email).first()
    if usuari:
        if usuari.rol == RolUsuari.ADMINISTRADOR:
            print(f"{email} ja és ADMINISTRADOR.")
        else:
            usuari.rol = RolUsuari.ADMINISTRADOR
            db.commit()
            print(f"{email} promogut a ADMINISTRADOR.")
    else:
        usuari = Usuari(
            email=email,
            nom=nom,
            cognom=cognom,
            password_hash=hash_password(password),
            rol=RolUsuari.ADMINISTRADOR,
        )
        db.add(usuari)
        db.commit()
        print(f"Creat nou ADMINISTRADOR: {email}")

    db.close()


if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Ús: python scripts/seed_admin.py <email> <password> [nom] [cognom]")
        sys.exit(1)
    seed(*sys.argv[1:])

from sqlalchemy.orm import Session
from passlib.context import CryptContext
from jose import JWTError, jwt
from datetime import datetime, timedelta
from app.models.usuari import Usuari, RolUsuari, Idioma
from app.schemas.usuari import UsuariCreate
from app.config import settings

# bcrypt for password hashing - industry standard, irreversible
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# JWT configuration
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 24 hours

def hash_password(password: str) -> str:
    """Converts plain text password to bcrypt hash"""
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verifies plain text password against stored hash"""
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict) -> str:
    """Generates a JWT token with 24h expiry"""
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=ALGORITHM)

def get_usuari_by_email(db: Session, email: str) -> Usuari | None:
    """Returns a user by email or None if not found"""
    return db.query(Usuari).filter(Usuari.email == email).first()

def register_usuari(db: Session, usuari_data: UsuariCreate) -> Usuari:
    """Creates a new user with hashed password"""
    hashed = hash_password(usuari_data.password)
    nou_usuari = Usuari(
        email=usuari_data.email,
        nom=usuari_data.nom,
        cognom=usuari_data.cognom,
        password_hash=hashed,
        idioma=usuari_data.idioma,
        rol=RolUsuari.VISITANT,
        procedencia=usuari_data.procedencia,
        es_alumne=usuari_data.es_alumne
    )
    db.add(nou_usuari)
    db.commit()
    db.refresh(nou_usuari)
    return nou_usuari

def login_usuari(db: Session, email: str, password: str) -> str | None:
    """Validates credentials and returns JWT token or None"""
    usuari = get_usuari_by_email(db, email)
    if not usuari or not verify_password(password, str(usuari.password_hash)):
        return None
    if not str(usuari.actiu):
        return None
    return create_access_token({"sub": str(usuari.id), "rol": usuari.rol.value})
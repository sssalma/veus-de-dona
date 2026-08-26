from sqlalchemy.orm import Session
from passlib.context import CryptContext
from jose import JWTError, jwt
from datetime import datetime, timedelta, timezone
from app.models.usuari import Usuari, RolUsuari, Idioma
from app.schemas.usuari import UsuariCreate
from app.config import settings
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from app.database import get_db

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
    # timezone-aware UTC: datetime.utcnow() is deprecated from Python 3.12 on
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
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
    if not usuari.actiu:
        return None
    return create_access_token({"sub": str(usuari.id), "rol": usuari.rol.value})

def canviar_password(db: Session, usuari: Usuari, password_actual: str, password_nova: str) -> bool:
    """Changes the user's own password. Returns False if the current password
    does not match, so the caller can answer 401 without leaking anything else."""
    if not verify_password(password_actual, str(usuari.password_hash)):
        return False
    setattr(usuari, "password_hash", hash_password(password_nova))
    db.commit()
    return True

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

# same scheme but without auto_error: lets an endpoint stay public while still
# recognising a caller who does send a valid token
oauth2_scheme_opcional = OAuth2PasswordBearer(tokenUrl="/auth/login", auto_error=False)

def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> Usuari:
    """Validates JWT token and returns current user"""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Token invàlid o expirat",
        headers={"WWW-Authenticate": "Bearer"}
    )
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    usuari = db.query(Usuari).filter(Usuari.id == user_id).first()
    if not usuari or not usuari.actiu:
        raise credentials_exception
    return usuari

def get_current_user_optional(
    token: str | None = Depends(oauth2_scheme_opcional),
    db: Session = Depends(get_db)
) -> Usuari | None:
    """Returns the current user if the request carries a valid token, or None.
    Never raises: it is meant for public endpoints that show more data to a
    recognised editor than to an anonymous visitor."""
    if not token:
        return None
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        if user_id is None:
            return None
    except JWTError:
        return None

    usuari = db.query(Usuari).filter(Usuari.id == user_id).first()
    if not usuari or not usuari.actiu:
        return None
    return usuari

def require_rol(*rols: RolUsuari):
    """Factory that returns a dependency checking user role"""
    def check_rol(current_user: Usuari = Depends(get_current_user)) -> Usuari:
        if current_user.rol not in rols:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No tens permisos per fer aquesta acció"
            )
        return current_user
    return check_rol
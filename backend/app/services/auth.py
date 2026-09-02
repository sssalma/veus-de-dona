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

# bcrypt: el hash no és reversible
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# configuració del JWT
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 24 h

def hash_password(password: str) -> str:
    """Xifra una contrasenya amb bcrypt."""
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Compara una contrasenya amb el hash desat."""
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict) -> str:
    """Genera un testimoni JWT que caduca en 24 h."""
    to_encode = data.copy()
    # UTC amb zona: datetime.utcnow() està desaconsellat des de Python 3.12
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=ALGORITHM)

def get_usuari_by_email(db: Session, email: str) -> Usuari | None:
    """Torna un compte pel correu, o None si no hi és."""
    return db.query(Usuari).filter(Usuari.email == email).first()

def register_usuari(db: Session, usuari_data: UsuariCreate) -> Usuari:
    """Crea un compte amb la contrasenya xifrada."""
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
    """Valida les credencials i torna un testimoni, o None."""
    usuari = get_usuari_by_email(db, email)
    if not usuari or not verify_password(password, str(usuari.password_hash)):
        return None
    if not usuari.actiu:
        return None
    return create_access_token({"sub": str(usuari.id), "rol": usuari.rol.value})

def canviar_password(db: Session, usuari: Usuari, password_actual: str, password_nova: str) -> bool:
    """Canvia la contrasenya del propi compte. Torna False si l'actual no
    concorda, perquè qui la crida pugui respondre 401."""
    if not verify_password(password_actual, str(usuari.password_hash)):
        return False
    setattr(usuari, "password_hash", hash_password(password_nova))
    db.commit()
    return True

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

# el mateix esquema sense auto_error: deixa que un endpoint sigui públic i,
# alhora, reconegui qui sí que envia un testimoni vàlid
oauth2_scheme_opcional = OAuth2PasswordBearer(tokenUrl="/auth/login", auto_error=False)

def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> Usuari:
    """Valida el testimoni JWT i torna qui l'envia."""
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
    """Torna qui fa la petició si porta un testimoni vàlid, o None. No llança
    mai: és per a endpoints públics que ensenyen més dades a un editor."""
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
    """Fabrica una dependència que comprova el rol."""
    def check_rol(current_user: Usuari = Depends(get_current_user)) -> Usuari:
        if current_user.rol not in rols:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No tens permisos per fer aquesta acció"
            )
        return current_user
    return check_rol
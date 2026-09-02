from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from app.config import settings


engine = create_engine(settings.DATABASE_URL)

# cada petició té la seva sessió i els canvis no es desen sols
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# classe base de tots els models
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
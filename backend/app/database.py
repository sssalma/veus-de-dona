from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from app.config import settings


#connection to database using .env URL
engine = create_engine(settings.DATABASE_URL) 

# each request gets its own session, changes are not auto-saved
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

#parent class for all models for SQLAlchemy table creation
Base = declarative_base()

def get_db():
    #open a new db session for each req
    db = SessionLocal()
    try:
        #inject session into router
        yield db
    finally:
        #always close
        db.close()
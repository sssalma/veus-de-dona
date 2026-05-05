from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    DATABASE_URL: str
    MINIO_URL: str
    MINIO_ACCESS_KEY: str
    MINIO_SECRET_KEY: str
    MINIO_BUCKET: str
    SECRET_KEY: str

    class Config:
        env_file = ".env"

settings = Settings()
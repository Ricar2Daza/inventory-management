from pydantic_settings import BaseSettings
from typing import Literal, Optional


class Settings(BaseSettings):
    DATABASE_URL: str = "sqlite:///./inventory.db"

    SECRET_KEY: str = "default-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    ENVIRONMENT: Literal["development", "production", "testing"] = "development"

    BACKEND_CORS_ORIGINS: list[str] = ["http://localhost:3000", "http://127.0.0.1:3000"]

    GROQ_API_KEY: Optional[str] = None
    GROQ_MODEL: str = "llama-3.3-70b-specdec"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = False


settings = Settings()

if settings.ENVIRONMENT == "production" and settings.SECRET_KEY == "default-secret-key-change-in-production":
    raise ValueError(
        "SECRET_KEY no puede ser el valor por defecto en producción. "
        "Por favor, configura una SECRET_KEY segura en las variables de entorno."
    )


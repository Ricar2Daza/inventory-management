from pydantic_settings import BaseSettings
from typing import Literal


class Settings(BaseSettings):
    """Configuración de la aplicación usando Pydantic Settings"""
    
    # Base de datos
    DATABASE_URL: str = "sqlite:///./inventory.db"
    
    # Autenticación JWT
    SECRET_KEY: str = "default-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # Entorno
    ENVIRONMENT: Literal["development", "production", "testing"] = "development"
    
    # CORS
    BACKEND_CORS_ORIGINS: list[str] = ["http://localhost:3000", "http://127.0.0.1:3000"]

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = False


# Crear instancia global de configuración
settings = Settings()

# Validar SECRET_KEY en producción
if settings.ENVIRONMENT == "production" and settings.SECRET_KEY == "default-secret-key-change-in-production":
    raise ValueError(
        "SECRET_KEY no puede ser el valor por defecto en producción. "
        "Por favor, configura una SECRET_KEY segura en las variables de entorno."
    )


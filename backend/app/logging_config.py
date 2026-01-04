import logging
import sys
from pathlib import Path
from logging.handlers import RotatingFileHandler
from app.config import settings


def setup_logging():
    """
    Configurar sistema de logging con archivos rotativos y salida a consola.
    """
    # Crear directorio de logs si no existe
    log_dir = Path("logs")
    log_dir.mkdir(exist_ok=True)
    
    # Formato de logs
    log_format = "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
    date_format = "%Y-%m-%d %H:%M:%S"
    
    # Configurar nivel de logging según entorno
    log_level = logging.DEBUG if settings.ENVIRONMENT == "development" else logging.INFO
    
    # Configurar root logger
    root_logger = logging.getLogger()
    root_logger.setLevel(log_level)
    
    # Limpiar handlers existentes
    root_logger.handlers.clear()
    
    # Handler para archivo con rotación
    file_handler = RotatingFileHandler(
        filename=log_dir / "app.log",
        maxBytes=10485760,  # 10 MB
        backupCount=5,
        encoding="utf-8"
    )
    file_handler.setLevel(log_level)
    file_handler.setFormatter(logging.Formatter(log_format, date_format))
    
    # Handler para consola
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(log_level)
    console_handler.setFormatter(logging.Formatter(log_format, date_format))
    
    # Añadir handlers al logger raíz
    root_logger.addHandler(file_handler)
    root_logger.addHandler(console_handler)
    
    # Reducir verbosidad de librerías externas
    logging.getLogger("uvicorn.access").setLevel(logging.WARNING)
    logging.getLogger("sqlalchemy.engine").setLevel(logging.WARNING)
    logging.getLogger("sqlalchemy.pool").setLevel(logging.WARNING)
    
    logger = logging.getLogger(__name__)
    logger.info(f"Logging configurado. Entorno: {settings.ENVIRONMENT}, Nivel: {log_level}")


from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import logging

from app.logging_config import setup_logging
from app.database import engine, Base
from app.config import settings
from app.routers import (
    categories,
    suppliers,
    products,
    stock_movements,
    auth,
    reports,
    notifications,
    warehouses,
    orders,
    clients,
    expenses,
    ai,
)
from app.models import inventory, financial, user, warehouse, notification, restaurant

# Configurar logging
setup_logging()
logger = logging.getLogger(__name__)

# Las tablas se crean mediante migraciones de Alembic
# Ejecutar: alembic upgrade head
# Base.metadata.create_all(bind=engine)  # Removido - usar migraciones de Alembic

app = FastAPI(
    title="Sistema de Inventario API",
    description="API REST para gestión de inventario con FastAPI y SQLAlchemy",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Global Exception Handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    import traceback
    print(f"CRITICAL ERROR CAUGHT: {exc}")
    traceback.print_exc()
    logger.error(f"Global exception: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": "Error interno del servidor. Por favor, contacte al administrador."},
    )

# Configurar CORS (ajustar según necesidades)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Permitir todo para evitar problemas de CORS en desarrollo
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(products.router)
app.include_router(categories.router)
app.include_router(suppliers.router)
app.include_router(stock_movements.router)
app.include_router(reports.router)
app.include_router(notifications.router)
app.include_router(warehouses.router)
app.include_router(orders.router)
app.include_router(clients.router)
app.include_router(expenses.router)
app.include_router(ai.router)


@app.get("/", tags=["raíz"])
def leer_raiz():
    """
    Endpoint raíz - Información de la API
    """
    return {
        "mensaje": "Bienvenido al Sistema de Inventario API",
        "version": "1.0.0",
        "documentacion": "/docs",
        "redoc": "/redoc"
    }


@app.get("/salud", tags=["salud"])
def verificar_salud():
    """
    Endpoint de verificación de salud
    """
    return {"estado": "saludable"}

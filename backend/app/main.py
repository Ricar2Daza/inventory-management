from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import engine, Base
from app.routers import categories, suppliers, products, stock_movements, auth, reports, notifications, warehouses

# Crear las tablas en la base de datos
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Sistema de Inventario API",
    description="API REST para gestión de inventario con FastAPI y SQLAlchemy",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Configurar CORS (ajustar según necesidades)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Incluir routers
app.include_router(auth.router)
app.include_router(categories.router)
app.include_router(suppliers.router)
app.include_router(products.router)
app.include_router(stock_movements.router)
app.include_router(reports.router)
app.include_router(notifications.router)
app.include_router(warehouses.router)


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

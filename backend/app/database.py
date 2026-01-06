from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from app.config import settings

# --- Synchronous Engine (Legacy/Migrations) ---
engine = create_engine(
    settings.DATABASE_URL,
    connect_args={"check_same_thread": False} if "sqlite" in settings.DATABASE_URL else {}
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    """
    Dependency para obtener sesión de base de datos síncrona
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# --- Asynchronous Engine (New) ---
# Ensure we use aiosqlite driver for sqlite
SQLALCHEMY_DATABASE_URL_ASYNC = settings.DATABASE_URL.replace("sqlite://", "sqlite+aiosqlite://")

async_engine = create_async_engine(
    SQLALCHEMY_DATABASE_URL_ASYNC,
    connect_args={"check_same_thread": False} if "sqlite" in settings.DATABASE_URL else {},
    echo=False
)

AsyncSessionLocal = sessionmaker(
    bind=async_engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False,
    autocommit=False
)

async def get_async_db():
    """
    Dependency para obtener sesión de base de datos asíncrona
    """
    async with AsyncSessionLocal() as session:
        yield session

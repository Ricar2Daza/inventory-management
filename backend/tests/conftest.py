import pytest
import pytest_asyncio
from fastapi.testclient import TestClient
from httpx import AsyncClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool, NullPool
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession

from app.database import Base, get_db, get_async_db
from app.main import app
from app.models.user import User
from app.auth import get_password_hash

# Base de datos de prueba en memoria (Síncrona)
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base de datos de prueba en memoria (Asíncrona)
# Note: shared cache is important for in-memory sqlite to share data between sync/async connections if needed,
# but here we might just use separate connections or same file.
# For simplicity in tests, using a file might be safer for mixed access, but :memory: is faster.
# With :memory:, sharing between sync/async engines is hard.
# So we will use a specific file for tests to allow both engines to see it.
TEST_DB_FILE = "test_db.sqlite"
SQLALCHEMY_DATABASE_URL_FILE = f"sqlite:///{TEST_DB_FILE}"
SQLALCHEMY_ASYNC_DATABASE_URL_FILE = f"sqlite+aiosqlite:///{TEST_DB_FILE}"

# Re-create engines with file
engine_file = create_engine(
    SQLALCHEMY_DATABASE_URL_FILE,
    connect_args={"check_same_thread": False},
    poolclass=NullPool
)
TestingSessionLocalFile = sessionmaker(autocommit=False, autoflush=False, bind=engine_file)

async_engine = create_async_engine(
    SQLALCHEMY_ASYNC_DATABASE_URL_FILE,
    connect_args={"check_same_thread": False},
    poolclass=NullPool,
)
TestingAsyncSessionLocal = sessionmaker(
    bind=async_engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False,
    autocommit=False
)

@pytest.fixture(scope="session", autouse=True)
def setup_test_db():
    """Crear tablas al inicio y borrarlas al final"""
    Base.metadata.create_all(bind=engine_file)
    yield
    import os
    if os.path.exists(TEST_DB_FILE):
        os.remove(TEST_DB_FILE)

@pytest.fixture(scope="function")
def db_session():
    """Crear una sesión de base de datos de prueba (Síncrona)"""
    # Clean tables
    Base.metadata.drop_all(bind=engine_file)
    Base.metadata.create_all(bind=engine_file)
    
    db = TestingSessionLocalFile()
    try:
        yield db
    finally:
        db.close()

@pytest_asyncio.fixture(scope="function")
async def async_db_session():
    """Crear una sesión de base de datos de prueba (Asíncrona)"""
    async with TestingAsyncSessionLocal() as session:
        yield session

@pytest.fixture(scope="function")
def client(db_session):
    """Crear un cliente de prueba de FastAPI (Síncrono)"""
    def override_get_db():
        try:
            yield db_session
        finally:
            pass
    
    app.dependency_overrides[get_db] = override_get_db
    
    # Override async db to ensure session is closed
    async def override_get_async_db():
        async with TestingAsyncSessionLocal() as session:
            yield session
    
    app.dependency_overrides[get_async_db] = override_get_async_db
    
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()

@pytest_asyncio.fixture(scope="function")
async def async_client(async_db_session):
    """Crear un cliente de prueba asíncrono"""
    def override_get_async_db():
        yield async_db_session

    app.dependency_overrides[get_async_db] = override_get_async_db
    async with AsyncClient(app=app, base_url="http://test") as ac:
        yield ac
    app.dependency_overrides.clear()

@pytest.fixture
def test_user(db_session):
    """Crear un usuario de prueba"""
    user = User(
        username="testuser",
        email="test@example.com",
        hashed_password=get_password_hash("testpassword"),
        full_name="Test User",
        role="employee",
        is_active=True
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user

@pytest.fixture
def admin_user(db_session):
    """Crear un usuario administrador de prueba"""
    user = User(
        username="admin",
        email="admin@example.com",
        hashed_password=get_password_hash("adminpassword"),
        full_name="Admin User",
        role="admin",
        is_active=True
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user

@pytest.fixture
def auth_headers(client, test_user):
    """Obtener headers de autenticación para un usuario de prueba"""
    response = client.post(
        "/auth/login",
        data={"username": "testuser", "password": "testpassword"}
    )
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}

@pytest.fixture
def admin_headers(client, admin_user):
    """Obtener headers de autenticación para un administrador"""
    response = client.post(
        "/auth/login",
        data={"username": "admin", "password": "adminpassword"}
    )
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}

from sqlalchemy import Column, Integer, String, Boolean, DateTime, Enum
from datetime import datetime
import enum
from app.database import Base


class UserRole(str, enum.Enum):
    """Roles de usuario"""
    ADMIN = "admin"
    MANAGER = "manager"
    EMPLOYEE = "employee"


class User(Base):
    """Modelo de Usuario"""
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, nullable=False, index=True)
    email = Column(String(100), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(200))
    role = Column(Enum(UserRole), default=UserRole.EMPLOYEE, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

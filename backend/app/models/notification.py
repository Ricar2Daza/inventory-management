from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text, Enum
from datetime import datetime
import enum
from app.database import Base


class NotificationType(str, enum.Enum):
    """Tipos de notificación"""
    LOW_STOCK = "low_stock"
    OUT_OF_STOCK = "out_of_stock"
    SYSTEM = "system"
    INFO = "info"


class Notification(Base):
    """Modelo de Notificación"""
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    type = Column(Enum(NotificationType), nullable=False)
    title = Column(String(200), nullable=False)
    message = Column(Text, nullable=False)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=True)
    is_read = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)


class NotificationPreference(Base):
    """Modelo de Preferencias de Notificación"""
    __tablename__ = "notification_preferences"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    low_stock_enabled = Column(Boolean, default=True, nullable=False)
    out_of_stock_enabled = Column(Boolean, default=True, nullable=False)
    email_notifications = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

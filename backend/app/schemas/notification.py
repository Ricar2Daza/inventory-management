from pydantic import BaseModel
from datetime import datetime
from typing import Optional
from enum import Enum


class NotificationType(str, Enum):
    """Tipos de notificación"""
    LOW_STOCK = "low_stock"
    OUT_OF_STOCK = "out_of_stock"
    SYSTEM = "system"
    INFO = "info"


# ============ NOTIFICATION SCHEMAS ============

class NotificationBase(BaseModel):
    type: NotificationType
    title: str
    message: str
    product_id: Optional[int] = None


class NotificationCreate(NotificationBase):
    user_id: int


class Notification(NotificationBase):
    id: int
    user_id: int
    is_read: bool
    created_at: datetime

    class Config:
        from_attributes = True


# ============ NOTIFICATION PREFERENCE SCHEMAS ============

class NotificationPreferenceBase(BaseModel):
    low_stock_enabled: bool = True
    out_of_stock_enabled: bool = True
    email_notifications: bool = False


class NotificationPreferenceCreate(NotificationPreferenceBase):
    user_id: int


class NotificationPreferenceUpdate(BaseModel):
    low_stock_enabled: Optional[bool] = None
    out_of_stock_enabled: Optional[bool] = None
    email_notifications: Optional[bool] = None


class NotificationPreference(NotificationPreferenceBase):
    id: int
    user_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

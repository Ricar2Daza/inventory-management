from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.models.notification import Notification, NotificationPreference
from app.models.user import User
from app.schemas.notification import (
    Notification as NotificationSchema,
    NotificationPreference as NotificationPreferenceSchema,
    NotificationPreferenceUpdate
)
from app.auth import get_current_active_user
from app.utils.notifications import get_or_create_preferences

router = APIRouter(
    prefix="/notifications",
    tags=["notifications"]
)


@router.get("/", response_model=List[NotificationSchema])
def get_notifications(
    unread_only: bool = False,
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Obtener notificaciones del usuario actual
    """
    query = db.query(Notification).filter(Notification.user_id == current_user.id)
    
    if unread_only:
        query = query.filter(Notification.is_read == False)
    
    notifications = query.order_by(Notification.created_at.desc()).offset(skip).limit(limit).all()
    return notifications


@router.get("/unread-count")
def get_unread_count(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Obtener cantidad de notificaciones no leídas
    """
    count = db.query(Notification).filter(
        Notification.user_id == current_user.id,
        Notification.is_read == False
    ).count()
    return {"unread_count": count}


@router.get("/{notification_id}", response_model=NotificationSchema)
def get_notification(
    notification_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Obtener una notificación específica
    """
    notification = db.query(Notification).filter(
        Notification.id == notification_id,
        Notification.user_id == current_user.id
    ).first()
    
    if not notification:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notificación no encontrada"
        )
    
    return notification


@router.put("/{notification_id}/read", response_model=NotificationSchema)
def mark_as_read(
    notification_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Marcar notificación como leída
    """
    notification = db.query(Notification).filter(
        Notification.id == notification_id,
        Notification.user_id == current_user.id
    ).first()
    
    if not notification:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notificación no encontrada"
        )
    
    notification.is_read = True
    db.commit()
    db.refresh(notification)
    return notification


@router.put("/mark-all-read")
def mark_all_as_read(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Marcar todas las notificaciones como leídas
    """
    db.query(Notification).filter(
        Notification.user_id == current_user.id,
        Notification.is_read == False
    ).update({"is_read": True})
    db.commit()
    
    return {"message": "Todas las notificaciones marcadas como leídas"}


@router.delete("/{notification_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_notification(
    notification_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Eliminar una notificación
    """
    notification = db.query(Notification).filter(
        Notification.id == notification_id,
        Notification.user_id == current_user.id
    ).first()
    
    if not notification:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notificación no encontrada"
        )
    
    db.delete(notification)
    db.commit()
    return None


# ============ PREFERENCES ENDPOINTS ============

@router.get("/preferences/me", response_model=NotificationPreferenceSchema)
def get_my_preferences(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Obtener preferencias de notificación del usuario actual
    """
    prefs = get_or_create_preferences(db, current_user.id)
    return prefs


@router.put("/preferences/me", response_model=NotificationPreferenceSchema)
def update_my_preferences(
    preferences: NotificationPreferenceUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Actualizar preferencias de notificación del usuario actual
    """
    prefs = get_or_create_preferences(db, current_user.id)
    
    # Actualizar campos
    update_data = preferences.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(prefs, field, value)
    
    db.commit()
    db.refresh(prefs)
    return prefs

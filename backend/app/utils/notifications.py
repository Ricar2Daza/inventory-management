from sqlalchemy.orm import Session
from app.models.notification import Notification, NotificationPreference, NotificationType
from app.models.inventory import Product
from app.models.user import User


def check_and_create_low_stock_notification(db: Session, product_id: int):
    """
    Verificar si un producto tiene stock bajo y crear notificaciones
    """
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        return
    
    # Verificar si el stock está bajo o agotado
    if product.current_stock > product.min_stock_level:
        return
    
    # Determinar tipo de notificación
    if product.current_stock == 0:
        notification_type = NotificationType.OUT_OF_STOCK
        title = f"Producto agotado: {product.name}"
        message = f"El producto '{product.name}' (SKU: {product.sku}) está agotado."
    else:
        notification_type = NotificationType.LOW_STOCK
        title = f"Stock bajo: {product.name}"
        message = f"El producto '{product.name}' (SKU: {product.sku}) tiene stock bajo. Stock actual: {product.current_stock}, Mínimo: {product.min_stock_level}"
    
    # Obtener usuarios con notificaciones habilitadas
    users_with_prefs = db.query(User, NotificationPreference).join(
        NotificationPreference, User.id == NotificationPreference.user_id
    ).all()
    
    # Crear notificaciones para usuarios con preferencias habilitadas
    for user, pref in users_with_prefs:
        # Verificar si el usuario quiere este tipo de notificación
        if notification_type == NotificationType.LOW_STOCK and not pref.low_stock_enabled:
            continue
        if notification_type == NotificationType.OUT_OF_STOCK and not pref.out_of_stock_enabled:
            continue
        
        # Verificar si ya existe una notificación no leída para este producto
        existing = db.query(Notification).filter(
            Notification.user_id == user.id,
            Notification.product_id == product_id,
            Notification.is_read == False,
            Notification.type == notification_type
        ).first()
        
        if existing:
            continue
        
        # Crear notificación
        notification = Notification(
            user_id=user.id,
            type=notification_type,
            title=title,
            message=message,
            product_id=product_id
        )
        db.add(notification)
    
    db.commit()


def create_notification_for_user(
    db: Session,
    user_id: int,
    notification_type: NotificationType,
    title: str,
    message: str,
    product_id: int = None
):
    """
    Crear una notificación para un usuario específico
    """
    notification = Notification(
        user_id=user_id,
        type=notification_type,
        title=title,
        message=message,
        product_id=product_id
    )
    db.add(notification)
    db.commit()
    db.refresh(notification)
    return notification


def get_or_create_preferences(db: Session, user_id: int) -> NotificationPreference:
    """
    Obtener o crear preferencias de notificación para un usuario
    """
    prefs = db.query(NotificationPreference).filter(
        NotificationPreference.user_id == user_id
    ).first()
    
    if not prefs:
        prefs = NotificationPreference(user_id=user_id)
        db.add(prefs)
        db.commit()
        db.refresh(prefs)
    
    return prefs

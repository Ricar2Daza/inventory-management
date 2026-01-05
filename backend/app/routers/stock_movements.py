import logging
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from typing import List

from app.database import get_db
from app.models.inventory import StockMovement, Product, MovementType
from app.schemas.inventory import StockMovement as StockMovementSchema, StockMovementCreate
from app.utils.notifications import check_and_create_low_stock_notification
from app.auth import get_current_active_user, require_role
from app.models.user import User

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/stock-movements",
    tags=["stock-movements"]
)


@router.get("/", response_model=List[StockMovementSchema])
def get_stock_movements(
    skip: int = 0, 
    limit: int = 100, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Obtener lista de todos los movimientos de stock
    """
    movements = db.query(StockMovement).options(joinedload(StockMovement.product)).order_by(StockMovement.created_at.desc()).offset(skip).limit(limit).all()
    return movements


@router.get("/product/{product_id}", response_model=List[StockMovementSchema])
def get_product_movements(
    product_id: int, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Obtener movimientos de stock de un producto específico
    """
    # Verificar que el producto existe
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Producto con ID {product_id} no encontrado"
        )
    
    movements = db.query(StockMovement).options(joinedload(StockMovement.product)).filter(
        StockMovement.product_id == product_id
    ).order_by(StockMovement.created_at.desc()).all()
    
    return movements


@router.post("/", response_model=StockMovementSchema, status_code=status.HTTP_201_CREATED)
def create_stock_movement(
    movement: StockMovementCreate, 
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("manager"))
):
    """
    Registrar un movimiento de stock manual (Requiere Manager)
    Actualiza automáticamente el stock del producto
    """
    logger.info(f"Creando movimiento de stock. Producto ID: {movement.product_id}, Tipo: {movement.movement_type.value}, Cantidad: {movement.quantity}")
    
    # Verificar que el producto existe
    product = db.query(Product).filter(Product.id == movement.product_id).first()
    if not product:
        logger.warning(f"Intento de movimiento con producto inexistente: {movement.product_id}")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Producto con ID {movement.product_id} no encontrado"
        )
    
    # Validar stock suficiente para salidas
    if movement.movement_type == MovementType.SALIDA:
        if product.current_stock < movement.quantity:
            logger.warning(f"Stock insuficiente para producto {product.name} (ID: {movement.product_id}). Stock actual: {product.current_stock}, Solicitado: {movement.quantity}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Stock insuficiente. Stock actual: {product.current_stock}, Cantidad solicitada: {movement.quantity}"
            )
    
    # Crear el movimiento
    db_movement = StockMovement(**movement.model_dump())
    db.add(db_movement)
    
    # Actualizar el stock del producto
    old_stock = product.current_stock
    if movement.movement_type == MovementType.ENTRADA:
        product.current_stock += movement.quantity
    else:  # SALIDA
        product.current_stock -= movement.quantity
    
    db.commit()
    db.refresh(db_movement)
    
    logger.info(f"Movimiento de stock creado. ID: {db_movement.id}, Producto: {product.name}, Stock anterior: {old_stock}, Stock nuevo: {product.current_stock}")
    
    # Verificar stock bajo y crear notificaciones si es necesario
    check_and_create_low_stock_notification(db, movement.product_id)
    
    return db_movement

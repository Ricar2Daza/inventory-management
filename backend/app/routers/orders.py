from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.models.inventory import Order, OrderItem, Product, StockMovement, MovementType
from app.schemas.orders import OrderCreate, OrderResponse, OrderItemSchema

router = APIRouter(
    prefix="/orders",
    tags=["orders"]
)

@router.post("/", response_model=OrderResponse, status_code=status.HTTP_201_CREATED)
def create_order(order_data: OrderCreate, db: Session = Depends(get_db)):
    """
    Crear una nueva venta (Orden).
    - Verifica stock suficiente.
    - Resta stock.
    - Crea movimiento de salida.
    - Registra la orden e items.
    """
    total_amount = 0.0
    db_items = []
    
    # 1. Validaciones y Cálculos preliminares
    for item in order_data.items:
        product = db.query(Product).filter(Product.id == item.product_id).first()
        if not product:
            raise HTTPException(status_code=404, detail=f"Producto ID {item.product_id} no encontrado")
        
        if product.current_stock < item.quantity:
            raise HTTPException(status_code=400, detail=f"Stock insuficiente para '{product.name}'. Disponible: {product.current_stock}")
        
        # Calcular montos
        subtotal = product.unit_price * item.quantity
        total_amount += subtotal
        
        # Preparar objeto OrderItem (aún no guardado)
        db_item = OrderItem(
            product_id=product.id,
            quantity=item.quantity,
            unit_price=product.unit_price,
            subtotal=subtotal
        )
        db_items.append(db_item)

    # 2. Transacción Atómica
    try:
        # Crear Orden
        new_order = Order(
            total_amount=total_amount,
            payment_method=order_data.payment_method,
            status="completed"
        )
        db.add(new_order)
        db.flush() # Para obtener ID
        
        for db_item, input_item in zip(db_items, order_data.items):
            db_item.order_id = new_order.id
            db.add(db_item)
            
            # Actualizar Stock Producto
            product = db.query(Product).filter(Product.id == db_item.product_id).first()
            product.current_stock -= db_item.quantity
            
            # Registrar Movimiento
            movement = StockMovement(
                product_id=product.id,
                movement_type=MovementType.SALIDA,
                quantity=db_item.quantity,
                reason=f"Venta #{new_order.id}",
                created_by="Sistema POS" 
            )
            db.add(movement)
            
        db.commit()
        db.refresh(new_order)
        return new_order
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error al procesar la venta: {str(e)}")

@router.get("/", response_model=List[OrderResponse])
def get_orders(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """Historial de ventas"""
    orders = db.query(Order).order_by(Order.created_at.desc()).offset(skip).limit(limit).all()
    # Enriquecer items con nombre de producto para el frontend
    for order in orders:
        for item in order.items:
            # SQLAlchemy ya trae el producto por la relación, pero el schema espera product_name
            # Aseguramos que el schema lo reciba mapeando explícitamente si es necesario, 
            # pero Pydantic `from_attributes` suele manejarlo si la propiedad existe.
            # Aquí inyectamos el nombre si no viene directo.
            item.product_name = item.product.name if item.product else "Desconocido"
            
    return orders

@router.get("/{order_id}", response_model=OrderResponse)
def get_order(order_id: int, db: Session = Depends(get_db)):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Orden no encontrada")
    
    for item in order.items:
        item.product_name = item.product.name if item.product else "Desconocido"
        
    return order

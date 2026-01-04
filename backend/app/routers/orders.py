import logging
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.models.inventory import Order, OrderItem, Product, StockMovement, MovementType, Client
from app.schemas.orders import OrderCreate, OrderResponse, OrderItemSchema

logger = logging.getLogger(__name__)

import io
from fastapi.responses import Response
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
import qrcode
import tempfile
import os

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
    logger.info(f"Creando nueva orden. Cliente ID: {order_data.client_id}, Items: {len(order_data.items)}")
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
            client_id=order_data.client_id,
            total_amount=total_amount,
            payment_method=order_data.payment_method,
            status="completed"
        )
        # Si el método de pago indica deuda/crédito, actualizamos el saldo del cliente
        if order_data.client_id and order_data.payment_method.lower() in ["crédito", "fiado", "deuda"]:
            client = db.query(Client).filter(Client.id == order_data.client_id).first()
            if client:
                client.balance -= total_amount # El cliente nos debe dinero (balance negativo o como prefieras manejarlo)
                new_order.status = "pending"

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
        
        logger.info(f"Orden creada exitosamente. ID: {new_order.id}, Total: {total_amount}")
        return new_order
        
    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Error al procesar la orden: {str(e)}", exc_info=True)
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
        
@router.get("/{order_id}/receipt")
def generate_order_receipt(order_id: int, db: Session = Depends(get_db)):
    """
    Generar ticket PDF para una venta
    """
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Orden no encontrada")

    buffer = io.BytesIO()
    # Tamaño Ticket (Ej: 80mm x largo variable)
    w_mm = 80
    h_mm = 150 # Largo base
    p_width = w_mm * mm
    p_height = h_mm * mm
    
    c = canvas.Canvas(buffer, pagesize=(p_width, p_height))
    
    # Dibujar Cabecera
    c.setFont("Helvetica-Bold", 14)
    c.drawCentredString(p_width/2, p_height - 10*mm, "RECIBO DE VENTA")
    
    c.setFont("Helvetica", 10)
    c.drawCentredString(p_width/2, p_height - 15*mm, f"Orden #{order.id}")
    c.drawCentredString(p_width/2, p_height - 20*mm, f"Fecha: {order.created_at.strftime('%d/%m/%Y %H:%M')}")
    
    c.line(5*mm, p_height - 25*mm, p_width - 5*mm, p_height - 25*mm)
    
    # Información Cliente
    y = p_height - 30*mm
    if order.client:
        c.setFont("Helvetica-Bold", 9)
        c.drawString(5*mm, y, f"Cliente: {order.client.name}")
        y -= 5*mm
    
    # Tabla de Items
    c.setFont("Helvetica-Bold", 9)
    c.drawString(5*mm, y, "Cant.")
    c.drawString(15*mm, y, "Producto")
    c.drawRightString(p_width - 5*mm, y, "Total")
    y -= 5*mm
    
    c.setFont("Helvetica", 8)
    for item in order.items:
        product_name = (item.product.name[:20] + '..') if len(item.product.name) > 20 else item.product.name
        c.drawString(5*mm, y, f"{item.quantity}")
        c.drawString(15*mm, y, product_name)
        c.drawRightString(p_width - 5*mm, y, f"${item.subtotal:,.2f}")
        y -= 4*mm
        if y < 20*mm: break # Evitar salirse (simplificación)

    c.line(5*mm, y - 2*mm, p_width - 5*mm, y - 2*mm)
    y -= 8*mm
    
    c.setFont("Helvetica-Bold", 12)
    c.drawString(5*mm, y, "TOTAL:")
    c.drawRightString(p_width - 5*mm, y, f"${order.total_amount:,.2f}")
    
    # QR de verificación
    qr = qrcode.QRCode(box_size=10, border=1)
    qr.add_data(f"ORDEN-{order.id}")
    qr.make(fit=True)
    img_qr = qr.make_image(fill_color="black", back_color="white")
    
    with tempfile.NamedTemporaryFile(delete=False, suffix=".png") as tmp:
        img_qr.save(tmp.name)
        tmp_path = tmp.name

    try:
        c.drawImage(tmp_path, (p_width/2) - 15*mm, 10*mm, width=30*mm, height=30*mm)
        c.setFont("Helvetica-Oblique", 7)
        c.drawCentredString(p_width/2, 5*mm, "Gracias por su compra")
        c.showPage()
        c.save()
    finally:
        if os.path.exists(tmp_path):
            os.remove(tmp_path)

    buffer.seek(0)
    return Response(content=buffer.getvalue(), media_type="application/pdf", headers={"Content-Disposition": f"attachment; filename=receipt_{order.id}.pdf"})

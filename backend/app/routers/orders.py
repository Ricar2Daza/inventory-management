import logging
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func
from typing import List

from app.database import get_db
from app.models.inventory import Order, OrderItem, Product, StockMovement, MovementType, Client
from app.models.financial import Invoice
from app.schemas.orders import OrderCreate, OrderResponse, OrderItemSchema
from app.schemas.financial import Invoice as InvoiceSchema, InvoiceCreate
from app.auth import get_current_active_user
from app.models.user import User

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
def create_order(
    order_data: OrderCreate, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Crear una nueva venta (Orden).
    - Verifica stock suficiente.
    - Resta stock.
    - Crea movimiento de salida.
    - Registra la orden e items.
    """
    logger.info(f"Creando nueva orden. Cliente ID: {order_data.client_id}, Items: {len(order_data.items)}")
    total_amount = 0.0
    subtotal_amount = 0.0
    tax_amount = 0.0
    db_items = []
    
    # Obtener IDs de productos
    product_ids = [item.product_id for item in order_data.items]
    
    # Consulta masiva de productos (Fix N+1)
    products = db.query(Product).filter(Product.id.in_(product_ids)).all()
    products_map = {p.id: p for p in products}
    
    # 1. Validaciones y Cálculos preliminares
    for item in order_data.items:
        product = products_map.get(item.product_id)
        
        if not product:
            raise HTTPException(status_code=404, detail=f"Producto ID {item.product_id} no encontrado")
        
        if product.current_stock < item.quantity:
            raise HTTPException(status_code=400, detail=f"Stock insuficiente para '{product.name}'. Disponible: {product.current_stock}")
        
        subtotal = product.unit_price * item.quantity
        subtotal_amount += subtotal
        line_tax = 0.0
        tax_amount += line_tax
        total_amount = subtotal_amount + tax_amount

        db_item = OrderItem(
            product_id=product.id,
            quantity=item.quantity,
            unit_price=product.unit_price,
            subtotal=subtotal,
            tax_amount=line_tax
        )
        db_items.append(db_item)

    # 2. Transacción Atómica
    try:
        new_order = Order(
            client_id=order_data.client_id,
            warehouse_id=order_data.warehouse_id,
            total_amount=total_amount,
            subtotal=subtotal_amount,
            tax_amount=tax_amount,
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
        
        for db_item in db_items:
            db_item.order_id = new_order.id
            db.add(db_item)
            
            # Actualizar Stock Producto (usando el objeto ya cargado en memoria)
            product = products_map[db_item.product_id]
            product.current_stock -= db_item.quantity
            
            # Registrar Movimiento
            movement = StockMovement(
                product_id=product.id,
                warehouse_id=new_order.warehouse_id,
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
def get_orders(
    skip: int = 0, 
    limit: int = 100, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Historial de ventas"""
    orders = db.query(Order).options(
        joinedload(Order.items).joinedload(OrderItem.product),
        joinedload(Order.client)
    ).order_by(Order.created_at.desc()).offset(skip).limit(limit).all()
    
    return orders


@router.post("/{order_id}/invoice", response_model=InvoiceSchema, status_code=status.HTTP_201_CREATED)
def create_invoice_for_order(
    order_id: int,
    invoice_data: InvoiceCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    order = db.query(Order).options(joinedload(Order.invoice)).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Orden no encontrada")
    if order.invoice:
        raise HTTPException(status_code=400, detail="La orden ya tiene una factura emitida")

    series = invoice_data.series.strip()
    if not series:
        raise HTTPException(status_code=400, detail="La serie de la factura es obligatoria")

    last_number = db.query(func.max(Invoice.number)).filter(Invoice.series == series).scalar() or 0
    next_number = last_number + 1

    subtotal = order.subtotal if order.subtotal is not None else order.total_amount
    tax_amount = order.tax_amount if order.tax_amount is not None else 0.0

    invoice = Invoice(
        order_id=order.id,
        series=series,
        number=next_number,
        subtotal=subtotal,
        tax_amount=tax_amount,
        total_amount=order.total_amount
    )

    db.add(invoice)
    db.commit()
    db.refresh(invoice)

    return invoice


@router.get("/{order_id}/invoice", response_model=InvoiceSchema)
def get_invoice_for_order(
    order_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    order = db.query(Order).options(joinedload(Order.invoice)).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Orden no encontrada")
    if not order.invoice:
        raise HTTPException(status_code=404, detail="La orden no tiene factura emitida")
    return order.invoice

@router.get("/{order_id}", response_model=OrderResponse)
def get_order(
    order_id: int, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    order = db.query(Order).options(
        joinedload(Order.items).joinedload(OrderItem.product),
        joinedload(Order.client)
    ).filter(Order.id == order_id).first()
    
    if not order:
        raise HTTPException(status_code=404, detail="Orden no encontrada")
            
    return order

@router.get("/{order_id}/receipt")
def generate_order_receipt(
    order_id: int, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Generar ticket PDF para una venta
    """
    order = db.query(Order).options(
        joinedload(Order.items).joinedload(OrderItem.product),
        joinedload(Order.client)
    ).filter(Order.id == order_id).first()
    
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

    c.setFont("Helvetica-Bold", 9)
    c.drawString(5*mm, y, "SUBTOTAL:")
    c.drawRightString(p_width - 5*mm, y, f"${order.subtotal:,.2f}")
    y -= 5*mm

    c.drawString(5*mm, y, "IMPUESTO:")
    c.drawRightString(p_width - 5*mm, y, f"${order.tax_amount:,.2f}")
    y -= 5*mm

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

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, desc, case
from datetime import datetime, timedelta
from typing import Optional

from app.database import get_db
from app.models.inventory import Product, Category, Supplier, StockMovement, MovementType
from app.schemas.reports import (
    InventorySummary,
    StockValue,
    ProductReport,
    LowStockReport,
    MovementSummary,
    TopProduct,
    TopProductsReport,
    CategoryInventory,
    CategoryReport,
    SupplierInventory,
    SupplierReport,
    SalesSummary
)

router = APIRouter(
    prefix="/reports",
    tags=["reports"]
)


@router.get("/inventory-summary", response_model=InventorySummary)
def get_inventory_summary(db: Session = Depends(get_db)):
    """
    Obtener resumen general del inventario
    """
    total_products = db.query(func.count(Product.id)).scalar()
    total_categories = db.query(func.count(Category.id)).scalar()
    total_suppliers = db.query(func.count(Supplier.id)).scalar()
    
    # Calcular valor total del stock
    total_stock_value = db.query(
        func.sum(Product.current_stock * Product.unit_price)
    ).scalar() or 0.0
    
    # Productos con stock bajo
    low_stock_products = db.query(func.count(Product.id)).filter(
        Product.current_stock <= Product.min_stock_level,
        Product.current_stock > 0
    ).scalar()
    
    # Productos sin stock
    out_of_stock_products = db.query(func.count(Product.id)).filter(
        Product.current_stock == 0
    ).scalar()
    
    return InventorySummary(
        total_products=total_products,
        total_categories=total_categories,
        total_suppliers=total_suppliers,
        total_stock_value=total_stock_value,
        low_stock_products=low_stock_products,
        out_of_stock_products=out_of_stock_products
    )


@router.get("/stock-value", response_model=StockValue)
def get_stock_value(db: Session = Depends(get_db)):
    """
    Obtener valor total del inventario
    """
    total_products = db.query(func.count(Product.id)).scalar()
    total_value = db.query(
        func.sum(Product.current_stock * Product.unit_price)
    ).scalar() or 0.0
    
    average_value = total_value / total_products if total_products > 0 else 0.0
    
    return StockValue(
        total_value=total_value,
        total_products=total_products,
        average_product_value=average_value
    )


@router.get("/low-stock", response_model=LowStockReport)
def get_low_stock_report(db: Session = Depends(get_db)):
    """
    Obtener reporte de productos con stock bajo
    """
    products = db.query(Product).filter(
        Product.current_stock <= Product.min_stock_level
    ).all()
    
    product_reports = []
    total_value = 0.0
    
    for product in products:
        value = product.current_stock * product.unit_price
        total_value += value
        
        product_reports.append(ProductReport(
            id=product.id,
            name=product.name,
            sku=product.sku,
            current_stock=product.current_stock,
            min_stock_level=product.min_stock_level,
            unit_price=product.unit_price,
            total_value=value,
            category_name=product.category.name if product.category else None,
            supplier_name=product.supplier.name if product.supplier else None
        ))
    
    return LowStockReport(
        products=product_reports,
        total_products=len(product_reports),
        total_value=total_value
    )


@router.get("/movements", response_model=MovementSummary)
def get_movements_report(
    days: int = Query(30, ge=1, le=365, description="Número de días hacia atrás"),
    db: Session = Depends(get_db)
):
    """
    Obtener resumen de movimientos de stock por período
    """
    period_start = datetime.utcnow() - timedelta(days=days)
    period_end = datetime.utcnow()
    
    movements = db.query(StockMovement).filter(
        StockMovement.created_at >= period_start,
        StockMovement.created_at <= period_end
    ).all()
    
    total_movements = len(movements)
    total_entries = sum(1 for m in movements if m.movement_type == MovementType.ENTRADA)
    total_exits = sum(1 for m in movements if m.movement_type == MovementType.SALIDA)
    total_quantity_in = sum(m.quantity for m in movements if m.movement_type == MovementType.ENTRADA)
    total_quantity_out = sum(m.quantity for m in movements if m.movement_type == MovementType.SALIDA)
    
    return MovementSummary(
        total_movements=total_movements,
        total_entries=total_entries,
        total_exits=total_exits,
        total_quantity_in=total_quantity_in,
        total_quantity_out=total_quantity_out,
        period_start=period_start,
        period_end=period_end
    )


@router.get("/top-products", response_model=TopProductsReport)
def get_top_products(
    limit: int = Query(10, ge=1, le=100, description="Número de productos a retornar"),
    days: Optional[int] = Query(None, ge=1, le=365, description="Período en días"),
    db: Session = Depends(get_db)
):
    """
    Obtener productos más movidos
    """
    query = db.query(
        StockMovement.product_id,
        Product.name,
        Product.sku,
        func.count(StockMovement.id).label('total_movements'),
        func.sum(StockMovement.quantity).label('total_quantity'),
        func.sum(case((StockMovement.movement_type == MovementType.ENTRADA, 1), else_=0)).label('entries_count'),
        func.sum(case((StockMovement.movement_type == MovementType.SALIDA, 1), else_=0)).label('exits_count'),
        func.sum(case((StockMovement.movement_type == MovementType.ENTRADA, StockMovement.quantity), else_=0)).label('quantity_in'),
        func.sum(case((StockMovement.movement_type == MovementType.SALIDA, StockMovement.quantity), else_=0)).label('quantity_out')
    ).join(Product)
    
    period_start = None
    period_end = None
    
    if days:
        period_start = datetime.utcnow() - timedelta(days=days)
        period_end = datetime.utcnow()
        query = query.filter(StockMovement.created_at >= period_start)
    
    results = query.group_by(
        StockMovement.product_id, Product.name, Product.sku
    ).order_by(desc('total_movements')).limit(limit).all()
    
    top_products = []
    for r in results:
        net = (r.quantity_in or 0) - (r.quantity_out or 0)
        top_products.append(TopProduct(
            product_id=r.product_id,
            product_name=r.name,
            sku=r.sku,
            total_movements=r.total_movements or 0,
            total_quantity=r.total_quantity or 0,
            entries_count=r.entries_count or 0,
            exits_count=r.exits_count or 0,
            quantity_in=r.quantity_in or 0,
            quantity_out=r.quantity_out or 0,
            net_quantity=net
        ))
    
    return TopProductsReport(
        products=top_products,
        period_start=period_start,
        period_end=period_end
    )


@router.get("/by-category", response_model=CategoryReport)
def get_inventory_by_category(db: Session = Depends(get_db)):
    """
    Obtener inventario agrupado por categoría
    """
    results = db.query(
        Category.id,
        Category.name,
        func.count(Product.id).label('total_products'),
        func.sum(Product.current_stock).label('total_stock'),
        func.sum(Product.current_stock * Product.unit_price).label('total_value')
    ).outerjoin(Product).group_by(Category.id, Category.name).all()
    
    categories = [
        CategoryInventory(
            category_id=r.id,
            category_name=r.name,
            total_products=r.total_products or 0,
            total_stock=r.total_stock or 0,
            total_value=r.total_value or 0.0
        )
        for r in results
    ]
    
    total_value = sum(c.total_value for c in categories)
    
    return CategoryReport(
        categories=categories,
        total_categories=len(categories),
        total_value=total_value
    )


@router.get("/by-supplier", response_model=SupplierReport)
def get_inventory_by_supplier(db: Session = Depends(get_db)):
    """
    Obtener inventario agrupado por proveedor
    """
    results = db.query(
        Supplier.id,
        Supplier.name,
        func.count(Product.id).label('total_products'),
        func.sum(Product.current_stock).label('total_stock'),
        func.sum(Product.current_stock * Product.unit_price).label('total_value')
    ).outerjoin(Product).group_by(Supplier.id, Supplier.name).all()
    
    suppliers = [
        SupplierInventory(
            supplier_id=r.id,
            supplier_name=r.name,
            total_products=r.total_products or 0,
            total_stock=r.total_stock or 0,
            total_value=r.total_value or 0.0
        )
        for r in results
    ]
    
    total_value = sum(s.total_value for s in suppliers)
    
    return SupplierReport(
        suppliers=suppliers,
        total_suppliers=len(suppliers),
        total_value=total_value
    )
@router.get("/sales-summary", response_model=SalesSummary)
def get_sales_summary(db: Session = Depends(get_db)):
    """
    Obtener resumen de ventas y rentabilidad
    """
    from app.models.inventory import Order
    
    # 1. Totales históricos
    total_stats = db.query(
        func.count(Order.id).label('total_orders'),
        func.sum(Order.total_amount).label('total_revenue')
    ).first()
    
    total_orders = total_stats.total_orders or 0
    total_revenue = total_stats.total_revenue or 0.0
    
    # 2. Hoy
    today = datetime.utcnow().date()
    today_stats = db.query(
        func.count(Order.id).label('today_orders'),
        func.sum(Order.total_amount).label('today_revenue')
    ).filter(func.date(Order.created_at) == today).first()
    
    today_orders = today_stats.today_orders or 0
    today_revenue = today_stats.today_revenue or 0.0
    
    # 3. Promedio
    average_order_value = total_revenue / total_orders if total_orders > 0 else 0.0
    
    return SalesSummary(
        total_revenue=total_revenue,
        today_revenue=today_revenue,
        total_orders=total_orders,
        today_orders=today_orders,
        average_order_value=average_order_value
    )

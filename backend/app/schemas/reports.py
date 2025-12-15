from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime


# ============ INVENTORY SUMMARY SCHEMAS ============

class InventorySummary(BaseModel):
    """Resumen general del inventario"""
    total_products: int
    total_categories: int
    total_suppliers: int
    total_stock_value: float
    low_stock_products: int
    out_of_stock_products: int

    class Config:
        from_attributes = True


class StockValue(BaseModel):
    """Valor total del inventario"""
    total_value: float
    total_products: int
    average_product_value: float

    class Config:
        from_attributes = True


# ============ PRODUCT REPORT SCHEMAS ============

class ProductReport(BaseModel):
    """Reporte de producto individual"""
    id: int
    name: str
    sku: str
    current_stock: int
    min_stock_level: int
    unit_price: float
    total_value: float
    category_name: Optional[str] = None
    supplier_name: Optional[str] = None

    class Config:
        from_attributes = True


class LowStockReport(BaseModel):
    """Reporte de productos con stock bajo"""
    products: List[ProductReport]
    total_products: int
    total_value: float

    class Config:
        from_attributes = True


# ============ MOVEMENT REPORT SCHEMAS ============

class MovementSummary(BaseModel):
    """Resumen de movimientos"""
    total_movements: int
    total_entries: int
    total_exits: int
    total_quantity_in: int
    total_quantity_out: int
    period_start: Optional[datetime] = None
    period_end: Optional[datetime] = None

    class Config:
        from_attributes = True


# ============ TOP PRODUCTS SCHEMAS ============

class TopProduct(BaseModel):
    """Producto más movido"""
    product_id: int
    product_name: str
    sku: str
    total_movements: int
    total_quantity: int

    class Config:
        from_attributes = True


class TopProductsReport(BaseModel):
    """Reporte de productos más movidos"""
    products: List[TopProduct]
    period_start: Optional[datetime] = None
    period_end: Optional[datetime] = None

    class Config:
        from_attributes = True


# ============ CATEGORY REPORT SCHEMAS ============

class CategoryInventory(BaseModel):
    """Inventario por categoría"""
    category_id: int
    category_name: str
    total_products: int
    total_stock: int
    total_value: float

    class Config:
        from_attributes = True


class CategoryReport(BaseModel):
    """Reporte por categorías"""
    categories: List[CategoryInventory]
    total_categories: int
    total_value: float

    class Config:
        from_attributes = True


# ============ SUPPLIER REPORT SCHEMAS ============

class SupplierInventory(BaseModel):
    """Inventario por proveedor"""
    supplier_id: int
    supplier_name: str
    total_products: int
    total_stock: int
    total_value: float

    class Config:
        from_attributes = True


class SupplierReport(BaseModel):
    """Reporte por proveedores"""
    suppliers: List[SupplierInventory]
    total_suppliers: int
    total_value: float

    class Config:
        from_attributes = True

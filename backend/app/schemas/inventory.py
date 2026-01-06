from pydantic import BaseModel, Field, EmailStr
from datetime import datetime
from typing import Optional
from enum import Enum


class MovementType(str, Enum):
    """Tipos de movimiento de stock"""
    ENTRADA = "entrada"
    SALIDA = "salida"


# ============ CATEGORY SCHEMAS ============

class CategoryBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = Field(None, max_length=500)


class CategoryCreate(CategoryBase):
    pass


class CategoryUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    description: Optional[str] = Field(None, max_length=500)


class Category(CategoryBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


# ============ SUPPLIER SCHEMAS ============

class SupplierBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    contact_name: Optional[str] = Field(None, max_length=200)
    email: Optional[EmailStr] = None
    phone: Optional[str] = Field(None, max_length=20)
    address: Optional[str] = Field(None, max_length=500)


class SupplierCreate(SupplierBase):
    pass


class SupplierUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=200)
    contact_name: Optional[str] = Field(None, max_length=200)
    email: Optional[EmailStr] = None
    phone: Optional[str] = Field(None, max_length=20)
    address: Optional[str] = Field(None, max_length=500)
    balance: Optional[float] = None


class Supplier(SupplierBase):
    id: int
    balance: float
    created_at: datetime

    class Config:
        from_attributes = True


# ============ CLIENT SCHEMAS ============

class ClientBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    email: Optional[EmailStr] = None
    phone: Optional[str] = Field(None, max_length=20)
    address: Optional[str] = Field(None, max_length=500)
    identification: Optional[str] = Field(None, max_length=50)


class ClientCreate(ClientBase):
    pass


class ClientUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=200)
    email: Optional[EmailStr] = None
    phone: Optional[str] = Field(None, max_length=20)
    address: Optional[str] = Field(None, max_length=500)
    identification: Optional[str] = Field(None, max_length=50)
    balance: Optional[float] = None


class Client(ClientBase):
    id: int
    balance: float
    created_at: datetime

    class Config:
        from_attributes = True


# ============ PRODUCT SCHEMAS ============

class ProductBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = Field(None, max_length=1000)
    sku: str = Field(..., min_length=1, max_length=50)
    category_id: int
    supplier_id: int
    unit_price: float = Field(..., gt=0)
    current_stock: int = Field(default=0, ge=0)
    min_stock_level: int = Field(default=0, ge=0)


class ProductCreate(ProductBase):
    pass


class ProductUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = Field(None, max_length=1000)
    sku: Optional[str] = Field(None, min_length=1, max_length=50)
    category_id: Optional[int] = None
    supplier_id: Optional[int] = None
    unit_price: Optional[float] = Field(None, gt=0)
    current_stock: Optional[int] = Field(None, ge=0)
    min_stock_level: Optional[int] = Field(None, ge=0)


class Product(ProductBase):
    id: int
    created_at: datetime
    updated_at: datetime
    category: Optional[Category] = None
    supplier: Optional[Supplier] = None
    category_id: Optional[int] = None
    supplier_id: Optional[int] = None

    class Config:
        from_attributes = True


# ============ STOCK MOVEMENT SCHEMAS ============

class StockMovementBase(BaseModel):
    product_id: int
    movement_type: MovementType
    quantity: int = Field(..., gt=0)
    reason: Optional[str] = Field(None, max_length=500)
    created_by: Optional[str] = Field(None, max_length=100)


class StockMovementCreate(StockMovementBase):
    pass


class StockMovement(StockMovementBase):
    id: int
    created_at: datetime
    product: Optional[Product] = None

    class Config:
        from_attributes = True

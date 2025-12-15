from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional


# ============ WAREHOUSE SCHEMAS ============

class WarehouseBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    code: str = Field(..., min_length=1, max_length=50)
    address: Optional[str] = Field(None, max_length=500)
    capacity: Optional[int] = Field(None, gt=0)
    manager_name: Optional[str] = Field(None, max_length=200)
    phone: Optional[str] = Field(None, max_length=20)


class WarehouseCreate(WarehouseBase):
    pass


class WarehouseUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=200)
    code: Optional[str] = Field(None, min_length=1, max_length=50)
    address: Optional[str] = Field(None, max_length=500)
    capacity: Optional[int] = Field(None, gt=0)
    manager_name: Optional[str] = Field(None, max_length=200)
    phone: Optional[str] = Field(None, max_length=20)
    is_active: Optional[bool] = None


class Warehouse(WarehouseBase):
    id: int
    is_active: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ============ PRODUCT WAREHOUSE SCHEMAS ============

class ProductWarehouseBase(BaseModel):
    product_id: int
    warehouse_id: int
    stock: int = Field(default=0, ge=0)
    min_stock_level: int = Field(default=0, ge=0)


class ProductWarehouseCreate(ProductWarehouseBase):
    pass


class ProductWarehouseUpdate(BaseModel):
    stock: Optional[int] = Field(None, ge=0)
    min_stock_level: Optional[int] = Field(None, ge=0)


class ProductWarehouse(ProductWarehouseBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ============ TRANSFER SCHEMAS ============

class WarehouseTransfer(BaseModel):
    """Schema para transferencia entre almacenes"""
    product_id: int
    from_warehouse_id: int
    to_warehouse_id: int
    quantity: int = Field(..., gt=0)
    reason: Optional[str] = Field(None, max_length=500)

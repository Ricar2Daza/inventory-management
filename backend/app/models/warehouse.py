from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base


class Warehouse(Base):
    """Modelo de Almacén"""
    __tablename__ = "warehouses"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), unique=True, nullable=False, index=True)
    code = Column(String(50), unique=True, nullable=False, index=True)
    address = Column(String(500))
    capacity = Column(Integer)  # Capacidad máxima en unidades
    manager_name = Column(String(200))
    phone = Column(String(20))
    is_active = Column(Integer, default=1, nullable=False)  # SQLite usa INTEGER para BOOLEAN
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relaciones inversas
    product_stocks = relationship("ProductWarehouse", back_populates="warehouse")
    stock_movements = relationship("StockMovement", back_populates="warehouse") # Necesita definirse en inventory.py también
    orders = relationship("Order", back_populates="warehouse") # Necesita definirse en inventory.py también


class ProductWarehouse(Base):
    """Modelo de Stock de Producto por Almacén"""
    __tablename__ = "product_warehouses"

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    warehouse_id = Column(Integer, ForeignKey("warehouses.id"), nullable=False)
    stock = Column(Integer, default=0, nullable=False)
    min_stock_level = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relaciones
    product = relationship("Product", back_populates="product_warehouses")
    warehouse = relationship("Warehouse", back_populates="product_stocks")

    # Constraint para evitar duplicados
    __table_args__ = (
        UniqueConstraint('product_id', 'warehouse_id', name='uq_product_warehouse'),
    )

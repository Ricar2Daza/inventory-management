from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Enum
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from app.database import Base


class MovementType(str, enum.Enum):
    """Tipos de movimiento de stock"""
    ENTRADA = "entrada"
    SALIDA = "salida"


class Category(Base):
    """Modelo de Categoría de productos"""
    __tablename__ = "categories"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False, index=True)
    description = Column(String(500))
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relación con productos
    products = relationship("Product", back_populates="category")


class Supplier(Base):
    """Modelo de Proveedor"""
    __tablename__ = "suppliers"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False, index=True)
    contact_name = Column(String(200))
    email = Column(String(100))
    phone = Column(String(20))
    address = Column(String(500))
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relación con productos
    products = relationship("Product", back_populates="supplier")


class Product(Base):
    """Modelo de Producto"""
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False, index=True)
    description = Column(String(1000))
    sku = Column(String(50), unique=True, nullable=False, index=True)
    category_id = Column(Integer, ForeignKey("categories.id"))
    supplier_id = Column(Integer, ForeignKey("suppliers.id"))
    unit_price = Column(Float, nullable=False)
    current_stock = Column(Integer, default=0, nullable=False)
    min_stock_level = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relaciones
    category = relationship("Category", back_populates="products")
    supplier = relationship("Supplier", back_populates="products")
    stock_movements = relationship("StockMovement", back_populates="product")


class StockMovement(Base):
    """Modelo de Movimiento de Stock"""
    __tablename__ = "stock_movements"

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    movement_type = Column(Enum(MovementType), nullable=False)
    quantity = Column(Integer, nullable=False)
    reason = Column(String(500))
    created_at = Column(DateTime, default=datetime.utcnow)
    created_by = Column(String(100))

    # Relación con producto
    product = relationship("Product", back_populates="stock_movements")

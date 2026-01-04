from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base

class Expense(Base):
    """Modelo de Gastos"""
    __tablename__ = "expenses"

    id = Column(Integer, primary_key=True, index=True)
    description = Column(String(500), nullable=False)
    amount = Column(Float, nullable=False)
    category = Column(String(100)) # Ej: Servicios, Alquiler, Sueldos
    date = Column(DateTime, default=datetime.utcnow)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Opcionalmente relacionado con un proveedor si el gasto es por una compra
    supplier_id = Column(Integer, ForeignKey("suppliers.id"), nullable=True)
    
    # Relación
    supplier = relationship("Supplier")

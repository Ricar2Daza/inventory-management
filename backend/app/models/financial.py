from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base


class Expense(Base):
    __tablename__ = "expenses"

    id = Column(Integer, primary_key=True, index=True)
    description = Column(String(500), nullable=False)
    amount = Column(Float, nullable=False)
    category = Column(String(100))
    date = Column(DateTime, default=datetime.utcnow)
    created_at = Column(DateTime, default=datetime.utcnow)
    supplier_id = Column(Integer, ForeignKey("suppliers.id"), nullable=True)
    supplier = relationship("Supplier")


class Invoice(Base):
    __tablename__ = "invoices"
    __table_args__ = (
        UniqueConstraint("series", "number", name="uq_invoice_series_number"),
    )

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=False, index=True)
    series = Column(String(20), nullable=False)
    number = Column(Integer, nullable=False)
    issue_date = Column(DateTime, default=datetime.utcnow)
    subtotal = Column(Float, default=0.0, nullable=False)
    tax_amount = Column(Float, default=0.0, nullable=False)
    total_amount = Column(Float, nullable=False)

    order = relationship("Order", back_populates="invoice")

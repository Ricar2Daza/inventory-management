from sqlalchemy import Column, Integer, String, Boolean
from app.database import Base

class Table(Base):
    """Modelo de Mesa para Restaurantes"""
    __tablename__ = "tables"

    id = Column(Integer, primary_key=True, index=True)
    number = Column(String(10), unique=True, nullable=False)
    capacity = Column(Integer, default=4)
    status = Column(String(20), default="available") # available, occupied, reserved
    is_active = Column(Boolean, default=True)

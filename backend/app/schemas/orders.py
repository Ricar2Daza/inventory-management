from pydantic import BaseModel, ConfigDict
from typing import List, Optional
from datetime import datetime

class OrderItemSchema(BaseModel):
    product_id: int
    quantity: int
    unit_price: float
    subtotal: float
    product_name: str
    tax_amount: float

    model_config = ConfigDict(from_attributes=True)

class OrderCreateItem(BaseModel):
    product_id: int
    quantity: int

class OrderCreate(BaseModel):
    payment_method: str
    client_id: Optional[int] = None
    warehouse_id: Optional[int] = None # Nuevo campo
    items: List[OrderCreateItem]

class OrderResponse(BaseModel):
    id: int
    client_id: Optional[int] = None
    warehouse_id: Optional[int] = None # Nuevo campo
    subtotal: float
    tax_amount: float
    total_amount: float
    payment_method: str
    status: str
    created_at: datetime
    items: List[OrderItemSchema]

    model_config = ConfigDict(from_attributes=True)

from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional

class ExpenseBase(BaseModel):
    description: str = Field(..., min_length=1, max_length=500)
    amount: float = Field(..., gt=0)
    category: Optional[str] = Field(None, max_length=100)
    date: Optional[datetime] = None

class ExpenseCreate(ExpenseBase):
    supplier_id: Optional[int] = None

class ExpenseUpdate(BaseModel):
    description: Optional[str] = Field(None, min_length=1, max_length=500)
    amount: Optional[float] = Field(None, gt=0)
    category: Optional[str] = Field(None, max_length=100)
    date: Optional[datetime] = None
    supplier_id: Optional[int] = None

class Expense(ExpenseBase):
    id: int
    created_at: datetime
    supplier_id: Optional[int] = None

    class Config:
        from_attributes = True

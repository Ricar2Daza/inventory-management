from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
import datetime

from app.database import get_db
from app.models.financial import Expense
from app.schemas.financial import Expense as ExpenseSchema, ExpenseCreate, ExpenseUpdate
from app.auth import require_role

router = APIRouter(
    prefix="/expenses",
    tags=["expenses"],
    dependencies=[Depends(require_role("manager"))]
)

@router.get("/", response_model=List[ExpenseSchema])
def get_expenses(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """Obtener lista de gastos"""
    return db.query(Expense).order_by(Expense.date.desc()).offset(skip).limit(limit).all()

@router.post("/", response_model=ExpenseSchema, status_code=status.HTTP_201_CREATED)
def create_expense(expense: ExpenseCreate, db: Session = Depends(get_db)):
    """Registrar un nuevo gasto"""
    db_expense = Expense(**expense.model_dump())
    if not db_expense.date:
        db_expense.date = datetime.datetime.now(datetime.timezone.utc)
        
    db.add(db_expense)
    db.commit()
    db.refresh(db_expense)
    return db_expense

@router.delete("/{expense_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_expense(expense_id: int, db: Session = Depends(get_db)):
    """Eliminar un gasto registrado"""
    db_expense = db.query(Expense).filter(Expense.id == expense_id).first()
    if not db_expense:
        raise HTTPException(status_code=404, detail="Gasto no encontrado")
    
    db.delete(db_expense)
    db.commit()
    return None

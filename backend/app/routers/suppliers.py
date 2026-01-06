from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.models.inventory import Supplier
from app.schemas.inventory import Supplier as SupplierSchema, SupplierCreate, SupplierUpdate
from app.utils.search import search_query
from app.auth import get_current_active_user, require_role
from app.models.user import User

router = APIRouter(
    prefix="/suppliers",
    tags=["suppliers"]
)


@router.get("/", response_model=List[SupplierSchema])
def get_suppliers(
    skip: int = 0, 
    limit: int = 100, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Obtener lista de todos los proveedores
    """
    suppliers = db.query(Supplier).offset(skip).limit(limit).all()
    return suppliers


@router.get("/search", response_model=List[SupplierSchema])
def search_suppliers(
    q: str = Query(..., min_length=1, description="Término de búsqueda"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Buscar proveedores por nombre, contacto o email
    """
    query = db.query(Supplier)
    query = search_query(query, Supplier, q, ["name", "contact_name", "email"])
    suppliers = query.all()
    return suppliers


@router.get("/{supplier_id}", response_model=SupplierSchema)
def get_supplier(
    supplier_id: int, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Obtener un proveedor por ID
    """
    supplier = db.query(Supplier).filter(Supplier.id == supplier_id).first()
    if not supplier:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Proveedor con ID {supplier_id} no encontrado"
        )
    return supplier


@router.post("/", response_model=SupplierSchema, status_code=status.HTTP_201_CREATED)
def create_supplier(
    supplier: SupplierCreate, 
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin"))
):
    """
    Crear un nuevo proveedor (Requiere Admin)
    """
    db_supplier = Supplier(**supplier.model_dump())
    db.add(db_supplier)
    db.commit()
    db.refresh(db_supplier)
    return db_supplier


@router.put("/{supplier_id}", response_model=SupplierSchema)
def update_supplier(
    supplier_id: int, 
    supplier: SupplierUpdate, 
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin"))
):
    """
    Actualizar un proveedor existente (Requiere Admin)
    """
    db_supplier = db.query(Supplier).filter(Supplier.id == supplier_id).first()
    if not db_supplier:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Proveedor con ID {supplier_id} no encontrado"
        )
    
    # Actualizar campos
    update_data = supplier.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_supplier, field, value)
    
    db.commit()
    db.refresh(db_supplier)
    return db_supplier


@router.delete("/{supplier_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_supplier(
    supplier_id: int, 
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin"))
):
    """
    Eliminar un proveedor (Requiere Admin)
    """
    db_supplier = db.query(Supplier).filter(Supplier.id == supplier_id).first()
    if not db_supplier:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Proveedor con ID {supplier_id} no encontrado"
        )
    
    db.delete(db_supplier)
    db.commit()
    return None

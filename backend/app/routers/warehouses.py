from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.models.warehouse import Warehouse, ProductWarehouse
from app.models.inventory import Product
from app.schemas.warehouse import (
    Warehouse as WarehouseSchema,
    WarehouseCreate,
    WarehouseUpdate,
    ProductWarehouse as ProductWarehouseSchema,
    ProductWarehouseCreate,
    ProductWarehouseUpdate,
    WarehouseTransfer
)

router = APIRouter(
    prefix="/warehouses",
    tags=["warehouses"]
)


# ============ WAREHOUSE ENDPOINTS ============

@router.get("/", response_model=List[WarehouseSchema])
def get_warehouses(
    active_only: bool = True,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """
    Obtener lista de almacenes
    """
    query = db.query(Warehouse)
    if active_only:
        query = query.filter(Warehouse.is_active == 1)
    
    warehouses = query.offset(skip).limit(limit).all()
    return warehouses


@router.get("/{warehouse_id}", response_model=WarehouseSchema)
def get_warehouse(warehouse_id: int, db: Session = Depends(get_db)):
    """
    Obtener un almacén por ID
    """
    warehouse = db.query(Warehouse).filter(Warehouse.id == warehouse_id).first()
    if not warehouse:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Almacén con ID {warehouse_id} no encontrado"
        )
    return warehouse


@router.post("/", response_model=WarehouseSchema, status_code=status.HTTP_201_CREATED)
def create_warehouse(warehouse: WarehouseCreate, db: Session = Depends(get_db)):
    """
    Crear un nuevo almacén
    """
    # Verificar nombre único
    existing_name = db.query(Warehouse).filter(Warehouse.name == warehouse.name).first()
    if existing_name:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Ya existe un almacén con el nombre '{warehouse.name}'"
        )
    
    # Verificar código único
    existing_code = db.query(Warehouse).filter(Warehouse.code == warehouse.code).first()
    if existing_code:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Ya existe un almacén con el código '{warehouse.code}'"
        )
    
    db_warehouse = Warehouse(**warehouse.model_dump())
    db.add(db_warehouse)
    db.commit()
    db.refresh(db_warehouse)
    return db_warehouse


@router.put("/{warehouse_id}", response_model=WarehouseSchema)
def update_warehouse(
    warehouse_id: int,
    warehouse: WarehouseUpdate,
    db: Session = Depends(get_db)
):
    """
    Actualizar un almacén
    """
    db_warehouse = db.query(Warehouse).filter(Warehouse.id == warehouse_id).first()
    if not db_warehouse:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Almacén con ID {warehouse_id} no encontrado"
        )
    
    # Verificar nombre único si se está actualizando
    if warehouse.name and warehouse.name != db_warehouse.name:
        existing = db.query(Warehouse).filter(Warehouse.name == warehouse.name).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Ya existe un almacén con el nombre '{warehouse.name}'"
            )
    
    # Verificar código único si se está actualizando
    if warehouse.code and warehouse.code != db_warehouse.code:
        existing = db.query(Warehouse).filter(Warehouse.code == warehouse.code).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Ya existe un almacén con el código '{warehouse.code}'"
            )
    
    # Actualizar campos
    update_data = warehouse.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_warehouse, field, value)
    
    db.commit()
    db.refresh(db_warehouse)
    return db_warehouse


@router.delete("/{warehouse_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_warehouse(warehouse_id: int, db: Session = Depends(get_db)):
    """
    Eliminar un almacén (soft delete)
    """
    db_warehouse = db.query(Warehouse).filter(Warehouse.id == warehouse_id).first()
    if not db_warehouse:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Almacén con ID {warehouse_id} no encontrado"
        )
    
    # Soft delete
    db_warehouse.is_active = 0
    db.commit()
    return None


# ============ PRODUCT WAREHOUSE ENDPOINTS ============

@router.get("/{warehouse_id}/inventory", response_model=List[ProductWarehouseSchema])
def get_warehouse_inventory(warehouse_id: int, db: Session = Depends(get_db)):
    """
    Obtener inventario de un almacén
    """
    # Verificar que el almacén existe
    warehouse = db.query(Warehouse).filter(Warehouse.id == warehouse_id).first()
    if not warehouse:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Almacén con ID {warehouse_id} no encontrado"
        )
    
    inventory = db.query(ProductWarehouse).filter(
        ProductWarehouse.warehouse_id == warehouse_id
    ).all()
    return inventory


@router.post("/inventory", response_model=ProductWarehouseSchema, status_code=status.HTTP_201_CREATED)
def assign_product_to_warehouse(
    product_warehouse: ProductWarehouseCreate,
    db: Session = Depends(get_db)
):
    """
    Asignar producto a almacén con stock inicial
    """
    # Verificar que el producto existe
    product = db.query(Product).filter(Product.id == product_warehouse.product_id).first()
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Producto con ID {product_warehouse.product_id} no encontrado"
        )
    
    # Verificar que el almacén existe
    warehouse = db.query(Warehouse).filter(Warehouse.id == product_warehouse.warehouse_id).first()
    if not warehouse:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Almacén con ID {product_warehouse.warehouse_id} no encontrado"
        )
    
    # Verificar que no existe ya
    existing = db.query(ProductWarehouse).filter(
        ProductWarehouse.product_id == product_warehouse.product_id,
        ProductWarehouse.warehouse_id == product_warehouse.warehouse_id
    ).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El producto ya está asignado a este almacén"
        )
    
    db_product_warehouse = ProductWarehouse(**product_warehouse.model_dump())
    db.add(db_product_warehouse)
    db.commit()
    db.refresh(db_product_warehouse)
    return db_product_warehouse


@router.put("/inventory/{product_warehouse_id}", response_model=ProductWarehouseSchema)
def update_product_warehouse(
    product_warehouse_id: int,
    product_warehouse: ProductWarehouseUpdate,
    db: Session = Depends(get_db)
):
    """
    Actualizar stock de producto en almacén
    """
    db_product_warehouse = db.query(ProductWarehouse).filter(
        ProductWarehouse.id == product_warehouse_id
    ).first()
    
    if not db_product_warehouse:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Registro no encontrado"
        )
    
    # Actualizar campos
    update_data = product_warehouse.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_product_warehouse, field, value)
    
    db.commit()
    db.refresh(db_product_warehouse)
    return db_product_warehouse


@router.post("/transfer")
def transfer_between_warehouses(transfer: WarehouseTransfer, db: Session = Depends(get_db)):
    """
    Transferir stock entre almacenes
    """
    # Verificar que los almacenes son diferentes
    if transfer.from_warehouse_id == transfer.to_warehouse_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Los almacenes de origen y destino deben ser diferentes"
        )
    
    # Obtener stock en almacén de origen
    from_stock = db.query(ProductWarehouse).filter(
        ProductWarehouse.product_id == transfer.product_id,
        ProductWarehouse.warehouse_id == transfer.from_warehouse_id
    ).first()
    
    if not from_stock:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Producto no encontrado en almacén de origen"
        )
    
    if from_stock.stock < transfer.quantity:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Stock insuficiente en almacén de origen. Disponible: {from_stock.stock}"
        )
    
    # Obtener o crear stock en almacén de destino
    to_stock = db.query(ProductWarehouse).filter(
        ProductWarehouse.product_id == transfer.product_id,
        ProductWarehouse.warehouse_id == transfer.to_warehouse_id
    ).first()
    
    if not to_stock:
        # Crear registro en almacén de destino
        to_stock = ProductWarehouse(
            product_id=transfer.product_id,
            warehouse_id=transfer.to_warehouse_id,
            stock=0
        )
        db.add(to_stock)
    
    # Realizar transferencia
    from_stock.stock -= transfer.quantity
    to_stock.stock += transfer.quantity
    
    db.commit()
    
    return {
        "message": "Transferencia exitosa",
        "product_id": transfer.product_id,
        "from_warehouse_id": transfer.from_warehouse_id,
        "to_warehouse_id": transfer.to_warehouse_id,
        "quantity": transfer.quantity,
        "from_stock_remaining": from_stock.stock,
        "to_stock_new": to_stock.stock
    }

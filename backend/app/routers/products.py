from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from app.database import get_db
from app.models.inventory import Product, Category, Supplier
from app.schemas.inventory import Product as ProductSchema, ProductCreate, ProductUpdate
from app.utils.search import search_query

router = APIRouter(
    prefix="/products",
    tags=["products"]
)


@router.get("/", response_model=List[ProductSchema])
def get_products(
    skip: int = 0,
    limit: int = 100,
    category_id: Optional[int] = Query(None, description="Filtrar por categoría"),
    supplier_id: Optional[int] = Query(None, description="Filtrar por proveedor"),
    min_stock: Optional[int] = Query(None, description="Stock mínimo"),
    db: Session = Depends(get_db)
):
    """
    Obtener lista de productos con filtros opcionales
    """
    query = db.query(Product)
    
    if category_id:
        query = query.filter(Product.category_id == category_id)
    if supplier_id:
        query = query.filter(Product.supplier_id == supplier_id)
    if min_stock is not None:
        query = query.filter(Product.current_stock >= min_stock)
    
    products = query.offset(skip).limit(limit).all()
    return products


@router.get("/search", response_model=List[ProductSchema])
def search_products(
    q: str = Query(..., min_length=1, description="Término de búsqueda"),
    db: Session = Depends(get_db)
):
    """
    Buscar productos por nombre, descripción o SKU
    """
    query = db.query(Product)
    query = search_query(query, Product, q, ["name", "description", "sku"])
    products = query.all()
    return products


@router.get("/low-stock", response_model=List[ProductSchema])
def get_low_stock_products(db: Session = Depends(get_db)):
    """
    Obtener productos con stock por debajo del nivel mínimo
    """
    products = db.query(Product).filter(
        Product.current_stock <= Product.min_stock_level
    ).all()
    return products


@router.get("/{product_id}", response_model=ProductSchema)
def get_product(product_id: int, db: Session = Depends(get_db)):
    """
    Obtener un producto por ID
    """
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Producto con ID {product_id} no encontrado"
        )
    return product


@router.post("/", response_model=ProductSchema, status_code=status.HTTP_201_CREATED)
def create_product(product: ProductCreate, db: Session = Depends(get_db)):
    """
    Crear un nuevo producto
    """
    # Verificar que la categoría existe
    category = db.query(Category).filter(Category.id == product.category_id).first()
    if not category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Categoría con ID {product.category_id} no encontrada"
        )
    
    # Verificar que el proveedor existe
    supplier = db.query(Supplier).filter(Supplier.id == product.supplier_id).first()
    if not supplier:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Proveedor con ID {product.supplier_id} no encontrado"
        )
    
    # Verificar SKU único
    existing = db.query(Product).filter(Product.sku == product.sku).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Ya existe un producto con el SKU '{product.sku}'"
        )
    
    db_product = Product(**product.model_dump())
    db.add(db_product)
    db.commit()
    db.refresh(db_product)
    return db_product


@router.put("/{product_id}", response_model=ProductSchema)
def update_product(product_id: int, product: ProductUpdate, db: Session = Depends(get_db)):
    """
    Actualizar un producto existente
    """
    db_product = db.query(Product).filter(Product.id == product_id).first()
    if not db_product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Producto con ID {product_id} no encontrado"
        )
    
    # Verificar categoría si se está actualizando
    if product.category_id:
        category = db.query(Category).filter(Category.id == product.category_id).first()
        if not category:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Categoría con ID {product.category_id} no encontrada"
            )
    
    # Verificar proveedor si se está actualizando
    if product.supplier_id:
        supplier = db.query(Supplier).filter(Supplier.id == product.supplier_id).first()
        if not supplier:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Proveedor con ID {product.supplier_id} no encontrado"
            )
    
    # Verificar SKU único si se está actualizando
    if product.sku and product.sku != db_product.sku:
        existing = db.query(Product).filter(Product.sku == product.sku).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Ya existe un producto con el SKU '{product.sku}'"
            )
    
    # Actualizar campos
    update_data = product.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_product, field, value)
    
    db.commit()
    db.refresh(db_product)
    return db_product


@router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_product(product_id: int, db: Session = Depends(get_db)):
    """
    Eliminar un producto
    """
    db_product = db.query(Product).filter(Product.id == product_id).first()
    if not db_product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Producto con ID {product_id} no encontrado"
        )
    
    db.delete(db_product)
    db.commit()
    return None

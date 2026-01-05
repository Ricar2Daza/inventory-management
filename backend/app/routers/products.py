from fastapi import APIRouter, Depends, HTTPException, status, Query, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_
from typing import List, Optional
from fastapi.responses import Response

from app.database import get_async_db
from app.models.inventory import Product, Category, Supplier
from app.schemas.inventory import Product as ProductSchema, ProductCreate, ProductUpdate
from app.services.product_service import ProductService
from app.auth import get_current_active_user, require_role
from app.models.user import User

from sqlalchemy.orm import joinedload

router = APIRouter(
    prefix="/products",
    tags=["products"]
)

@router.get("/", response_model=List[ProductSchema])
async def get_products(
    skip: int = 0,
    limit: int = 100,
    category_id: Optional[int] = Query(None, description="Filtrar por categoría"),
    supplier_id: Optional[int] = Query(None, description="Filtrar por proveedor"),
    min_stock: Optional[int] = Query(None, description="Stock mínimo"),
    db: AsyncSession = Depends(get_async_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Obtener lista de productos con filtros opcionales (Async)
    """
    query = select(Product).options(
        joinedload(Product.category),
        joinedload(Product.supplier)
    )
    
    if category_id:
        query = query.filter(Product.category_id == category_id)
    if supplier_id:
        query = query.filter(Product.supplier_id == supplier_id)
    if min_stock is not None:
        query = query.filter(Product.current_stock >= min_stock)
    
    query = query.offset(skip).limit(limit)
    result = await db.execute(query)
    return result.scalars().all()


@router.get("/search", response_model=List[ProductSchema])
async def search_products(
    q: str = Query(..., min_length=1, description="Término de búsqueda"),
    db: AsyncSession = Depends(get_async_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Buscar productos por nombre, descripción o SKU (Async)
    """
    filters = []
    for field in ["name", "description", "sku"]:
        filters.append(getattr(Product, field).ilike(f"%{q}%"))
    
    query = select(Product).options(
        joinedload(Product.category),
        joinedload(Product.supplier)
    ).filter(or_(*filters))
    result = await db.execute(query)
    return result.scalars().all()

@router.get("/low-stock", response_model=List[ProductSchema])
async def get_low_stock_products(
    db: AsyncSession = Depends(get_async_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Obtener productos con stock por debajo del nivel mínimo (Async)
    """
    query = select(Product).options(
        joinedload(Product.category),
        joinedload(Product.supplier)
    ).filter(Product.current_stock <= Product.min_stock_level)
    result = await db.execute(query)
    return result.scalars().all()


@router.get("/{product_id}", response_model=ProductSchema)
async def get_product(
    product_id: int, 
    db: AsyncSession = Depends(get_async_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Obtener un producto por ID (Async)
    """
    result = await db.execute(
        select(Product).options(
            joinedload(Product.category),
            joinedload(Product.supplier)
        ).filter(Product.id == product_id)
    )
    product = result.scalars().first()
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Producto con ID {product_id} no encontrado"
        )
    return product


@router.post("/", response_model=ProductSchema, status_code=status.HTTP_201_CREATED)
async def create_product(
    product: ProductCreate, 
    db: AsyncSession = Depends(get_async_db),
    current_user: User = Depends(require_role("admin"))
):
    """
    Crear un nuevo producto (Async) - Requiere rol Admin
    """
    # Verificar que la categoría existe
    result = await db.execute(select(Category).filter(Category.id == product.category_id))
    category = result.scalars().first()
    if not category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Categoría con ID {product.category_id} no encontrada"
        )
    
    # Verificar que el proveedor existe
    result = await db.execute(select(Supplier).filter(Supplier.id == product.supplier_id))
    supplier = result.scalars().first()
    if not supplier:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Proveedor con ID {product.supplier_id} no encontrado"
        )

    new_product = Product(**product.dict())
    db.add(new_product)
    await db.commit()
    await db.refresh(new_product)
    
    # Reload with relationships for schema response
    # Re-fetch to ensure joinedload works for response model
    result = await db.execute(
        select(Product).options(
            joinedload(Product.category),
            joinedload(Product.supplier)
        ).filter(Product.id == new_product.id)
    )
    return result.scalars().first()


@router.put("/{product_id}", response_model=ProductSchema)
async def update_product(
    product_id: int, 
    product_update: ProductUpdate, 
    db: AsyncSession = Depends(get_async_db),
    current_user: User = Depends(require_role("admin"))
):
    """
    Actualizar un producto existente (Async) - Requiere rol Admin
    """
    result = await db.execute(select(Product).filter(Product.id == product_id))
    product = result.scalars().first()
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Producto con ID {product_id} no encontrado"
        )
    
    update_data = product_update.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(product, key, value)
    
    await db.commit()
    await db.refresh(product)
    return product


@router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_product(
    product_id: int, 
    db: AsyncSession = Depends(get_async_db),
    current_user: User = Depends(require_role("admin"))
):
    """
    Eliminar un producto (Async) - Requiere rol Admin
    """
    result = await db.execute(select(Product).filter(Product.id == product_id))
    product = result.scalars().first()
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Producto con ID {product_id} no encontrado"
        )
    
    await db.delete(product)
    await db.commit()
    return None

@router.post("/import/csv")
async def import_products_csv(
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_async_db),
    current_user: User = Depends(require_role("admin"))
):
    """
    Importar productos desde CSV masivamente (Async) - Requiere rol Admin
    """
    return await ProductService.import_from_csv(file, db)

@router.get("/{product_id}/label")
async def get_product_label(
    product_id: int,
    db: AsyncSession = Depends(get_async_db)
):
    """
    Generar etiqueta PDF para un producto (Async)
    """
    pdf_bytes, filename = await ProductService.generate_label_pdf(product_id, db)
    
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f"attachment; filename=label_{filename}.pdf"
        }
    )

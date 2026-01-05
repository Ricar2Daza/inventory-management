from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
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
    
    try:
        db.delete(db_product)
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No se puede eliminar el producto porque tiene movimientos o ventas asociadas."
        )
    return None


# --- NUEVAS FUNCIONALIDADES ---
from fastapi import UploadFile, File
from fastapi.responses import Response
import csv
import io
import qrcode
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
import tempfile
import os

@router.post("/import", status_code=status.HTTP_200_OK)
async def import_products(
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """
    Importar productos masivamente desde un CSV.
    Columnas esperadas: sku, nombre, precio, cantidad_actual, alerta_stock_bajo, categoria, proveedor
    """
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="El archivo debe ser un CSV")

    content = await file.read()
    decoded = content.decode('utf-8-sig') # utf-8-sig para manejar BOM de Excel
    csv_reader = csv.DictReader(io.StringIO(decoded), delimiter=',')  # Asumimos coma, podría ser ;

    # Normalizar headers (lower strip)
    if csv_reader.fieldnames:
        csv_reader.fieldnames = [h.lower().strip() for h in csv_reader.fieldnames]

    report = {"created": 0, "errors": []}

    for row in csv_reader:
        try:
            # Mapeo flexible para soportar headers en Inglés y Español
            sku = (row.get("sku") or "").strip()
            name = (row.get("name") or row.get("nombre") or "").strip()
            price_str = (row.get("unit_price") or row.get("precio") or row.get("price") or "0")
            stock_str = (row.get("current_stock") or row.get("cantidad_actual") or row.get("stock") or "0")
            min_str = (row.get("min_stock_level") or row.get("alerta_stock_bajo") or row.get("min_stock") or "5")
            cat_name = (row.get("category_name") or row.get("categoria") or row.get("category") or "").strip()
            sup_name = (row.get("supplier_name") or row.get("proveedor") or row.get("supplier") or "").strip()

            if not sku or not name:
                report["errors"].append(f"Fila incompleta (Falta SKU o Nombre): {row}")
                continue

            # Verificar existencia SKU
            exists = db.query(Product).filter(Product.sku == sku).first()
            if exists:
                report["errors"].append(f"SKU {sku} ya existe. Omitido.")
                continue

            # Resolver Categoría (Crear si no existe o usar default)
            category = None
            if cat_name:
                category = db.query(Category).filter(Category.name == cat_name).first()
                if not category:
                    category = Category(name=cat_name, description="Importada automáticamente")
                    db.add(category)
                    db.commit()
                    db.refresh(category)
            else:
                # Usar primera categoría o default
                category = db.query(Category).first()
                if not category:
                    # Crear una default si no existe nada
                    category = Category(name="General", description="Categoría por defecto")
                    db.add(category)
                    db.commit()
                    db.refresh(category)

            # Resolver Proveedor
            supplier = None
            if sup_name:
                supplier = db.query(Supplier).filter(Supplier.name == sup_name).first()
                if not supplier:
                    supplier = Supplier(name=sup_name, email="importado@system.com", phone="-")
                    db.add(supplier)
                    db.commit()
                    db.refresh(supplier)
            else:
                supplier = db.query(Supplier).first()
                if not supplier:
                    supplier = Supplier(name="Proveedor General", email="-", phone="-")
                    db.add(supplier)
                    db.commit()
                    db.refresh(supplier)

            # Crear Producto
            new_prod = Product(
                sku=sku,
                name=name,
                unit_price=float(price_str),
                current_stock=int(stock_str),
                min_stock_level=int(min_str),
                category_id=category.id,
                supplier_id=supplier.id
            )
            db.add(new_prod)
            db.commit()
            report["created"] += 1

        except Exception as e:
            db.rollback()
            report["errors"].append(f"Error procesando {row.get('sku', '?')}: {str(e)}")

    return report


@router.get("/{product_id}/label")
def generate_product_label(product_id: int, db: Session = Depends(get_db)):
    """
    Generar etiqueta PDF (Ticket) para un producto con código QR
    """
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Producto no encontrado")

    # Crear PDF en memoria
    buffer = io.BytesIO()
    
    # Tamaño Ticket (Ej: 80mm x 50mm)
    w_mm = 80
    h_mm = 50
    p_width = w_mm * mm
    p_height = h_mm * mm
    
    c = canvas.Canvas(buffer, pagesize=(p_width, p_height))
    
    # Generar QR
    qr = qrcode.QRCode(box_size=10, border=1)
    qr_data = f"{product.sku}" # Solo SKU para simpleza, o URL
    qr.add_data(qr_data)
    qr.make(fit=True)
    img_qr = qr.make_image(fill_color="black", back_color="white")
    
    # Guardar QR temporalmente para pintarlo
    with tempfile.NamedTemporaryFile(delete=False, suffix=".png") as tmp:
        img_qr.save(tmp.name)
        tmp_path = tmp.name

    try:
        # Dibujar Interfaz
        c.drawImage(tmp_path, 2 * mm, 10 * mm, width=30*mm, height=30*mm)
        
        c.setFont("Helvetica-Bold", 12)
        c.drawString(35 * mm, 40 * mm, f"{product.sku}")
        
        c.setFont("Helvetica", 10)
        # Wrap de nombre si es muy largo (simple truncado para v1)
        name_display = product.name[:15] + "..." if len(product.name) > 15 else product.name
        c.drawString(35 * mm, 35 * mm, name_display)
        
        c.setFont("Helvetica-Bold", 14)
        c.drawString(35 * mm, 25 * mm, f"${product.unit_price}")
        
        c.setFont("Helvetica", 8)
        c.drawString(35 * mm, 15 * mm, f"Cat: {product.category.name if product.category else '-'}")
        
        c.drawString(2 * mm, 5 * mm, "Sistema de Octava Capa")
        
        c.showPage()
        c.save()
    finally:
        if os.path.exists(tmp_path):
            os.remove(tmp_path)

    buffer.seek(0)
    return Response(content=buffer.getvalue(), media_type="application/pdf", headers={"Content-Disposition": f"attachment; filename=label_{product.sku}.pdf"})


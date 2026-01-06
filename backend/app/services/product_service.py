import csv
import io
import os
import tempfile
import qrcode
from fastapi import UploadFile, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from app.models.inventory import Product, Category, Supplier

class ProductService:
    @staticmethod
    async def import_from_csv(file: UploadFile, db: AsyncSession):
        if not file.filename.endswith('.csv'):
            raise HTTPException(status_code=400, detail="El archivo debe ser un CSV")

        content = await file.read()
        decoded = content.decode('utf-8-sig')
        csv_reader = csv.DictReader(io.StringIO(decoded), delimiter=',')

        if csv_reader.fieldnames:
            csv_reader.fieldnames = [h.lower().strip() for h in csv_reader.fieldnames]

        report = {"created": 0, "errors": []}

        for row in csv_reader:
            try:
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

                # Check if exists
                result = await db.execute(select(Product).filter(Product.sku == sku))
                exists = result.scalars().first()
                if exists:
                    report["errors"].append(f"SKU {sku} ya existe. Omitido.")
                    continue

                # Resolve Category
                category = None
                if cat_name:
                    result = await db.execute(select(Category).filter(Category.name == cat_name))
                    category = result.scalars().first()
                    if not category:
                        category = Category(name=cat_name, description="Importada automáticamente")
                        db.add(category)
                        await db.commit()
                        await db.refresh(category)
                else:
                    result = await db.execute(select(Category))
                    category = result.scalars().first()
                    if not category:
                        category = Category(name="General", description="Categoría por defecto")
                        db.add(category)
                        await db.commit()
                        await db.refresh(category)

                # Resolve Supplier
                supplier = None
                if sup_name:
                    result = await db.execute(select(Supplier).filter(Supplier.name == sup_name))
                    supplier = result.scalars().first()
                    if not supplier:
                        supplier = Supplier(name=sup_name, email="importado@system.com", phone="-")
                        db.add(supplier)
                        await db.commit()
                        await db.refresh(supplier)
                else:
                    result = await db.execute(select(Supplier))
                    supplier = result.scalars().first()
                    if not supplier:
                        supplier = Supplier(name="Proveedor General", email="-", phone="-")
                        db.add(supplier)
                        await db.commit()
                        await db.refresh(supplier)

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
                await db.commit()
                report["created"] += 1

            except Exception as e:
                await db.rollback()
                report["errors"].append(f"Error procesando {row.get('sku', '?')}: {str(e)}")

        return report

    @staticmethod
    async def generate_label_pdf(product_id: int, db: AsyncSession):
        from sqlalchemy.orm import selectinload
        result = await db.execute(
            select(Product)
            .options(selectinload(Product.category))
            .filter(Product.id == product_id)
        )
        product = result.scalars().first()
        
        if not product:
            raise HTTPException(status_code=404, detail="Producto no encontrado")

        buffer = io.BytesIO()
        w_mm = 80
        h_mm = 50
        p_width = w_mm * mm
        p_height = h_mm * mm
        
        c = canvas.Canvas(buffer, pagesize=(p_width, p_height))
        
        qr = qrcode.QRCode(box_size=10, border=1)
        qr_data = f"{product.sku}"
        qr.add_data(qr_data)
        qr.make(fit=True)
        img_qr = qr.make_image(fill_color="black", back_color="white")
        
        with tempfile.NamedTemporaryFile(delete=False, suffix=".png") as tmp:
            img_qr.save(tmp.name)
            tmp_path = tmp.name

        try:
            c.drawImage(tmp_path, 2 * mm, 10 * mm, width=30*mm, height=30*mm)
            
            c.setFont("Helvetica-Bold", 12)
            c.drawString(35 * mm, 40 * mm, f"{product.sku}")
            
            c.setFont("Helvetica", 10)
            name_display = product.name[:15] + "..." if len(product.name) > 15 else product.name
            c.drawString(35 * mm, 35 * mm, name_display)
            
            c.setFont("Helvetica-Bold", 14)
            c.drawString(35 * mm, 25 * mm, f"${product.unit_price}")
            
            c.setFont("Helvetica", 8)
            cat_name = product.category.name if product.category else '-'
            c.drawString(35 * mm, 15 * mm, f"Cat: {cat_name}")
            
            c.drawString(2 * mm, 5 * mm, "Sistema de Octava Capa")
            
            c.showPage()
            c.save()
        finally:
            if os.path.exists(tmp_path):
                os.remove(tmp_path)

        buffer.seek(0)
        return buffer.getvalue(), product.sku

import pytest
from fastapi import status
from app.models.inventory import Product, Category, Supplier, StockMovement, MovementType
from app.routers.reports import get_low_stock_report

def test_low_stock_report(client, admin_headers, db_session):
    # Setup Data
    category = Category(name="ReportCat", description="For reports")
    supplier = Supplier(name="ReportSup")
    db_session.add(category)
    db_session.add(supplier)
    db_session.commit()
    
    # Create products
    p1 = Product(
        name="LowStockItem",
        sku="LOW-001",
        category_id=category.id,
        supplier_id=supplier.id,
        unit_price=10.0,
        current_stock=5,
        min_stock_level=10
    )
    p2 = Product(
        name="NormalStockItem",
        sku="NORM-001",
        category_id=category.id,
        supplier_id=supplier.id,
        unit_price=20.0,
        current_stock=20,
        min_stock_level=10
    )
    db_session.add(p1)
    db_session.add(p2)
    db_session.commit()
    
    # Test Report Endpoint
    response = client.get("/reports/low-stock", headers=admin_headers)
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    
    # Verify content
    assert data["total_products"] == 1
    assert data["products"][0]["sku"] == "LOW-001"
    assert data["products"][0]["category_name"] == "ReportCat"
    assert data["products"][0]["supplier_name"] == "ReportSup"

def test_inventory_summary(client, admin_headers, db_session):
    response = client.get("/reports/inventory-summary", headers=admin_headers)
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert "total_products" in data
    assert "total_stock_value" in data

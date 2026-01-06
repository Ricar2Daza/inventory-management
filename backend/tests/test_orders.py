import pytest
from fastapi import status
from app.models.inventory import Category, Supplier, Product, Client, Order
from app.models.user import User

def test_create_order_flow(client, admin_headers, db_session):
    # Setup Data
    category = Category(name="Food", description="Edible")
    supplier = Supplier(name="Supplier1")
    client_obj = Client(name="Customer1", email="c@test.com")
    db_session.add(category)
    db_session.add(supplier)
    db_session.add(client_obj)
    db_session.commit()
    
    product = Product(
        name="Burger",
        sku="BURGER-01",
        category_id=category.id,
        supplier_id=supplier.id,
        unit_price=10.0,
        current_stock=100,
        min_stock_level=10
    )
    db_session.add(product)
    db_session.commit()
    
    # Create Order
    order_data = {
        "client_id": client_obj.id,
        "payment_method": "efectivo",
        "items": [
            {"product_id": product.id, "quantity": 2}
        ]
    }
    
    # Call with headers
    response = client.post("/orders/", json=order_data, headers=admin_headers)
    assert response.status_code == status.HTTP_201_CREATED
    data = response.json()
    assert data["total_amount"] == 20.0
    assert len(data["items"]) == 1
    # Verify the property 'product_name' was correctly populated via pydantic/model property
    assert data["items"][0]["product_name"] == "Burger"
    
    # Verify Stock Deduction
    db_session.refresh(product)
    assert product.current_stock == 98
    
    # Verify Get Orders (History)
    response = client.get("/orders/", headers=admin_headers)
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert len(data) >= 1
    assert data[0]["items"][0]["product_name"] == "Burger"

def test_create_order_no_stock(client, admin_headers, db_session):
    # Setup
    category = Category(name="Food2", description="Edible")
    supplier = Supplier(name="Supplier2")
    db_session.add(category)
    db_session.add(supplier)
    db_session.commit()
    
    product = Product(
        name="Pizza",
        sku="PIZZA-01",
        category_id=category.id,
        supplier_id=supplier.id,
        unit_price=15.0,
        current_stock=1, # Low stock
        min_stock_level=10
    )
    db_session.add(product)
    db_session.commit()
    
    order_data = {
        "payment_method": "efectivo",
        "items": [
            {"product_id": product.id, "quantity": 2} # Request more than stock
        ]
    }
    
    response = client.post("/orders/", json=order_data, headers=admin_headers)
    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert "Stock insuficiente" in response.json()["detail"]

def test_create_order_no_auth(client, db_session):
    # Try to create order without headers
    order_data = {
        "payment_method": "efectivo",
        "items": []
    }
    response = client.post("/orders/", json=order_data)
    assert response.status_code == status.HTTP_401_UNAUTHORIZED

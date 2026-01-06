import pytest
from fastapi import status

def test_create_client_as_admin(client, admin_headers):
    data = {
        "name": "Test Client",
        "email": "client@test.com",
        "phone": "1234567890",
        "identification": "ID123",
        "address": "Test Address"
    }
    response = client.post("/clients/", json=data, headers=admin_headers)
    assert response.status_code == status.HTTP_201_CREATED
    assert response.json()["name"] == "Test Client"

def test_create_client_unauthorized(client):
    data = {"name": "Test Client"}
    response = client.post("/clients/", json=data)
    assert response.status_code == status.HTTP_401_UNAUTHORIZED

def test_get_clients(client, auth_headers):
    response = client.get("/clients/", headers=auth_headers)
    assert response.status_code == status.HTTP_200_OK

def test_create_supplier_as_admin(client, admin_headers):
    data = {
        "name": "Test Supplier",
        "email": "supplier@test.com",
        "contact_name": "Contact",
        "phone": "0987654321",
        "address": "Supplier Address"
    }
    response = client.post("/suppliers/", json=data, headers=admin_headers)
    assert response.status_code == status.HTTP_201_CREATED
    assert response.json()["name"] == "Test Supplier"

def test_create_supplier_unauthorized(client):
    data = {"name": "Test Supplier"}
    response = client.post("/suppliers/", json=data)
    assert response.status_code == status.HTTP_401_UNAUTHORIZED

def test_delete_supplier_as_admin(client, admin_headers):
    # Create first
    data = {"name": "To Delete", "email": "del@test.com"}
    create_res = client.post("/suppliers/", json=data, headers=admin_headers)
    supplier_id = create_res.json()["id"]
    
    # Delete
    response = client.delete(f"/suppliers/{supplier_id}", headers=admin_headers)
    assert response.status_code == status.HTTP_204_NO_CONTENT

def test_delete_supplier_as_user(client, auth_headers, admin_headers):
    # Create as admin first
    data = {"name": "To Delete User", "email": "deluser@test.com"}
    create_res = client.post("/suppliers/", json=data, headers=admin_headers)
    supplier_id = create_res.json()["id"]
    
    # Try delete as normal user (should fail if require_role("admin"))
    response = client.delete(f"/suppliers/{supplier_id}", headers=auth_headers)
    assert response.status_code == status.HTTP_403_FORBIDDEN

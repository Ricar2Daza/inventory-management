import pytest
from fastapi import status


def test_register_user(client, admin_headers):
    """Test de registro de usuario (Requiere Admin)"""
    response = client.post(
        "/auth/register",
        json={
            "username": "newuser",
            "email": "newuser@example.com",
            "password": "password123",
            "full_name": "New User",
            "role": "employee"
        },
        headers=admin_headers
    )
    assert response.status_code == status.HTTP_201_CREATED
    data = response.json()
    assert data["username"] == "newuser"
    assert data["email"] == "newuser@example.com"
    assert "hashed_password" not in data


def test_register_duplicate_username(client, test_user, admin_headers):
    """Test de registro con username duplicado"""
    response = client.post(
        "/auth/register",
        json={
            "username": "testuser",
            "email": "another@example.com",
            "password": "password123"
        },
        headers=admin_headers
    )
    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert "ya está en uso" in response.json()["detail"]


def test_login_success(client, test_user):
    """Test de login exitoso"""
    response = client.post(
        "/auth/login",
        data={"username": "testuser", "password": "testpassword"}
    )
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"


def test_login_wrong_password(client, test_user):
    """Test de login con contraseña incorrecta"""
    response = client.post(
        "/auth/login",
        data={"username": "testuser", "password": "wrongpassword"}
    )
    assert response.status_code == status.HTTP_401_UNAUTHORIZED


def test_get_current_user(client, auth_headers):
    """Test de obtener usuario actual"""
    response = client.get("/auth/me", headers=auth_headers)
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["username"] == "testuser"
    assert data["email"] == "test@example.com"


def test_get_current_user_unauthorized(client):
    """Test de obtener usuario sin autenticación"""
    response = client.get("/auth/me")
    assert response.status_code == status.HTTP_401_UNAUTHORIZED


def test_list_users_as_admin(client, admin_headers, test_user):
    """Test de listar usuarios como admin"""
    response = client.get("/auth/users", headers=admin_headers)
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert len(data) >= 2  # admin + test_user


def test_list_users_as_employee(client, auth_headers):
    """Test de listar usuarios como employee (debe fallar)"""
    response = client.get("/auth/users", headers=auth_headers)
    assert response.status_code == status.HTTP_403_FORBIDDEN

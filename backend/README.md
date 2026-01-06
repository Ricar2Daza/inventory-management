# Sistema de Inventario - FastAPI Backend

Sistema completo de gestión de inventario con **FastAPI**, **SQLAlchemy ORM**, **JWT Authentication**, **Notificaciones Automáticas** y **Soporte Multi-Almacén**.

## 🚀 Inicio Rápido

### Requisitos Previos

- Python 3.8 o superior
- pip (gestor de paquetes de Python)

### Instalación

```bash
# Navegar al directorio del proyecto
cd c:\Users\Usuario\Desktop\test

# Instalar dependencias
python -m pip install -r requirements.txt

# Iniciar el servidor
python -m uvicorn app.main:app --reload
```

El servidor estará disponible en: **http://127.0.0.1:8000**

### Documentación Interactiva

- **Swagger UI**: http://127.0.0.1:8000/docs
- **ReDoc**: http://127.0.0.1:8000/redoc

## ✨ Funcionalidades

### 🔐 Autenticación JWT
- Sistema completo de usuarios con roles (admin, manager, employee)
- Registro y login con tokens JWT
- Control de acceso basado en roles
- Gestión de usuarios y cambio de contraseña

### 📊 Gestión de Inventario
- **Categorías**: Organización de productos
- **Proveedores**: Gestión de proveedores
- **Productos**: CRUD completo con SKU, precios, stock
- **Movimientos de Stock**: Registro de entradas/salidas con actualización automática

### 🔍 Búsqueda Avanzada
- Búsqueda de texto completo en productos (nombre, descripción, SKU)
- Búsqueda de texto completo en proveedores (nombre, contacto, email)
- Búsqueda case-insensitive

### 📈 Sistema de Reportes (7 tipos)
1. **Resumen de Inventario**: Totales y estadísticas generales
2. **Valor del Stock**: Valor total y promedio
3. **Productos con Stock Bajo**: Lista detallada
4. **Resumen de Movimientos**: Por período configurable
5. **Productos Más Movidos**: Ranking de actividad
6. **Inventario por Categoría**: Agrupado y totalizado
7. **Inventario por Proveedor**: Agrupado y totalizado

### 🔔 Notificaciones Automáticas
- Alertas automáticas de stock bajo
- Alertas de productos agotados
- Preferencias personalizables por usuario
- Contador de notificaciones no leídas

### 🏢 Soporte Multi-Almacén
- Gestión de múltiples almacenes
- Stock independiente por almacén
- Transferencias entre almacenes
- Inventario por ubicación

### 📄 Paginación Avanzada
- Parámetros: skip, limit, sort_by, order
- Metadata en respuestas (total, page, pages)
- Ordenamiento dinámico

## 📁 Estructura del Proyecto

```
test/
├── app/
│   ├── main.py                    # Aplicación principal
│   ├── database.py                # Configuración BD
│   ├── auth.py                    # Utilidades JWT
│   ├── models/                    # Modelos SQLAlchemy
│   │   ├── inventory.py
│   │   ├── user.py
│   │   ├── notification.py
│   │   └── warehouse.py
│   ├── schemas/                   # Schemas Pydantic
│   │   ├── inventory.py
│   │   ├── user.py
│   │   ├── notification.py
│   │   ├── warehouse.py
│   │   └── reports.py
│   ├── routers/                   # Endpoints API
│   │   ├── auth.py
│   │   ├── categories.py
│   │   ├── suppliers.py
│   │   ├── products.py
│   │   ├── stock_movements.py
│   │   ├── reports.py
│   │   ├── notifications.py
│   │   └── warehouses.py
│   └── utils/                     # Utilidades
│       ├── pagination.py
│       ├── search.py
│       └── notifications.py
├── tests/                         # Tests unitarios
│   ├── conftest.py
│   └── test_auth.py
├── requirements.txt
├── .env
└── README.md
```

## 🔌 API Endpoints

### Autenticación (`/auth`)
- `POST /auth/register` - Registrar usuario
- `POST /auth/login` - Login (OAuth2)
- `GET /auth/me` - Usuario actual
- `PUT /auth/me` - Actualizar perfil
- `PUT /auth/me/password` - Cambiar contraseña
- `GET /auth/users` - Listar usuarios (admin)

### Categorías (`/categories`)
- `GET /categories/` - Listar
- `POST /categories/` - Crear
- `PUT /categories/{id}` - Actualizar
- `DELETE /categories/{id}` - Eliminar

### Proveedores (`/suppliers`)
- `GET /suppliers/` - Listar
- `GET /suppliers/search?q=` - Buscar
- `POST /suppliers/` - Crear
- `PUT /suppliers/{id}` - Actualizar
- `DELETE /suppliers/{id}` - Eliminar

### Productos (`/products`)
- `GET /products/` - Listar (con filtros)
- `GET /products/search?q=` - Buscar
- `GET /products/low-stock` - Stock bajo
- `POST /products/` - Crear
- `PUT /products/{id}` - Actualizar
- `DELETE /products/{id}` - Eliminar

### Movimientos (`/stock-movements`)
- `GET /stock-movements/` - Listar
- `GET /stock-movements/product/{id}` - Por producto
- `POST /stock-movements/` - Registrar (actualiza stock automáticamente)

### Reportes (`/reports`)
- `GET /reports/inventory-summary` - Resumen general
- `GET /reports/stock-value` - Valor del inventario
- `GET /reports/low-stock` - Productos con stock bajo
- `GET /reports/movements?days=30` - Movimientos por período
- `GET /reports/top-products?limit=10` - Productos más movidos
- `GET /reports/by-category` - Por categoría
- `GET /reports/by-supplier` - Por proveedor

### Notificaciones (`/notifications`)
- `GET /notifications/` - Listar notificaciones
- `GET /notifications/unread-count` - Contador no leídas
- `PUT /notifications/{id}/read` - Marcar como leída
- `PUT /notifications/mark-all-read` - Marcar todas
- `GET /notifications/preferences/me` - Ver preferencias
- `PUT /notifications/preferences/me` - Actualizar preferencias

### Almacenes (`/warehouses`)
- `GET /warehouses/` - Listar almacenes
- `POST /warehouses/` - Crear almacén
- `GET /warehouses/{id}/inventory` - Ver inventario
- `POST /warehouses/inventory` - Asignar producto a almacén
- `POST /warehouses/transfer` - Transferir entre almacenes

## 🎯 Guía de Uso

### 1. Autenticación

```bash
# Registrar usuario administrador
curl -X POST "http://localhost:8000/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "email": "admin@example.com",
    "password": "admin123",
    "role": "admin"
  }'

# Login
curl -X POST "http://localhost:8000/auth/login" \
  -d "username=admin&password=admin123"

# Respuesta: {"access_token": "eyJ...", "token_type": "bearer"}
```

### 2. Usar en Swagger UI

1. Abre http://localhost:8000/docs
2. Haz clic en **"Authorize"** (candado verde)
3. Ingresa: `Bearer <tu_token>`
4. Ahora puedes usar todos los endpoints

### 3. Crear Datos Iniciales

```bash
# Crear categoría
curl -X POST "http://localhost:8000/categories/" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"name": "Electrónica", "description": "Productos electrónicos"}'

# Crear proveedor
curl -X POST "http://localhost:8000/suppliers/" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"name": "Tech Supply", "email": "info@tech.com"}'

# Crear producto
curl -X POST "http://localhost:8000/products/" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Laptop Dell XPS 15",
    "sku": "LAP-DELL-001",
    "category_id": 1,
    "supplier_id": 1,
    "unit_price": 1500.00,
    "current_stock": 10,
    "min_stock_level": 5
  }'
```

### 4. Registrar Movimientos

```bash
# Entrada de stock
curl -X POST "http://localhost:8000/stock-movements/" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "product_id": 1,
    "movement_type": "entrada",
    "quantity": 20,
    "reason": "Compra mensual"
  }'
```

## 🧪 Tests

```bash
# Ejecutar tests
pytest tests/ -v

# Con cobertura
pytest tests/ -v --cov=app
```

## 🔄 Migraciones de Base de Datos (Alembic)

El proyecto usa Alembic para gestionar migraciones de la base de datos.

### Primera vez - Crear migración inicial

```bash
cd backend
# Crear migración inicial (solo la primera vez)
alembic revision --autogenerate -m "Initial migration"

# Aplicar migraciones
alembic upgrade head
```

### Comandos comunes

```bash
# Crear nueva migración automática
alembic revision --autogenerate -m "Descripción del cambio"

# Aplicar todas las migraciones pendientes
alembic upgrade head

# Revertir última migración
alembic downgrade -1

# Ver estado de migraciones
alembic current

# Ver historial de migraciones
alembic history
```

**Nota**: Antes de crear la primera migración, asegúrate de que todos los modelos estén importados en `alembic/env.py`.

## 📦 Dependencias

- **fastapi** - Framework web
- **uvicorn[standard]** - Servidor ASGI
- **sqlalchemy** - ORM
- **pydantic** - Validación
- **python-jose[cryptography]** - JWT
- **passlib[bcrypt]** - Hash de contraseñas
- **python-multipart** - Form data
- **email-validator** - Validación de emails
- **pytest** - Testing
- **httpx** - Cliente HTTP para tests

## ⚙️ Configuración

Edita el archivo `.env` para configurar:

```env
DATABASE_URL=sqlite:///./inventory.db
SECRET_KEY=tu_clave_secreta_super_segura_cambiala_en_produccion
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
ENVIRONMENT=development
```

### Sistema de Logging

El sistema genera logs en la carpeta `logs/` con rotación automática:
- **Archivo**: `logs/app.log` (máximo 10 MB, mantiene 5 archivos de respaldo)
- **Consola**: Logs también se muestran en la consola
- **Niveles**: 
  - Development: DEBUG
  - Production: INFO
- Los logs se registran automáticamente para operaciones críticas (autenticación, órdenes, movimientos de stock)

### Cambiar a PostgreSQL o MySQL

```env
# PostgreSQL
DATABASE_URL=postgresql://usuario:contraseña@localhost/inventario

# MySQL
DATABASE_URL=mysql://usuario:contraseña@localhost/inventario
```

## 🔒 Seguridad

- ✅ Autenticación JWT con tokens
- ✅ Contraseñas hasheadas con bcrypt
- ✅ Control de acceso basado en roles
- ✅ Tokens con expiración configurable
- ✅ Validación de datos con Pydantic

## 🎯 Características Destacadas

- **Automatización**: Notificaciones automáticas de stock bajo
- **Multi-almacén**: Gestión de inventario en múltiples ubicaciones
- **Reportes**: 7 tipos diferentes de reportes analíticos
- **Búsqueda**: Full-text search en productos y proveedores
- **Paginación**: Listados paginados con ordenamiento
- **Tests**: Suite de tests unitarios incluida

## 📚 Funcionalidades Implementadas

- [x] Autenticación y autorización (JWT)
- [x] Paginación avanzada
- [x] Búsqueda de texto completo
- [x] Reportes de inventario (7 tipos)
- [x] Notificaciones de stock bajo
- [x] Soporte para múltiples almacenes
- [x] Tests unitarios y de integración

## 📊 Estadísticas del Proyecto

- **60+ endpoints API**
- **9 modelos de base de datos**
- **9 routers**
- **7 tipos de reportes**
- **3 roles de usuario**

## 📞 Soporte

Para más información sobre FastAPI: https://fastapi.tiangolo.com/

## 📄 Licencia

Este proyecto es de código abierto y está disponible bajo la licencia MIT.

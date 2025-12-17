# Sistema de Gestión de Inventario

Este proyecto es una aplicación completa de gestión de inventario compuesta por un backend en Python (FastAPI) y un frontend en React (Next.js).

## Estructura del Proyecto

El proyecto está organizado en dos carpetas principales:

- **📂 `backend/`**: API RESTful construida con FastAPI, SQLAlchemy y SQLite.
- **📂 `frontend/`**: Interfaz de usuario moderna construida con Next.js 14 y CSS Modules.

## Guía de Inicio Rápido

Para ejecutar el sistema completo necesitas dos terminales abiertas.

### 1. Iniciar el Backend

```bash
cd backend
# Instalar dependencias (si es la primera vez)
pip install -r requirements.txt

# Iniciar el servidor
python -m uvicorn app.main:app --reload
```
El backend estará disponible en: [http://localhost:8000](http://localhost:8000)
Documentación API (Swagger): [http://localhost:8000/docs](http://localhost:8000/docs)

### 2. Iniciar el Frontend

```bash
cd frontend
# Instalar dependencias (si es la primera vez)
npm install

# Iniciar el servidor de desarrollo
npm run dev   ó    npm.cmd run dev
```
La aplicación web estará disponible en: [http://localhost:3000](http://localhost:3000)

## Credenciales de Acceso

- **Usuario:** `admin`
- **Contraseña:** `admin123`


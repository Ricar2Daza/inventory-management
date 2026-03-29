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

## 🚀 Roadmap y Futuras Funcionalidades

Este proyecto tiene una visión clara de crecimiento para convertirse en una solución SaaS completa. Estas son las características planeadas para futuras versiones que permitirán escalar el valor del producto:

### 🏪 Módulo POS (Punto de Venta)
*Interfaz optimizada para venta rápida en mostrador.*
- **Interfaz "Cajero"**: Diseño de alta visibilidad, teclas rápidas y soporte para pantallas táctiles.
- **Ticket Rápido**: Generación e impresión térmica de recibos al instante.
- **Arqueo de Caja**: Control de apertura y cierre de turno, conteo de efectivo y reporte de diferencias.

### 🏢 Multi-Sucursal y Multi-Almacén
*Gestión centralizada para negocios en expansión.*
- **Inventario Distribuido**: Control de stock independiente por cada ubicación física.
- **Transferencias**: Movimientos de mercancía entre almacenes con trazabilidad completa.
- **Reportes Comparativos**: Análisis de rendimiento "Sucursal A vs Sucursal B".

### ⚖️ Integraciones Fiscales y Contables
*Cumplimiento normativo y automatización administrativa.*
- **Facturación Electrónica**: Emisión de comprobantes fiscales válidos (según normativa local).
- **Exportación Contable**: Generación de archivos compatibles con software contable estándar.
- **Cálculo de Impuestos**: Gestión automática de IVA/Impuestos por producto y categoría.

### 🧠 Inteligencia Artificial Avanzada
*Asistente proactivo para la toma de decisiones.*
- **Alertas Inteligentes**: Detección de patrones anómalos (ej. "Este producto dejó de moverse repentinamente").
- **Sugerencias de Compra**: Recomendación automática de reabastecimiento basada en velocidad de ventas y tiempo de entrega del proveedor.
- **Reportes Automáticos**: Envío programado de resúmenes ejecutivos vía WhatsApp o Email a los gerentes.


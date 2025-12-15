# Sistema de Inventario - Frontend

Este es el frontend moderno desarrollado con **Next.js 14**, **Vanilla CSS Modules** y **Axios**.

## Requisitos Previos

- Node.js (v18 o superior)
- Backend FastAPI corriendo en `http://localhost:8000` (Ver instrucciones en `../backend/README.md`)

## Instalación

```bash
cd frontend
npm install
```

## Ejecución

Para iniciar el servidor de desarrollo:

```bash
npm run dev
```

La aplicación estará disponible en [http://localhost:3000](http://localhost:3000).

## Credenciales por Defecto (Desarrollo)

Si has ejecutado el script de seed del backend o creado el admin manualmente:

- **Usuario:** `admin`
- **Contraseña:** `admin123`

## Estructura del Proyecto

- `/src/app`: Páginas y rutas (App Router).
- `/src/components`: Componentes reutilizables (Sidebar, Header, etc.).
- `/src/services`: Configuración de API (Axios) y utilidades.
- `/src/context`: Estado global (AuthContext).

## Características

1.  **Dashboard**: Vista general con KPIs.
2.  **Productos**: CRUD completo con validaciones.
3.  **Inventario**: Registro de entradas y salidas de stock.
4.  **Reportes**: Análisis de stock y exportación a CSV.
5.  **Seguridad**: Protección de rutas y manejo de sesión JWT.

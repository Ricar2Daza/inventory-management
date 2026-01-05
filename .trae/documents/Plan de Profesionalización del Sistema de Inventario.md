# Lista de Implementaciones Necesarias para Profesionalización

Basado en el análisis, aquí está la lista concreta de implementaciones técnicas requeridas para llevar el sistema a un nivel profesional, priorizadas por necesidad crítica.

## 🔴 Prioridad Alta: Infraestructura y Estabilidad (Base)
Estas implementaciones son obligatorias para considerar el proyecto "profesional" y desplegable.

1.  **Dockerización del Entorno (DevOps)**
    *   `Implementación`: Crear `Dockerfile` para Backend y Frontend.
    *   `Implementación`: Configurar `docker-compose.yml` para orquestar BD, Backend y Frontend.
    *   *Por qué:* Garantiza que el sistema funcione idéntico en desarrollo y producción.

2.  **Seguridad y Configuración**
    *   `Implementación`: Migrar todas las credenciales y URLs a variables de entorno (`.env`).
    *   `Implementación`: Configurar CORS dinámico y seguro en FastAPI.
    *   `Implementación`: Asegurar que ningún endpoint crítico sea accesible sin validación de rol.

## 🟡 Prioridad Media: Arquitectura y Mantenibilidad
Mejoras necesarias para que el código sea escalable y mantenible a largo plazo.

3.  **Refactorización Backend (Patrón Servicio)**
    *   `Implementación`: Mover lógica de negocio de `routers/` a una nueva capa `services/`.
    *   `Implementación`: Migrar controladores a `async/await` para evitar bloqueos del servidor.

4.  **Optimización Frontend (React Query)**
    *   `Implementación`: Reemplazar `useEffect` manual por **TanStack Query** (manejo de caché y estados de carga).
    *   `Implementación`: Modularizar la página de Productos (separar Tabla, Formulario y Filtros en componentes aislados).

## 🟢 Prioridad Baja: Calidad y Testing
Para asegurar la fiabilidad a largo plazo.

5.  **Sistema de Testing**
    *   `Implementación`: Configurar `pytest` con fixtures para base de datos.
    *   `Implementación`: Crear tests unitarios para flujos críticos (Crear Pedido, Ajustar Stock).

## 📅 Propuesta de Inicio
Sugiero comenzar con la **Fase 1: Dockerización y Seguridad**, ya que sin esto el sistema es vulnerable y difícil de instalar.

¿Apruebas comenzar con estas implementaciones?
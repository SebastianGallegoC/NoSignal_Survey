# Arquitectura del Sistema: PWA Offline-First

## 1. Patrón Arquitectónico (Frontend)
- **Modular Architecture:** Separación estricta entre UI (Componentes), Lógica de Negocio (Hooks) y Acceso a Datos (Dexie/API).
- **Custom Hooks Pattern:** Toda la lógica de persistencia en Dexie y geolocalización debe encapsularse en hooks (ej: `useOfflineForm`, `useGPS`).
- **Single Source of Truth:** La base de datos IndexedDB (vía Dexie) es la fuente de verdad única mientras el formulario no haya sido confirmado por el servidor.

## 2. Flujo de Datos (Data Flow)
1. **Componente de Formulario:** Captura el input del usuario.
2. **Capa de Servicio Local:** Valida y guarda el objeto JSON + Blobs de imágenes en IndexedDB.
3. **Service Worker:** Monitorea el estado `onLine`. Al detectar red, activa el "Sync Manager".
4. **API Gateway (FastAPI):** Recibe la petición, valida el esquema con Pydantic y persiste en PostgreSQL.

## 3. Estructura de Carpetas Sugerida (Frontend)
- `/src/components`: Componentes atómicos de UI (Inputs, Buttons).
- `/src/hooks`: Lógica reutilizable (GPS, Offline Sync, Auth).
- `/src/services`: Configuración de Dexie.js y llamadas a la API (Axios/Fetch).
- `/src/store`: Estado global ligero para la sesión del usuario.
- `/public`: Service Worker y manifiesto de la PWA.

## 4. Backend (Layered Architecture)
- **Schemas:** Modelos de Pydantic para entrada/salida.
- **Routes:** Endpoints organizados por versión (ej: `/api/v1/forms`).
- **Services:** Lógica de negocio y manejo de archivos en disco.
- **Repository:** Consultas a la base de datos (SQLAlchemy o Tortoise ORM).
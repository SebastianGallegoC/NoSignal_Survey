# PERCENS

Aplicación PWA offline-first para diligenciar encuestas de visita con GPS, fotos, sincronización a API y descarga Excel basada en `PlantillaSurvey.xlsx`.

## Arquitectura

- `frontend/`: React + Vite + TypeScript + PWA + Dexie.
- `backend/`: FastAPI + SQLAlchemy async + Alembic.
- `db`: PostgreSQL/PostGIS.
- `traefik/`: proxy TLS y rutas para `percens.site` y `api.percens.site`.

## Producción

| Recurso | Valor |
|---------|-------|
| Frontend | `https://percens.site` |
| API | `https://api.percens.site` |
| BD | `nosignal_survey` |
| Contenedores | `nosignal-survey-*`, `percens-traefik` |
| Volúmenes | `nosignal_survey_db`, `nosignal_survey_uploads`, `percens_traefik_certs` |

## Formulario

La plantilla `PlantillaSurvey.xlsx` define 29 columnas visibles en Excel y una clave interna `id_formulario` que no se muestra al usuario ni se exporta. Ese ID se conserva en IndexedDB, API, base de datos, historial y precargas para editar y sincronizar sin duplicados.

Secciones:

- Coordenadas WGS84
- Tratamiento de datos
- Fecha de la visita
- Ubicación
- Encuestado
- Vivienda
- Validación
- Desplazamiento
- Encuestador

En la sección Encuestador del formulario solo se elige un perfil habilitado (`id_perfil_encuestador`). Los datos completos del encuestador (documento, firma, etc.) se gestionan en Inicio. La PWA guarda en IndexedDB un catálogo lite (`id` + nombre) de perfiles habilitados, sincronizado al iniciar sesión con internet y al recuperar conexión, para que el desplegable funcione sin red.

El único campo obligatorio para guardar/enviar es `nombres_apellidos_encuestado`.

## Excel

La plantilla debe estar disponible en:

- raíz del proyecto: `PlantillaSurvey.xlsx`
- frontend público: `frontend/public/templates/PLANTILLA.xlsx`

La descarga Excel escribe datos desde la fila 4 de la hoja `Plantilla`. La aplicación no implementa importación Excel.

## Configuración

Copiar `.env.example` a `.env` y reemplazar secretos:

```bash
cp .env.example .env
```

Variables clave:

- `VITE_API_URL=https://api.percens.site`
- `CORS_ORIGINS=https://percens.site`
- `ACME_EMAIL` (Let's Encrypt)
- `POSTGRES_PASSWORD`
- `JWT_SECRET`
- `NOSIGNAL_AUTH_USERS`

## Desarrollo local

El compose expone puertos locales para pruebas (sin Traefik):

- Frontend: `http://localhost:8081`
- Backend: `http://localhost:8001`
- Postgres: `localhost:5434`

```bash
docker compose build
docker compose up -d
```

Para ejecutar frontend fuera de Docker:

```bash
cd frontend
npm install
npm run dev
```

Para ejecutar backend fuera de Docker, usar `backend/.env.example` como base y apuntar `DATABASE_URL` a `localhost:5434`.

## Producción en VPS dedicado

1. Crear registros DNS A:
   - `percens.site` → IP pública del VPS
   - `api.percens.site` → IP pública del VPS
2. Configurar `.env` (ver arriba).
3. Levantar stack con Traefik:

```bash
docker compose --profile production build
docker compose --profile production up -d
docker compose exec backend python -m alembic upgrade head
```

4. Tras `git pull` que cambie código o migraciones Alembic, **reconstruir el backend**:

```bash
docker compose build backend
docker compose --profile production up -d backend
docker compose exec backend python -m alembic upgrade head
```

Detalle de Traefik y comprobaciones: `traefik/README.md`.

**Importante:** en producción PERCENS se sirve por dominio vía Traefik (`https://percens.site`), no por el puerto `8081` del host.

## Verificación

```bash
cd frontend
npm run typecheck
npm run test
npm run build
```

```bash
cd backend
pytest
```

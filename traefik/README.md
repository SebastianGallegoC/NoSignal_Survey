# Traefik y PERCENS (servidor dedicado)

En producción el tráfico entra así:

```
Internet → Traefik (:443, red percens-network) → nosignal-survey-frontend / nosignal-survey-backend
```

PERCENS incluye su propio Traefik en `docker-compose.yml` (perfil `production`). No depende de Huertas ni de otra instancia compartida.

## Dominios

| Servicio | URL |
|----------|-----|
| Frontend | `https://percens.site` |
| API | `https://api.percens.site` |

Configurá en `.env`:

- `VITE_API_URL=https://api.percens.site`
- `CORS_ORIGINS=https://percens.site`
- `ACME_EMAIL` (correo válido para Let's Encrypt)

Las rutas TLS están en `traefik/dynamic.yml`. Tras cambiar dominios, recreá Traefik:

```bash
docker compose --profile production up -d traefik
```

## Despliegue en el VPS

1. Registros DNS A apuntando a la IP del servidor:
   - `percens.site`
   - `api.percens.site`
2. Copiar `.env.example` → `.env` y completar secretos.
3. Levantar el stack con Traefik:

```bash
docker compose --profile production build
docker compose --profile production up -d
docker compose exec backend python -m alembic upgrade head
```

4. Abrí siempre por HTTPS: `https://percens.site` (el puerto 80 redirige a HTTPS).

Los puertos `8081` / `8001` en `127.0.0.1` son solo para depuración local en el servidor.

## Desarrollo local (sin Traefik)

```bash
docker compose build
docker compose up -d
```

- Frontend: `http://localhost:8081`
- Backend: `http://localhost:8001`

## Comprobación

```bash
docker network inspect percens-network --format '{{range .Containers}}{{.Name}} {{end}}'
```

Deben aparecer: `percens-traefik`, `nosignal-survey-frontend`, `nosignal-survey-backend`.

```bash
curl -sI https://percens.site | head -5
curl -s https://api.percens.site/health
```

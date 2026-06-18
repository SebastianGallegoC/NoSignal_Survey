# Backups (PostgreSQL + uploads)

Los datos en producción viven en **volúmenes Docker**:

| Volumen Compose | Contenido |
|-----------------|-----------|
| `nosignal_db` | Datos PostgreSQL/PostGIS (`nosignal`) |
| `nosignal_uploads` | Archivos subidos por el API (`/app/uploads` en el contenedor `backend`) |

Estos scripts asumen que ejecutás desde la **raíz del repositorio** (donde están `docker-compose.yml` y `.env`).

## Preparación

```bash
chmod +x scripts/backup-nosignal.sh scripts/backup-uploads.sh scripts/backup-automatic.sh scripts/prune-backup-retention.sh scripts/test-backup-retention.sh scripts/restore-db.sh
```

El archivo `.env` de la raíz debe definir al menos `POSTGRES_PASSWORD` (misma que usa el servicio `db`).

## Backup de la base de datos

```bash
sh scripts/backup-nosignal.sh
```

Genera `backups/db-nosignal-YYYYMMDD-HHMM.sql.gz` (por defecto).

- Usa `docker compose exec` contra el servicio **`db`**.
- El dump incluye `--clean --if-exists` para facilitar restauraciones completas (ver abajo).

Directorio de salida opcional:

```bash
BACKUP_DIR=/var/backups/nosignal sh scripts/backup-nosignal.sh
```

## Backup de subidas (fotos / archivos)

Requiere que el stack esté levantado y el servicio **`backend`** en ejecución:

```bash
sh scripts/backup-uploads.sh
```

Genera `backups/uploads-nosignal-YYYYMMDD-HHMM.tar.gz` empaquetando `/app/uploads`.

## Backup automático semanal + retención (domingo 12:00)

El script [`backup-automatic.sh`](backup-automatic.sh):

1. Ejecuta el backup de la base y el de uploads (los mismos scripts que arriba).
2. Llama a [`prune-backup-retention.sh`](prune-backup-retention.sh) para dejar como máximo **5** archivos de cada tipo (`db-nosignal-*.sql.gz` y `uploads-nosignal-*.tar.gz`); si hay más, **borra los más viejos** según fecha de modificación (`ls -t`).

Cantidad máxima configurable:

```bash
BACKUP_KEEP_LAST=5 sh scripts/backup-automatic.sh
```

**Cron (domingo a las 12:00, hora del servidor)** — reemplazá `/ruta/al/repo` por el directorio donde están `docker-compose.yml` y `.env`:

```cron
0 12 * * 0 cd /ruta/al/repo && BACKUP_KEEP_LAST=5 sh scripts/backup-automatic.sh >> /var/log/nosignal-backup.log 2>&1
```

Creá el log una vez: `sudo touch /var/log/nosignal-backup.log` y ajustá permisos si el usuario del cron no es root.

`cron` usa la **zona horaria del sistema** (`timedatectl`). Si necesitás otro huso, configurá el servidor o usá `TZ=America/Bogota` antes del comando.

## Prueba automatizada (sin Docker)

Comprueba la lógica de retención y la sintaxis `sh -n` de los scripts de backup:

```bash
sh scripts/test-backup-retention.sh
```

En sistemas sin `touch -t` (pocos), el test imprime `SKIP` y sale 0.

## Restaurar la base (destructivo)

El dump está pensado para restaurarse sobre la misma base `nosignal` **reemplazando** objetos según las sentencias `DROP`/`CREATE` del archivo.

```bash
sh scripts/restore-db.sh backups/db-nosignal-XXXXXXXX.sql.gz --confirm
```

Sin `--confirm` el script no hace nada.

**Recomendaciones:**

1. Probar antes en una copia del entorno o un Postgres temporal.
2. Tras restaurar datos antiguos, puede hacer falta alinear el esquema con Alembic (`upgrade head`) si migraste código después del backup.
3. Las rutas de fotos en la BD apuntan a archivos bajo `/app/uploads`; si restaurás solo la BD, sincronizá también el backup de uploads coherente en fecha.

Copiá los archivos generados **fuera del mismo disco** cuando puedas (rsync, objeto storage, otro VPS). Un backup que solo vive en el mismo servidor no protege ante fallo de disco.

## Automatización ad hoc (cron sin retención)

Si solo querés ejecutar los scripts sueltos sin borrar viejos (no recomendado a largo plazo):

```cron
15 3 * * * cd /opt/PERCENS && sh scripts/backup-nosignal.sh && sh scripts/backup-uploads.sh
```

## Retención manual

Si no usás `backup-automatic.sh`, rotá o borrá backups viejos para no llenar el disco (por ejemplo conservar los últimos 7 días y uno semanal).

## Comandos peligrosos (pérdida de datos)

Evitar en producción sin export previo:

- `docker compose down -v` (el `-v` elimina volúmenes nombrados declarados en el compose).
- `docker volume rm …`
- Borrar manualmente `/var/lib/docker/volumes/…`

## Checklist de verificación (después del primer despliegue de scripts)

En el servidor Linux:

1. `docker compose ps` — servicios `db` y `backend` **running**.
2. `sh scripts/backup-nosignal.sh` — debe crear un `.sql.gz` con tamaño > 0.
3. `sh scripts/backup-uploads.sh` — debe crear un `.tar.gz` (puede ser pequeño si no hay fotos).
4. **Prueba de restauración** (opcional, en entorno de prueba): copiar el `.sql.gz`, ejecutar `restore-db.sh … --confirm`, comprobar que `GET /health` y datos críticos responden bien.
5. `sh scripts/backup-automatic.sh` — debe crear BD + uploads y, si ya hay más de 5 archivos de un tipo, borrar los más antiguos de ese tipo (ver listado en `backups/`).
6. `sh scripts/test-backup-retention.sh` — debe imprimir `OK` (retención + sintaxis de scripts).

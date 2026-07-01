# Mapas offline CENS

Scripts para generar el pack `cens-influencia.pmtiles` del área de influencia (47 municipios).

## Requisitos

- Docker Desktop en ejecución
- ~2 GB libres en disco (extracto Colombia + AOI + PMTiles)
- Conexión a internet (solo la primera vez)

## Windows (PowerShell)

```powershell
.\maps\build-cens-pack.ps1
```

## Linux / macOS

```bash
chmod +x maps/build-cens-pack.sh
./maps/build-cens-pack.sh
```

## Salida

| Archivo | Destino |
|---------|---------|
| `cens-influencia.pmtiles` | `frontend/public/maps/` |
| Manifiesto actualizado | `frontend/public/maps/cens-influencia.manifest.json` |

Los `.pmtiles` no se versionan en git (ver `.gitignore`). Publicar con el despliegue del frontend.

Documentación completa: [docs/mapas-offline-cens.md](../docs/mapas-offline-cens.md)

# Mapas offline — área de influencia CENS



PERCENS descarga en **segundo plano** un único pack cartográfico (Opción A) que cubre los **47 municipios** del área de influencia CENS. El archivo se almacena en **Cache API** del navegador; los metadatos de versión viven en **IndexedDB** (`offlineMapPackMeta`).



## Generación automatizada (recomendado)



Con **Docker Desktop** en ejecución:



```powershell

# Windows

.\maps\build-cens-pack.ps1

```



```bash

# Linux / macOS

./maps/build-cens-pack.sh

```



El script:



1. Descarga `colombia-latest.osm.pbf` (Geofabrik) en `maps-build/` si no existe.

2. Recorta el bbox CENS con **osmium** (Docker).

3. Genera **PMTiles** con **Planetiler** (Docker, zoom 10–16).

4. Copia el resultado a `frontend/public/maps/cens-influencia.pmtiles`.

5. Actualiza `version` y `byteLength` en el manifiesto.



Tiempo estimado: **30–90 minutos** (según CPU y red). Los artefactos intermedios quedan en `maps-build/` (ignorado por git).



## Archivos publicados



| Archivo | Descripción |

|---------|-------------|

| `frontend/public/maps/cens-influencia.manifest.json` | Versión, URL del pack y atribución |

| `frontend/public/maps/cens-influencia.pmtiles` | Pack vectorial PMTiles (generado; no en git) |



Tras generar el `.pmtiles`, despliega el frontend para servirlo en `https://percens.site/maps/cens-influencia.pmtiles`.



## Generación manual (referencia)



1. Descargar extracto Colombia: [Geofabrik](https://download.geofabrik.de/south-america/colombia.html).

2. Recortar al AOI CENS (bbox `-74.05,6.75,-72.0,9.35`) con `osmium extract`.

3. Generar PMTiles con [Planetiler](https://github.com/onthegomap/planetiler) o [Protomaps CLI](https://docs.protomaps.com/pmtiles/create), zoom **14–17**.

4. Publicar y actualizar `version` en el manifiesto.



## Comportamiento en la app



- Al entrar en una ruta protegida, `useCensOfflineMapSync` intenta descargar el pack **sin UI**.

- Si el pack aún no está listo, el formulario muestra un **fallback** con coordenadas y precisión.

- Cuando la descarga termina, el mapa PMTiles aparece automáticamente (reintento cada 8 s).



## Variables de entorno



| Variable | Default |

|----------|---------|

| `VITE_CENS_OFFLINE_MAP_MANIFEST_URL` | `/maps/cens-influencia.manifest.json` |



## Municipios incluidos



Ver `frontend/src/config/censInfluenceArea.ts` (40 NS + 6 Cesar sur + Morales Bolívar).


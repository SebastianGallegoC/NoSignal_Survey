# Precarga Automática de Formularios – Implementación

## Objetivo

Permitir que el usuario active una **precarga automática por formulario** en el dispositivo local. Cuando está activa, el sistema:

- Descarga y guarda automáticamente un snapshot del formulario en IndexedDB.
- Detecta cambios en el servidor (cada 10 minutos, al reconectar, o al entrar a la app).
- Actualiza la copia local si hay cambios más recientes en el servidor.
- Al desactivar, elimina la copia local del dispositivo.

## Qué se implementó

### 1. **Base de datos (Dexie) – `frontend/src/services/db.ts`**

- **Cambio**: Añadido campo `auto_precarga?: boolean` en la interfaz `PrecargaForm`.
- **Razón**: Marcar qué precargas deben ser monitoreadas y actualizadas automáticamente.
- **Versión de DB**: Actualizada de v6 a v7; índices ahora incluyen `auto_precarga`.

```typescript
export interface PrecargaForm {
  id_formulario: string;
  fecha_precarga: string;
  datos_formulario: Record<string, unknown>;
  gps?: { latitud: number; longitud: number; precision?: number | null } | null;
  fotos?: OfflineForm["fotos"];
  auto_precarga?: boolean; // ← NUEVO
}
```

### 2. **API – `frontend/src/services/api.ts`**

- **Cambio**: Agregada función `fetchFormFromApi(formId)`.
- **Razón**: Descargar el detalle completo de un formulario desde el servidor (requiere JWT).
- **Uso**: El servicio de precarga lo llama para obtener datos actualizados.

```typescript
export const fetchFormFromApi = async (
  formId: string,
): Promise<FormReadItem> => {
  // GET /api/v1/forms/{formId}
  // Retorna: datos_formulario, fotos (como rutas), gps, fecha_actualizacion, etc.
};
```

### 3. **Servicio de Precarga – `frontend/src/services/precargaService.ts` (NUEVO)**

**Funciones principales:**

- **`downloadAndSavePrecarga(formId, options?)`**
  - Descarga el detalle del formulario desde el API.
  - Comprime/optimiza las fotos (JPEG, máx 1600px, calidad 80%) para ahorrar espacio en IndexedDB.
  - Guarda en `db.precargas` con `auto_precarga=true`.
  - **Motivo de compresión**: Las fotos en base64 sin comprimir pueden ocupar 2–5 MB por formulario; la compresión reduce a ~200–500 KB manteniendo calidad visual.

- **`enableAutoPrecarga(formId)`**
  - Si existe precarga anterior, marca `auto_precarga=true`.
  - Si no existe, crea una nueva descargando inmediatamente del servidor.

- **`disableAutoPrecarga(formId)`**
  - Elimina la precarga local completamente (libera espacio en IndexedDB).

- **`deletePrecarga(formId)`**
  - Alias para eliminar manualmente.

- **Función interna: `optimizeDataUrl(dataUrl, maxWidth, quality)`**
  - Redimensiona y comprime fotos usando Canvas API.
  - Configurable; valores por defecto: 1600px ancho, JPEG calidad 80%.

### 4. **Watcher de Cambios – `frontend/src/hooks/usePrecargaWatcher.ts` (NUEVO)**

**Comportamiento:**

- Se ejecuta al:
  - Montar el hook (si `enabled=true`).
  - Evento `online` (cuando recupera conexión).
  - Cambiar visibilidad de la pestaña a visible (vuelve a foreground).
  - Cada 10 minutos de manera periódica (si hay sesión activa).

- **Lógica**: Recorre todas las precargas con `auto_precarga=true` y:
  1. Compara `fecha_actualizacion` del servidor vs `fecha_precarga` local.
  2. Si el servidor es más reciente, llama a `downloadAndSavePrecarga` para refrescar.

- **Tolerancia a errores**: Si el API falla para un formulario, sigue revisando los demás (no bloquea).

```typescript
export const usePrecargaWatcher = (enabled = true): void => {
  // Checks every 10 minutes + on online/visibility
  // Syncs precargas where auto_precarga === true
};
```

### 5. **Integración en Sync – `frontend/src/services/sync.ts`**

**Cambio**: Tras un envío exitoso (`POST /forms/`), si existe una precarga automática para ese formulario:

- Refresa la precarga local con `downloadAndSavePrecarga` (import dinámico).
- **Razón**: Asegurar que la copia local tenga la versión más reciente del servidor después de que el usuario editó offline y sincronizó.

```typescript
// Tras update de historialFormularios a ENVIADO:
if (prec?.auto_precarga) {
  void downloadAndSavePrecarga(form.id_formulario);
}
```

### 6. **UI – `frontend/src/pages/FormulariosDiligenciadosPage.tsx`**

**Cambios:**

- **Imports**: `usePrecargaWatcher`, `enableAutoPrecarga`, `disableAutoPrecarga`.
- **Hooks**: Llamada a `usePrecargaWatcher(hasToken)` para activar el monitor.
- **Estado**:
  - `autoPrecargaStates`: Mapa de `formId → boolean` para saber qué formularios tienen precarga automática.
  - `togglingAutoPrecargaId`: ID del formulario siendo toggled (para evitar múltiples clicks).
- **Callback**: `toggleAutoPrecarga(row)` — activa/desactiva la automática y recarga la lista.
- **Botón**:
  - Botón "Activar precarga automática" (solo si `row.server` existe).
  - Cambia a "✓ Precarga automática activa" cuando está encendida (estilos verdes/azules).
  - Disabled mientras se está procesando o sin conexión.

## Flujo completo (Ejemplo)

1. **Usuario abre "Formularios diligenciados" con conexión.**
2. **Expande un formulario del servidor.**
3. **Hace clic en "Activar precarga automática".**
   - Sistema llama a `enableAutoPrecarga(formId)`.
   - Se descarga y se comprime el detalle, se guarda en `db.precargas` con `auto_precarga=true`.
   - UI muestra "✓ Precarga automática activa".

4. **Usuario se va a campo sin conexión.**
   - El formulario sigue disponible offline (precarga local).
   - Puede abrir y editar sin red.

5. **Usuario vuelve a conectarse.**
   - Evento `online` dispara el watcher.
   - Watcher compara `fecha_actualizacion` servidor vs `fecha_precarga` local.
   - Si el servidor tiene cambios (otro usuario editó, por ejemplo), descarga y actualiza la precarga local.

6. **Usuario edita offline y luego sincroniza.**
   - Al reconectar, la cola `db.formularios` se envía.
   - Si el envío es exitoso, `sync.ts` actualiza la precarga local con `downloadAndSavePrecarga`.
   - La precarga ahora refleja la versión servidor más reciente.

7. **Usuario desactiva precarga automática.**
   - Clic en "Activar precarga automática" nuevamente (ahora muestra "Desactivar...").
   - Sistema llama a `disableAutoPrecarga(formId)`.
   - Precarga se elimina de IndexedDB; espacio liberado.

## Decisiones de diseño

### Por qué compresión de fotos

- **Problema**: Una foto de móvil sin comprimir (base64) ~3-5 MB; 3 fotos = 9-15 MB.
- **Solución**: Redimensionar a 1600px y JPEG 80% reduce a ~200-500 KB sin pérdida visual notable.
- **Beneficio**: Múltiples formularios caben en IndexedDB (~50 MB límite típico).

### Por qué checking periódico cada 10 minutos

- **Balance**: 10 minutos es un compromiso entre latencia y consumo de batería.
- **Alternativa rechazada**: Polling cada 1 minuto (demasiado agresivo); server-sent events (requiere backend adicional).

### Por qué import dinámico en sync.ts

- **Evitar ciclo de módulos**: `precargaService` → `api` → `db`; `sync` también importaría `api`. Import dinámico evita resolver todo de una vez.

### Por qué no sincronizar entre dispositivos

- **Scope local**: La precarga es **específica del dispositivo**. Cada dispositivo tiene su propia caché local.
- **Razón**: Simplicidad; evita conflictos de versiones y sincronización de server.

## Qué falta por hacer

### Alto Impacto (Recomendado)

1. **Tests unitarios para `precargaService.ts`**
   - Validar `downloadAndSavePrecarga` guarda correctamente en DB.
   - Validar `optimizeDataUrl` comprime imágenes sin corromper.
   - Mock de `fetchFormFromApi` y `fetchFormPhotoDataUrl`.

2. **Tests de integración para `usePrecargaWatcher`**
   - Simular evento `online`.
   - Simular cambio en servidor (mock `fetchFormFromApi` con `fecha_actualizacion` más reciente).
   - Validar que `downloadAndSavePrecarga` se llama.

3. **Gestión de cuota y alertas**
   - Estimar tamaño de precarga **antes** de guardar.
   - Si supera (ej.) 10 MB, mostrar warning al usuario.
   - Implementar dashboard de uso de almacenamiento local.

4. **Migración de Dexie más robusta**
   - Versión 7 es un "bump" vacío; si hay usuarios en producción con v6, la migración automática debería preservar datos.
   - Considerar `onUpgrade` handlers para migrar `auto_precarga` desde precargas existentes.

### Medio Impacto

5. **Política de retención automática (TTL)**
   - Ejemplo: Expirar precargas tras 30 días sin acceso.
   - Agregar `ultima_lectura` en `PrecargaForm` y limpiar periódicamente.

6. **Mejoras de UX**
   - Botón "Actualizar todas las precargas automáticas" en header.
   - Indicador visual de "última actualización automática" por formulario.
   - Histórico: mostrar cuándo se detectó cambio en servidor.

7. **Control granular de compresión**
   - Permitir usuario elegir: máxima calidad (más espacio) vs máxima compresión (menos espacio).
   - Slider o opciones: "Baja", "Media", "Alta" compresión.

### Bajo Impacto (Futuro)

8. **Encriptación de fotos**
   - Si el proyecto requiere privacidad estricta, encriptar fotos en IndexedDB.
   - Usar Web Crypto API.

9. **Sincronización selectiva entre dispositivos (futuro)**
   - Si se agrega backend de sincronización, permitir "precargas favoritas" sincronizadas.

10. **Análisis y logging**

- Metrics: cuántas precargas activas, cuántas actualizaciones/día, espacio promedio.
- Debugging: logs detallados en modo dev.

## Cómo probar manualmente

### Escenario 1: Activar y desactivar precarga automática

1. Abrir "Formularios diligenciados".
2. Expandir un formulario del servidor.
3. Clic en "Activar precarga automática".
   - Esperar a que se descargue (indicador "Precargando datos...").
   - Validar: botón cambia a "✓ Precarga automática activa".
4. Clic nuevamente para desactivar.
   - Botón vuelve a "Activar precarga automática".
   - IndexedDB no tiene entrada de precarga (espacio liberado).

### Escenario 2: Detección de cambios automática

1. Activar precarga automática en un formulario.
2. **Sin cierre de app**: Editar ese formulario desde otra pestaña/dispositivo (o simularlo editando directamente en la DB).
3. Esperar 10 minutos O generar evento `online` (ej. con DevTools: `window.dispatchEvent(new Event('online'))`).
4. Observar:
   - Consola: logs de `usePrecargaWatcher` (si agregados).
   - IndexedDB: `fecha_precarga` se actualiza a la hora actual.

### Escenario 3: Edición offline → Sincronización → Refresh automático

1. Activar precarga automática en un formulario.
2. Desconectar internet (DevTools → Offline).
3. Editar el formulario y enviar (quedaría en cola local).
4. Reconectar internet.
5. Esperar a que se sincronice.
6. Validar: precarga se refresa automáticamente con la versión servidor.

## Archivos modificados / añadidos

- ✏️ `frontend/src/services/db.ts` — Añadido campo `auto_precarga`, actualizada versión Dexie.
- ✏️ `frontend/src/services/api.ts` — Agregada `fetchFormFromApi()`.
- ✏️ `frontend/src/services/sync.ts` — Refresh automático de precarga tras envío exitoso.
- ✏️ `frontend/src/pages/FormulariosDiligenciadosPage.tsx` — Integración del watcher y botón UI.
- 🆕 `frontend/src/services/precargaService.ts` — Lógica de descarga, compresión y gestión de precargas.
- 🆕 `frontend/src/hooks/usePrecargaWatcher.ts` — Watcher periódico de cambios.
- 📄 `docs/precarga-automatica.md` — Este documento.

## Entrada Manual de Coordenadas GPS

### Resumen de la Funcionalidad

Complementando la captura automática de GPS mediante PWA, se implementó la posibilidad de que el usuario ingrese manualmente coordenadas de ubicación en formato decimal (latitud, longitud, precisión). Esto es útil cuando:

- No hay acceso a GPS (ej: cámara web con navegador limitado)
- Se requiere corregir una ubicación capturada
- El usuario prefiere ingresar coordenadas de fuente externa

### Componentes Implementados

#### `frontend/src/components/form/ManualCoordinatesModal.tsx`

Modal interactivo que permite al usuario ingresar:

- **Latitud** (rango: -90 a 90 grados)
- **Longitud** (rango: -180 a 180 grados)
- **Precisión** (metros, default: 5, mínimo: 0)

**Validación**:

- Campos requeridos (no vacíos después de trim)
- Rangos numéricamente válidos
- Conversión a tipo `number` con `parseFloat()`
- Mensajes de error específicos para cada validación

**Estado Interno**:

- `lat`, `lon`, `precision`: strings (capturan entrada del usuario)
- `error`: mensaje de validación o null

**Props**:

```typescript
type Props = {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (coords: {
    latitud: number;
    longitud: number;
    precision: number;
  }) => void;
};
```

#### Integración en `FormularioOverviewPanel.tsx`

**Cambios**:

- Agregado prop `onAbrirManual: () => void` al type `Props`
- Reemplazado botón único "Tomar ubicación" con dual-button group:
  - Botón izq: "GPS automático" — dispara GPS hardware
  - Botón der: "Ingresar manualmente" — abre modal

**Renderizado**:

```typescript
<div className="mt-3 flex gap-2">
  <Button onClick={onSolicitarGps} disabled={cargando}>
    {cargando ? "Buscando GPS…" : "GPS automático"}
  </Button>
  <Button onClick={onAbrirManual} disabled={cargando}>
    Ingresar manualmente
  </Button>
</div>
```

#### Integración en `FormularioPage.tsx`

**Cambios**:

- Import: `ManualCoordinatesModal`
- State: `const [mostrarModalManual, setMostrarModalManual] = useState(false);`
- Callback: `handleCoordenadasManual()` que:
  - Convierte coordenadas decimales a DMS (grados/minutos/segundos)
  - Actualiza campos del formulario via `setValue()`
  - Cierra modal
  - Guarda borrador con nuevas coordenadas
- Renderizado del modal con binding a estado y callback

### Alternancia entre ubicación automática y manual

La alternancia quedó resuelta con dos acciones distintas en la UI, pero con un mismo resultado final: el formulario termina guardando una sola ubicación válida.

- **GPS automático**: toma la ubicación desde el celular o el navegador cuando el dispositivo puede resolverla.
- **Entrada manual**: permite escribir latitud, longitud y precisión sin depender del hardware ni de la red.

No se implementaron dos modelos de datos separados. En ambos casos, el valor resultante se lleva al mismo formulario, se transforma a formato decimal y DMS, y se guarda como borrador local.

### Por qué se separaron los caminos

- El GPS automático sigue siendo la opción más rápida cuando el dispositivo responde bien.
- La entrada manual cubre los casos donde el GPS no está disponible, es impreciso o el usuario necesita cargar un punto exacto de otra fuente.
- Separar ambos botones evita confusión y hace visible qué método está usando el formulario.
- Como ambos flujos convergen en el mismo estado de ubicación, no fue necesario cambiar backend ni persistencia.

### Qué cambió en la interfaz

- Antes existía un único botón para tomar ubicación.
- Ahora hay dos botones:
  - uno para iniciar la captura automática,
  - otro para abrir el modal de ingreso manual.
- El modal valida los valores antes de aceptar la ubicación.

### Flujo de Usuario

1. **Acceder al formulario** → Sección GPS muestra dos botones: "GPS automático" e "Ingresar manualmente"
2. **Clic en "Ingresar manualmente"** → Abre modal con tres inputs
3. **Ingresar coordenadas** → Ej: Lat -34.603722, Lon -58.381592, Precision 10
4. **Validación en tiempo real** → Si error: muestra mensaje específico en rose-50 box
5. **Clic en "Guardar ubicación"** → Convierte a DMS, actualiza campos, guarda borrador, cierra modal
6. **Formulario actualizado** → Mapa renderiza ubicación; campos DMS y decimales sincronizados

### Comparación: Automático vs Manual

| Aspecto          | GPS Automático         | Manual                                          |
| ---------------- | ---------------------- | ----------------------------------------------- |
| Activación       | Botón "GPS automático" | Botón "Ingresar manualmente"                    |
| Datos requeridos | Hardware GPS/WiFi      | Entrada usuario (3 campos)                      |
| Precisión        | Varía (1-100+ metros)  | Usuario especifica                              |
| Contexto         | Ubicación actual       | Cualquier punto (histórico, externo, corregido) |
| Offline          | Requiere WiFi/GPS      | Funciona offline                                |
| Error handling   | Reintento automático   | Validación modal                                |

### Desarrollo Futuro

- Importar coordenadas desde archivo (CSV, GeoJSON)
- Búsqueda de ubicación por nombre (Nominatim, Google Places)
- Historial de coordenadas ingresadas
- Exportar rutas como GeoJSON
- Integración con aplicaciones externas de mapas

## Referencias

- **IndexedDB Limits**: ~50 MB por aplicación (varía por navegador; Chrome/Edge: 50 MB).
- **Canvas API**: Usada para optimizar imágenes (redimensión, JPEG encoding).
- **Web API**: `navigator.onLine`, eventos `online`/`offline`, `visibilitychange`.

---

**Estado**: ✅ Implementación básica completa. Pendiente: tests, gestión de cuota, TTL.

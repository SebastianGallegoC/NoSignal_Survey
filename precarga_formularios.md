# Precarga de formularios diligenciados para visitas posteriores

## Contexto

Cuando se realiza la primera visita a un lugar, el formulario se guarda en la base de datos. En la segunda o tercera visita, el usuario puede no tener internet, lo que impide cargar la informacion previa y dificulta agregar o actualizar datos. Para resolver esto, se implementa un flujo de precarga en la seccion de "Formularios diligenciados" cuando el usuario tiene conexion.

## Objetivo

Permitir que el usuario seleccione y descargue localmente los datos de un formulario ya diligenciado, de modo que queden disponibles sin internet durante visitas posteriores.

## Alcance de la solucion

- La precarga se ejecuta solo con conexion activa.
- Los datos seleccionados se guardan localmente (IndexedDB) para lectura offline.
- En visitas posteriores sin internet, el usuario podra ver los datos precargados y continuar agregando o actualizando la informacion.

## Flujo propuesto

1. El usuario abre la seccion "Formularios diligenciados" con internet.
2. La interfaz permite seleccionar uno o varios formularios a precargar.
3. Al confirmar, la app descarga los datos completos del formulario (incluye fotos y metadatos necesarios).
4. Se guarda un snapshot local en IndexedDB con marca de tiempo.
5. En modo offline, la app permite consultar el snapshot y usarlo como base para la nueva visita.

## Cambios a implementar

- UI en "Formularios diligenciados" para seleccionar formularios y ejecutar "Precargar".
- Servicio de descarga del detalle del formulario desde la API.
- Persistencia local de la precarga en IndexedDB con un estado claro (precargado, version, fecha).
- Vista offline que lee primero los datos precargados y permite continuar el formulario.

## Justificacion

- Reduce bloqueos por falta de conectividad.
- Asegura continuidad operativa en campo.
- Evita reprocesos y mejora la calidad de datos entre visitas.

## Impacto esperado

- Usuarios podran trabajar sin internet en visitas posteriores.
- Menos fricciones al capturar datos adicionales.
- Mayor consistencia entre visitas del mismo lugar.

# Ubicación manual y alternancia con GPS

## Objetivo

Permitir que, al completar un formulario, el usuario pueda elegir entre dos formas de cargar la ubicación:

- usar el GPS del celular o del navegador,
- digitar la ubicación manualmente en la sección de coordenadas.

La idea fue que ambas opciones terminen alimentando el mismo formulario, sin duplicar el flujo de guardado.

## Cambios realizados

### 1. Se agregó una alternancia visible en la interfaz

En la parte superior del formulario ahora aparecen dos acciones:

- **GPS automático**: pide la ubicación al dispositivo.
- **Ingresar manualmente**: activa la edición de la sección "Coordenadas (grados / minutos / segundos)".

### 2. La sección de coordenadas quedó habilitable

Antes, los campos de coordenadas estaban siempre marcados como de solo lectura porque se llenaban solo desde GPS.

Ahora, cuando el usuario elige la opción manual:

- los campos de coordenadas pasan a ser editables,
- el usuario puede escribir latitud, longitud y el resto de valores de esa sección,
- la interfaz mantiene el mismo bloque de campos del formulario, sin abrir otro flujo separado.

### 3. Se guardó el modo elegido en el borrador local

Se agregó un estado de modo de coordenadas para recordar si el usuario está trabajando con:

- `automatico`
- `manual`

Ese valor también se guarda en el borrador local para no perder la elección si el formulario se recarga.

### 4. Se mantuvo la compatibilidad con el GPS automático

Cuando el usuario vuelve a GPS automático:

- el formulario vuelve a tomar la ubicación del dispositivo,
- los campos vuelven a comportarse como lectura automática,
- la vista de resumen sigue mostrando la ubicación efectiva del formulario.

## Flujo de uso

1. El usuario abre el formulario.
2. Si necesita ubicación automática, pulsa **GPS automático**.
3. Si necesita escribirla a mano, pulsa **Ingresar manualmente**.
4. Al activar manual, se habilita la sección de coordenadas.
5. El usuario completa los datos y sigue llenando el formulario.
6. Al guardar, la ubicación queda registrada junto con el resto del formulario.

## Qué resuelve este cambio

- Evita depender del GPS cuando no hay señal o permisos.
- Permite cargar coordenadas exactas desde otra fuente.
- Mantiene un solo formulario y un solo esquema de guardado.
- Hace visible para el usuario qué modo de ubicación está usando en cada momento.

## Archivos involucrados

- `frontend/src/pages/FormularioPage.tsx`
- `frontend/src/components/form/FormFieldRow.tsx`
- `frontend/src/services/formDraftStorage.ts`
- `frontend/src/components/form/FormularioOverviewPanel.tsx`

## Nota

Este documento describe el cambio funcional principal que se hizo sobre la ubicación. Si después se quiere, se puede separar en una guía más técnica o en un documento orientado al usuario final.

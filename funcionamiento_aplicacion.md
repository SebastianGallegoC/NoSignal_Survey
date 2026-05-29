1. Flujo de Autenticación Offline-First
El trabajador debe iniciar sesión con internet al menos una vez.

El JWT se almacena en localStorage y una copia de los datos del usuario en Dexie.js.

Al abrir la app sin conexión, el sistema valida la existencia y fecha de expiración del token localmente para permitir el acceso al formulario.

2. Captura de Datos y GPS
Formulario Dinámico: Inputs de texto y selects según el requerimiento del negocio.

Geolocalización: Al pulsar el botón "Tomar Ubicación", la app debe solicitar permisos de GPS y capturar latitude y longitude con un margen de error máximo de 3 metros, en lo posible que tenga un margen de error cero.

Cámara: Uso de la API input capture="camera" o MediaDevices para tomar fotos directamente. Las fotos se comprimen en el frontend inmediatamente.

3. Lógica de Guardado y Sincronización
Paso 1: Al dar clic en "Enviar", la app verifica el estado de la red (navigator.onLine).

Paso 2 (Offline): Si no hay red, los datos se serializan en un JSON y las imágenes se convierten en Blobs, guardándose todo en una tabla de "Pendientes" en Dexie.js. Se muestra un aviso al usuario: "Datos guardados localmente".

Paso 3 (Sincronización): Un Service Worker con Background Sync escucha el evento de recuperación de red. Cuando detecta internet, toma los registros de la tabla "Pendientes" y los envía uno a uno al endpoint de FastAPI.

Paso 4: Una vez el servidor responde con 200 OK, se eliminan los datos de la base de datos local para ahorrar espacio.

4. Requisitos de Seguridad y Distribución
La aplicación se distribuye como PWA vía URL, sin pasar por App Store o Play Store.

Es obligatorio el uso de HTTPS para que el navegador permita el acceso a la cámara y al GPS.
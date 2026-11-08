# Seguridad de notificaciones JennyFit

Esta rama protege las rutas de notificaciones sin cambiar las pantallas ni los textos visibles de la app.

## Antes de desplegar

La protección App Check falla de forma cerrada: las rutas responderán 401 hasta completar la configuración del sitio web.

### 1. Firebase App Check

1. En Firebase Console, abre **App Check** y registra la aplicación web JennyFit con el proveedor **reCAPTCHA Enterprise**.
2. Autoriza los dominios de producción: `jennyv2.vercel.app` y, si el panel administrativo consume estas rutas, `admin-jennyfit.vercel.app`.
3. Copia la **site key pública** de reCAPTCHA v3 y colócala en `FIREBASE_APP_CHECK_SITE_KEY` dentro de `index.html`.
4. Primero prueba en modo de monitorización en Firebase Console. Activa la aplicación de App Check cuando las solicitudes legítimas ya aparezcan correctamente.

La clave pública/Key ID se puede incluir en el HTML. Nunca pongas una clave secreta en el HTML. Crea una clave Web basada en puntuación, sin desafío de casilla, y autoriza los dominios de producción.

### 2. Variables de entorno de Vercel

Configura en el proyecto de Vercel:

- `FIREBASE_SERVICE_ACCOUNT_BASE64`: cuenta de servicio Firebase Admin codificada en Base64. La API también conserva compatibilidad con `FIREBASE_SERVICE_ACCOUNT`, pero se recomienda usar la primera.
- `NOTIFICATION_ADMIN_UIDS`: UID(s) de Firebase Authentication autorizados para enviar notificaciones administrativas. Si hay varios, sepáralos por comas.
- `JENNYFIT_ADMIN_FCM_TOKEN`: token FCM privado del dispositivo administrador que recibirá avisos de nuevos registros.
- `NOTIFICATION_ALLOWED_ORIGINS`: opcional; por defecto permite `https://jennyv2.vercel.app` y `https://admin-jennyfit.vercel.app`.

No guardes estos valores en el repositorio ni en el HTML.

### 3. Firestore

La API usa la colección `_security_rate_limits` para límites persistentes por IP o UID. Las escrituras se realizan con Firebase Admin, por lo que las reglas de cliente deben denegar el acceso directo de usuarios a esa colección.

Se recomienda configurar TTL sobre el campo `resetAt` para limpiar automáticamente los documentos caducados. La TTL es una tarea de mantenimiento; no es necesaria para que expire el límite, porque la API comprueba `resetAt`.

### 4. Rotación de la credencial antigua

La clave de autorización que antes estaba incrustada en el código fuente público debe considerarse comprometida y dejar de utilizarse. El nuevo código ya no la acepta ni la envía desde el navegador; no crees otra clave compartida para sustituirla.

### 5. Qué protege cada ruta

- `POST /api/suscribir`: App Check, límite de 30 operaciones por hora e inclusión exclusiva de los temas `recordatorio_agua` y `noticias_jennyfit`.
- `POST /api/enviar-notificacion`: App Check; para avisos administrativos exige Firebase Auth y UID incluido en `NOTIFICATION_ADMIN_UIDS`. El evento de nuevo registro exige una sesión Firebase Auth, limita a un aviso por UID por hora y el destinatario se toma de `JENNYFIT_ADMIN_FCM_TOKEN`, nunca del navegador.
- `POST /api/enviar-agua`: App Check, Firebase Auth de administrador y límite de 10 envíos por hora.

Los límites se guardan en Firestore mediante transacciones y las claves se almacenan con hash; no se guardan direcciones IP en claro.

## Pruebas antes de fusionar

- Suscribir y desuscribir agua.
- Suscribir y desuscribir noticias.
- Confirmar que un usuario normal no puede enviar avisos administrativos.
- Confirmar que un UID administrador sí puede enviar avisos.
- Confirmar que solicitudes sin App Check se rechazan.
- Confirmar que los límites devuelven HTTP 429 al excederse.
- Probar registro nuevo con sesión Firebase Auth y recibir el aviso en el dispositivo administrador.

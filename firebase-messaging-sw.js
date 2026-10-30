// ============================================================
// SERVICE WORKER PARA JENNYFIT (FIREBASE MESSAGING + PWA)
// ============================================================

// Importar los scripts de Firebase (Versión 10.13.2)
importScripts('https://www.gstatic.com/firebasejs/10.13.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.13.2/firebase-messaging-compat.js');

// Inicializar Firebase en el Service Worker
firebase.initializeApp({
  apiKey: "AIzaSyDT0lieijjz2sxbu6PqaLmkrQ_HsDadK5M",
  authDomain: "jennyfitapp.firebaseapp.com",
  projectId: "jennyfitapp",
  storageBucket: "jennyfitapp.firebasestorage.app",
  messagingSenderId: "492885885548",
  appId: "1:492885885548:web:64d40ccffe8dad340f4e49"
});

const messaging = firebase.messaging();

// Manejar notificaciones cuando la app está cerrada o en segundo plano
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Recibido mensaje en segundo plano: ', payload);
  
  const notificationTitle = payload.notification?.title || payload.data?.title || 'Jennyfit';
  const notificationOptions = {
    body: payload.notification?.body || payload.data?.body || 'Tienes una nueva notificación.',
    icon: './Iconojennyfit.png',
    badge: './Iconojennyfit.png',
    vibrate: [300, 120, 300, 120, 400],
    data: { url: './' }
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Manejar el clic en la notificación para abrir la app
self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(windowClients => {
      // Si la app ya está abierta, enfocarla
      for (let i = 0; i < windowClients.length; i++) {
        let client = windowClients[i];
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus();
        }
      }
      // Si no está abierta, abrir una nueva ventana
      if (clients.openWindow) {
        return clients.openWindow('./');
      }
    })
  );
});

// 🚨 ESTO ES OBLIGATORIO PARA QUE CHROME PERMITA INSTALAR LA PWA 🚨
self.addEventListener('fetch', function(event) {
  // Dejamos el evento vacío. Chrome solo necesita saber que existe.
});

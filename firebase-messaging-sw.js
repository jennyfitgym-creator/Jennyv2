// 🚨 FORZAMOS LA ACTUALIZACIÓN INMEDIATA DEL SERVICE WORKER 🚨
const SW_VERSION = '1.0.1'; // Cambiar este número obliga al teléfono a borrar el viejo
self.addEventListener('install', (event) => { self.skipWaiting(); });
self.addEventListener('activate', (event) => { event.waitUntil(clients.claim()); });

importScripts('https://www.gstatic.com/firebasejs/10.13.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.13.2/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyDT0lieijjz2sxbu6PqaLmkrQ_HsDadK5M",
  authDomain: "jennyfitapp.firebaseapp.com",
  projectId: "jennyfitapp",
  storageBucket: "jennyfitapp.firebasestorage.app",
  messagingSenderId: "492885885548",
  appId: "1:492885885548:web:64d40ccffe8dad340f4e49"
});

const messaging = firebase.messaging();

// 🚨 NO DIBUJAMOS LA NOTIFICACIÓN MANUALMENTE. 
// El servidor de Google ya lo hace con el bloque "notification" de arriba.
messaging.onBackgroundMessage((payload) => {
  console.log('Notificación recibida en segundo plano. El servidor la muestra.');
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(windowClients => {
      for (let i = 0; i < windowClients.length; i++) {
        let client = windowClients[i];
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) return clients.openWindow('./');
    })
  );
});

self.addEventListener('fetch', function(event) {});

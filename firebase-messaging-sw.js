// 🚨 EVITA EL AVISO DE ACTUALIZACIÓN EN SEGUNDO PLANO
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

// 🚨 AQUÍ ESTÁ EL TRUCO: YA NO DIBUJAMOS LA NOTIFICACIÓN MANUALMENTE
// Dejamos que Firebase (el servidor de Google) lo haga para que no salga doble.
messaging.onBackgroundMessage((payload) => {
  console.log('Notificación recibida en segundo plano, el servidor la mostrará.');
});

// Manejar el clic en la notificación para abrir la app
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

// Manejador obligatorio para PWA
self.addEventListener('fetch', function(event) {
  // Manejador vacío
});

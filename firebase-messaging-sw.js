// ============================================================
// SERVICE WORKER PARA JENNYFIT (FCM + MODO OFFLINE PWA)
// ============================================================
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

messaging.onBackgroundMessage((payload) => {
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

// ============================================================
// LÓGICA DE CACHÉ PARA QUE FUNCIONE SIN INTERNET
// ============================================================
const CACHE_NAME = 'jennyfit-cache-v1';

// Archivos que se guardarán en el teléfono
const urlsToCache = [
  './',
  './index.html',
  './manifest.json',
  './logo.png',
  './Iconojennyfit.png',
  './Jennyfitpost.jpg'
];

// Instalar el Service Worker y guardar los archivos
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(urlsToCache);
    })
  );
  self.skipWaiting();
});

// Limpiar cachés viejas cuando haya actualizaciones
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Interceptar las peticiones (El evento fetch que exige Chrome)
self.addEventListener('fetch', event => {
  // Ignorar peticiones que no sean GET (como POST de Firebase)
  if (event.request.method !== 'GET') return;
  
  // Ignorar las peticiones a Google APIs o Firebase (esas sí necesitan internet)
  if (event.request.url.includes('googleapis.com') || 
      event.request.url.includes('firebase') || 
      event.request.url.includes('gstatic.com')) {
    return;
  }

  event.respondWith(
    // Intentar buscar en internet primero (para tener siempre lo último)
    fetch(event.request)
      .then(response => {
        // Si hay internet, guardamos una copia actualizada
        const responseClone = response.clone();
        caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, responseClone);
        });
        return response;
      })
      .catch(() => {
        // Si NO hay internet, cargamos la copia guardada en el teléfono
        return caches.match(event.request);
      })
  );
});

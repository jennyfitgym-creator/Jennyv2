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
  const notificationTitle = payload.data?.title || payload.notification?.title || 'Jennyfit';
  
  const notificationOptions = {
    body: payload.data?.body || payload.notification?.body || 'Tienes una nueva notificación.',
    icon: './Iconojennyfit.png',
    badge: './Iconojennyfit.png',
    // 🚨 AQUÍ ESTÁ LA MAGIA PARA LA IMAGEN 🚨
    image: payload.data?.image || payload.notification?.image, 
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

// Manejador obligatorio para PWA
self.addEventListener('fetch', function(event) {
  // Manejador vacío
});

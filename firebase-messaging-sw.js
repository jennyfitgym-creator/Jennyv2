// ============================================================
// SERVICE WORKER PARA JENNYFIT (PWA + FCM)
// ============================================================

// EVENTO OBLIGATORIO PARA QUE CHROME PERMITA INSTALAR LA PWA
self.addEventListener('fetch', function(event) {
  // Dejarlo vacío es suficiente para que Chrome valide la instalación.
});

// Importar Firebase (Compatibilidad con Service Workers)
try {
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
} catch (error) {
  console.log('Error inicializando Firebase en SW:', error);
}

// Manejar el clic en la notificación
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

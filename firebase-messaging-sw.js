// Importar los scripts de Firebase (versión compat para Service Workers)
importScripts('https://www.gstatic.com/firebasejs/10.13.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.13.2/firebase-messaging-compat.js');

// Configuración de tu proyecto Jennyfit
const firebaseConfig = {
  apiKey: "AIzaSyDT0lieijjz2sxbu6PqaLmkrQ_HsDadK5M",
  authDomain: "jennyfitapp.firebaseapp.com",
  projectId: "jennyfitapp",
  storageBucket: "jennyfitapp.firebasestorage.app",
  messagingSenderId: "492885885548",
  appId: "1:492885885548:web:64d40ccffe8dad340f4e49"
};

// Inicializar Firebase en el Service Worker
firebase.initializeApp(firebaseConfig);

// Obtener la instancia de mensajería
const messaging = firebase.messaging();

// Manejar los mensajes que llegan en segundo plano (cuando la app está cerrada)
messaging.onBackgroundMessage(function(payload) {
  console.log('[firebase-messaging-sw.js] Mensaje recibido en segundo plano: ', payload);

  // Extraer datos, buscando tanto en "notification" como en "data"
  const notificationTitle = payload.notification?.title || payload.data?.title || "Jennyfit";
  const notificationBody = payload.notification?.body || payload.data?.body || "Tienes una nueva notificación";
  
  // Capturar la imagen (soporta si viene como 'image' o como 'imageUrl')
  const imageUrl = payload.notification?.image || payload.data?.imageUrl || payload.data?.image || null;

  const notificationOptions = {
    body: notificationBody,
    icon: '/Iconojennyfit.png', // El ícono pequeño de tu app
    badge: '/Iconojennyfit.png', // El ícono para la barra de estado
    vibrate: [200, 100, 200, 100, 200],
    // 👇 AQUÍ SE INYECTA LA IMAGEN GRANDE 👇
    image: imageUrl 
  };

  // Mostrar la notificación en el sistema Android
  return self.registration.showNotification(notificationTitle, notificationOptions);
});

// Manejar el clic en la notificación (abrir la app al tocarla)
self.addEventListener('notificationclick', function(event) {
  event.notification.close(); // Cerrar la notificación al tocarla

  // URL a abrir (tu app)
  const urlToOpen = new URL('/', self.location.origin).href;

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(windowClients) {
      // Si la app ya está abierta en otra pestaña, enfocarla
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      // Si no está abierta, abrir una nueva pestaña/ventana
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

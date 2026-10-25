importScripts('https://www.gstatic.com/firebasejs/10.13.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.13.2/firebase-messaging-compat.js');

const firebaseConfig = {
  apiKey: "AIzaSyDT0lieijjz2sxbu6PqaLmkrQ_HsDadK5M",
  authDomain: "jennyfitapp.firebaseapp.com",
  projectId: "jennyfitapp",
  storageBucket: "jennyfitapp.firebasestorage.app",
  messagingSenderId: "492885885548",
  appId: "1:492885885548:web:64d40ccffe8dad340f4e49"
};

firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

// FORZAR ACTUALIZACIÓN DEL SERVICE WORKER
self.addEventListener('install', (event) => {
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(clients.claim());
});

messaging.onBackgroundMessage((payload) => {
    console.log('[sw.js] Mensaje recibido:', payload);
    
    const title = payload.data?.title || payload.notification?.title || 'Jennyfit';
    const body = payload.data?.body || payload.notification?.body || '';
    
    // AQUI ESTA TU NUEVA URL Y EL FORMATO .PNG CORREGIDO
    const iconUrl = 'https://jennyv2.vercel.app/Iconojennyfit.png'; 

    const notificationOptions = {
        body: body,
        icon: iconUrl,
        badge: iconUrl,
        vibrate: [200, 100, 200]
    };

    self.registration.showNotification(title, notificationOptions);
});

// HACER QUE AL TOCAR LA NOTIFICACIÓN SE ABRA LA APP
self.addEventListener('notificationclick', function(event) {
    event.notification.close();
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
            for (var i = 0; i < clientList.length; i++) {
                var client = clientList[i];
                if (client.url === 'https://jennyv2.vercel.app/' && 'focus' in client) {
                    return client.focus();
                }
            }
            if (clients.openWindow) {
                return clients.openWindow('https://jennyv2.vercel.app/');
            }
        })
    );
});

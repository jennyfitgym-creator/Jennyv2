importScripts('https://www.gstatic.com/firebasejs/10.13.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.13.2/firebase-messaging-compat.js');

// ... (tu configuración de Firebase aquí) ...

const messaging = firebase.messaging();

messaging.onBackgroundMessage(function(payload) {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/Iconojennyfit.png', // Tu ícono
    // 👇 ESTA ES LA LÍNEA CLAVE QUE FALTA 👇
    image: payload.notification.image 
  };

  return self.registration.showNotification(notificationTitle, notificationOptions);
});

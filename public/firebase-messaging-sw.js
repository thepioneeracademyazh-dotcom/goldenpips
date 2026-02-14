// Firebase Messaging Service Worker
importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-messaging-compat.js');

// Initialize Firebase in the service worker
firebase.initializeApp({
  apiKey: "AIzaSyBdF8k3SEdt_knE74DJXOMYco97Dw1K4Ww",
  authDomain: "golden-pips.firebaseapp.com",
  projectId: "golden-pips",
  storageBucket: "golden-pips.firebasestorage.app",
  messagingSenderId: "995054352500",
  appId: "1:995054352500:web:9fca3b29f1b970f8a7b921",
  measurementId: "G-21HM6EXZ15"
});

const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('Received background message:', payload);

  // Only show custom notification if there's no notification payload
  // (FCM auto-displays when notification payload is present)
  if (payload.notification) {
    // FCM handles display automatically for notification messages
    return;
  }

  const notificationTitle = payload.data?.title || 'GoldenPips';
  const notificationOptions = {
    body: payload.data?.body || 'New notification',
    icon: 'https://goldenpips.online/icons/icon-192x192.png',
    badge: 'https://goldenpips.online/icons/icon-72x72.png',
    vibrate: [100, 50, 100],
    data: { url: 'https://goldenpips.online' },
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event);
  event.notification.close();

  // Navigate to the app
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Check if there's already a window open
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus();
        }
      }
      // Open new window if none exists
      if (clients.openWindow) {
        return clients.openWindow('https://goldenpips.online');
      }
    })
  );
});

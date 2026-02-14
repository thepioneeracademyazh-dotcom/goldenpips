// Combined Service Worker: Caching + Firebase Messaging
importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging-compat.js');

// ========== PWA CACHING ==========
const CACHE_NAME = 'goldenpips-v2';
const urlsToCache = ['/', '/index.html', '/manifest.json'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(urlsToCache))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) return caches.delete(cacheName);
        })
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  if (!event.request.url.startsWith(self.location.origin)) return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const responseClone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseClone));
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});

// ========== FIREBASE MESSAGING ==========
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

// Handle background messages - only show notification if FCM didn't auto-display
messaging.onBackgroundMessage((payload) => {
  console.log('Background message received:', payload);

  const title = payload.notification?.title || 'GoldenPips';
  const body = payload.notification?.body || 'New notification';

  return self.registration.showNotification(title, {
    body: body,
    icon: 'https://goldenpips.online/icons/icon-192x192.png',
    badge: 'https://goldenpips.online/icons/icon-72x72.png',
    vibrate: [100, 50, 100],
    data: { url: 'https://goldenpips.online' },
  });
});

// Handle notification click - always open goldenpips.online
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes('goldenpips.online') && 'focus' in client) {
          return client.focus();
        }
      }
      return clients.openWindow('https://goldenpips.online');
    })
  );
});

// Kalendary Service Worker for Push Notifications

const CACHE_NAME = 'kalendary-v1';
const urlsToCache = [
  '/',
  '/manifest.json',
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Caching app shell');
      return cache.addAll(urlsToCache);
    })
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[Service Worker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch event - serve from cache when offline
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});

// Push event - show notification
self.addEventListener('push', (event) => {
  console.log('[Service Worker] Push received:', event);

  let data = {};
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data = {
        title: 'Kalendary',
        body: event.data.text(),
      };
    }
  }

  const title = data.title || 'Kalendary';
  const options = {
    body: data.body || 'Hai una nuova notifica!',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    vibrate: [200, 100, 200],
    tag: data.tag || 'kalendary-notification',
    data: data,
    actions: [
      {
        action: 'open',
        title: 'Apri',
      },
      {
        action: 'close',
        title: 'Chiudi',
      },
    ],
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  console.log('[Service Worker] Notification clicked:', event);

  event.notification.close();

  if (event.action === 'open' || !event.action) {
    event.waitUntil(
      clients.openWindow(event.notification.data?.url || '/')
    );
  }
});

// Background sync (for offline activity creation)
self.addEventListener('sync', (event) => {
  console.log('[Service Worker] Background sync:', event.tag);

  if (event.tag === 'sync-activities') {
    event.waitUntil(syncActivities());
  }
});

async function syncActivities() {
  // This would sync any pending activities created while offline
  console.log('[Service Worker] Syncing activities...');
  // Implementation would go here
}

// G-TRAMS Official Service Worker (PWA)
// Authenticated API mutations and private document assets are never queued or cached.
const CACHE_NAME = 'gtrams-cache-v3';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/gasan-logo.png',
  '/favicon.svg',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/icons/icon-maskable-512x512.png',
  '/icons/apple-touch-icon.png'
];

// Install Event: Cache Core App Shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

// Activate Event: Clear Stale Caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event: Network-First Strategy with Cache Fallback for offline support
self.addEventListener('fetch', (event) => {
  // Only handle GET requests and skip API or WebSocket requests
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.pathname.startsWith('/api') || url.pathname.startsWith('/socket.io')) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        // Clone and cache the response for static/asset files
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return networkResponse;
      })
      .catch(async () => {
        // Offline fallback
        const cachedResponse = await caches.match(event.request);
        if (cachedResponse) return cachedResponse;
        if (event.request.mode === 'navigate') {
          return caches.match('/index.html');
        }
        return new Response('Network offline', { status: 503, statusText: 'Service Unavailable' });
      })
  );
});

// Push Event: Handle incoming push notification while app is in background or closed
self.addEventListener('push', (event) => {
  let data = {
    title: 'GTRAMS Notification',
    body: 'Mayroon kang bagong abiso mula sa GTRAMS.',
    url: '/operator-dashboard',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/favicon-32x32.png'
  };

  if (event.data) {
    try {
      const parsed = event.data.json();
      data = { ...data, ...parsed };
    } catch (e) {
      data.body = event.data.text();
    }
  }

  const rawTitle = String(data.title || 'GTRAMS');
  const rawBody = String(data.body || data.message || '');
  const combinedText = `${rawTitle} ${rawBody}`;
  const hasSensitivePaymentOrReceipt =
    /(₱|\bphp\b|\bpesos?\b|official\s*receipt|\bo\.?r\.?\s*(?:no\.?|number|#|:|-)|or#\s*[a-z0-9-]+|\bOR[-:\s#]*[A-Z0-9-]*\d+[A-Z0-9-]*|receipt(?:\s*(?:no\.?|number|#|:|-))?|e-?resibo|resibo|payer\s*:|amount\s*(?:paid|due)|payment\s*(?:confirmed|received|recorded)|cashier|treasury)/i.test(combinedText) ||
    /\bOR\b/.test(combinedText);
  const isSensitivePayload =
    Boolean(data.sensitive) ||
    hasSensitivePaymentOrReceipt;

  const displayTitle = isSensitivePayload ? 'G-TRAMS Account Update' : rawTitle;
  const displayBody = isSensitivePayload
    ? 'You have a new G-TRAMS account update. Open the app to view details.'
    : (rawBody || 'You have a new G-TRAMS account update. Open the app to view details.');

  const options = {
    body: displayBody,
    icon: data.icon || '/icons/icon-192x192.png',
    badge: data.badge || '/icons/favicon-32x32.png',
    vibrate: [150, 80, 150],
    data: {
      url: data.url || '/operator-dashboard',
      timestamp: data.timestamp || Date.now()
    },
    actions: [
      { action: 'open', title: 'Buksan ang App' }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(displayTitle, options)
  );
});

// Notification Click Event: Focus existing window or open a new one
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const targetPath = (event.notification.data && event.notification.data.url) || '/operator-dashboard';
  const targetUrl = new URL(targetPath, self.location.origin).href;

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          if ('navigate' in client) {
            client.navigate(targetUrl);
          }
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});

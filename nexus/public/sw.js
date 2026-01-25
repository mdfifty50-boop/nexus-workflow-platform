// Nexus Service Worker v2.0.0
// Enhanced caching with better API response handling and offline support

const CACHE_VERSION = 'v2';
const CACHE_NAME = `nexus-cache-${CACHE_VERSION}`;
const RUNTIME_CACHE = `nexus-runtime-${CACHE_VERSION}`;
const API_CACHE = `nexus-api-${CACHE_VERSION}`;
const IMAGE_CACHE = `nexus-images-${CACHE_VERSION}`;

// Cache TTLs (in milliseconds)
const CACHE_TTL = {
  API_SHORT: 60 * 1000,          // 1 minute - for frequently changing data
  API_MEDIUM: 5 * 60 * 1000,     // 5 minutes - default for API calls
  API_LONG: 15 * 60 * 1000,      // 15 minutes - for semi-static data
  API_EXTENDED: 60 * 60 * 1000,  // 1 hour - for static reference data
  STATIC: 7 * 24 * 60 * 60 * 1000, // 7 days - for static assets
};

// Static assets to precache for offline support
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/offline.html',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png'
];

// API endpoints with their caching strategies
const API_CACHE_RULES = {
  // Long cache - rarely changes
  '/api/chat/agents': { ttl: CACHE_TTL.API_EXTENDED, strategy: 'stale-while-revalidate' },
  '/api/tools': { ttl: CACHE_TTL.API_EXTENDED, strategy: 'stale-while-revalidate' },

  // Medium cache - changes occasionally
  '/api/templates': { ttl: CACHE_TTL.API_LONG, strategy: 'stale-while-revalidate' },
  '/api/integrations': { ttl: CACHE_TTL.API_LONG, strategy: 'stale-while-revalidate' },
  '/api/workflows': { ttl: CACHE_TTL.API_MEDIUM, strategy: 'network-first' },

  // Short cache - changes frequently
  '/api/workflows/': { ttl: CACHE_TTL.API_SHORT, strategy: 'network-first' },

  // No cache - always fresh
  '/api/chat': { ttl: 0, strategy: 'network-only' },
  '/api/execute': { ttl: 0, strategy: 'network-only' },
  '/api/sse': { ttl: 0, strategy: 'network-only' },
  '/api/admin': { ttl: 0, strategy: 'network-only' },
};

// API routes that should use network-first strategy
const API_ROUTES = [
  '/api/',
  '/rest/v1/',
  'supabase.co'
];

// Assets that can be cached aggressively (stale-while-revalidate)
const CACHEABLE_ASSETS = [
  /\.(?:js|css|woff2?|ttf|otf|eot)$/,
  /fonts\.googleapis\.com/,
  /fonts\.gstatic\.com/
];

// Image patterns for image cache
const IMAGE_PATTERNS = [
  /\.(?:png|jpg|jpeg|gif|webp|svg|ico)$/,
  /images\./,
  /avatars\./
];

// Install event - precache critical assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Precaching assets');
        return cache.addAll(PRECACHE_ASSETS);
      })
      .then(() => self.skipWaiting())
      .catch((error) => {
        console.error('[SW] Precache failed:', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((cacheName) => {
              return cacheName.startsWith('nexus-') &&
                     !cacheName.endsWith(CACHE_VERSION);
            })
            .map((cacheName) => {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            })
        );
      })
      .then(() => self.clients.claim())
  );
});

// Fetch event - implement caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip chrome-extension and other non-http(s) requests
  if (!url.protocol.startsWith('http')) {
    return;
  }

  // API calls - Apply specific caching rules
  if (isApiRequest(url)) {
    const rule = getApiCacheRule(url);

    if (rule.strategy === 'network-only') {
      event.respondWith(fetch(request));
      return;
    }

    if (rule.strategy === 'stale-while-revalidate') {
      event.respondWith(staleWhileRevalidateWithTTL(request, rule.ttl));
      return;
    }

    event.respondWith(networkFirstWithCache(request, rule.ttl));
    return;
  }

  // Navigation requests - Network first with offline fallback
  if (request.mode === 'navigate') {
    event.respondWith(navigationStrategy(request));
    return;
  }

  // Images - Cache first with network fallback
  if (isImageRequest(url)) {
    event.respondWith(cacheFirstWithNetwork(request, IMAGE_CACHE));
    return;
  }

  // Static assets - Stale while revalidate
  if (isCacheableAsset(url)) {
    event.respondWith(staleWhileRevalidate(request));
    return;
  }

  // Default - Network first
  event.respondWith(networkFirstWithCache(request, CACHE_TTL.API_MEDIUM));
});

// Check if request is an API call
function isApiRequest(url) {
  return API_ROUTES.some(route => url.href.includes(route));
}

// Check if asset should be cached aggressively
function isCacheableAsset(url) {
  return CACHEABLE_ASSETS.some(pattern => {
    if (pattern instanceof RegExp) {
      return pattern.test(url.href);
    }
    return url.href.includes(pattern);
  });
}

// Check if request is for an image
function isImageRequest(url) {
  return IMAGE_PATTERNS.some(pattern => {
    if (pattern instanceof RegExp) {
      return pattern.test(url.href);
    }
    return url.href.includes(pattern);
  });
}

// Get cache rule for API endpoint
function getApiCacheRule(url) {
  const pathname = url.pathname;

  // Check exact matches first
  for (const [pattern, rule] of Object.entries(API_CACHE_RULES)) {
    if (pathname === pattern || pathname.startsWith(pattern)) {
      return rule;
    }
  }

  // Default rule for unmatched API endpoints
  return { ttl: CACHE_TTL.API_MEDIUM, strategy: 'network-first' };
}

// Check if cached response is still valid
function isCacheValid(response, ttl) {
  if (!response) return false;
  if (ttl === 0) return false;
  if (ttl === Infinity) return true;

  const dateHeader = response.headers.get('date');
  if (!dateHeader) return true; // Assume valid if no date header

  const cachedTime = new Date(dateHeader).getTime();
  const now = Date.now();

  return (now - cachedTime) < ttl;
}

// Add cache metadata headers
function addCacheHeaders(response, ttl) {
  const headers = new Headers(response.headers);
  headers.set('sw-cache-ttl', ttl.toString());
  headers.set('sw-cached-at', new Date().toISOString());

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers
  });
}

// Network first strategy with caching and TTL
async function networkFirstWithCache(request, ttl = CACHE_TTL.API_MEDIUM) {
  const cache = await caches.open(API_CACHE);

  try {
    const networkResponse = await fetch(request);

    // Cache successful responses
    if (networkResponse.ok) {
      const responseToCache = addCacheHeaders(networkResponse.clone(), ttl);
      cache.put(request, responseToCache);
    }

    return networkResponse;
  } catch (error) {
    const cachedResponse = await cache.match(request);

    if (cachedResponse && isCacheValid(cachedResponse, ttl)) {
      console.log('[SW] Returning cached response for:', request.url);
      return cachedResponse;
    }

    // Return offline response for API calls
    if (isApiRequest(new URL(request.url))) {
      return new Response(
        JSON.stringify({
          error: 'offline',
          message: 'You are currently offline. Please check your connection.',
          cached: false
        }),
        {
          status: 503,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    throw error;
  }
}

// Stale while revalidate with TTL
async function staleWhileRevalidateWithTTL(request, ttl = CACHE_TTL.API_MEDIUM) {
  const cache = await caches.open(API_CACHE);
  const cachedResponse = await cache.match(request);

  // Background refresh
  const fetchPromise = fetch(request)
    .then((networkResponse) => {
      if (networkResponse.ok) {
        const responseToCache = addCacheHeaders(networkResponse.clone(), ttl);
        cache.put(request, responseToCache);
      }
      return networkResponse;
    })
    .catch(() => cachedResponse);

  // Return cached if valid, otherwise wait for network
  if (cachedResponse && isCacheValid(cachedResponse, ttl)) {
    console.log('[SW] Returning stale response, revalidating:', request.url);
    return cachedResponse;
  }

  return fetchPromise;
}

// Navigation strategy - network first with offline fallback page
async function navigationStrategy(request) {
  try {
    const networkResponse = await fetch(request);
    return networkResponse;
  } catch (error) {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    // Return offline page
    const offlineResponse = await caches.match('/offline.html');
    if (offlineResponse) {
      return offlineResponse;
    }

    // Fallback offline response
    return new Response(
      `<!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Offline - Nexus</title>
        <style>
          body {
            font-family: 'Inter', system-ui, sans-serif;
            background: #0f172a;
            color: #f8fafc;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            margin: 0;
            text-align: center;
            padding: 2rem;
          }
          .container { max-width: 400px; }
          h1 { color: #3b82f6; font-size: 1.5rem; margin-bottom: 1rem; }
          p { color: #94a3b8; line-height: 1.6; }
          button {
            background: #3b82f6;
            color: white;
            border: none;
            padding: 0.75rem 1.5rem;
            border-radius: 0.5rem;
            font-size: 1rem;
            cursor: pointer;
            margin-top: 1.5rem;
          }
          button:hover { background: #2563eb; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>You're Offline</h1>
          <p>It looks like you've lost your internet connection. Some features may not be available until you're back online.</p>
          <button onclick="location.reload()">Try Again</button>
        </div>
      </body>
      </html>`,
      {
        status: 200,
        headers: { 'Content-Type': 'text/html' }
      }
    );
  }
}

// Stale while revalidate - return cached version immediately, update in background
async function staleWhileRevalidate(request) {
  const cache = await caches.open(RUNTIME_CACHE);
  const cachedResponse = await cache.match(request);

  const fetchPromise = fetch(request)
    .then((networkResponse) => {
      if (networkResponse.ok) {
        cache.put(request, networkResponse.clone());
      }
      return networkResponse;
    })
    .catch(() => cachedResponse);

  return cachedResponse || fetchPromise;
}

// Cache first with network fallback (for images)
async function cacheFirstWithNetwork(request, cacheName = IMAGE_CACHE) {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);

  if (cachedResponse) {
    return cachedResponse;
  }

  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    // Return placeholder for images
    return new Response(
      `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100">
        <rect width="100" height="100" fill="#1e293b"/>
        <text x="50" y="50" text-anchor="middle" dy=".3em" fill="#64748b" font-size="12">Offline</text>
      </svg>`,
      {
        status: 200,
        headers: { 'Content-Type': 'image/svg+xml' }
      }
    );
  }
}

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-workflows') {
    event.waitUntil(syncWorkflows());
  }

  if (event.tag === 'sync-mutations') {
    event.waitUntil(syncMutations());
  }
});

// Sync queued workflow actions
async function syncWorkflows() {
  try {
    const db = await openIndexedDB();
    const queue = await getQueuedActions(db, 'syncQueue');

    for (const action of queue) {
      try {
        await fetch(action.url, {
          method: action.method,
          headers: action.headers,
          body: action.body
        });
        await removeFromQueue(db, 'syncQueue', action.id);
        console.log('[SW] Synced action:', action.id);
      } catch (error) {
        console.error('[SW] Sync failed for action:', action.id, error);
      }
    }
  } catch (error) {
    console.error('[SW] Background sync failed:', error);
  }
}

// Sync queued mutations
async function syncMutations() {
  try {
    const db = await openIndexedDB();
    const queue = await getQueuedActions(db, 'mutationQueue');

    for (const mutation of queue) {
      try {
        const response = await fetch(mutation.url, {
          method: mutation.method,
          headers: mutation.headers,
          body: mutation.body
        });

        if (response.ok) {
          await removeFromQueue(db, 'mutationQueue', mutation.id);
          // Notify clients of successful sync
          const clients = await self.clients.matchAll();
          clients.forEach(client => {
            client.postMessage({
              type: 'MUTATION_SYNCED',
              id: mutation.id,
              success: true
            });
          });
        }
      } catch (error) {
        console.error('[SW] Mutation sync failed:', mutation.id, error);
      }
    }
  } catch (error) {
    console.error('[SW] Mutation sync failed:', error);
  }
}

// IndexedDB helpers for offline queue
function openIndexedDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('nexus-offline', 2);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('syncQueue')) {
        db.createObjectStore('syncQueue', { keyPath: 'id', autoIncrement: true });
      }
      if (!db.objectStoreNames.contains('mutationQueue')) {
        db.createObjectStore('mutationQueue', { keyPath: 'id', autoIncrement: true });
      }
      if (!db.objectStoreNames.contains('offlineCache')) {
        db.createObjectStore('offlineCache', { keyPath: 'key' });
      }
    };
  });
}

function getQueuedActions(db, storeName) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([storeName], 'readonly');
    const store = transaction.objectStore(storeName);
    const request = store.getAll();

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

function removeFromQueue(db, storeName, id) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([storeName], 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.delete(id);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

// Push notification support
self.addEventListener('push', (event) => {
  if (!event.data) return;

  const data = event.data.json();

  const options = {
    body: data.body || 'You have a new notification',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    vibrate: [100, 50, 100],
    data: {
      url: data.url || '/',
      timestamp: Date.now()
    },
    actions: data.actions || [
      { action: 'open', title: 'Open' },
      { action: 'dismiss', title: 'Dismiss' }
    ],
    tag: data.tag || 'nexus-notification',
    renotify: data.renotify || false
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'Nexus', options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'dismiss') {
    return;
  }

  const urlToOpen = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((windowClients) => {
        // Check if there's already a window open
        for (const client of windowClients) {
          if (client.url.includes(self.registration.scope)) {
            client.focus();
            client.navigate(urlToOpen);
            return;
          }
        }
        // Open new window if none exists
        return clients.openWindow(urlToOpen);
      })
  );
});

// Periodic background sync for keeping data fresh
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'refresh-workflows') {
    event.waitUntil(refreshWorkflowData());
  }

  if (event.tag === 'cleanup-cache') {
    event.waitUntil(cleanupExpiredCache());
  }
});

async function refreshWorkflowData() {
  try {
    const response = await fetch('/api/workflows/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });

    if (response.ok) {
      console.log('[SW] Workflow data refreshed in background');
    }
  } catch (error) {
    console.log('[SW] Background refresh failed (offline)');
  }
}

// Cleanup expired cache entries
async function cleanupExpiredCache() {
  const cacheNames = await caches.keys();

  for (const cacheName of cacheNames) {
    if (!cacheName.startsWith('nexus-')) continue;

    const cache = await caches.open(cacheName);
    const requests = await cache.keys();

    for (const request of requests) {
      const response = await cache.match(request);
      if (response) {
        const ttlHeader = response.headers.get('sw-cache-ttl');
        const cachedAt = response.headers.get('sw-cached-at');

        if (ttlHeader && cachedAt) {
          const ttl = parseInt(ttlHeader, 10);
          const cachedTime = new Date(cachedAt).getTime();
          const now = Date.now();

          if ((now - cachedTime) > ttl) {
            await cache.delete(request);
            console.log('[SW] Cleaned up expired cache:', request.url);
          }
        }
      }
    }
  }
}

// Message handler for communication with main app
self.addEventListener('message', (event) => {
  if (event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: CACHE_NAME });
  }

  if (event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter(name => name.startsWith('nexus-'))
            .map((cacheName) => caches.delete(cacheName))
        );
      }).then(() => {
        event.ports[0]?.postMessage({ success: true });
      })
    );
  }

  if (event.data.type === 'INVALIDATE_CACHE') {
    const { pattern } = event.data;
    event.waitUntil(
      invalidateCacheByPattern(pattern).then(() => {
        event.ports[0]?.postMessage({ success: true });
      })
    );
  }

  if (event.data.type === 'CACHE_STATS') {
    event.waitUntil(
      getCacheStats().then((stats) => {
        event.ports[0]?.postMessage(stats);
      })
    );
  }

  if (event.data.type === 'QUEUE_MUTATION') {
    const { url, method, headers, body, id } = event.data;
    event.waitUntil(
      queueMutation({ url, method, headers, body, id }).then(() => {
        event.ports[0]?.postMessage({ success: true, queued: true });
      })
    );
  }
});

// Invalidate cache by URL pattern
async function invalidateCacheByPattern(pattern) {
  const cacheNames = await caches.keys();
  const regex = new RegExp(pattern);

  for (const cacheName of cacheNames) {
    if (!cacheName.startsWith('nexus-')) continue;

    const cache = await caches.open(cacheName);
    const requests = await cache.keys();

    for (const request of requests) {
      if (regex.test(request.url)) {
        await cache.delete(request);
        console.log('[SW] Invalidated cache:', request.url);
      }
    }
  }
}

// Get cache statistics
async function getCacheStats() {
  const stats = {
    caches: {},
    totalSize: 0,
    totalEntries: 0
  };

  const cacheNames = await caches.keys();

  for (const cacheName of cacheNames) {
    if (!cacheName.startsWith('nexus-')) continue;

    const cache = await caches.open(cacheName);
    const requests = await cache.keys();

    stats.caches[cacheName] = {
      entries: requests.length,
      urls: requests.map(r => r.url)
    };
    stats.totalEntries += requests.length;
  }

  return stats;
}

// Queue a mutation for background sync
async function queueMutation(mutation) {
  const db = await openIndexedDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['mutationQueue'], 'readwrite');
    const store = transaction.objectStore('mutationQueue');
    const request = store.add({
      ...mutation,
      timestamp: Date.now()
    });

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      // Request background sync
      if ('sync' in self.registration) {
        self.registration.sync.register('sync-mutations');
      }
      resolve();
    };
  });
}

console.log('[SW] Service Worker loaded - Nexus PWA v2.0.0');

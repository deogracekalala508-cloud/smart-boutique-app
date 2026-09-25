// ── Smart Boutique Service Worker ──────────────────────────────────────────
const CACHE_NAME = 'smart-boutique-v3';

// ── Installation ────────────────────────────────────────────────────────────
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

// ── Activation (suppression des anciens caches) ──────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(
        keyList.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// ── Interception des requêtes (Network-First pour toujours avoir la version à jour) ──
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Ignorer les requêtes non-GET et les requêtes API (toujours réseau direct)
  if (event.request.method !== 'GET' || url.pathname.startsWith('/api/') || url.hostname !== self.location.hostname) {
    return;
  }

  // Network-First strategy : Tente d'abord de récupérer depuis le réseau
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response && response.status === 200 && response.type === 'basic') {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        // En cas de panne de réseau (hors-ligne), on cherche dans le cache
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          if (event.request.mode === 'navigate') {
            return caches.match('/');
          }
        });
      })
  );
});

// ── Synchronisation en arrière-plan ─────────────────────────────────────────
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-ventes-offline') {
    event.waitUntil(
      self.clients.matchAll().then(clients => {
        clients.forEach(client => {
          client.postMessage({ type: 'SYNC_OFFLINE_SALES' });
        });
      })
    );
  }
});

// ── Smart Boutique Service Worker ──────────────────────────────────────────
const CACHE_NAME = 'smart-boutique-v2';
const OFFLINE_URL = '/';

// Ressources de l'application à mettre en cache (shell)
const SHELL_ASSETS = [
  '/',
  '/index.html',
  '/static/js/main.chunk.js',
  '/static/js/bundle.js',
  '/static/js/0.chunk.js',
  '/manifest.json',
];

// ── Installation ────────────────────────────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(SHELL_ASSETS).catch(() => {
        // Ignorer les erreurs si certains fichiers n'existent pas (dev vs prod)
        return cache.add('/');
      });
    })
  );
  self.skipWaiting();
});

// ── Activation ──────────────────────────────────────────────────────────────
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

// ── Interception des requêtes ────────────────────────────────────────────────
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Ne pas intercepter les appels API — ils doivent toujours aller au réseau
  if (url.pathname.startsWith('/api/') || url.hostname !== self.location.hostname) {
    // Pour les requêtes API, on laisse passer directement
    // Si elles échouent, c'est au client de gérer le mode hors ligne
    event.respondWith(fetch(event.request).catch(() => {
      return new Response(JSON.stringify({ offline: true, message: 'Hors ligne' }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }));
    return;
  }

  // Pour les autres ressources : Cache-first, puis réseau
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request).then((response) => {
        // Mettre en cache les nouvelles ressources statiques
        if (response.ok && event.request.method === 'GET') {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      }).catch(() => {
        // Fallback vers l'index.html pour les navigations
        if (event.request.mode === 'navigate') {
          return caches.match('/index.html').then(r => r || caches.match('/'));
        }
      });
    })
  );
});

// ── Synchronisation en arrière-plan (Background Sync) ───────────────────────
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-ventes-offline') {
    event.waitUntil(syncVentesOffline());
  }
});

async function syncVentesOffline() {
  // Notifier tous les clients de lancer la synchronisation
  const clients = await self.clients.matchAll();
  clients.forEach(client => {
    client.postMessage({ type: 'SYNC_OFFLINE_SALES' });
  });
}

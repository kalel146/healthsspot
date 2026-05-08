/* Health's Spot service-worker kill switch
   Deploy this at /sw.js to replace any old vite-plugin-pwa worker.
   It clears old caches, unregisters itself, and reloads open clients once. */
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    try {
      const keys = await caches.keys();
      await Promise.all(keys.map((key) => caches.delete(key)));
    } catch (_) {}

    try {
      await self.registration.unregister();
    } catch (_) {}

    try {
      const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
      for (const client of windows) {
        client.navigate(client.url);
      }
    } catch (_) {}
  })());
});

self.addEventListener('fetch', () => {
  // Intentionally empty. This worker should not cache or intercept app assets.
});

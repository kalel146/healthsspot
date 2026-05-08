// Legacy vite-plugin-pwa compatibility cleanup.
// If an old app shell still requests /registerSW.js, use that moment to unregister every SW.
(async () => {
  try {
    if ('serviceWorker' in navigator) {
      const regs = await navigator.serviceWorker.getRegistrations();
      await Promise.all(regs.map((reg) => reg.unregister().catch(() => false)));
    }
  } catch (_) {}

  try {
    if ('caches' in window) {
      const keys = await caches.keys();
      await Promise.all(keys.map((key) => caches.delete(key).catch(() => false)));
    }
  } catch (_) {}
})();

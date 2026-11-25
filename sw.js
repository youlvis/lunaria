self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(retireServiceWorker());
});

async function retireServiceWorker() {
  await self.registration.unregister();

  const cacheNames = await caches.keys();
  const lunariaCaches = cacheNames.filter(
    (name) => name.startsWith("lunaria-shell-v") || name === "lunaria-images-v1",
  );
  await Promise.all(lunariaCaches.map((name) => caches.delete(name)));
}

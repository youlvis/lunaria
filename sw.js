// Versión del Service Worker — incrementar para forzar actualización del shell
const SW_VERSION = "1.2.4";
const SHELL_CACHE = `lunaria-shell-v${SW_VERSION}`;

// Archivos que forman el "app shell" (estructura de la app)
const SHELL_ASSETS = [
  "/",
  "/index.html",
  "/eventos.html",
  "/assets/css/styles.css",
  "/assets/css/eventos.css",
  "/assets/js/config.js",
  "/assets/js/appmode.js",
  "/assets/js/api.js",
  "/assets/js/store.js",
  "/assets/js/ui.js",
  "/assets/js/main.js",
  "/assets/js/eventos.js",
  "/assets/img/search.svg",
  "/assets/img/menu-icon.svg",
  "/assets/img/close-icon.svg",
  "/assets/img/icon-close.svg",
];

// Cache para imágenes de Cloudinary
const IMG_CACHE = "lunaria-images-v1";
const MAX_CACHED_IMAGES = 150;

// --- Install: cachear el app shell (bypass browser cache para obtener archivos frescos) ---
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE).then((cache) => {
      const requests = SHELL_ASSETS.map((url) => new Request(url, { cache: "reload" }));
      return cache.addAll(requests);
    })
  );
  self.skipWaiting();
});

// --- Activate: limpiar caches viejos ---
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k !== SHELL_CACHE && k !== IMG_CACHE)
          .map((k) => caches.delete(k))
      )
    ).then(() => {
      // Avisar a todas las pestañas abiertas que hay versión nueva
      self.clients.matchAll().then((clients) => {
        clients.forEach((client) => client.postMessage({ type: "SW_UPDATED" }));
      });
    })
  );
  self.clients.claim();
});

// --- Fetch: estrategia por tipo de recurso ---
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // API de Google Apps Script → network-first (intenta red, fallback a caché)
  if (url.hostname === "script.google.com") {
    event.respondWith(networkFirst(request));
    return;
  }

  // Imágenes de Cloudinary → cache-first (sirve caché, actualiza en fondo)
  if (url.hostname === "res.cloudinary.com") {
    event.respondWith(cacheFirstImages(request));
    return;
  }

  // Google Fonts → cache-first
  if (url.hostname === "fonts.googleapis.com" || url.hostname === "fonts.gstatic.com") {
    event.respondWith(cacheFirst(request, SHELL_CACHE));
    return;
  }

  // App shell (archivos locales) → cache-first
  // Cuando cambias SW_VERSION, el cache viejo se borra y todo se descarga fresco
  if (url.origin === self.location.origin) {
    event.respondWith(cacheFirst(request, SHELL_CACHE));
    return;
  }
});

// --- Estrategias ---

// Cache-first: sirve desde caché, si no existe va a la red
async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return new Response("Offline", { status: 503 });
  }
}

// Network-first: intenta la red, si falla sirve caché
async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(SHELL_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    return cached || new Response('{"items":[],"config":{}}', {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }
}

// Cache-first para imágenes con límite de entradas
async function cacheFirstImages(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(IMG_CACHE);
      cache.put(request, response.clone());
      trimCache(IMG_CACHE, MAX_CACHED_IMAGES);
    }
    return response;
  } catch {
    return new Response("", { status: 404 });
  }
}

// Evitar que el cache de imágenes crezca sin límite
async function trimCache(cacheName, maxItems) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  if (keys.length > maxItems) {
    await cache.delete(keys[0]);
    trimCache(cacheName, maxItems);
  }
}

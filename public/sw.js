/* Классная копилка — service worker
   Стратегия:
   - страницы (навигация): network-first, с кэшем на случай офлайна;
   - всё остальное того же origin: cache-first с дозаписью в кэш.
   Приложение собирается в один HTML-файл, поэтому достаточно кэшировать
   саму страницу, манифест и иконку — офлайн работает полностью. */

const CACHE = "kopilka-v1";
const CORE = ["./", "./manifest.webmanifest", "./icons/icon-512.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(CORE))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)));
      await self.clients.claim();
    })()
  );
});

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") self.skipWaiting();
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  let url;
  try {
    url = new URL(req.url);
  } catch {
    return;
  }
  if (url.origin !== self.location.origin) return;

  // Навигация: сначала сеть (так обновления с GitHub Pages подхватываются
  // автоматически), при отсутствии сети — кэш.
  if (req.mode === "navigate") {
    event.respondWith(
      (async () => {
        try {
          const fresh = await fetch(req, { cache: "no-store" });
          const cache = await caches.open(CACHE);
          cache.put("./", fresh.clone());
          return fresh;
        } catch {
          const cached = (await caches.match("./")) || (await caches.match(req));
          return cached || Response.error();
        }
      })()
    );
    return;
  }

  // Статика: cache-first.
  event.respondWith(
    (async () => {
      const cached = await caches.match(req);
      if (cached) return cached;
      try {
        const fresh = await fetch(req);
        if (fresh.ok) {
          const cache = await caches.open(CACHE);
          cache.put(req, fresh.clone());
        }
        return fresh;
      } catch {
        return cached || Response.error();
      }
    })()
  );
});

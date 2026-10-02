/* Классная копилка — service worker
   - страница: network-first, чтобы обновления подхватывались автоматически;
   - статика: cache-first;
   - кэш kopilka-user-* с пользовательскими данными никогда не очищается;
   - запросы/адреса с резервными данными во внешние сети не уходят. */

const CACHE = "kopilka-v2-host";
const USER_CACHE_PREFIX = "kopilka-user-";
const PROTECTED_PATHS = ["__kopilka_backup__/", "__kopilka_photo__/"];
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
      // Старый технический кэш kopilka-v1 не трогаем: в нём может лежать
      // последняя аварийная копия данных, которую клиент ещё не восстановил.
      await Promise.all(
        keys
          .filter((k) => {
            if (k.startsWith(USER_CACHE_PREFIX)) return false;
            if (k === CACHE) return false;
            if (k === "kopilka-v1") return false;
            return true;
          })
          .map((k) => caches.delete(k))
      );
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

  // Адреса резервных данных обрабатываются только Cache API на клиенте.
  // Воркер никогда не возвращает их сетевыми ответами и не перезаписывает.
  if (PROTECTED_PATHS.some((p) => url.pathname.includes(p))) return;

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

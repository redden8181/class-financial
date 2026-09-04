/* КлассКасса — service worker (шаблон).
 * При каждой сборке next.config.ts подставляет 1.0.0-1788528551985 и 
 * и записывает результат в public/sw.js. Не редактируйте public/sw.js вручную.
 *
 * Стратегии кэширования:
 *  - HTML-навигация:        network-first  → новая версия приложения приходит сразу;
 *  - _next/static + icons:  cache-first    → хэшированные файлы неизменны;
 *  - прочее:                stale-while-revalidate.
 * Данные пользователя (IndexedDB/localStorage) кэшем не затрагиваются.
 */
const VERSION = "1.0.0-1788528551985";
const BASE = "";

const STATIC_CACHE = `kk-static-${VERSION}`;
const PAGES_CACHE = `kk-pages-${VERSION}`;
const ASSETS_CACHE = `kk-assets-${VERSION}`;
const CURRENT_CACHES = [STATIC_CACHE, PAGES_CACHE, ASSETS_CACHE];

self.addEventListener("install", () => {
  // Обновление активируем по команде страницы (SKIP_WAITING),
  // чтобы приложение само решило, когда перезагрузиться.
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      // Удаляем кэши всех предыдущих версий — старые файлы не копятся.
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((key) => key.startsWith("kk-") && !CURRENT_CACHES.includes(key))
          .map((key) => caches.delete(key)),
      );
      await self.clients.claim();
    })(),
  );
});

self.addEventListener("message", (event) => {
  if (!event.data || typeof event.data !== "object") return;
  if (event.data.type === "SKIP_WAITING") self.skipWaiting();
});

const STATIC_PREFIX = `${BASE}/_next/static/`;
const ICONS_PREFIX = `${BASE}/icons/`;
const API_PREFIX = `${BASE}/api/`;

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith(API_PREFIX)) return;

  // HTML-навигация — network-first
  if (request.mode === "navigate") {
    event.respondWith(networkFirst(request));
    return;
  }

  // Хэшированная статика сборки и иконки — cache-first
  if (url.pathname.startsWith(STATIC_PREFIX) || url.pathname.startsWith(ICONS_PREFIX)) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // Остальное (manifest, медиа, шрифты) — stale-while-revalidate
  event.respondWith(staleWhileRevalidate(request));
});

async function networkFirst(request) {
  const cache = await caches.open(PAGES_CACHE);
  try {
    const response = await fetch(request);
    if (response.ok) await cache.put(request, response.clone());
    return response;
  } catch {
    const cached =
      (await cache.match(request, { ignoreSearch: true })) ||
      (await caches.match(`${BASE}/`, { ignoreSearch: true }));
    return (
      cached ||
      new Response("Нет соединения. Откройте приложение, когда появится интернет.", {
        status: 503,
        headers: { "Content-Type": "text/plain; charset=utf-8" },
      })
    );
  }
}

async function cacheFirst(request) {
  const cache = await caches.open(STATIC_CACHE);
  const cached = await cache.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok) await cache.put(request, response.clone());
  return response;
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(ASSETS_CACHE);
  const cached = await cache.match(request);
  const update = fetch(request)
    .then((response) => {
      if (response.ok) cache.put(request, response.clone());
      return response;
    })
    .catch(() => cached);
  return cached || update;
}

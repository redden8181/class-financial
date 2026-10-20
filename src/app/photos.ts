import { USER_CACHE } from "./storage";

/**
 * Хранилище фотографий чеков в IndexedDB.
 * Картинки держим отдельно от основных данных (localStorage), чтобы
 * не упереться в лимит ~5 МБ. Перед сохранением фото сжимается.
 */

const DB_NAME = "klassnaya-kopilka-photos";
const STORE = "photos";
const DB_VERSION = 1;

let dbPromise: Promise<IDBDatabase> | null = null;

function openDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return dbPromise;
}

function photoCacheUrl(id: string): string {
  return new URL(`./__kopilka_photo__/${encodeURIComponent(id)}`, document.baseURI).toString();
}

async function savePhotoToCache(id: string, dataUrl: string): Promise<boolean> {
  if (!("caches" in window)) return false;
  try {
    const cache = await caches.open(USER_CACHE);
    await cache.put(
      photoCacheUrl(id),
      new Response(dataUrl, { headers: { "content-type": "text/plain" } })
    );
    return true;
  } catch {
    return false;
  }
}

async function getPhotoFromCache(id: string): Promise<string | null> {
  if (!("caches" in window)) return null;
  const names = [USER_CACHE, ...(await caches.keys().catch(() => [USER_CACHE]))].filter(
    (n) => n === USER_CACHE || n.startsWith("kopilka-")
  );
  for (const name of names) {
    try {
      const response = await (await caches.open(name)).match(photoCacheUrl(id));
      if (response) return await response.text();
    } catch {
      /* пробуем следующий кэш */
    }
  }
  return null;
}

export async function savePhoto(id: string, dataUrl: string): Promise<void> {
  const cacheWrite = savePhotoToCache(id, dataUrl);
  let savedToDB = false;
  try {
    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, "readwrite");
      tx.objectStore(STORE).put(dataUrl, id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
    savedToDB = true;
  } catch {
    /* noop */
  }
  const savedToCache = await cacheWrite;
  if (!savedToDB && !savedToCache) throw new Error("Не удалось сохранить фото");
}

export async function getPhoto(id: string): Promise<string | null> {
  try {
    const db = await openDB();
    const local = await new Promise<string | null>((resolve, reject) => {
      const tx = db.transaction(STORE, "readonly");
      const req = tx.objectStore(STORE).get(id);
      req.onsuccess = () => resolve((req.result as string) ?? null);
      req.onerror = () => reject(req.error);
    });
    if (local) {
      // Старые фото могли существовать только в IndexedDB. При первом чтении
      // зеркалим их в общий кэш, чтобы вторая иконка PWA тоже могла их открыть.
      void savePhotoToCache(id, local);
      return local;
    }
  } catch {
    /* пробуем общий кэш ниже */
  }
  const cached = await getPhotoFromCache(id);
  // Восстановить локальную копию, если фото нашлось в общем кэше.
  if (cached) void savePhoto(id, cached).catch(() => undefined);
  return cached;
}

export async function deletePhoto(id: string): Promise<void> {
  const cacheDelete = (async () => {
    if (!("caches" in window)) return;
    try {
      await (await caches.open(USER_CACHE)).delete(photoCacheUrl(id));
    } catch {
      /* noop */
    }
  })();
  try {
    const db = await openDB();
    await new Promise<void>((resolve) => {
      const tx = db.transaction(STORE, "readwrite");
      tx.objectStore(STORE).delete(id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    });
  } catch {
    /* noop */
  }
  await cacheDelete;
}

/** Фото, на которые ссылается резервная копия приложения. */
export async function exportPhotos(ids: string[]): Promise<Record<string, string>> {
  const unique = [...new Set(ids)];
  const entries = await Promise.all(
    unique.map(async (id) => [id, await getPhoto(id)] as const)
  );
  return Object.fromEntries(entries.filter((entry): entry is readonly [string, string] => Boolean(entry[1])));
}

export async function importPhotos(photos: Record<string, string>): Promise<void> {
  await Promise.all(
    Object.entries(photos).map(([id, dataUrl]) => savePhoto(id, dataUrl))
  );
}

/**
 * Сжимает фото до разумного размера (макс. сторона 1400 px, JPEG ~0.7)
 * и возвращает data URL.
 */
export function compressImage(file: File, maxSide = 1400, quality = 0.7): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Не удалось прочитать файл"));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("Не удалось открыть изображение"));
      img.onload = () => {
        const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
        const w = Math.round(img.width * scale);
        const h = Math.round(img.height * scale);
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(String(reader.result));
          return;
        }
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}

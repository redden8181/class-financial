import {
  DEFAULT_CLASS_NAME,
  emptyData,
  type AppData,
  type Contribution,
  type Expense,
  type ExpensesMap,
  type PaymentsMap,
  type RootData,
  type SchoolClass,
} from "./types";
import { uid } from "./utils";

/**
 * Защищённое локальное хранилище. Все данные лежат только на устройстве.
 *
 * Зеркалирование: localStorage + резервные ключи + IndexedDB + Cache Storage.
 * Пустое состояние никогда не перезаписывает непустую копию.
 */

const LOCAL_KEY = "klassnaya-kopilka/v1";
const LOCAL_UPDATED_KEY = "klassnaya-kopilka/updated-at";
const LOCAL_MIRROR_KEYS = [
  "klassnaya-kopilka/backup-a",
  "klassnaya-kopilka/backup-b",
];
const BACKUP_DBS = ["klassnaya-kopilka-durable", "klassnaya-kopilka-durable-v2"];
const BACKUP_STORE = "snapshots";
const BACKUP_KEY = "latest";
export const USER_CACHE = "kopilka-user-data-v1";
export const SW_APP_CACHES = ["kopilka-v1", "kopilka-v2-host"];
const SW_MIRROR_ID = "sw-last-resort-v1";

interface Snapshot {
  version: 1;
  updatedAt: number;
  data: RootData;
}

export interface StorageAdapter {
  load(): RootData;
  loadBackup(): RootData | null;
  recover(local: RootData): Promise<RootData>;
  save(data: RootData): void;
}

/* --------------------------- нормализация данных --------------------------- */

function normalizePayments(
  raw: unknown,
  amountByCollection: Map<string, number>
): PaymentsMap {
  const out: PaymentsMap = {};
  if (!raw || typeof raw !== "object") return out;

  for (const [collectionId, perChild] of Object.entries(raw as Record<string, unknown>)) {
    if (!perChild || typeof perChild !== "object") continue;
    const target: Record<string, { contributions: Contribution[] }> = {};

    for (const [childId, state] of Object.entries(perChild as Record<string, unknown>)) {
      const s = state as
        | { contributions?: Contribution[]; paid?: boolean; paidAt?: number }
        | null;
      if (!s) continue;

      if (Array.isArray(s.contributions)) {
        const contributions = s.contributions
          .filter((c) => c && typeof c.amount === "number" && c.amount > 0)
          .map((c) => ({
            id: typeof c.id === "string" ? c.id : uid(),
            amount: c.amount,
            date: typeof c.date === "number" ? c.date : Date.now(),
          }));
        if (contributions.length > 0) target[childId] = { contributions };
      } else if (s.paid === true) {
        const amount = amountByCollection.get(collectionId) ?? 0;
        if (amount > 0) {
          target[childId] = {
            contributions: [
              {
                id: uid(),
                amount,
                date: typeof s.paidAt === "number" ? s.paidAt : Date.now(),
              },
            ],
          };
        }
      }
    }

    if (Object.keys(target).length > 0) out[collectionId] = target;
  }

  return out;
}

function normalizeExpenses(raw: unknown): ExpensesMap {
  const out: ExpensesMap = {};
  if (!raw || typeof raw !== "object") return out;

  for (const [collectionId, list] of Object.entries(raw as Record<string, unknown>)) {
    if (!Array.isArray(list)) continue;
    const items: Expense[] = list
      .filter((e) => e && typeof e.amount === "number" && e.amount > 0)
      .map((e) => ({
        id: typeof e.id === "string" ? e.id : uid(),
        title: typeof e.title === "string" ? e.title : "Расход",
        amount: e.amount,
        date: typeof e.date === "string" ? e.date : "",
        note: typeof e.note === "string" ? e.note : undefined,
        photoId: typeof e.photoId === "string" ? e.photoId : undefined,
        createdAt: typeof e.createdAt === "number" ? e.createdAt : Date.now(),
      }));
    if (items.length > 0) out[collectionId] = items;
  }

  return out;
}

/** данные одного класса */
export function normalizeAppData(raw: unknown): AppData {
  if (!raw || typeof raw !== "object") return { ...emptyData };
  const parsed = raw as Partial<AppData>;
  const collections = Array.isArray(parsed.collections) ? parsed.collections : [];
  const amountByCollection = new Map(collections.map((c) => [c.id, c.amount]));

  return {
    children: Array.isArray(parsed.children) ? parsed.children : [],
    collections,
    payments: normalizePayments(parsed.payments, amountByCollection),
    expenses: normalizeExpenses(parsed.expenses),
  };
}

export function hasAppData(data: AppData): boolean {
  return (
    data.children.length > 0 ||
    data.collections.length > 0 ||
    Object.keys(data.payments).length > 0 ||
    Object.keys(data.expenses).length > 0
  );
}

export function createEmptyRoot(name = DEFAULT_CLASS_NAME): RootData {
  const id = uid();
  return {
    classes: [{ id, name, createdAt: Date.now() }],
    activeClassId: id,
    byClass: { [id]: { ...emptyData } },
  };
}

/** Поддерживает и новый формат (классы), и старый (один класс одним объектом). */
export function normalizeRootData(raw: unknown): RootData {
  if (!raw || typeof raw !== "object") return createEmptyRoot();
  const value = raw as Partial<RootData> & Partial<AppData>;

  // новый формат
  if (Array.isArray(value.classes) && value.byClass && typeof value.byClass === "object") {
    const classes: SchoolClass[] = value.classes
      .filter((c) => c && typeof c.id === "string")
      .map((c) => ({
        id: c.id,
        name: typeof c.name === "string" && c.name.trim() ? c.name : DEFAULT_CLASS_NAME,
        createdAt: typeof c.createdAt === "number" ? c.createdAt : Date.now(),
      }));

    if (classes.length === 0) return createEmptyRoot();

    const byClass: Record<string, AppData> = {};
    for (const c of classes) {
      byClass[c.id] = normalizeAppData((value.byClass as Record<string, unknown>)[c.id]);
    }

    const activeClassId =
      typeof value.activeClassId === "string" &&
      classes.some((c) => c.id === value.activeClassId)
        ? value.activeClassId
        : classes[0].id;

    return { classes, activeClassId, byClass };
  }

  // старый формат — переносим всё в первый класс
  const legacy = normalizeAppData(value);
  const root = createEmptyRoot();
  root.byClass[root.activeClassId] = legacy;
  return root;
}

export function hasRootData(root: RootData): boolean {
  if (root.classes.length > 1) return true;
  return Object.values(root.byClass).some(hasAppData);
}

/** все id фотографий чеков во всех классах */
export function allPhotoIds(root: RootData): string[] {
  const ids: string[] = [];
  for (const data of Object.values(root.byClass)) {
    for (const list of Object.values(data.expenses)) {
      for (const e of list) if (e.photoId) ids.push(e.photoId);
    }
  }
  return ids;
}

function isSnapshot(value: unknown): value is Snapshot {
  if (!value || typeof value !== "object") return false;
  const s = value as Partial<Snapshot>;
  return typeof s.updatedAt === "number" && Boolean(s.data);
}

function normalizeSnapshot(value: unknown): Snapshot | null {
  if (!isSnapshot(value)) return null;
  const data = normalizeRootData(value.data);
  if (!hasRootData(data)) return null;
  return { version: 1, updatedAt: value.updatedAt, data };
}

/* ------------------------------ IndexedDB ------------------------------ */

const backupDbPromises = new Map<string, Promise<IDBDatabase>>();

function openBackupDB(name: string): Promise<IDBDatabase> {
  const cached = backupDbPromises.get(name);
  if (cached) return cached;
  const promise = new Promise<IDBDatabase>((resolve, reject) => {
    const req = indexedDB.open(name, 1);
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains(BACKUP_STORE)) {
        req.result.createObjectStore(BACKUP_STORE);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  backupDbPromises.set(name, promise);
  return promise;
}

async function readIndexedSnapshots(): Promise<Snapshot[]> {
  return (
    await Promise.all(
      BACKUP_DBS.map(async (name) => {
        try {
          const db = await openBackupDB(name);
          const value = await new Promise<unknown>((resolve, reject) => {
            const req = db
              .transaction(BACKUP_STORE, "readonly")
              .objectStore(BACKUP_STORE)
              .get(BACKUP_KEY);
            req.onsuccess = () => resolve(req.result);
            req.onerror = () => reject(req.error);
          });
          return normalizeSnapshot(value);
        } catch {
          return null;
        }
      })
    )
  ).filter((s): s is Snapshot => Boolean(s));
}

async function writeIndexedSnapshots(snapshot: Snapshot): Promise<void> {
  await Promise.all(
    BACKUP_DBS.map(async (name) => {
      try {
        const db = await openBackupDB(name);
        await new Promise<void>((resolve, reject) => {
          const tx = db.transaction(BACKUP_STORE, "readwrite");
          tx.objectStore(BACKUP_STORE).put(snapshot, BACKUP_KEY);
          tx.oncomplete = () => resolve();
          tx.onerror = () => reject(tx.error);
        });
      } catch {
        /* слой недоступен */
      }
    })
  );
}

/* ------------------------------ Cache API ------------------------------ */

function snapshotCacheUrl(id = "latest"): string {
  return new URL(`./__kopilka_backup__/${id}`, document.baseURI).toString();
}

function snapshotResponse(snapshot: Snapshot): Response {
  return new Response(JSON.stringify(snapshot), {
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

export async function writeSnapshotToUserCaches(snapshot: Snapshot): Promise<void> {
  if (!("caches" in window)) return;
  await Promise.all(
    [USER_CACHE, ...SW_APP_CACHES].map(async (cacheName) => {
      try {
        const cache = await caches.open(cacheName);
        await Promise.all([
          cache.put(snapshotCacheUrl("latest"), snapshotResponse(snapshot)),
          cache.put(snapshotCacheUrl(SW_MIRROR_ID), snapshotResponse(snapshot)),
        ]);
      } catch {
        /* кэш недоступен */
      }
    })
  );
}

async function readCacheSnapshots(): Promise<Snapshot[]> {
  if (!("caches" in window)) return [];
  const names = await caches.keys().catch(() => [] as string[]);
  const targetNames = [
    USER_CACHE,
    ...SW_APP_CACHES,
    ...names.filter(
      (n) =>
        !SW_APP_CACHES.includes(n) &&
        n !== USER_CACHE &&
        n.startsWith("kopilka-") &&
        !n.startsWith("kopilka-user-")
    ),
  ];

  return (
    await Promise.all(
      targetNames.map(async (cacheName) => {
        for (const id of ["latest", SW_MIRROR_ID]) {
          try {
            const response = await (await caches.open(cacheName)).match(snapshotCacheUrl(id));
            if (!response) continue;
            const snapshot = normalizeSnapshot(await response.json());
            if (snapshot) return snapshot;
          } catch {
            /* пробуем следующий адрес */
          }
        }
        return null;
      })
    )
  ).filter((s): s is Snapshot => Boolean(s));
}

export async function requestPersistentStorage(): Promise<boolean | null> {
  try {
    if (!navigator.storage?.persist) return null;
    if (await navigator.storage.persisted()) return true;
    return await navigator.storage.persist();
  } catch {
    return null;
  }
}

/* --------------------------- адаптер хранилища --------------------------- */

class DurableStorageAdapter implements StorageAdapter {
  load(): RootData {
    try {
      const raw = localStorage.getItem(LOCAL_KEY);
      return raw ? normalizeRootData(JSON.parse(raw)) : createEmptyRoot();
    } catch {
      return createEmptyRoot();
    }
  }

  loadBackup(): RootData | null {
    const candidates: Snapshot[] = [];
    try {
      for (const key of LOCAL_MIRROR_KEYS) {
        const snapshot = normalizeSnapshot(JSON.parse(localStorage.getItem(key) ?? "null"));
        if (snapshot) candidates.push(snapshot);
      }
    } catch {
      /* резервная подпись повреждена */
    }
    candidates.sort((a, b) => b.updatedAt - a.updatedAt);
    return candidates[0]?.data ?? null;
  }

  async recover(local: RootData): Promise<RootData> {
    void requestPersistentStorage();

    if (!hasRootData(local)) {
      const backup = this.loadBackup();
      if (backup) return backup;
    }

    const localUpdatedAt = Number(localStorage.getItem(LOCAL_UPDATED_KEY) ?? 0);
    const candidates: Snapshot[] = [];
    if (hasRootData(local)) {
      candidates.push({ version: 1, updatedAt: localUpdatedAt, data: local });
    }

    const backup = this.loadBackup();
    if (backup) candidates.push({ version: 1, updatedAt: localUpdatedAt, data: backup });

    const [indexed, cached] = await Promise.all([
      readIndexedSnapshots(),
      readCacheSnapshots(),
    ]);
    candidates.push(...indexed, ...cached);

    if (candidates.length === 0) return local;
    candidates.sort((a, b) => b.updatedAt - a.updatedAt);
    return candidates[0].data;
  }

  save(data: RootData): void {
    const updatedAt = Date.now();
    try {
      localStorage.setItem(LOCAL_KEY, JSON.stringify(data));
      localStorage.setItem(LOCAL_UPDATED_KEY, String(updatedAt));
    } catch {
      /* основной слой переполнен */
    }

    if (!hasRootData(data)) return;
    const snapshot: Snapshot = { version: 1, updatedAt, data };

    try {
      const json = JSON.stringify(snapshot);
      for (const key of LOCAL_MIRROR_KEYS) localStorage.setItem(key, json);
    } catch {
      /* дублирующие ключи некуда писать */
    }

    void Promise.all([
      writeIndexedSnapshots(snapshot),
      writeSnapshotToUserCaches(snapshot),
    ]);
  }
}

export function createAdapter(): StorageAdapter {
  return new DurableStorageAdapter();
}

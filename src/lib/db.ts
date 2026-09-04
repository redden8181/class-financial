import { createStore, del, get, set } from "idb-keyval";
import type { StateStorage } from "zustand/middleware";

/**
 * Постоянное хранилище приложения — IndexedDB (база "klasskassa", таблица "kv").
 * IndexedDB:
 *  - надёжна для больших данных и не имеет жёсткого лимита ~5 МБ, как localStorage;
 *  - не очищается при обновлении приложения/версии service worker;
 *  - асинхронна и не блокирует UI.
 * В будущем этот модуль можно дополнить синхронизацией с облаком,
 * не меняя остальное приложение.
 */
const idb = createStore("klasskassa", "kv");

/** Ключ, под которым zustand/persist хранит состояние (общий для old/new версий). */
export const APP_STORAGE_KEY = "klasskassa-data";

const idbStorage: StateStorage = {
  async getItem(name) {
    const value = await get<string>(name, idb);
    if (value != null) return value;
    // Разовая миграция данных прежней версии приложения из localStorage,
    // чтобы после обновления ничего не потерялось. Старую копию оставляем
    // как резервную — она крошечная и никому не мешает.
    try {
      const legacy = localStorage.getItem(name);
      if (legacy != null) {
        await set(name, legacy, idb);
        return legacy;
      }
    } catch {
      /* приватный режим и т.п. — просто нет миграции */
    }
    return null;
  },
  async setItem(name, value) {
    await set(name, value, idb);
    // Держим резервную копию в localStorage (best-effort).
    try {
      localStorage.setItem(name, value);
    } catch {
      /* лимит/приватный режим — IndexedDB остаётся источником истины */
    }
  },
  async removeItem(name) {
    await del(name, idb);
    try {
      localStorage.removeItem(name);
    } catch {
      /* noop */
    }
  },
};

const localStorageEngine: StateStorage = {
  getItem: (name) => localStorage.getItem(name),
  setItem: (name, value) => localStorage.setItem(name, value),
  removeItem: (name) => localStorage.removeItem(name),
};

/** Fallback на localStorage, если IndexedDB недоступна (очень старые браузеры). */
export function createAppStorage(): StateStorage {
  if (typeof indexedDB === "undefined") return localStorageEngine;
  return idbStorage;
}

import { emptyData, type AppData } from "./types";

/**
 * Слой хранения данных. Сейчас — localStorage (всё офлайн, без сервера).
 * В будущем сюда можно подставить облачный адаптер (Supabase / Firebase):
 * интерфейс Store при этом не изменится.
 */
export interface StorageAdapter {
  load(): AppData;
  save(data: AppData): void;
}

const KEY = "klassnaya-kopilka/v1";

export class LocalStorageAdapter implements StorageAdapter {
  load(): AppData {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return emptyData;
      const parsed = JSON.parse(raw) as Partial<AppData>;
      return {
        children: Array.isArray(parsed.children) ? parsed.children : [],
        collections: Array.isArray(parsed.collections) ? parsed.collections : [],
        payments:
          parsed.payments && typeof parsed.payments === "object" ? parsed.payments : {},
      };
    } catch {
      return emptyData;
    }
  }

  save(data: AppData): void {
    try {
      localStorage.setItem(KEY, JSON.stringify(data));
    } catch {
      /* переполнение хранилища — игнорируем */
    }
  }
}

export function createAdapter(): StorageAdapter {
  return new LocalStorageAdapter();
}

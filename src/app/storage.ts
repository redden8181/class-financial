import { emptyData, type AppData, type Contribution, type PaymentsMap } from "./types";
import { uid } from "./utils";

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

/** миграция платежей из формата v1 ({paid, paidAt}) в формат взносов ({contributions}) */
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
        // старый формат: полная оплата без суммы — берём сумму сбора
        const amount = amountByCollection.get(collectionId) ?? 0;
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

    if (Object.keys(target).length > 0) out[collectionId] = target;
  }

  return out;
}

export class LocalStorageAdapter implements StorageAdapter {
  load(): AppData {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return emptyData;
      const parsed = JSON.parse(raw) as Partial<AppData>;

      const collections = Array.isArray(parsed.collections) ? parsed.collections : [];
      const amountByCollection = new Map(collections.map((c) => [c.id, c.amount]));

      return {
        children: Array.isArray(parsed.children) ? parsed.children : [],
        collections,
        payments: normalizePayments(parsed.payments, amountByCollection),
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

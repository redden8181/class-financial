import type { AppData, Child, Collection } from "./types";

export function uid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

const fmtInt = new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 0 });
const fmtDec = new Intl.NumberFormat("ru-RU", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** 12 500 ₽ / 12 500,50 ₽ */
export function formatMoney(n: number): string {
  const rounded = Math.round(n * 100) / 100;
  const hasKopecks = Math.round(rounded * 100) % 100 !== 0;
  return `${(hasKopecks ? fmtDec : fmtInt).format(rounded)} ₽`;
}

/** "2026-09-12" или timestamp → "12.09.2026" */
export function formatDate(input: string | number): string {
  const d =
    typeof input === "number"
      ? new Date(input)
      : new Date(input.length === 10 ? `${input}T00:00:00` : input);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

/** сегодня в формате input[type=date] */
export function todayInputValue(): string {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

/** русская плюрализация: plural(5, "ребёнок", "ребёнка", "детей") */
export function plural(n: number, one: string, few: string, many: string): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return few;
  return many;
}

export function fullName(c: Child): string {
  return `${c.lastName} ${c.firstName}`.replace(/\s+/g, " ").trim();
}

export function byName(a: Child, b: Child): number {
  return fullName(a).localeCompare(fullName(b), "ru");
}

export function vibrate(ms = 12): void {
  try {
    if ("vibrate" in navigator) navigator.vibrate(ms);
  } catch {
    /* noop */
  }
}

/* ------------------------- статистика ------------------------- */

export interface CollectionStats {
  total: number;
  paid: number;
  unpaid: number;
  collected: number;
  remaining: number;
  percent: number;
  done: boolean;
}

export function collectionStats(data: AppData, collection: Collection): CollectionStats {
  const map = data.payments[collection.id] ?? {};
  const total = data.children.length;
  const paid = data.children.reduce((acc, c) => acc + (map[c.id]?.paid ? 1 : 0), 0);
  const unpaid = total - paid;
  const collected = paid * collection.amount;
  const remaining = unpaid * collection.amount;
  const percent = total === 0 ? 0 : Math.round((paid / total) * 100);
  return { total, paid, unpaid, collected, remaining, percent, done: total > 0 && unpaid === 0 };
}

export function childTotals(data: AppData, childId: string): { paidSum: number; debtSum: number } {
  let paidSum = 0;
  let debtSum = 0;
  for (const coll of data.collections) {
    if (data.payments[coll.id]?.[childId]?.paid) paidSum += coll.amount;
    else debtSum += coll.amount;
  }
  return { paidSum, debtSum };
}

export interface ChildHistoryItem {
  collection: Collection;
  paid: boolean;
  paidAt?: number;
}

export function childHistory(data: AppData, childId: string): ChildHistoryItem[] {
  return data.collections
    .map((collection) => {
      const state = data.payments[collection.id]?.[childId];
      return { collection, paid: Boolean(state?.paid), paidAt: state?.paidAt };
    })
    .sort((a, b) => b.collection.createdAt - a.collection.createdAt);
}

export interface DebtEntry {
  child: Child;
  items: { collection: Collection }[];
  total: number;
}

export function debtsByChild(data: AppData): DebtEntry[] {
  return data.children
    .map((child) => {
      const items = data.collections
        .filter((c) => !data.payments[c.id]?.[child.id]?.paid)
        .sort((a, b) => a.createdAt - b.createdAt)
        .map((collection) => ({ collection }));
      return {
        child,
        items,
        total: items.reduce((s, i) => s + i.collection.amount, 0),
      };
    })
    .filter((e) => e.items.length > 0)
    .sort((a, b) => b.total - a.total || byName(a.child, b.child));
}

export interface GrandTotals {
  collected: number;
  remaining: number;
  debtors: number;
  kids: number;
  collectedPercent: number;
}

export function grandTotals(data: AppData): GrandTotals {
  let collected = 0;
  let remaining = 0;
  const debtors = new Set<string>();
  for (const coll of data.collections) {
    for (const child of data.children) {
      if (data.payments[coll.id]?.[child.id]?.paid) {
        collected += coll.amount;
      } else {
        remaining += coll.amount;
        debtors.add(child.id);
      }
    }
  }
  const all = collected + remaining;
  return {
    collected,
    remaining,
    debtors: debtors.size,
    kids: data.children.length,
    collectedPercent: all === 0 ? 0 : Math.round((collected / all) * 100),
  };
}

export function sortCollections(collections: Collection[]): Collection[] {
  return [...collections].sort((a, b) => b.createdAt - a.createdAt);
}

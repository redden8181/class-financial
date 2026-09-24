import type { AppData, Child, Collection, PaymentState } from "./types";

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

/** короткая дата: 12.09 */
export function formatDateShort(input: string | number): string {
  const d =
    typeof input === "number"
      ? new Date(input)
      : new Date(input.length === 10 ? `${input}T00:00:00` : input);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit" });
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

/* ---------------------- оплата и взнос­­ы ---------------------- */

export type PaymentStatus = "none" | "partial" | "full";

/** сколько уже внесено по сбору */
export function paidAmount(state?: PaymentState): number {
  if (!state) return 0;
  return state.contributions.reduce((s, c) => s + c.amount, 0);
}

export function paymentStatus(state: PaymentState | undefined, amount: number): PaymentStatus {
  const sum = paidAmount(state);
  if (sum <= 0) return "none";
  return sum < amount ? "partial" : "full";
}

/** сколько осталось внести */
export function remainingFor(state: PaymentState | undefined, amount: number): number {
  return Math.max(0, amount - paidAmount(state));
}

/* --------------------------- дедлайн --------------------------- */

export interface DeadlineInfo {
  /** сколько дней осталось (отрицательное — просрочено) */
  daysLeft: number;
  overdue: boolean;
  label: string;
}

export function deadlineInfo(deadline?: string): DeadlineInfo | null {
  if (!deadline) return null;
  const end = new Date(`${deadline}T00:00:00`);
  if (Number.isNaN(end.getTime())) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const daysLeft = Math.round((end.getTime() - today.getTime()) / 86_400_000);
  const overdue = daysLeft < 0;
  const abs = Math.abs(daysLeft);
  const label = overdue
    ? `просрочено на ${abs} ${plural(abs, "день", "дня", "дней")}`
    : daysLeft === 0
      ? "сдаём сегодня"
      : `осталось ${daysLeft} ${plural(daysLeft, "день", "дня", "дней")}`;
  return { daysLeft, overdue, label };
}

/* ------------------------- статистика ------------------------- */

export interface CollectionStats {
  total: number;
  /** сдали полностью */
  paid: number;
  /** внесли часть суммы */
  partial: number;
  /** ничего не внесли */
  none: number;
  collected: number;
  remaining: number;
  percent: number;
  done: boolean;
}

export function collectionStats(data: AppData, collection: Collection): CollectionStats {
  const map = data.payments[collection.id] ?? {};
  const total = data.children.length;
  let paid = 0;
  let partial = 0;
  let collected = 0;
  let remaining = 0;

  for (const c of data.children) {
    const state = map[c.id];
    const sum = paidAmount(state);
    collected += sum;
    const rem = Math.max(0, collection.amount - sum);
    remaining += rem;
    if (sum >= collection.amount && collection.amount > 0) paid += 1;
    else if (sum > 0) partial += 1;
  }

  const none = total - paid - partial;
  const percent = total === 0 ? 0 : Math.round((paid / total) * 100);
  return {
    total,
    paid,
    partial,
    none,
    collected,
    remaining,
    percent,
    done: total > 0 && paid === total,
  };
}

export function childTotals(data: AppData, childId: string): { paidSum: number; debtSum: number } {
  let paidSum = 0;
  let debtSum = 0;
  for (const coll of data.collections) {
    const state = data.payments[coll.id]?.[childId];
    paidSum += paidAmount(state);
    debtSum += remainingFor(state, coll.amount);
  }
  return { paidSum, debtSum };
}

export interface ChildHistoryItem {
  collection: Collection;
  sum: number;
  remaining: number;
  status: PaymentStatus;
  lastDate?: number;
}

export function childHistory(data: AppData, childId: string): ChildHistoryItem[] {
  return data.collections
    .map((collection) => {
      const state = data.payments[collection.id]?.[childId];
      const sum = paidAmount(state);
      const last = state?.contributions[state.contributions.length - 1];
      return {
        collection,
        sum,
        remaining: remainingFor(state, collection.amount),
        status: paymentStatus(state, collection.amount),
        lastDate: last?.date,
      };
    })
    .sort((a, b) => b.collection.createdAt - a.collection.createdAt);
}

export interface DebtItem {
  collection: Collection;
  /** сколько уже внесено */
  sum: number;
  /** сколько осталось (долг по этому сбору) */
  remaining: number;
}

export interface DebtEntry {
  child: Child;
  items: DebtItem[];
  total: number;
}

export function debtsByChild(data: AppData): DebtEntry[] {
  return data.children
    .map((child) => {
      const items = data.collections
        .map((collection) => {
          const state = data.payments[collection.id]?.[child.id];
          return {
            collection,
            sum: paidAmount(state),
            remaining: remainingFor(state, collection.amount),
          };
        })
        .filter((i) => i.remaining > 0)
        .sort((a, b) => a.collection.createdAt - b.collection.createdAt);
      return {
        child,
        items,
        total: items.reduce((s, i) => s + i.remaining, 0),
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
      const state = data.payments[coll.id]?.[child.id];
      collected += paidAmount(state);
      const rem = remainingFor(state, coll.amount);
      if (rem > 0) {
        remaining += rem;
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

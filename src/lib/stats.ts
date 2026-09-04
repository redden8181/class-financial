import type { ClassData, FundCollection, Kid } from "./types";
import { payKey } from "./types";

export interface CollectionStats {
  total: number;
  paidCount: number;
  unpaidCount: number;
  collected: number;
  remaining: number;
  percent: number;
}

export interface LedgerEntry {
  collection: FundCollection;
  paid: boolean;
  paidAt: number | null;
}

export interface KidLedger {
  entries: LedgerEntry[];
  paidTotal: number;
  debtTotal: number;
  paidCount: number;
  unpaidCount: number;
}

export interface GlobalTotals {
  kidsCount: number;
  collectionsCount: number;
  collected: number;
  remaining: number;
  debtorsCount: number;
  percent: number;
}

export interface Debtor {
  kid: Kid;
  debts: { collection: FundCollection }[];
  total: number;
}

export function sortKids(kids: Kid[]): Kid[] {
  return [...kids].sort(
    (a, b) => a.lastName.localeCompare(b.lastName, "ru") || a.firstName.localeCompare(b.firstName, "ru"),
  );
}

export function isPaid(data: ClassData, kidId: string, collectionId: string): boolean {
  return Boolean(data.payments[payKey(kidId, collectionId)]);
}

export function getCollectionStats(data: ClassData, collection: FundCollection): CollectionStats {
  const total = data.kids.length;
  const paidCount = data.kids.reduce((acc, kid) => acc + (isPaid(data, kid.id, collection.id) ? 1 : 0), 0);
  const unpaidCount = total - paidCount;
  const collected = paidCount * collection.amount;
  const remaining = unpaidCount * collection.amount;
  const percent = total === 0 ? 0 : Math.round((paidCount / total) * 100);
  return { total, paidCount, unpaidCount, collected, remaining, percent };
}

export function getKidLedger(data: ClassData, kidId: string): KidLedger {
  const entries: LedgerEntry[] = [...data.collections]
    .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt - a.createdAt)
    .map((collection) => {
      const rec = data.payments[payKey(kidId, collection.id)];
      return { collection, paid: Boolean(rec), paidAt: rec?.paidAt ?? null };
    });
  const paidTotal = entries.reduce((acc, e) => acc + (e.paid ? e.collection.amount : 0), 0);
  const debtTotal = entries.reduce((acc, e) => acc + (e.paid ? 0 : e.collection.amount), 0);
  return {
    entries,
    paidTotal,
    debtTotal,
    paidCount: entries.filter((e) => e.paid).length,
    unpaidCount: entries.filter((e) => !e.paid).length,
  };
}

export function getDebtors(data: ClassData): Debtor[] {
  const result: Debtor[] = [];
  for (const kid of data.kids) {
    const debts = data.collections
      .filter((c) => !isPaid(data, kid.id, c.id))
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((collection) => ({ collection }));
    if (debts.length > 0) {
      result.push({ kid, debts, total: debts.reduce((acc, d) => acc + d.collection.amount, 0) });
    }
  }
  return result.sort(
    (a, b) => b.total - a.total || a.kid.lastName.localeCompare(b.kid.lastName, "ru"),
  );
}

export function getGlobalTotals(data: ClassData): GlobalTotals {
  const kidsCount = data.kids.length;
  const collectionsCount = data.collections.length;
  const byId = new Map(data.collections.map((c) => [c.id, c]));
  let collected = 0;
  for (const key of Object.keys(data.payments)) {
    const collectionId = key.split("::")[1];
    const kidId = key.split("::")[0];
    const collection = byId.get(collectionId);
    if (collection && data.kids.some((k) => k.id === kidId)) collected += collection.amount;
  }
  let remaining = 0;
  for (const collection of data.collections) {
    remaining += data.kids.reduce((acc, kid) => acc + (isPaid(data, kid.id, collection.id) ? 0 : collection.amount), 0);
  }
  const debtorsCount = getDebtors(data).length;
  const goal = collected + remaining;
  const percent = goal === 0 ? 0 : Math.round((collected / goal) * 100);
  return { kidsCount, collectionsCount, collected, remaining, debtorsCount, percent };
}

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { AppData, Child, Collection, Expense, Gender } from "./types";
import { createAdapter } from "./storage";
import { deletePhoto } from "./photos";
import { paidAmount, paymentStatus, uid } from "./utils";

export interface ChildInput {
  firstName: string;
  lastName: string;
  gender: Gender;
}

export interface CollectionInput {
  title: string;
  amount: number;
  description?: string;
  date: string;
  deadline?: string;
}

interface Store {
  data: AppData;
  addChild(input: ChildInput): string;
  updateChild(id: string, patch: Partial<Omit<Child, "id">>): void;
  removeChild(id: string): void;
  addCollection(input: CollectionInput): string;
  updateCollection(id: string, patch: Partial<Omit<Collection, "id">>): void;
  removeCollection(id: string): void;
  /** добавить взнос (может быть частичным) */
  addContribution(collectionId: string, childId: string, amount: number): void;
  /** удалить один взнос */
  removeContribution(collectionId: string, childId: string, contributionId: string): void;
  /** полностью ли оплачен сбор ребёнком */
  isPaid(collectionId: string, childId: string): boolean;
  /** добавить трату по сбору */
  addExpense(collectionId: string, input: ExpenseInput): void;
  /** изменить трату */
  updateExpense(collectionId: string, expenseId: string, patch: ExpenseInput): void;
  /** удалить трату (вместе с фото чека) */
  removeExpense(collectionId: string, expenseId: string): void;
}

export interface ExpenseInput {
  title: string;
  amount: number;
  date: string;
  note?: string;
  photoId?: string;
}

const StoreContext = createContext<Store | null>(null);
const adapter = createAdapter();

export function StoreProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AppData>(() => adapter.load());

  useEffect(() => {
    adapter.save(data);
  }, [data]);

  const store = useMemo<Store>(
    () => ({
      data,

      addChild(input) {
        const id = uid();
        setData((d) => ({
          ...d,
          children: [...d.children, { id, createdAt: Date.now(), ...input }],
        }));
        return id;
      },

      updateChild(id, patch) {
        setData((d) => ({
          ...d,
          children: d.children.map((c) => (c.id === id ? { ...c, ...patch } : c)),
        }));
      },

      removeChild(id) {
        setData((d) => {
          const payments: AppData["payments"] = {};
          for (const cid of Object.keys(d.payments)) {
            const m = { ...d.payments[cid] };
            delete m[id];
            payments[cid] = m;
          }
          return {
            ...d,
            children: d.children.filter((c) => c.id !== id),
            payments,
          };
        });
      },

      addCollection(input) {
        const id = uid();
        setData((d) => ({
          ...d,
          collections: [...d.collections, { id, createdAt: Date.now(), ...input }],
        }));
        return id;
      },

      updateCollection(id, patch) {
        setData((d) => ({
          ...d,
          collections: d.collections.map((c) => (c.id === id ? { ...c, ...patch } : c)),
        }));
      },

      removeCollection(id) {
        setData((d) => {
          const payments = { ...d.payments };
          delete payments[id];
          const expenses = { ...d.expenses };
          for (const e of expenses[id] ?? []) {
            if (e.photoId) void deletePhoto(e.photoId);
          }
          delete expenses[id];
          return {
            ...d,
            collections: d.collections.filter((c) => c.id !== id),
            payments,
            expenses,
          };
        });
      },

      addExpense(collectionId, input) {
        if (!Number.isFinite(input.amount) || input.amount <= 0) return;
        const expense: Expense = {
          id: uid(),
          createdAt: Date.now(),
          ...input,
          amount: Math.round(input.amount * 100) / 100,
        };
        setData((d) => ({
          ...d,
          expenses: {
            ...d.expenses,
            [collectionId]: [...(d.expenses[collectionId] ?? []), expense],
          },
        }));
      },

      updateExpense(collectionId, expenseId, patch) {
        setData((d) => {
          const list = d.expenses[collectionId] ?? [];
          const prev = list.find((e) => e.id === expenseId);
          // старое фото заменили — удаляем из IndexedDB
          if (prev?.photoId && prev.photoId !== patch.photoId) {
            void deletePhoto(prev.photoId);
          }
          return {
            ...d,
            expenses: {
              ...d.expenses,
              [collectionId]: list.map((e) =>
                e.id === expenseId
                  ? { ...e, ...patch, amount: Math.round(patch.amount * 100) / 100 }
                  : e
              ),
            },
          };
        });
      },

      removeExpense(collectionId, expenseId) {
        setData((d) => {
          const list = d.expenses[collectionId] ?? [];
          const target = list.find((e) => e.id === expenseId);
          if (target?.photoId) void deletePhoto(target.photoId);
          return {
            ...d,
            expenses: {
              ...d.expenses,
              [collectionId]: list.filter((e) => e.id !== expenseId),
            },
          };
        });
      },

      addContribution(collectionId, childId, amount) {
        if (!Number.isFinite(amount) || amount <= 0) return;
        setData((d) => {
          const perChild = { ...(d.payments[collectionId] ?? {}) };
          const entry = perChild[childId] ?? { contributions: [] };
          perChild[childId] = {
            contributions: [
              ...entry.contributions,
              { id: uid(), amount: Math.round(amount * 100) / 100, date: Date.now() },
            ],
          };
          return { ...d, payments: { ...d.payments, [collectionId]: perChild } };
        });
      },

      removeContribution(collectionId, childId, contributionId) {
        setData((d) => {
          const current = d.payments[collectionId]?.[childId];
          if (!current) return d;
          const perChild = { ...(d.payments[collectionId] ?? {}) };
          const contributions = current.contributions.filter(
            (c) => c.id !== contributionId
          );
          if (contributions.length === 0) delete perChild[childId];
          else perChild[childId] = { contributions };
          return { ...d, payments: { ...d.payments, [collectionId]: perChild } };
        });
      },

      isPaid(collectionId, childId) {
        const coll = data.collections.find((c) => c.id === collectionId);
        if (!coll) return false;
        const state = data.payments[collectionId]?.[childId];
        return paymentStatus(state, coll.amount) === "full" && paidAmount(state) > 0;
      },
    }),
    [data]
  );

  return <StoreContext.Provider value={store}>{children}</StoreContext.Provider>;
}

export function useStore(): Store {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore должен использоваться внутри StoreProvider");
  return ctx;
}

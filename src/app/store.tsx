import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { AppData, Child, Collection, Gender } from "./types";
import { createAdapter } from "./storage";
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
          return {
            ...d,
            collections: d.collections.filter((c) => c.id !== id),
            payments,
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

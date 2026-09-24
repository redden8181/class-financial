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
import { uid } from "./utils";

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
}

interface Store {
  data: AppData;
  addChild(input: ChildInput): string;
  updateChild(id: string, patch: Partial<Omit<Child, "id">>): void;
  removeChild(id: string): void;
  addCollection(input: CollectionInput): string;
  updateCollection(id: string, patch: Partial<Omit<Collection, "id">>): void;
  removeCollection(id: string): void;
  setPaid(collectionId: string, childId: string, paid: boolean): void;
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

      setPaid(collectionId, childId, paid) {
        setData((d) => ({
          ...d,
          payments: {
            ...d.payments,
            [collectionId]: {
              ...(d.payments[collectionId] ?? {}),
              [childId]: paid ? { paid: true, paidAt: Date.now() } : { paid: false },
            },
          },
        }));
      },

      isPaid(collectionId, childId) {
        return Boolean(data.payments[collectionId]?.[childId]?.paid);
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

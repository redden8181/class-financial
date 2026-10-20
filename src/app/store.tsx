import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  emptyData,
  type AppData,
  type Child,
  type Collection,
  type Expense,
  type Gender,
  type RootData,
  type SchoolClass,
} from "./types";
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

export interface ExpenseInput {
  title: string;
  amount: number;
  date: string;
  note?: string;
  photoId?: string;
}

interface Store {
  /** данные активного класса */
  data: AppData;
  /** всё содержимое приложения */
  root: RootData;
  classes: SchoolClass[];
  activeClass: SchoolClass;
  /** восстановление резервных слоёв завершено */
  ready: boolean;

  /* классы */
  addClass(name: string): string;
  renameClass(id: string, name: string): void;
  removeClass(id: string): void;
  switchClass(id: string): void;
  /** полная замена содержимого (импорт резервной копии) */
  replaceRoot(root: RootData): void;

  /* дети */
  addChild(input: ChildInput): string;
  updateChild(id: string, patch: Partial<Omit<Child, "id">>): void;
  removeChild(id: string): void;

  /* сборы */
  addCollection(input: CollectionInput): string;
  updateCollection(id: string, patch: Partial<Omit<Collection, "id">>): void;
  removeCollection(id: string): void;

  /* взносы */
  addContribution(collectionId: string, childId: string, amount: number): void;
  removeContribution(collectionId: string, childId: string, contributionId: string): void;
  isPaid(collectionId: string, childId: string): boolean;

  /* расходы */
  addExpense(collectionId: string, input: ExpenseInput): void;
  updateExpense(collectionId: string, expenseId: string, patch: ExpenseInput): void;
  removeExpense(collectionId: string, expenseId: string): void;
}

const StoreContext = createContext<Store | null>(null);
const adapter = createAdapter();

export function StoreProvider({ children }: { children: ReactNode }) {
  const [root, setRoot] = useState<RootData>(() => adapter.load());
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let alive = true;
    adapter.recover(root).then((recovered) => {
      if (!alive) return;
      setRoot(recovered);
      // Автосохранение включаем после восстановления, чтобы пустое состояние
      // не перезаписало зеркала при сбое iOS.
      window.setTimeout(() => {
        if (alive) setReady(true);
      }, 250);
    }).catch(() => {
      // Не оставляем интерфейс в бесконечной загрузке при сбое браузерного API.
      if (alive) setReady(true);
    });
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (ready) adapter.save(root);
  }, [root, ready]);

  const activeClass =
    root.classes.find((c) => c.id === root.activeClassId) ?? root.classes[0];
  const data = root.byClass[activeClass?.id] ?? emptyData;

  const store = useMemo<Store>(() => {
    /** изменить данные активного класса */
    const patchActive = (fn: (d: AppData) => AppData) => {
      setRoot((r) => {
        const id = r.activeClassId;
        const current = r.byClass[id] ?? emptyData;
        return { ...r, byClass: { ...r.byClass, [id]: fn(current) } };
      });
    };

    return {
      data,
      root,
      classes: root.classes,
      activeClass,
      ready,

      /* ----------------------------- классы ----------------------------- */

      addClass(name) {
        const id = uid();
        setRoot((r) => ({
          classes: [
            ...r.classes,
            { id, name: name.trim() || "Новый класс", createdAt: Date.now() },
          ],
          activeClassId: id,
          byClass: { ...r.byClass, [id]: { ...emptyData } },
        }));
        return id;
      },

      renameClass(id, name) {
        setRoot((r) => ({
          ...r,
          classes: r.classes.map((c) =>
            c.id === id ? { ...c, name: name.trim() || c.name } : c
          ),
        }));
      },

      removeClass(id) {
        setRoot((r) => {
          // последний класс не удаляем — очищаем его содержимое
          if (r.classes.length <= 1) return r;

          for (const list of Object.values(r.byClass[id]?.expenses ?? {})) {
            for (const e of list) if (e.photoId) void deletePhoto(e.photoId);
          }

          const classes = r.classes.filter((c) => c.id !== id);
          const byClass = { ...r.byClass };
          delete byClass[id];
          return {
            classes,
            byClass,
            activeClassId:
              r.activeClassId === id ? classes[0].id : r.activeClassId,
          };
        });
      },

      switchClass(id) {
        setRoot((r) =>
          r.classes.some((c) => c.id === id) ? { ...r, activeClassId: id } : r
        );
      },

      replaceRoot(next) {
        setRoot(next);
      },

      /* ------------------------------ дети ------------------------------ */

      addChild(input) {
        const id = uid();
        patchActive((d) => ({
          ...d,
          children: [...d.children, { id, createdAt: Date.now(), ...input }],
        }));
        return id;
      },

      updateChild(id, patch) {
        patchActive((d) => ({
          ...d,
          children: d.children.map((c) => (c.id === id ? { ...c, ...patch } : c)),
        }));
      },

      removeChild(id) {
        patchActive((d) => {
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

      /* ------------------------------ сборы ----------------------------- */

      addCollection(input) {
        const id = uid();
        patchActive((d) => ({
          ...d,
          collections: [...d.collections, { id, createdAt: Date.now(), ...input }],
        }));
        return id;
      },

      updateCollection(id, patch) {
        patchActive((d) => ({
          ...d,
          collections: d.collections.map((c) => (c.id === id ? { ...c, ...patch } : c)),
        }));
      },

      removeCollection(id) {
        patchActive((d) => {
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

      /* ----------------------------- взносы ----------------------------- */

      addContribution(collectionId, childId, amount) {
        if (!Number.isFinite(amount) || amount <= 0) return;
        patchActive((d) => {
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
        patchActive((d) => {
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

      /* ----------------------------- расходы ---------------------------- */

      addExpense(collectionId, input) {
        if (!Number.isFinite(input.amount) || input.amount <= 0) return;
        const expense: Expense = {
          id: uid(),
          createdAt: Date.now(),
          ...input,
          amount: Math.round(input.amount * 100) / 100,
        };
        patchActive((d) => ({
          ...d,
          expenses: {
            ...d.expenses,
            [collectionId]: [...(d.expenses[collectionId] ?? []), expense],
          },
        }));
      },

      updateExpense(collectionId, expenseId, patch) {
        patchActive((d) => {
          const list = d.expenses[collectionId] ?? [];
          const prev = list.find((e) => e.id === expenseId);
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
        patchActive((d) => {
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
    };
  }, [root, data, activeClass, ready]);

  return <StoreContext.Provider value={store}>{children}</StoreContext.Provider>;
}

export function useStore(): Store {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore должен использоваться внутри StoreProvider");
  return ctx;
}

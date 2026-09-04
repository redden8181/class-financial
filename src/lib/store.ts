"use client";

import { useEffect, useState } from "react";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { ClassData, FundCollection, Kid, PaymentsMap } from "./types";
import { payKey, uid } from "./types";
import { buildDemoData } from "./demo";
import { APP_STORAGE_KEY, createAppStorage } from "./db";

export type KidInput = Omit<Kid, "id" | "createdAt">;
export type CollectionInput = Omit<FundCollection, "id" | "createdAt">;

export interface ClassStore extends ClassData {
  addKid: (input: KidInput) => Kid;
  updateKid: (id: string, patch: Partial<KidInput>) => void;
  removeKid: (id: string) => void;
  addCollection: (input: CollectionInput) => FundCollection;
  updateCollection: (id: string, patch: Partial<CollectionInput>) => void;
  removeCollection: (id: string) => void;
  togglePayment: (kidId: string, collectionId: string) => void;
  setAllPayments: (collectionId: string, paid: boolean) => void;
  loadDemo: () => void;
  resetAll: () => void;
}

/**
 * Все данные хранятся локально на устройстве в IndexedDB (см. lib/db.ts).
 * Чтобы в будущем подключить облако, достаточно расширить storage-движок
 * синхронизацией — остальное приложение менять не придётся.
 */
export const useClassStore = create<ClassStore>()(
  persist(
    (set, get) => ({
      kids: [],
      collections: [],
      payments: {},

      addKid: (input) => {
        const kid: Kid = { ...input, id: uid(), createdAt: Date.now() };
        set({ kids: [...get().kids, kid] });
        return kid;
      },

      updateKid: (id, patch) =>
        set({ kids: get().kids.map((k) => (k.id === id ? { ...k, ...patch } : k)) }),

      removeKid: (id) => {
        const payments: PaymentsMap = {};
        for (const [key, rec] of Object.entries(get().payments)) {
          if (!key.startsWith(`${id}::`)) payments[key] = rec;
        }
        set({ kids: get().kids.filter((k) => k.id !== id), payments });
      },

      addCollection: (input) => {
        const collection: FundCollection = { ...input, id: uid(), createdAt: Date.now() };
        set({ collections: [...get().collections, collection] });
        return collection;
      },

      updateCollection: (id, patch) =>
        set({
          collections: get().collections.map((c) => (c.id === id ? { ...c, ...patch } : c)),
        }),

      removeCollection: (id) => {
        const payments: PaymentsMap = {};
        for (const [key, rec] of Object.entries(get().payments)) {
          if (!key.endsWith(`::${id}`)) payments[key] = rec;
        }
        set({ collections: get().collections.filter((c) => c.id !== id), payments });
      },

      togglePayment: (kidId, collectionId) => {
        const key = payKey(kidId, collectionId);
        const payments = { ...get().payments };
        if (payments[key]) {
          delete payments[key];
        } else {
          payments[key] = { paidAt: Date.now() };
        }
        set({ payments });
      },

      setAllPayments: (collectionId, paid) => {
        const payments = { ...get().payments };
        for (const kid of get().kids) {
          const key = payKey(kid.id, collectionId);
          if (paid) {
            if (!payments[key]) payments[key] = { paidAt: Date.now() };
          } else {
            delete payments[key];
          }
        }
        set({ payments });
      },

      loadDemo: () => {
        const s = get();
        if (s.kids.length > 0 || s.collections.length > 0) return;
        set(buildDemoData());
      },

      resetAll: () => set({ kids: [], collections: [], payments: {} }),
    }),
    {
      name: APP_STORAGE_KEY,
      version: 1,
      storage: createJSONStorage(() => createAppStorage()),
    },
  ),
);

/**
 * IndexedDB читается асинхронно — ждём завершения гидратации persist,
 * чтобы не рисовать пустое состояние, пока данные ещё загружаются.
 */
export function useHydrated(): boolean {
  const [hydrated, setHydrated] = useState(useClassStore.persist.hasHydrated());
  useEffect(() => {
    const unsubFinish = useClassStore.persist.onFinishHydration(() => setHydrated(true));
    if (useClassStore.persist.hasHydrated()) setHydrated(true);
    return unsubFinish;
  }, []);
  return hydrated;
}

/** Лёгкая тактильная отдача на поддерживаемых устройствах */
export function haptic() {
  try {
    if (typeof navigator !== "undefined" && "vibrate" in navigator) navigator.vibrate(8);
  } catch {
    /* noop */
  }
}

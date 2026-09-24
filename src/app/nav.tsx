import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type Tab = "home" | "kids" | "collections" | "debts";

export type Route =
  | { name: "child"; childId: string }
  | { name: "collection"; collectionId: string };

interface Nav {
  tab: Tab;
  setTab(tab: Tab): void;
  /** стек экранов поверх вкладок */
  stack: Route[];
  push(route: Route): void;
  pop(): void;
}

const NavContext = createContext<Nav | null>(null);

export function NavProvider({ children }: { children: ReactNode }) {
  const [tab, setTabState] = useState<Tab>("home");
  const [stack, setStack] = useState<Route[]>([]);

  const nav = useMemo<Nav>(
    () => ({
      tab,
      stack,
      setTab(t) {
        setTabState(t);
        setStack([]);
      },
      push(route) {
        setStack((s) => [...s, route]);
      },
      pop() {
        setStack((s) => s.slice(0, -1));
      },
    }),
    [tab, stack]
  );

  return <NavContext.Provider value={nav}>{children}</NavContext.Provider>;
}

export function useNav(): Nav {
  const ctx = useContext(NavContext);
  if (!ctx) throw new Error("useNav должен использоваться внутри NavProvider");
  return ctx;
}

export function routeKey(r: Route): string {
  return r.name === "child" ? `child-${r.childId}` : `collection-${r.collectionId}`;
}

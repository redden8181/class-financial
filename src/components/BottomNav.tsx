import { motion } from "framer-motion";
import { CircleAlert, HandCoins, Home, Users, type LucideIcon } from "lucide-react";
import { useNav, type Tab } from "../app/nav";
import { useStore } from "../app/store";
import { grandTotals } from "../app/utils";
import { cn } from "../utils/cn";

const items: { id: Tab; label: string; icon: LucideIcon }[] = [
  { id: "home", label: "Главная", icon: Home },
  { id: "kids", label: "Дети", icon: Users },
  { id: "collections", label: "Сборы", icon: HandCoins },
  { id: "debts", label: "Долги", icon: CircleAlert },
];

export function BottomNav() {
  const { tab, setTab } = useNav();
  const { data } = useStore();
  const totals = grandTotals(data);

  return (
    <nav
      className="pointer-events-none fixed inset-x-0 bottom-0 z-40 mx-auto w-full max-w-md px-4"
      style={{ bottom: "max(env(safe-area-inset-bottom), 0.75rem)" }}
    >
      <div className="pointer-events-auto flex items-center gap-1 rounded-[1.75rem] border border-app-border bg-app-card/90 p-1.5 shadow-[var(--shadow-lg)] backdrop-blur-xl">
        {items.map((item) => {
          const active = tab === item.id;
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              className="relative flex flex-1 flex-col items-center gap-0.5 rounded-3xl py-2 transition-colors"
              aria-label={item.label}
            >
              {active && (
                <motion.span
                  layoutId="nav-active"
                  className="absolute inset-0 rounded-3xl bg-amber-100 dark:bg-amber-400/15"
                  transition={{ type: "spring", damping: 30, stiffness: 380 }}
                />
              )}
              <span className="relative z-10">
                <Icon
                  size={21}
                  strokeWidth={active ? 2.4 : 2}
                  className={cn(
                    "transition-colors",
                    active
                      ? "text-amber-600 dark:text-amber-400"
                      : "text-app-muted"
                  )}
                />
              </span>
              <span
                className={cn(
                  "relative z-10 text-[10px] font-bold transition-colors",
                  active
                    ? "text-amber-700 dark:text-amber-400"
                    : "text-app-muted"
                )}
              >
                {item.label}
              </span>
              {item.id === "debts" && totals.debtors > 0 && (
                <span className="absolute right-[14%] top-1 z-10 flex h-[17px] min-w-[17px] items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white shadow-sm">
                  {totals.debtors}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}

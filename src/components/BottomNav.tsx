"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { CircleAlert, Coins, Coins as CoinsIcon, Home, Plus, UserPlus, Users } from "lucide-react";
import { cn } from "./ui";
import { useClassStore, useHydrated, haptic } from "@/lib/store";
import { getDebtors } from "@/lib/stats";

const TABS = [
  { href: "/", match: "/", label: "Главная", icon: Home, exact: true },
  { href: "/kids", match: "/kid", label: "Дети", icon: Users, exact: false },
  null, // место под FAB
  { href: "/collections", match: "/collection", label: "Сборы", icon: Coins, exact: false },
  { href: "/debts", match: "/debts", label: "Долги", icon: CircleAlert, exact: false },
] as const;

type TabConfig = (typeof TABS)[number];

export function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [sheetOpen, setSheetOpen] = useState(false);
  const hydrated = useHydrated();

  const kids = useClassStore((s) => s.kids);
  const collections = useClassStore((s) => s.collections);
  const payments = useClassStore((s) => s.payments);
  const debtorsCount = useMemo(
    () => (hydrated ? getDebtors({ kids, collections, payments }).length : 0),
    [hydrated, kids, collections, payments],
  );

  const go = (href: string) => {
    setSheetOpen(false);
    router.push(href);
  };

  return (
    <>
      <nav className="pointer-events-none fixed inset-x-0 bottom-0 z-50">
        <div className="mx-auto w-full max-w-md px-3.5 pb-[calc(env(safe-area-inset-bottom,0px)+0.8rem)]">
          <div className="pointer-events-auto relative rounded-[1.85rem] border border-black/[0.06] bg-white/85 p-1.5 shadow-[0_12px_40px_-8px_rgba(15,23,42,0.25)] backdrop-blur-xl dark:border-white/[0.08] dark:bg-night-900/85">
            <div className="grid grid-cols-5">
              {TABS.map((tab: TabConfig, i) => {
                if (!tab) return <div key={`spacer-${i}`} />;
                const active = tab.exact ? pathname === tab.href : pathname.startsWith(tab.match);
                const Icon = tab.icon;
                return (
                  <Link
                    key={tab.href}
                    href={tab.href}
                    className={cn(
                      "relative flex flex-col items-center gap-0.5 rounded-3xl py-2 transition-colors",
                      active ? "text-brand-600 dark:text-brand-300" : "text-slate-400 dark:text-slate-500",
                    )}
                  >
                    {active && (
                      <motion.span
                        layoutId="nav-pill"
                        transition={{ type: "spring", stiffness: 420, damping: 32 }}
                        className="absolute inset-0 rounded-3xl bg-brand-500/10 dark:bg-brand-400/10"
                      />
                    )}
                    <span className="relative">
                      <Icon size={21} strokeWidth={active ? 2.5 : 2.1} />
                      {tab.href === "/debts" && debtorsCount > 0 && (
                        <span className="animate-pop absolute -right-2 -top-1 flex h-[17px] min-w-[17px] items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-extrabold text-white">
                          {debtorsCount}
                        </span>
                      )}
                    </span>
                    <span className={cn("relative text-[10.5px] font-bold", active && "font-extrabold")}>{tab.label}</span>
                  </Link>
                );
              })}
            </div>

            <motion.button
              whileTap={{ scale: 0.88 }}
              onClick={() => {
                haptic();
                setSheetOpen(true);
              }}
              aria-label="Быстрое действие"
              className="absolute -top-7 left-1/2 flex h-14 w-14 -translate-x-1/2 items-center justify-center rounded-[1.35rem] bg-gradient-to-b from-brand-500 to-brand-600 text-white shadow-brand"
            >
              <motion.span animate={{ rotate: sheetOpen ? 45 : 0 }} transition={{ type: "spring", stiffness: 400, damping: 22 }}>
                <Plus size={26} strokeWidth={2.8} />
              </motion.span>
            </motion.button>
          </div>
        </div>
      </nav>

      <AnimatePresence>
        {sheetOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60]"
          >
            <div className="absolute inset-0 bg-slate-950/45 backdrop-blur-sm" onClick={() => setSheetOpen(false)} />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 380, damping: 36 }}
              className="absolute inset-x-0 bottom-0 mx-auto w-full max-w-md rounded-t-[2rem] border-t border-black/5 bg-white px-5 pb-[calc(env(safe-area-inset-bottom,0px)+1.5rem)] pt-5 dark:border-white/10 dark:bg-night-900"
            >
              <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-slate-300/70 dark:bg-white/15" />
              <p className="mb-3 px-1 text-[13px] font-extrabold uppercase tracking-[0.08em] text-slate-400">
                Быстрое действие
              </p>
              <div className="flex flex-col gap-2.5">
                <SheetRow
                  icon={<CoinsIcon size={22} strokeWidth={2.4} />}
                  iconClass="bg-brand-500/10 text-brand-600 dark:text-brand-300"
                  title="Новый сбор"
                  hint="Шторы, праздник, экскурсия…"
                  onClick={() => go("/collections/new")}
                />
                <SheetRow
                  icon={<UserPlus size={22} strokeWidth={2.4} />}
                  iconClass="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                  title="Добавить ребёнка"
                  hint="Пополнить список класса"
                  onClick={() => go("/kids/new")}
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function SheetRow({
  icon,
  iconClass,
  title,
  hint,
  onClick,
}: {
  icon: React.ReactNode;
  iconClass: string;
  title: string;
  hint: string;
  onClick: () => void;
}) {
  return (
    <motion.button
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      className="flex items-center gap-3.5 rounded-[1.3rem] border border-black/[0.05] bg-slate-50 p-4 text-left transition-colors hover:bg-slate-100 dark:border-white/[0.06] dark:bg-white/[0.04] dark:hover:bg-white/[0.07]"
    >
      <span className={cn("flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl", iconClass)}>{icon}</span>
      <span className="min-w-0">
        <span className="block text-[15px] font-extrabold">{title}</span>
        <span className="block truncate text-[13px] font-medium text-slate-400">{hint}</span>
      </span>
    </motion.button>
  );
}

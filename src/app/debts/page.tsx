"use client";

import { useMemo } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ChevronRight, CircleX, PartyPopper, Wallet } from "lucide-react";
import { useClassStore, useHydrated } from "@/lib/store";
import { getDebtors } from "@/lib/stats";
import { formatMoney, pluralKids, pluralRu } from "@/lib/format";
import { Avatar, EmptyState, Splash } from "@/components/ui";
import { TabHeader } from "@/components/TopBar";

export default function DebtsPage() {
  const hydrated = useHydrated();
  const kids = useClassStore((s) => s.kids);
  const collections = useClassStore((s) => s.collections);
  const payments = useClassStore((s) => s.payments);

  const data = useMemo(() => ({ kids, collections, payments }), [kids, collections, payments]);
  const debtors = useMemo(() => getDebtors(data), [data]);

  if (!hydrated) return <Splash />;

  const grandTotal = debtors.reduce((acc, d) => acc + d.total, 0);
  const unpaidCount = debtors.reduce((acc, d) => acc + d.debts.length, 0);

  return (
    <div>
      <TabHeader
        title="Все долги"
        subtitle={
          debtors.length > 0
            ? `${debtors.length} ${pluralKids(debtors.length)} ещё не расчитались`
            : "контроль неоплаченных сборов"
        }
      />

      {debtors.length === 0 ? (
        <EmptyState
          tone="emerald"
          icon={<PartyPopper size={28} strokeWidth={2.2} />}
          title="Долгов нет"
          hint="Все расчитались по сборам — отличная работа!"
        />
      ) : (
        <>
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 flex items-center gap-4 rounded-[1.6rem] bg-gradient-to-br from-rose-500 to-rose-600 p-5 text-white shadow-[0_12px_28px_-8px_rgba(244,63,94,0.5)]"
          >
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/15">
              <Wallet size={23} strokeWidth={2.3} />
            </span>
            <div className="min-w-0">
              <p className="text-[12px] font-bold uppercase tracking-wide text-white/70">Всего к получению</p>
              <p className="mt-0.5 text-[26px] font-extrabold leading-none tabular-nums tracking-tight">
                {formatMoney(grandTotal)}
              </p>
              <p className="mt-1 text-[12px] font-semibold text-white/70">
                {unpaidCount} {pluralRu(unpaidCount, "неоплаченный сбор", "неоплаченных сбора", "неоплаченных сборов")}
              </p>
            </div>
          </motion.div>

          <div className="flex flex-col gap-3">
            {debtors.map((debtor, i) => (
              <motion.div
                key={debtor.kid.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.05, 0.35), duration: 0.25 }}
              >
                <Link href={`/kid?id=${debtor.kid.id}`} className="press block">
                  <div className="card overflow-hidden">
                    <div className="flex items-center gap-3 p-4 pb-3">
                      <Avatar kid={debtor.kid} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[15.5px] font-bold tracking-tight">
                          {debtor.kid.lastName} {debtor.kid.firstName}
                        </p>
                        <p className="text-[12px] font-semibold text-slate-400">
                          {pluralRu(debtor.debts.length, "не сдан", "не сдано", "не сдано")} {debtor.debts.length}{" "}
                          {pluralRu(debtor.debts.length, "сбор", "сбора", "сборов")}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10.5px] font-bold uppercase tracking-wide text-slate-400">общий долг</p>
                        <p className="text-[17px] font-extrabold tabular-nums tracking-tight text-rose-500">
                          {formatMoney(debtor.total)}
                        </p>
                      </div>
                      <ChevronRight size={18} className="shrink-0 text-slate-300 dark:text-slate-600" />
                    </div>
                    <div className="space-y-0.5 px-4 pb-3.5">
                      {debtor.debts.map(({ collection }) => (
                        <div
                          key={collection.id}
                          className="flex items-center gap-2.5 rounded-xl bg-rose-500/[0.07] px-3 py-2 dark:bg-rose-500/[0.09]"
                        >
                          <CircleX size={15} strokeWidth={2.5} className="shrink-0 text-rose-500" />
                          <span className="min-w-0 flex-1 truncate text-[13.5px] font-bold">{collection.title}</span>
                          <span className="shrink-0 text-[13.5px] font-extrabold tabular-nums text-rose-500">
                            {formatMoney(collection.amount)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

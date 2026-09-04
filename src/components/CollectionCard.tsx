"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { CalendarDays, ChevronRight, Coins } from "lucide-react";
import type { FundCollection } from "@/lib/types";
import type { CollectionStats } from "@/lib/stats";
import { formatDateLong, formatMoney } from "@/lib/format";
import { ProgressBar } from "./ui";

export function CollectionCard({
  collection,
  stats,
  index = 0,
}: {
  collection: FundCollection;
  stats: CollectionStats;
  index?: number;
}) {
  const done = stats.total > 0 && stats.unpaidCount === 0;
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.05, 0.3), duration: 0.25 }}
    >
      <Link href={`/collection?id=${collection.id}`} className="press block">
        <div className="card p-4 sm:p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="truncate text-[16.5px] font-extrabold tracking-tight">{collection.title}</h3>
              <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12.5px] font-semibold text-slate-400">
                <span className="inline-flex items-center gap-1.5">
                  <Coins size={14} className="text-amber-500" />
                  {formatMoney(collection.amount)} с ребёнка
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <CalendarDays size={14} />
                  {formatDateLong(collection.date)}
                </span>
              </div>
            </div>
            <ChevronRight size={20} className="mt-1 shrink-0 text-slate-300 dark:text-slate-600" />
          </div>

          <div className="mt-4">
            <ProgressBar value={stats.percent} tone={done ? "emerald" : "brand"} />
            <div className="mt-2 flex items-end justify-between gap-3">
              <p className="text-[13px] font-bold text-slate-500 dark:text-slate-400">
                Сдали <span className="text-slate-800 dark:text-slate-100">{stats.paidCount}</span> из {stats.total}
                <span className={done ? "text-emerald-500" : "text-brand-500"}>&nbsp;· {stats.percent}%</span>
              </p>
              <p className="shrink-0 text-right">
                <span className="block text-[10.5px] font-bold uppercase tracking-wide text-slate-400">собрано</span>
                <span className="text-[15px] font-extrabold tabular-nums tracking-tight text-emerald-600 dark:text-emerald-400">
                  {formatMoney(stats.collected)}
                </span>
              </p>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

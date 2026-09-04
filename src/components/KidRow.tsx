"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { CircleCheck, ChevronRight } from "lucide-react";
import type { Kid } from "@/lib/types";
import { formatMoney } from "@/lib/format";
import { Avatar } from "./ui";

export function KidRow({ kid, debt, index = 0 }: { kid: Kid; debt: number; index?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.03, 0.3), duration: 0.22 }}
    >
      <Link href={`/kid?id=${kid.id}`} className="press block">
        <div className="flex items-center gap-3 py-3">
          <Avatar kid={kid} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-[15.5px] font-bold tracking-tight">
              {kid.lastName} {kid.firstName}
            </p>
            {debt > 0 ? (
              <p className="mt-0.5 text-[12.5px] font-bold text-rose-500">
                долг <span className="tabular-nums">{formatMoney(debt)}</span>
              </p>
            ) : (
              <p className="mt-0.5 inline-flex items-center gap-1 text-[12.5px] font-semibold text-emerald-600 dark:text-emerald-400">
                <CircleCheck size={13} strokeWidth={2.6} />
                всё оплачено
              </p>
            )}
          </div>
          <ChevronRight size={19} className="shrink-0 text-slate-300 dark:text-slate-600" />
        </div>
      </Link>
    </motion.div>
  );
}

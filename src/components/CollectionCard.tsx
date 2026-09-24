import { motion } from "framer-motion";
import { CalendarDays, CheckCircle2, ChevronRight, Clock } from "lucide-react";
import { useStore } from "../app/store";
import type { Collection } from "../app/types";
import { collectionStats, deadlineInfo, formatDate, formatMoney } from "../app/utils";
import { cn } from "../utils/cn";
import { Progress } from "./ui";

export function CollectionCard({
  collection,
  onClick,
  index = 0,
}: {
  collection: Collection;
  onClick(): void;
  index?: number;
}) {
  const { data } = useStore();
  const s = collectionStats(data, collection);
  const dl = deadlineInfo(collection.deadline);

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index, 8) * 0.045, duration: 0.28, ease: "easeOut" }}
    >
      <button
        type="button"
        onClick={onClick}
        className="card w-full p-4 text-left transition-transform duration-150 active:scale-[0.98]"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="truncate text-base font-bold tracking-tight">
              {collection.title}
            </h3>
            <p className="mt-1 flex items-center gap-1.5 text-xs font-medium text-app-muted">
              <CalendarDays size={12} className="shrink-0" />
              {formatDate(collection.date)}
              <span className="text-app-border">•</span>
              {formatMoney(collection.amount)} с ребёнка
            </p>
          </div>
          {s.done ? (
            <span className="flex shrink-0 items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-bold text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
              <CheckCircle2 size={12} />
              Собран
            </span>
          ) : (
            <ChevronRight size={18} className="mt-1 shrink-0 text-app-muted" />
          )}
        </div>

        {dl && !s.done && (
          <span
            className={cn(
              "mt-2.5 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold",
              dl.overdue
                ? "bg-rose-100 text-rose-600 dark:bg-rose-500/15 dark:text-rose-300"
                : "bg-app-soft text-app-muted"
            )}
          >
            <Clock size={11} />
            до {formatDate(collection.deadline!)} · {dl.label}
          </span>
        )}

        <div className="mt-3 flex items-center gap-3">
          <Progress value={s.percent} className="flex-1" />
          <span className="shrink-0 text-xs font-bold text-app-muted">
            {s.paid} из {s.total} · {s.percent}%
          </span>
        </div>
      </button>
    </motion.div>
  );
}

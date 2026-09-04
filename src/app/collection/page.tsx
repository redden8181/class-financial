"use client";

import { Suspense, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Baby, CalendarDays, CheckCheck, CircleX, Coins, Pencil, RotateCcw, Trash2 } from "lucide-react";
import { haptic, useClassStore, useHydrated } from "@/lib/store";
import { getCollectionStats, isPaid, sortKids } from "@/lib/stats";
import { formatDateLong, formatMoney, formatPaidAt } from "@/lib/format";
import type { Kid } from "@/lib/types";
import {
  Avatar,
  Button,
  EmptyState,
  IconButton,
  LinkButton,
  LinkIconButton,
  ProgressRing,
  Splash,
  StatusChip,
  cn,
} from "@/components/ui";
import { BackHeader } from "@/components/TopBar";
import { ConfirmDialog } from "@/components/ConfirmDialog";

type Filter = "all" | "unpaid" | "paid";

export default function CollectionPage() {
  return (
    <Suspense fallback={<Splash />}>
      <CollectionPageInner />
    </Suspense>
  );
}

function CollectionPageInner() {
  const id = useSearchParams().get("id") ?? "";
  const router = useRouter();
  const hydrated = useHydrated();

  const collection = useClassStore((s) => s.collections.find((c) => c.id === id));
  const kids = useClassStore((s) => s.kids);
  const collections = useClassStore((s) => s.collections);
  const payments = useClassStore((s) => s.payments);
  const togglePayment = useClassStore((s) => s.togglePayment);
  const setAllPayments = useClassStore((s) => s.setAllPayments);
  const removeCollection = useClassStore((s) => s.removeCollection);

  const [filter, setFilter] = useState<Filter>("all");
  const [confirmOpen, setConfirmOpen] = useState(false);

  const data = useMemo(() => ({ kids, collections, payments }), [kids, collections, payments]);
  const sortedKids = useMemo(() => sortKids(kids), [kids]);

  if (!hydrated) return <Splash />;

  if (!collection) {
    return (
      <div>
        <BackHeader title="Сбор" />
        <EmptyState icon={<CircleX size={28} strokeWidth={2.2} />} title="Сбор не найден" hint="Возможно, он был удалён">
          <LinkButton href="/collections" full>
            Ко всем сборам
          </LinkButton>
        </EmptyState>
      </div>
    );
  }

  const stats = getCollectionStats(data, collection);
  const visible = sortedKids.filter((k) => {
    const paid = isPaid(data, k.id, collection.id);
    return filter === "all" || (filter === "paid" ? paid : !paid);
  });
  const boys = visible.filter((k) => k.gender === "boy");
  const girls = visible.filter((k) => k.gender === "girl");

  const chips: { value: Filter; label: string; count: number }[] = [
    { value: "all", label: "Все", count: stats.total },
    { value: "unpaid", label: "Не сдали", count: stats.unpaidCount },
    { value: "paid", label: "Сдали", count: stats.paidCount },
  ];

  return (
    <div>
      <BackHeader
        title={collection.title}
        actions={
          <>
            <LinkIconButton href={`/collection/edit?id=${collection.id}`} label="Изменить">
              <Pencil size={18} strokeWidth={2.4} />
            </LinkIconButton>
            <IconButton danger aria-label="Удалить" onClick={() => setConfirmOpen(true)}>
              <Trash2 size={18} strokeWidth={2.4} />
            </IconButton>
          </>
        }
      />

      {/* Информация о сборе */}
      <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="card p-5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-3 py-1.5 text-[12.5px] font-bold text-amber-600 dark:text-amber-400">
            <Coins size={14} />
            {formatMoney(collection.amount)} с ребёнка
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-900/[0.05] px-3 py-1.5 text-[12.5px] font-bold text-slate-500 dark:bg-white/[0.07] dark:text-slate-300">
            <CalendarDays size={14} />
            {formatDateLong(collection.date)}
          </span>
        </div>
        {collection.description && (
          <p className="mt-3 text-[14px] font-medium leading-relaxed text-slate-500 dark:text-slate-400">
            {collection.description}
          </p>
        )}

        <div className="mt-5 flex items-center gap-4 border-t border-black/[0.05] pt-5 dark:border-white/[0.06]">
          <div className="shrink-0">
            <ProgressRing value={stats.percent} size={108} />
          </div>
          <dl className="min-w-0 flex-1 space-y-2 text-[13.5px]">
            <StatRow label="Всего детей" value={String(stats.total)} />
            <StatRow label="Сдали" value={String(stats.paidCount)} valueClass="text-emerald-600 dark:text-emerald-400" />
            <StatRow label="Не сдали" value={String(stats.unpaidCount)} valueClass="text-rose-500 dark:text-rose-400" />
            <StatRow label="Собрано" value={formatMoney(stats.collected)} valueClass="text-emerald-600 dark:text-emerald-400" />
            <StatRow
              label="Осталось собрать"
              value={formatMoney(stats.remaining)}
              valueClass={stats.remaining > 0 ? "text-rose-500 dark:text-rose-400" : "text-emerald-600 dark:text-emerald-400"}
            />
          </dl>
        </div>
      </motion.section>

      {kids.length === 0 ? (
        <div className="mt-5">
          <EmptyState
            icon={<Baby size={28} strokeWidth={2.2} />}
            title="В классе пока нет детей"
            hint="Добавьте учеников — они появятся в этом сборе автоматически"
          >
            <LinkButton href="/kids/new" full>
              Добавить ребёнка
            </LinkButton>
          </EmptyState>
        </div>
      ) : (
        <>
          {/* Фильтры и массовая отметка */}
          <div className="mb-3 mt-5 flex items-center justify-between gap-2">
            <div className="flex gap-1 rounded-2xl bg-slate-900/[0.05] p-1 dark:bg-white/[0.06]">
              {chips.map((chip) => (
                <button
                  key={chip.value}
                  onClick={() => setFilter(chip.value)}
                  className={cn(
                    "rounded-xl px-3 py-1.5 text-[12.5px] font-bold transition-all",
                    filter === chip.value
                      ? "bg-white text-slate-900 shadow-sm dark:bg-white/[0.12] dark:text-white"
                      : "text-slate-400",
                  )}
                >
                  {chip.label} <span className="tabular-nums opacity-70">{chip.count}</span>
                </button>
              ))}
            </div>
            <Button
              variant="soft"
              size="md"
              className="h-9 shrink-0 gap-1.5 rounded-xl px-3 text-[12.5px]"
              onClick={() => {
                haptic();
                setAllPayments(collection.id, stats.unpaidCount > 0);
              }}
            >
              {stats.unpaidCount > 0 ? (
                <>
                  <CheckCheck size={15} strokeWidth={2.5} />
                  Все сдали
                </>
              ) : (
                <>
                  <RotateCcw size={15} strokeWidth={2.5} />
                  Сбросить
                </>
              )}
            </Button>
          </div>

          {/* Списки */}
          {boys.length + girls.length === 0 ? (
            <div className="card px-6 py-8 text-center">
              <p className="font-extrabold">Здесь пусто</p>
              <p className="mt-1 text-sm font-medium text-slate-400">Переключите фильтр выше</p>
            </div>
          ) : (
            [
              { label: "Мальчики", list: boys, dot: "bg-sky-500" },
              { label: "Девочки", list: girls, dot: "bg-rose-500" },
            ]
              .filter((g) => g.list.length > 0)
              .map((group) => (
                <section key={group.label} className="mb-4">
                  <div className="mb-2 flex items-center gap-2 px-1">
                    <span className={cn("h-2 w-2 rounded-full", group.dot)} />
                    <h2 className="text-[13px] font-extrabold uppercase tracking-[0.08em] text-slate-400">{group.label}</h2>
                    <span className="text-[12px] font-bold text-slate-400">{group.list.length}</span>
                  </div>
                  <div className="card divide-y divide-black/[0.05] px-4 py-1 dark:divide-white/[0.06]">
                    {group.list.map((kid) => (
                      <PayRow
                        key={kid.id}
                        kid={kid}
                        paid={isPaid(data, kid.id, collection.id)}
                        paidAt={payments[`${kid.id}::${collection.id}`]?.paidAt ?? null}
                        onToggle={() => {
                          haptic();
                          togglePayment(kid.id, collection.id);
                        }}
                      />
                    ))}
                  </div>
                </section>
              ))
          )}
        </>
      )}

      <ConfirmDialog
        open={confirmOpen}
        title={`Удалить сбор «${collection.title}»?`}
        description="История оплат по этому сбору будет удалена у всех детей. Действие нельзя отменить."
        onClose={() => setConfirmOpen(false)}
        onConfirm={() => {
          removeCollection(collection.id);
          setConfirmOpen(false);
          router.replace("/collections");
        }}
      />
    </div>
  );
}

function StatRow({ label, value, valueClass }: { label: string; value: string; valueClass?: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="font-semibold text-slate-400">{label}</dt>
      <dd className={cn("font-extrabold tabular-nums tracking-tight", valueClass)}>{value}</dd>
    </div>
  );
}

function PayRow({ kid, paid, paidAt, onToggle }: { kid: Kid; paid: boolean; paidAt: number | null; onToggle: () => void }) {
  return (
    <motion.button whileTap={{ scale: 0.98 }} onClick={onToggle} className="flex w-full items-center gap-3 py-3 text-left">
      <Avatar kid={kid} size="sm" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-[15px] font-bold tracking-tight">
          {kid.lastName} {kid.firstName}
        </p>
        {paid && paidAt ? (
          <p className="mt-0.5 text-[12px] font-semibold text-emerald-600 dark:text-emerald-400">
            оплачено {formatPaidAt(paidAt)}
          </p>
        ) : (
          <p className="mt-0.5 text-[12px] font-medium text-slate-400">нажмите, чтобы отметить</p>
        )}
      </div>
      <StatusChip paid={paid} />
    </motion.button>
  );
}

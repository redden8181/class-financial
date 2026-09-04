"use client";

import { Suspense, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { CircleCheck, CircleX, Coins, Pencil, Trash2 } from "lucide-react";
import { haptic, useClassStore, useHydrated } from "@/lib/store";
import { getKidLedger } from "@/lib/stats";
import { formatDateLong, formatMoney, formatPaidAt } from "@/lib/format";
import {
  Avatar,
  EmptyState,
  GenderChip,
  IconButton,
  LinkButton,
  LinkIconButton,
  Splash,
  StatusChip,
  SectionTitle,
} from "@/components/ui";
import { BackHeader } from "@/components/TopBar";
import { ConfirmDialog } from "@/components/ConfirmDialog";

export default function KidPage() {
  return (
    <Suspense fallback={<Splash />}>
      <KidPageInner />
    </Suspense>
  );
}

function KidPageInner() {
  const id = useSearchParams().get("id") ?? "";
  const router = useRouter();
  const hydrated = useHydrated();

  const kid = useClassStore((s) => s.kids.find((k) => k.id === id));
  const kids = useClassStore((s) => s.kids);
  const collections = useClassStore((s) => s.collections);
  const payments = useClassStore((s) => s.payments);
  const togglePayment = useClassStore((s) => s.togglePayment);
  const removeKid = useClassStore((s) => s.removeKid);

  const [confirmOpen, setConfirmOpen] = useState(false);

  const data = useMemo(() => ({ kids, collections, payments }), [kids, collections, payments]);
  const ledger = useMemo(() => getKidLedger(data, id), [data, id]);

  if (!hydrated) return <Splash />;

  if (!kid) {
    return (
      <div>
        <BackHeader title="Карточка ребёнка" />
        <EmptyState
          icon={<CircleX size={28} strokeWidth={2.2} />}
          title="Ребёнок не найден"
          hint="Возможно, запись была удалена"
        >
          <LinkButton href="/kids" full>
            К списку детей
          </LinkButton>
        </EmptyState>
      </div>
    );
  }

  return (
    <div>
      <BackHeader
        title="Карточка ребёнка"
        actions={
          <>
            <LinkIconButton href={`/kid/edit?id=${kid.id}`} label="Изменить">
              <Pencil size={18} strokeWidth={2.4} />
            </LinkIconButton>
            <IconButton danger aria-label="Удалить" onClick={() => setConfirmOpen(true)}>
              <Trash2 size={18} strokeWidth={2.4} />
            </IconButton>
          </>
        }
      />

      {/* Профиль */}
      <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="card p-5">
        <div className="flex items-center gap-4">
          <Avatar kid={kid} size="lg" />
          <div className="min-w-0">
            <h2 className="truncate text-[21px] font-extrabold tracking-tight">
              {kid.lastName}
              <br />
              {kid.firstName}
            </h2>
            <div className="mt-2">
              <GenderChip gender={kid.gender} />
            </div>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-2.5">
          <div className="rounded-2xl bg-emerald-500/[0.08] p-3.5">
            <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-emerald-600/80 dark:text-emerald-400/80">
              <CircleCheck size={13} strokeWidth={2.6} />
              Оплачено
            </p>
            <p className="mt-1 text-[19px] font-extrabold tabular-nums tracking-tight text-emerald-600 dark:text-emerald-400">
              {formatMoney(ledger.paidTotal)}
            </p>
          </div>
          <div className="rounded-2xl bg-rose-500/[0.08] p-3.5">
            <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-rose-500/80 dark:text-rose-400/80">
              <CircleX size={13} strokeWidth={2.6} />
              Долг
            </p>
            <p className="mt-1 text-[19px] font-extrabold tabular-nums tracking-tight text-rose-500 dark:text-rose-400">
              {formatMoney(ledger.debtTotal)}
            </p>
          </div>
        </div>
      </motion.section>

      {/* История */}
      {ledger.entries.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            icon={<Coins size={28} strokeWidth={2.2} />}
            title="Сборов пока нет"
            hint="Создайте сбор — он появится здесь, и можно будет отметить оплату"
          >
            <LinkButton href="/collections/new" full>
              Создать сбор
            </LinkButton>
          </EmptyState>
        </div>
      ) : (
        <>
          <SectionTitle count={ledger.entries.length}>История сборов</SectionTitle>
          <div className="card divide-y divide-black/[0.05] px-4 py-1 dark:divide-white/[0.06]">
            {ledger.entries.map((entry, i) => (
              <motion.button
                key={entry.collection.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.04, 0.35) }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  haptic();
                  togglePayment(kid.id, entry.collection.id);
                }}
                className="flex w-full items-center gap-3 py-3.5 text-left"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[15px] font-bold tracking-tight">{entry.collection.title}</p>
                  <p className="mt-1 text-[12.5px] font-semibold text-slate-400">
                    <span className="font-bold text-slate-600 tabular-nums dark:text-slate-300">
                      {formatMoney(entry.collection.amount)}
                    </span>
                    {" · "}
                    {entry.paid && entry.paidAt ? (
                      <span className="text-emerald-600 dark:text-emerald-400">оплачено {formatPaidAt(entry.paidAt)}</span>
                    ) : (
                      <span className="text-rose-500 dark:text-rose-400">не оплачено · до {formatDateLong(entry.collection.date)}</span>
                    )}
                  </p>
                </div>
                <StatusChip paid={entry.paid} />
              </motion.button>
            ))}
          </div>
          <p className="mt-3 px-1 text-center text-[12px] font-medium text-slate-400">
            Нажмите на строку, чтобы отметить или снять оплату
          </p>
        </>
      )}

      <ConfirmDialog
        open={confirmOpen}
        title={`Удалить ${kid.firstName} ${kid.lastName}?`}
        description="Вместе с ребёнком удалится вся его история оплат. Действие нельзя отменить."
        onClose={() => setConfirmOpen(false)}
        onConfirm={() => {
          removeKid(kid.id);
          setConfirmOpen(false);
          router.replace("/kids");
        }}
      />
    </div>
  );
}

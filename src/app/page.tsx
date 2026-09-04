"use client";

import { useMemo } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ChevronRight, Coins, PartyPopper, PiggyBank, Plus, Sparkles, UserPlus, Users, Wallet } from "lucide-react";
import { useClassStore, useHydrated } from "@/lib/store";
import { getCollectionStats, getGlobalTotals } from "@/lib/stats";
import { formatMoney, pluralKids, pluralRu } from "@/lib/format";
import { LinkButton, ProgressBar, Splash, Button } from "@/components/ui";
import { ThemeToggle } from "@/components/ThemeToggle";
import { CollectionCard } from "@/components/CollectionCard";

export default function HomePage() {
  const hydrated = useHydrated();
  const kids = useClassStore((s) => s.kids);
  const collections = useClassStore((s) => s.collections);
  const payments = useClassStore((s) => s.payments);
  const loadDemo = useClassStore((s) => s.loadDemo);

  const data = useMemo(() => ({ kids, collections, payments }), [kids, collections, payments]);
  const totals = useMemo(() => getGlobalTotals(data), [data]);

  const sortedCollections = useMemo(
    () => [...collections].sort((a, b) => b.date.localeCompare(a.date) || b.createdAt - a.createdAt),
    [collections],
  );

  if (!hydrated) return <Splash />;

  const isEmpty = kids.length === 0 && collections.length === 0;
  const goal = totals.collected + totals.remaining;

  return (
    <div>
      {/* Шапка */}
      <header className="mb-6 flex items-center justify-between gap-3 pt-1">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-[1rem] bg-gradient-to-b from-brand-500 to-brand-600 text-white shadow-brand">
            <PiggyBank size={23} strokeWidth={2.2} />
          </div>
          <div>
            <p className="text-[17px] font-extrabold leading-tight tracking-tight">КлассКасса</p>
            <p className="text-[12px] font-semibold text-slate-400">сборы одного класса</p>
          </div>
        </div>
        <ThemeToggle />
      </header>

      {/* Главная карточка */}
      <motion.section
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-[1.8rem] bg-gradient-to-br from-brand-500 via-brand-600 to-[#7c5cf0] p-5 text-white shadow-brand"
      >
        <div aria-hidden className="absolute -right-10 -top-14 h-44 w-44 rounded-full bg-white/15 blur-2xl" />
        <div aria-hidden className="absolute -bottom-16 -left-8 h-40 w-40 rounded-full bg-black/10 blur-2xl" />

        <div className="relative">
          <p className="flex items-center gap-1.5 text-[12.5px] font-bold uppercase tracking-wide text-white/70">
            <Wallet size={14} />
            Собрано всего
          </p>
          <p className="mt-1.5 text-[38px] font-extrabold leading-none tabular-nums tracking-tight">
            {formatMoney(totals.collected)}
          </p>

          {goal > 0 ? (
            <div className="mt-4">
              <ProgressBar value={totals.percent} tone="light" className="h-2" />
              <p className="mt-2 text-[12.5px] font-semibold text-white/75">
                {totals.percent}% от общей цели {formatMoney(goal)}
              </p>
            </div>
          ) : (
            <p className="mt-3 text-[13px] font-semibold text-white/75">
              Добавьте детей и создайте первый сбор — здесь появится прогресс
            </p>
          )}

          <div className="mt-5 grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-white/12 p-3 backdrop-blur-sm">
              <p className="text-[11px] font-bold uppercase tracking-wide text-white/65">Осталось собрать</p>
              <p className="mt-1 text-[19px] font-extrabold tabular-nums tracking-tight">{formatMoney(totals.remaining)}</p>
            </div>
            <div className="rounded-2xl bg-white/12 p-3 backdrop-blur-sm">
              <p className="text-[11px] font-bold uppercase tracking-wide text-white/65">Должников</p>
              <p className="mt-1 text-[19px] font-extrabold tabular-nums tracking-tight">
                {totals.debtorsCount}
                <span className="ml-1.5 text-[12px] font-bold text-white/65">
                  {pluralRu(totals.debtorsCount, "человек", "человека", "человек")}
                </span>
              </p>
            </div>
          </div>
        </div>
      </motion.section>

      {/* Сводные плитки */}
      <div className="mt-4 grid grid-cols-2 gap-3">
        <Link href="/kids" className="press block">
          <div className="card flex items-center gap-3 p-4">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500/10 text-sky-500">
              <Users size={19} strokeWidth={2.4} />
            </span>
            <div>
              <p className="text-[20px] font-extrabold leading-none tabular-nums">{totals.kidsCount}</p>
              <p className="mt-1 text-[11.5px] font-bold text-slate-400">{pluralKids(totals.kidsCount)} в классе</p>
            </div>
          </div>
        </Link>
        <Link href="/collections" className="press block">
          <div className="card flex items-center gap-3 p-4">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500/10 text-brand-500">
              <Coins size={19} strokeWidth={2.4} />
            </span>
            <div>
              <p className="text-[20px] font-extrabold leading-none tabular-nums">{totals.collectionsCount}</p>
              <p className="mt-1 text-[11.5px] font-bold text-slate-400">
                {pluralRu(totals.collectionsCount, "сбор", "сбора", "сборов")}
              </p>
            </div>
          </div>
        </Link>
      </div>

      {/* Действия */}
      <div className="mt-5 flex flex-col gap-2.5">
        <LinkButton href="/collections/new" size="xl" full>
          <Plus size={21} strokeWidth={2.8} />
          Новый сбор
        </LinkButton>
        <LinkButton href="/kids/new" size="xl" variant="outline" full>
          <UserPlus size={20} strokeWidth={2.6} />
          Добавить ребёнка
        </LinkButton>
      </div>

      {/* Содержимое */}
      {isEmpty ? (
        <div className="mt-6">
          <div className="card flex flex-col items-center px-6 py-9 text-center">
            <motion.div
              animate={{ y: [0, -6, 0] }}
              transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
              className="mb-4 flex h-16 w-16 items-center justify-center rounded-[1.4rem] bg-brand-500/10 text-brand-500"
            >
              <Sparkles size={28} strokeWidth={2.2} />
            </motion.div>
            <p className="text-lg font-extrabold">Начнём с пустого класса</p>
            <p className="mt-1.5 max-w-[30ch] text-sm font-medium leading-relaxed text-slate-500 dark:text-slate-400">
              Добавьте детей, создайте сборы и отмечайте, кто сдал деньги. Всё хранится на этом устройстве.
            </p>
            <Button variant="soft" className="mt-5" onClick={() => loadDemo()}>
              <PartyPopper size={17} strokeWidth={2.4} />
              Посмотреть на примере
            </Button>
            <p className="mt-2 text-[11.5px] font-medium text-slate-400">
              загрузим демо-класс — его легко удалить потом
            </p>
          </div>
        </div>
      ) : sortedCollections.length > 0 ? (
        <section className="mt-7">
          <div className="mb-3 flex items-center justify-between px-1">
            <h2 className="text-[15px] font-extrabold uppercase tracking-[0.06em] text-slate-400 dark:text-slate-500">
              Активные сборы
            </h2>
            <Link
              href="/collections"
              className="inline-flex items-center gap-0.5 text-[13px] font-bold text-brand-600 dark:text-brand-300"
            >
              Все
              <ChevronRight size={15} strokeWidth={2.6} />
            </Link>
          </div>
          <div className="flex flex-col gap-3">
            {sortedCollections.slice(0, 3).map((c, i) => (
              <CollectionCard key={c.id} collection={c} stats={getCollectionStats(data, c)} index={i} />
            ))}
          </div>
        </section>
      ) : (
        <div className="card mt-7 flex flex-col items-center px-6 py-8 text-center">
          <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-[1.2rem] bg-amber-500/10 text-amber-500">
            <Coins size={26} strokeWidth={2.2} />
          </div>
          <p className="text-base font-extrabold">Сборов пока нет</p>
          <p className="mt-1 max-w-[26ch] text-sm font-medium text-slate-500 dark:text-slate-400">
            Дети добавлены — самое время создать первый сбор
          </p>
        </div>
      )}
    </div>
  );
}

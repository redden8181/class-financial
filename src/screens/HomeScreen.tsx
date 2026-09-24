import {
  CircleAlert,
  HandCoins,
  Moon,
  PiggyBank,
  Plus,
  Sun,
  UserPlus,
  Users,
} from "lucide-react";
import { useState } from "react";
import { useNav } from "../app/nav";
import { useStore } from "../app/store";
import { useTheme } from "../app/theme";
import { formatMoney, grandTotals, plural, sortCollections } from "../app/utils";
import { ChildFormSheet } from "../components/ChildFormSheet";
import { CollectionCard } from "../components/CollectionCard";
import { CollectionFormSheet } from "../components/CollectionFormSheet";
import { Button, EmptyState, IconButton, Progress, SectionTitle } from "../components/ui";
import { cn } from "../utils/cn";

export function HomeScreen() {
  const { data } = useStore();
  const { push, setTab } = useNav();
  const { dark, toggle } = useTheme();
  const [childForm, setChildForm] = useState(false);
  const [collectionForm, setCollectionForm] = useState(false);

  const totals = grandTotals(data);
  const collections = sortCollections(data.collections);

  return (
    <div
      className="px-4 pb-40"
      style={{ paddingTop: "max(env(safe-area-inset-top), 1.5rem)" }}
    >
      {/* Шапка */}
      <header className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-amber-600 dark:text-amber-400">
            Учёт сборов класса
          </p>
          <h1 className="mt-0.5 text-[1.7rem] font-extrabold tracking-tight">
            Классная копилка
          </h1>
        </div>
        <IconButton
          onClick={toggle}
          aria-label={dark ? "Светлая тема" : "Тёмная тема"}
        >
          {dark ? <Sun size={18} /> : <Moon size={18} />}
        </IconButton>
      </header>

      {/* Главная карточка */}
      <section className="card relative mt-5 overflow-hidden p-5">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-amber-400/25 blur-2xl dark:bg-amber-400/10"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-16 -left-10 h-36 w-36 rounded-full bg-orange-300/25 blur-2xl dark:bg-orange-400/10"
        />
        <div className="relative">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.12em] text-app-muted">
            <PiggyBank size={15} className="text-amber-500" />
            Собрано всего
          </div>
          <div className="mt-1.5 text-[2.5rem] font-extrabold leading-none tracking-tight">
            {formatMoney(totals.collected)}
          </div>
          <Progress value={totals.collectedPercent} className="mt-5" />
          <div className="mt-2 flex items-baseline justify-between text-xs font-medium text-app-muted">
            <span>{totals.collectedPercent}% собрано</span>
            <span>
              осталось{" "}
              <span className="font-bold text-app-text">
                {formatMoney(totals.remaining)}
              </span>
            </span>
          </div>
        </div>
      </section>

      {/* Мини-статистика */}
      <div className="mt-3 grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => setTab("kids")}
          className="card p-4 text-left transition-transform duration-150 active:scale-[0.97]"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-sky-100 text-sky-600 dark:bg-sky-500/15 dark:text-sky-300">
            <Users size={17} />
          </div>
          <div className="mt-3 text-2xl font-extrabold tracking-tight">
            {totals.kids}
          </div>
          <div className="text-xs font-medium text-app-muted">
            {plural(totals.kids, "ребёнок", "ребёнка", "детей")} в классе
          </div>
        </button>
        <button
          type="button"
          onClick={() => setTab("debts")}
          className="card p-4 text-left transition-transform duration-150 active:scale-[0.97]"
        >
          <div
            className={cn(
              "flex h-9 w-9 items-center justify-center rounded-2xl",
              totals.debtors > 0
                ? "bg-rose-100 text-rose-500 dark:bg-rose-500/15 dark:text-rose-300"
                : "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300"
            )}
          >
            <CircleAlert size={17} />
          </div>
          <div className="mt-3 text-2xl font-extrabold tracking-tight">
            {totals.debtors}
          </div>
          <div className="text-xs font-medium text-app-muted">
            {plural(totals.debtors, "должник", "должника", "должников")}
          </div>
        </button>
      </div>

      {/* Большие кнопки */}
      <div className="mt-4 space-y-2.5">
        <Button onClick={() => setCollectionForm(true)}>
          <Plus size={20} strokeWidth={2.6} />
          Новый сбор
        </Button>
        <Button variant="secondary" onClick={() => setChildForm(true)}>
          <UserPlus size={18} />
          Добавить ребёнка
        </Button>
      </div>

      {/* Активные сборы */}
      <SectionTitle
        title="Активные сборы"
        className="mt-8"
        right={
          collections.length > 0 ? (
            <span className="rounded-full bg-app-soft px-2.5 py-1 text-xs font-bold text-app-muted">
              {collections.length}
            </span>
          ) : undefined
        }
      />
      <div className="mt-3 space-y-3">
        {collections.length === 0 ? (
          <EmptyState
            icon={HandCoins}
            title="Пока нет ни одного сбора"
            text={
              data.children.length === 0
                ? "Сначала добавьте детей класса, а затем создайте первый сбор."
                : "Создайте первый сбор — шторы, Новый год, экскурсия или что угодно ещё."
            }
            action={
              data.children.length === 0 ? (
                <Button variant="secondary" onClick={() => setChildForm(true)}>
                  <UserPlus size={18} />
                  Добавить ребёнка
                </Button>
              ) : (
                <Button onClick={() => setCollectionForm(true)}>
                  <Plus size={18} strokeWidth={2.6} />
                  Создать сбор
                </Button>
              )
            }
          />
        ) : (
          collections.map((c, i) => (
            <CollectionCard
              key={c.id}
              collection={c}
              index={i}
              onClick={() => push({ name: "collection", collectionId: c.id })}
            />
          ))
        )}
      </div>

      <ChildFormSheet open={childForm} onClose={() => setChildForm(false)} />
      <CollectionFormSheet
        open={collectionForm}
        onClose={() => setCollectionForm(false)}
        onCreated={(id) => push({ name: "collection", collectionId: id })}
      />
    </div>
  );
}

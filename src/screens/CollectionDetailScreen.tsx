import {
  CalendarClock,
  CalendarDays,
  Check,
  ChevronLeft,
  Coins,
  Pencil,
  PiggyBank,
  Plus,
  Receipt,
  Trash2,
  Users,
  Wallet,
  X,
} from "lucide-react";
import { useState } from "react";
import { useNav } from "../app/nav";
import { useStore } from "../app/store";
import {
  byName,
  collectionExpenses,
  collectionStats,
  deadlineInfo,
  formatDate,
  formatMoney,
  fullName,
  paidAmount,
  paymentStatus,
  plural,
} from "../app/utils";
import type { Child, Expense } from "../app/types";
import { Avatar } from "../components/Avatar";
import { CollectionFormSheet } from "../components/CollectionFormSheet";
import { ExpenseFormSheet } from "../components/ExpenseFormSheet";
import { PaymentSheet } from "../components/PaymentSheet";
import { ReceiptPhoto } from "../components/ReceiptPhoto";
import {
  Button,
  ConfirmSheet,
  EmptyState,
  IconButton,
  Progress,
  Segmented,
} from "../components/ui";
import { cn } from "../utils/cn";

type Filter = "all" | "paid" | "partial" | "none";

export function CollectionDetailScreen({ collectionId }: { collectionId: string }) {
  const { data, removeCollection, removeExpense } = useStore();
  const { pop, setTab } = useNav();
  const [filter, setFilter] = useState<Filter>("all");
  const [editOpen, setEditOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [paymentChildId, setPaymentChildId] = useState<string | null>(null);
  const [expenseFormOpen, setExpenseFormOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [expenseToDelete, setExpenseToDelete] = useState<Expense | null>(null);

  const collection = data.collections.find((c) => c.id === collectionId);
  if (!collection) return <div className="p-6" />;

  const s = collectionStats(data, collection);
  const expenses = collectionExpenses(data, collection.id);
  const dl = deadlineInfo(collection.deadline);
  const paidMap = data.payments[collection.id] ?? {};
  const statusOf = (child: Child) =>
    paymentStatus(paidMap[child.id], collection.amount);

  const kids = [...data.children]
    .sort(byName)
    .filter((c) => {
      const st = statusOf(c);
      if (filter === "paid") return st === "full";
      if (filter === "partial") return st === "partial";
      if (filter === "none") return st === "none";
      return true;
    });

  return (
    <div
      className="px-4 pb-12"
      style={{ paddingTop: "max(env(safe-area-inset-top), 1.25rem)" }}
    >
      {/* Шапка */}
      <div className="flex items-center justify-between">
        <IconButton onClick={pop} aria-label="Назад">
          <ChevronLeft size={20} />
        </IconButton>
        <div className="flex gap-2">
          <IconButton onClick={() => setEditOpen(true)} aria-label="Изменить">
            <Pencil size={16} />
          </IconButton>
          <IconButton
            onClick={() => setConfirmOpen(true)}
            aria-label="Удалить"
            className="text-rose-500"
          >
            <Trash2 size={16} />
          </IconButton>
        </div>
      </div>

      {/* Заголовок сбора */}
      <div className="mt-5 px-1">
        <h1 className="text-2xl font-extrabold tracking-tight">
          {collection.title}
        </h1>
        <p className="mt-1.5 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-sm font-medium text-app-muted">
          <span className="inline-flex items-center gap-1.5">
            <CalendarDays size={14} />
            {formatDate(collection.date)}
          </span>
          <span className="text-app-border">•</span>
          <span>{formatMoney(collection.amount)} с ребёнка</span>
        </p>
        {dl && (
          <p
            className={cn(
              "mt-1.5 flex items-center gap-1.5 text-sm font-semibold",
              dl.overdue && !s.done
                ? "text-rose-500 dark:text-rose-400"
                : "text-app-muted"
            )}
          >
            <CalendarClock size={14} className="shrink-0" />
            Собрать до {formatDate(collection.deadline!)}
            {!s.done && <span>· {dl.label}</span>}
          </p>
        )}
        {collection.description && (
          <p className="mt-3 text-sm leading-relaxed text-app-muted">
            {collection.description}
          </p>
        )}
      </div>

      {/* Прогресс и статистика */}
      <section className="card relative mt-4 overflow-hidden p-5">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-amber-400/20 blur-2xl dark:bg-amber-400/10"
        />
        <div className="relative flex items-end justify-between gap-4">
          <div>
            <div className="text-5xl font-extrabold leading-none tracking-tight">
              {s.percent}
              <span className="text-2xl">%</span>
            </div>
            <div className="mt-2 text-xs font-semibold text-app-muted">
              {s.paid === 0 && s.total === 0
                ? "пока никто не сдал"
                : `полностью сдали ${s.paid} из ${s.total}`}
            </div>
          </div>
          <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-amber-100 text-amber-500 dark:bg-amber-500/15 dark:text-amber-300">
            <PiggyBank size={26} strokeWidth={1.8} />
          </div>
        </div>
        <Progress value={s.percent} className="relative mt-4" />

        <div className="relative mt-4 grid grid-cols-2 gap-2.5">
          <StatTile
            label={`Сдали полностью — ${plural(s.paid, "ребёнок", "ребёнка", "детей")}`}
            value={String(s.paid)}
            tone="emerald"
          />
          <StatTile
            label={`Внесли частично — ${plural(s.partial, "ребёнок", "ребёнка", "детей")}`}
            value={String(s.partial)}
            tone={s.partial > 0 ? "amber" : "default"}
          />
          <StatTile
            label="Собрано"
            value={formatMoney(s.collected)}
            tone="amber"
            money
          />
          <StatTile
            label="Осталось собрать"
            value={formatMoney(s.remaining)}
            tone={s.remaining > 0 ? "rose" : "default"}
            money
          />
        </div>

        {/* Касса: собрано − потрачено */}
        {s.spent > 0 && (
          <div className="relative mt-2.5 flex items-center justify-between gap-3 rounded-2xl bg-app-soft p-3.5">
            <div className="flex min-w-0 items-center gap-2.5">
              <Wallet size={17} className="shrink-0 text-app-muted" />
              <div className="min-w-0">
                <div className="text-[11px] font-medium text-app-muted">
                  Потрачено {formatMoney(s.spent)} из {formatMoney(s.collected)}
                </div>
                <div className="text-xs font-bold">Остаток в кассе</div>
              </div>
            </div>
            <div
              className={cn(
                "shrink-0 text-lg font-extrabold tracking-tight",
                s.balance < 0
                  ? "text-rose-500 dark:text-rose-400"
                  : "text-emerald-600 dark:text-emerald-400"
              )}
            >
              {formatMoney(s.balance)}
            </div>
          </div>
        )}
      </section>

      {/* Расходы */}
      <div className="mt-7 flex items-center justify-between px-1">
        <h2 className="text-lg font-bold tracking-tight">Расходы</h2>
        <button
          type="button"
          onClick={() => {
            setEditingExpense(null);
            setExpenseFormOpen(true);
          }}
          className="flex items-center gap-1.5 rounded-full bg-app-soft px-3.5 py-2 text-xs font-bold text-app-text transition-all active:scale-95"
        >
          <Plus size={14} strokeWidth={2.8} />
          Добавить
        </button>
      </div>

      {expenses.length === 0 ? (
        <button
          type="button"
          onClick={() => {
            setEditingExpense(null);
            setExpenseFormOpen(true);
          }}
          className="card mt-3 flex w-full items-center gap-3 p-4 text-left transition-transform active:scale-[0.98]"
        >
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-app-soft text-app-muted">
            <Receipt size={19} />
          </span>
          <span className="min-w-0">
            <span className="block text-sm font-bold">Трат пока нет</span>
            <span className="mt-0.5 block text-xs leading-relaxed text-app-muted">
              Записывайте, на что потратили деньги, и прикладывайте фото чека
            </span>
          </span>
        </button>
      ) : (
        <div className="card mt-3 overflow-hidden">
          {expenses.map((e, i) => (
            <div
              key={e.id}
              className={cn(
                "flex items-center gap-3 p-3.5",
                i > 0 && "border-t border-app-border/70"
              )}
            >
              {e.photoId ? (
                <ReceiptPhoto photoId={e.photoId} className="h-12 w-12" />
              ) : (
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-app-soft text-app-muted">
                  <Receipt size={18} />
                </span>
              )}
              <button
                type="button"
                onClick={() => {
                  setEditingExpense(e);
                  setExpenseFormOpen(true);
                }}
                className="min-w-0 flex-1 text-left"
              >
                <div className="truncate text-sm font-semibold">{e.title}</div>
                <div className="mt-0.5 truncate text-xs font-medium text-app-muted">
                  {e.date ? formatDate(e.date) : ""}
                  {e.note ? ` · ${e.note}` : ""}
                </div>
              </button>
              <div className="flex shrink-0 items-center gap-1">
                <span className="text-sm font-bold text-rose-500 dark:text-rose-400">
                  −{formatMoney(e.amount)}
                </span>
                <button
                  type="button"
                  aria-label="Удалить расход"
                  onClick={() => setExpenseToDelete(e)}
                  className="flex h-8 w-8 items-center justify-center rounded-full text-app-muted transition-all active:scale-90 active:text-rose-500"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}
          <div className="flex items-center justify-between bg-app-soft/70 px-4 py-3">
            <span className="text-xs font-bold uppercase tracking-wide text-app-muted">
              Всего потрачено
            </span>
            <span className="text-sm font-extrabold text-rose-500 dark:text-rose-400">
              {formatMoney(s.spent)}
            </span>
          </div>
        </div>
      )}

      {/* Список детей */}
      {data.children.length === 0 ? (
        <div className="mt-4">
          <EmptyState
            icon={Users}
            title="Сначала добавьте детей"
            text="В классе пока никого нет — отметки об оплате ставить некому."
            action={
              <Button variant="secondary" onClick={() => setTab("kids")}>
                Перейти к списку детей
              </Button>
            }
          />
        </div>
      ) : (
        <>
          <div className="mt-6">
            <Segmented<Filter>
              small
              value={filter}
              onChange={setFilter}
              options={[
                { value: "all", label: `Все · ${s.total}` },
                { value: "paid", label: `Сдали · ${s.paid}` },
                { value: "partial", label: `Частично · ${s.partial}` },
                { value: "none", label: `Не сдали · ${s.none}` },
              ]}
            />
          </div>
          {kids.length === 0 ? (
            <p className="mt-4 px-1 text-center text-sm font-medium text-app-muted">
              В этой категории никого нет.
            </p>
          ) : (
            <div className="card mt-3 overflow-hidden">
              {kids.map((child, i) => {
                const state = paidMap[child.id];
                const status = statusOf(child);
                const sum = paidAmount(state);
                const remaining = Math.max(0, collection.amount - sum);
                return (
                  <div
                    key={child.id}
                    className={cn(
                      "flex items-center gap-3 p-3 pl-4",
                      i > 0 && "border-t border-app-border/70"
                    )}
                  >
                    <Avatar child={child} size="sm" />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-semibold">
                        {fullName(child)}
                      </div>
                      {status === "full" && state && state.contributions.length > 0 && (
                        <div className="mt-0.5 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                          оплачено{" "}
                          {formatDate(
                            state.contributions[state.contributions.length - 1].date
                          )}
                        </div>
                      )}
                      {status === "partial" && (
                        <div className="mt-0.5 text-[11px] font-medium text-amber-600 dark:text-amber-400">
                          внесено {formatMoney(sum)} · осталось {formatMoney(remaining)}
                        </div>
                      )}
                    </div>
                    <PaymentPill
                      status={status}
                      sum={sum}
                      onClick={() => setPaymentChildId(child.id)}
                    />
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      <PaymentSheet
        open={paymentChildId !== null}
        onClose={() => setPaymentChildId(null)}
        collectionId={collection.id}
        childId={paymentChildId}
      />
      <ExpenseFormSheet
        open={expenseFormOpen}
        onClose={() => {
          setExpenseFormOpen(false);
          setEditingExpense(null);
        }}
        collectionId={collection.id}
        initial={editingExpense}
      />
      <ConfirmSheet
        open={expenseToDelete !== null}
        onClose={() => setExpenseToDelete(null)}
        onConfirm={() => {
          if (expenseToDelete) removeExpense(collection.id, expenseToDelete.id);
          setExpenseToDelete(null);
        }}
        title="Удалить расход?"
        text={
          expenseToDelete
            ? `Запись «${expenseToDelete.title}» на ${formatMoney(expenseToDelete.amount)} будет удалена вместе с фото чека.`
            : ""
        }
      />
      <CollectionFormSheet
        open={editOpen}
        onClose={() => setEditOpen(false)}
        initial={collection}
      />
      <ConfirmSheet
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={() => {
          removeCollection(collection.id);
          setConfirmOpen(false);
          pop();
        }}
        title="Удалить сбор?"
        text={`Сбор «${collection.title}» и все взносы будут удалены. Это действие нельзя отменить.`}
      />
    </div>
  );
}

function PaymentPill({
  status,
  sum,
  onClick,
}: {
  status: "none" | "partial" | "full";
  sum: number;
  onClick(): void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-bold transition-all duration-150 active:scale-95",
        status === "full"
          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300"
          : status === "partial"
            ? "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300"
            : "bg-app-soft text-app-muted"
      )}
    >
      {status === "full" ? (
        <>
          <Check size={14} strokeWidth={3} />
          Сдал
        </>
      ) : status === "partial" ? (
        <>
          <Coins size={14} />
          {formatMoney(sum)}
        </>
      ) : (
        <>
          <X size={14} strokeWidth={3} />
          Не сдал
        </>
      )}
    </button>
  );
}

function StatTile({
  label,
  value,
  tone,
  money,
}: {
  label: string;
  value: string;
  tone: "emerald" | "rose" | "amber" | "default";
  money?: boolean;
}) {
  return (
    <div className="rounded-2xl bg-app-soft p-3.5">
      <div
        className={cn(
          money ? "text-base" : "text-2xl",
          "truncate font-extrabold tracking-tight",
          tone === "emerald" && "text-emerald-600 dark:text-emerald-400",
          tone === "rose" && "text-rose-500 dark:text-rose-400",
          tone === "amber" && "text-amber-600 dark:text-amber-400"
        )}
      >
        {value}
      </div>
      <div className="mt-0.5 text-[11px] font-medium leading-tight text-app-muted">
        {label}
      </div>
    </div>
  );
}

import {
  Check,
  ChevronLeft,
  Coins,
  History,
  Pencil,
  Trash2,
  X,
} from "lucide-react";
import { useState } from "react";
import { useNav } from "../app/nav";
import { useStore } from "../app/store";
import {
  childHistory,
  childTotals,
  formatDate,
  formatMoney,
  fullName,
} from "../app/utils";
import { Avatar } from "../components/Avatar";
import { ChildFormSheet } from "../components/ChildFormSheet";
import { PaymentSheet } from "../components/PaymentSheet";
import { ConfirmSheet, EmptyState, IconButton } from "../components/ui";
import { cn } from "../utils/cn";

export function KidDetailScreen({ childId }: { childId: string }) {
  const { data, removeChild } = useStore();
  const { pop } = useNav();
  const [editOpen, setEditOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [paymentCollectionId, setPaymentCollectionId] = useState<string | null>(null);

  const child = data.children.find((c) => c.id === childId);
  if (!child) return <div className="p-6" />;

  const totals = childTotals(data, childId);
  const history = childHistory(data, childId);

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

      {/* Карточка ребёнка */}
      <section className="card mt-4 flex flex-col items-center px-5 pb-6 pt-7 text-center">
        <Avatar child={child} size="lg" />
        <h1 className="mt-4 text-2xl font-extrabold tracking-tight">
          {fullName(child)}
        </h1>
        <span
          className={cn(
            "mt-2 rounded-full px-3 py-1 text-xs font-bold",
            child.gender === "boy"
              ? "bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300"
              : "bg-rose-100 text-rose-600 dark:bg-rose-500/15 dark:text-rose-300"
          )}
        >
          {child.gender === "boy" ? "Мальчик" : "Девочка"}
        </span>
      </section>

      {/* Итоги */}
      <div className="mt-3 grid grid-cols-2 gap-3">
        <div className="card p-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300">
            <Check size={17} strokeWidth={2.6} />
          </div>
          <div className="mt-3 truncate text-xl font-extrabold tracking-tight">
            {formatMoney(totals.paidSum)}
          </div>
          <div className="text-xs font-medium text-app-muted">Оплачено всего</div>
        </div>
        <div className="card p-4">
          <div
            className={cn(
              "flex h-9 w-9 items-center justify-center rounded-2xl",
              totals.debtSum > 0
                ? "bg-rose-100 text-rose-500 dark:bg-rose-500/15 dark:text-rose-300"
                : "bg-app-soft text-app-muted"
            )}
          >
            <X size={17} strokeWidth={2.6} />
          </div>
          <div className="mt-3 truncate text-xl font-extrabold tracking-tight">
            {formatMoney(totals.debtSum)}
          </div>
          <div className="text-xs font-medium text-app-muted">Задолженность</div>
        </div>
      </div>

      {/* История */}
      <div className="mt-7 flex items-center justify-between px-1">
        <h2 className="text-lg font-bold tracking-tight">История сборов</h2>
        {history.length > 0 && (
          <span className="text-xs font-semibold text-app-muted">
            нажмите, чтобы внести взнос
          </span>
        )}
      </div>

      {history.length === 0 ? (
        <div className="mt-3">
          <EmptyState
            icon={History}
            title="Сборов пока не было"
            text="Когда появятся сборы, здесь будет полная история оплат ребёнка."
          />
        </div>
      ) : (
        <div className="card mt-3 overflow-hidden">
          {history.map(({ collection, sum, remaining, status, lastDate }, i) => (
            <button
              key={collection.id}
              type="button"
              onClick={() => setPaymentCollectionId(collection.id)}
              className={cn(
                "flex w-full items-center gap-3 p-4 text-left transition-colors active:bg-app-soft/70",
                i > 0 && "border-t border-app-border/70"
              )}
            >
              <span
                className={cn(
                  "flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-colors",
                  status === "full"
                    ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300"
                    : status === "partial"
                      ? "bg-amber-100 text-amber-600 dark:bg-amber-500/15 dark:text-amber-300"
                      : "bg-rose-100 text-rose-500 dark:bg-rose-500/15 dark:text-rose-300"
                )}
              >
                {status === "full" ? (
                  <Check size={16} strokeWidth={2.8} />
                ) : status === "partial" ? (
                  <Coins size={15} />
                ) : (
                  <X size={16} strokeWidth={2.8} />
                )}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold">
                  {collection.title}
                </span>
                <span
                  className={cn(
                    "mt-0.5 block text-xs font-medium",
                    status === "full"
                      ? "text-emerald-600 dark:text-emerald-400"
                      : status === "partial"
                        ? "text-amber-600 dark:text-amber-400"
                        : "text-rose-500 dark:text-rose-400"
                  )}
                >
                  {status === "full"
                    ? `Оплачено полностью${lastDate ? ` · ${formatDate(lastDate)}` : ""}`
                    : status === "partial"
                      ? `Внесено ${formatMoney(sum)} — осталось ${formatMoney(remaining)}`
                      : "Не оплачено"}
                </span>
              </span>
              <span className="shrink-0 text-sm font-bold">
                {formatMoney(collection.amount)}
              </span>
            </button>
          ))}
        </div>
      )}

      <PaymentSheet
        open={paymentCollectionId !== null}
        onClose={() => setPaymentCollectionId(null)}
        collectionId={paymentCollectionId}
        childId={child.id}
      />
      <ChildFormSheet
        open={editOpen}
        onClose={() => setEditOpen(false)}
        initial={child}
      />
      <ConfirmSheet
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={() => {
          removeChild(child.id);
          setConfirmOpen(false);
          pop();
        }}
        title="Удалить ребёнка?"
        text={`${fullName(child)} будет удалён из класса вместе со всей историей оплат. Это действие нельзя отменить.`}
      />
    </div>
  );
}

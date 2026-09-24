import { CheckCircle2, Coins, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useStore } from "../app/store";
import {
  formatDate,
  formatMoney,
  fullName,
  paidAmount,
  paymentStatus,
  vibrate,
} from "../app/utils";
import { cn } from "../utils/cn";
import { Avatar } from "./Avatar";
import { Button, Progress, Sheet } from "./ui";

/**
 * Шторка оплаты одного сбора одним ребёнком.
 * Поддерживает частичные взносы: 100 ₽ сейчас, 200 ₽ позже и т.д.
 */
export function PaymentSheet({
  open,
  onClose,
  collectionId,
  childId,
}: {
  open: boolean;
  onClose(): void;
  collectionId: string | null;
  childId: string | null;
}) {
  const { data, addContribution, removeContribution } = useStore();
  const [amountInput, setAmountInput] = useState("");

  const collection = collectionId
    ? data.collections.find((c) => c.id === collectionId)
    : undefined;
  const child = childId ? data.children.find((c) => c.id === childId) : undefined;
  const state =
    collection && child ? data.payments[collection.id]?.[child.id] : undefined;
  const sum = paidAmount(state);
  const status = collection ? paymentStatus(state, collection.amount) : "none";
  const remaining = collection ? Math.max(0, collection.amount - sum) : 0;

  useEffect(() => {
    if (open && collection && child) {
      setAmountInput(remaining > 0 ? String(remaining) : "");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, collectionId, childId]);

  if (!collection || !child) return <Sheet open={false} onClose={onClose} title="" children={null} />;

  const parsed = Number.parseFloat(amountInput.replace(/\s/g, "").replace(",", "."));
  const canAdd = status !== "full" && Number.isFinite(parsed) && parsed > 0;

  const quick = [100, 200, 500].filter((v) => v < remaining);
  if (remaining > 0) quick.push(remaining);

  const submit = () => {
    if (!canAdd) return;
    const value = Math.min(parsed, remaining);
    addContribution(collection.id, child.id, value);
    vibrate();
    if (value >= remaining - 0.001) {
      onClose();
    } else {
      const left = Math.round((remaining - value) * 100) / 100;
      setAmountInput(String(left));
    }
  };

  const percent = collection.amount > 0 ? Math.min(100, Math.round((sum / collection.amount) * 100)) : 0;

  return (
    <Sheet open={open} onClose={onClose} title={fullName(child)}>
      <div className="space-y-5">
        {/* Прогресс по сбору */}
        <div className="rounded-2xl bg-app-soft p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="truncate text-sm font-bold">{collection.title}</div>
              <div className="mt-0.5 text-xs font-medium text-app-muted">
                цель — {formatMoney(collection.amount)}
              </div>
            </div>
            <Avatar child={child} size="sm" />
          </div>
          <Progress
            value={percent}
            className="mt-3"
            barClassName={status === "full" ? "from-emerald-400 to-emerald-500" : undefined}
          />
          <div className="mt-2 flex items-baseline justify-between text-xs font-semibold">
            <span
              className={cn(
                status === "full"
                  ? "text-emerald-600 dark:text-emerald-400"
                  : status === "partial"
                    ? "text-amber-600 dark:text-amber-400"
                    : "text-app-muted"
              )}
            >
              {status === "full"
                ? `Внесено ${formatMoney(sum)} — всё оплачено`
                : status === "partial"
                  ? `Внесено ${formatMoney(sum)} из ${formatMoney(collection.amount)}`
                  : "Пока ничего не внесено"}
            </span>
            {status !== "full" && (
              <span className="text-app-muted">
                осталось <span className="text-app-text">{formatMoney(remaining)}</span>
              </span>
            )}
          </div>
        </div>

        {/* Форма взноса */}
        {status !== "full" && (
          <div>
            <span className="label">Добавить взнос</span>
            <div className="relative">
              <input
                className="input pr-9 text-lg font-bold"
                value={amountInput}
                onChange={(e) => setAmountInput(e.target.value)}
                inputMode="decimal"
                placeholder="0"
                autoComplete="off"
              />
              <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-app-muted">
                ₽
              </span>
            </div>
            {quick.length > 0 && (
              <div className="mt-2.5 flex flex-wrap gap-2">
                {quick.map((v, i) => (
                  <button
                    key={`${v}-${i}`}
                    type="button"
                    onClick={() => setAmountInput(String(v))}
                    className="rounded-full border border-app-border bg-app-card px-3.5 py-1.5 text-xs font-bold text-app-muted transition-all active:scale-95"
                  >
                    {v === remaining && v !== 100 && v !== 200 && v !== 500
                      ? `Всё · ${formatMoney(v)}`
                      : formatMoney(v)}
                  </button>
                ))}
              </div>
            )}
            <Button className="mt-3" onClick={submit} disabled={!canAdd}>
              <Coins size={18} />
              {canAdd && Math.min(parsed, remaining) >= remaining - 0.001
                ? `Внести ${formatMoney(Math.min(parsed, remaining))} — полная оплата`
                : canAdd
                  ? `Внести ${formatMoney(Math.min(parsed, remaining))}`
                  : "Внести"}
            </Button>
          </div>
        )}

        {status === "full" && (
          <div className="flex items-center gap-3 rounded-2xl bg-emerald-100 p-4 dark:bg-emerald-500/10">
            <CheckCircle2
              size={22}
              className="shrink-0 text-emerald-600 dark:text-emerald-400"
            />
            <div>
              <div className="text-sm font-bold text-emerald-700 dark:text-emerald-300">
                Сбор полностью оплачен
              </div>
              {state && state.contributions.length > 0 && (
                <div className="mt-0.5 text-xs font-medium text-emerald-600/80 dark:text-emerald-400/80">
                  последний взнос{" "}
                  {formatDate(
                    state.contributions[state.contributions.length - 1].date
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* История взносов */}
        {state && state.contributions.length > 0 && (
          <div>
            <span className="label">
              Взносы · {state.contributions.length}
            </span>
            <div className="overflow-hidden rounded-2xl border border-app-border">
              {state.contributions.map((c, i) => (
                <div
                  key={c.id}
                  className={cn(
                    "flex items-center gap-3 bg-app-card px-4 py-3",
                    i > 0 && "border-t border-app-border/60"
                  )}
                >
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-bold">{formatMoney(c.amount)}</div>
                    <div className="mt-0.5 text-xs font-medium text-app-muted">
                      {formatDate(c.date)} в{" "}
                      {new Date(c.date).toLocaleTimeString("ru-RU", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  </div>
                  <button
                    type="button"
                    aria-label="Удалить взнос"
                    onClick={() => {
                      removeContribution(collection.id, child.id, c.id);
                      vibrate();
                    }}
                    className="flex h-9 w-9 items-center justify-center rounded-full text-app-muted transition-all active:scale-90 active:text-rose-500"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Sheet>
  );
}

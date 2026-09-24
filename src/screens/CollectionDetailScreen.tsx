import {
  CalendarDays,
  Check,
  ChevronLeft,
  Pencil,
  PiggyBank,
  Trash2,
  Users,
  X,
} from "lucide-react";
import { useState } from "react";
import { useNav } from "../app/nav";
import { useStore } from "../app/store";
import {
  byName,
  collectionStats,
  formatDate,
  formatMoney,
  fullName,
  plural,
  vibrate,
  type CollectionStats,
} from "../app/utils";
import { Avatar } from "../components/Avatar";
import { CollectionFormSheet } from "../components/CollectionFormSheet";
import {
  Button,
  ConfirmSheet,
  EmptyState,
  IconButton,
  Progress,
  Segmented,
} from "../components/ui";
import { cn } from "../utils/cn";

type Filter = "all" | "paid" | "unpaid";

export function CollectionDetailScreen({ collectionId }: { collectionId: string }) {
  const { data, removeCollection, setPaid } = useStore();
  const { pop, setTab } = useNav();
  const [filter, setFilter] = useState<Filter>("all");
  const [editOpen, setEditOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const collection = data.collections.find((c) => c.id === collectionId);
  if (!collection) return <div className="p-6" />;

  const s = collectionStats(data, collection);
  const paidMap = data.payments[collection.id] ?? {};
  const isPaid = (id: string) => Boolean(paidMap[id]?.paid);

  const kids = [...data.children]
    .sort(byName)
    .filter((c) =>
      filter === "all" ? true : filter === "paid" ? isPaid(c.id) : !isPaid(c.id)
    );

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
                : `сдали ${s.paid} из ${s.total}`}
            </div>
          </div>
          <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-amber-100 text-amber-500 dark:bg-amber-500/15 dark:text-amber-300">
            <PiggyBank size={26} strokeWidth={1.8} />
          </div>
        </div>
        <Progress value={s.percent} className="relative mt-4" />

        <div className="relative mt-4 grid grid-cols-2 gap-2.5">
          <StatTile
            label={`Сдали — ${plural(s.paid, "ребёнок", "ребёнка", "детей")}`}
            value={String(s.paid)}
            tone="emerald"
          />
          <StatTile
            label={`Не сдали — ${plural(s.unpaid, "ребёнок", "ребёнка", "детей")}`}
            value={String(s.unpaid)}
            tone={s.unpaid > 0 ? "rose" : "default"}
          />
          <StatTile label="Собрано" value={formatMoney(s.collected)} tone="amber" money />
          <StatTile
            label="Осталось собрать"
            value={formatMoney(s.remaining)}
            tone="default"
            money
          />
        </div>
      </section>

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
              value={filter}
              onChange={setFilter}
              options={[
                { value: "all", label: `Все · ${s.total}` },
                { value: "paid", label: `Сдали · ${s.paid}` },
                { value: "unpaid", label: `Не сдали · ${s.unpaid}` },
              ]}
            />
          </div>
          <div className="card mt-3 overflow-hidden">
            {kids.map((child, i) => {
              const paid = isPaid(child.id);
              const paidAt = paidMap[child.id]?.paidAt;
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
                    {paid && paidAt && (
                      <div className="mt-0.5 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                        оплачено {formatDate(paidAt)}
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setPaid(collection.id, child.id, !paid);
                      vibrate();
                    }}
                    className={cn(
                      "flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-bold transition-all duration-150 active:scale-95",
                      paid
                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300"
                        : "bg-app-soft text-app-muted"
                    )}
                  >
                    {paid ? (
                      <Check size={14} strokeWidth={3} />
                    ) : (
                      <X size={14} strokeWidth={3} />
                    )}
                    {paid ? "Сдал" : "Не сдал"}
                  </button>
                </div>
              );
            })}
          </div>
        </>
      )}

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
        text={`Сбор «${collection.title}» и все отметки об оплате будут удалены. Это действие нельзя отменить.`}
      />
    </div>
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

export type { CollectionStats };

import { ChevronRight, Plus, Search, UserPlus, Users } from "lucide-react";
import { useMemo, useState, type ReactNode } from "react";
import { useNav } from "../app/nav";
import { useStore } from "../app/store";
import type { Child } from "../app/types";
import {
  byName,
  childTotals,
  formatMoney,
  fullName,
  plural,
} from "../app/utils";
import { Avatar } from "../components/Avatar";
import { ChildFormSheet } from "../components/ChildFormSheet";
import { EmptyState, IconButton, Button } from "../components/ui";
import { cn } from "../utils/cn";

export function KidsScreen() {
  const { data } = useStore();
  const { push } = useNav();
  const [query, setQuery] = useState("");
  const [formOpen, setFormOpen] = useState(false);

  const filtered = useMemo(() => {
    const list = [...data.children].sort(byName);
    const q = query.trim().toLowerCase();
    if (!q) return list;
    return list.filter((c) => `${fullName(c)} ${c.firstName} ${c.lastName}`.toLowerCase().includes(q));
  }, [data.children, query]);

  const boys = filtered.filter((c) => c.gender === "boy");
  const girls = filtered.filter((c) => c.gender === "girl");

  const group = (
    title: string,
    list: Child[],
    dot: string
  ): ReactNode =>
    list.length > 0 && (
      <div className="mt-6">
        <div className="flex items-center gap-2 px-1">
          <span className={cn("h-2 w-2 rounded-full", dot)} />
          <h2 className="text-sm font-bold text-app-muted">
            {title} · {list.length}
          </h2>
        </div>
        <div className="card mt-2 overflow-hidden">
          {list.map((child, i) => (
            <KidRow
              key={child.id}
              child={child}
              withBorder={i > 0}
              onClick={() => push({ name: "child", childId: child.id })}
            />
          ))}
        </div>
      </div>
    );

  return (
    <div
      className="px-4 pb-40"
      style={{ paddingTop: "max(env(safe-area-inset-top), 1.5rem)" }}
    >
      <header className="flex items-end justify-between gap-3">
        <div>
          <h1 className="text-[1.7rem] font-extrabold tracking-tight">Дети</h1>
          <p className="mt-0.5 text-sm font-medium text-app-muted">
            {data.children.length}{" "}
            {plural(data.children.length, "ребёнок", "ребёнка", "детей")} в
            классе
          </p>
        </div>
        <IconButton onClick={() => setFormOpen(true)} aria-label="Добавить ребёнка">
          <Plus size={19} strokeWidth={2.4} />
        </IconButton>
      </header>

      {data.children.length > 0 && (
        <div className="relative mt-4">
          <Search
            size={17}
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-app-muted"
          />
          <input
            className="input pl-11"
            placeholder="Поиск по имени или фамилии"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoComplete="off"
          />
        </div>
      )}

      {data.children.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            icon={Users}
            title="В классе пока никого нет"
            text="Добавьте детей — и можно будет создавать сборы и отмечать оплату."
            action={
              <Button onClick={() => setFormOpen(true)}>
                <UserPlus size={18} />
                Добавить ребёнка
              </Button>
            }
          />
        </div>
      ) : filtered.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            icon={Search}
            title="Никого не найдено"
            text={`По запросу «${query.trim()}» никого нет. Проверьте написание.`}
          />
        </div>
      ) : (
        <>
          {group("Мальчики", boys, "bg-sky-500")}
          {group("Девочки", girls, "bg-rose-400")}
        </>
      )}

      <ChildFormSheet open={formOpen} onClose={() => setFormOpen(false)} />
    </div>
  );
}

function KidRow({
  child,
  onClick,
  withBorder,
}: {
  child: Child;
  onClick(): void;
  withBorder: boolean;
}) {
  const { data } = useStore();
  const { debtSum } = childTotals(data, child.id);
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-3 p-3.5 pl-4 text-left transition-colors active:bg-app-soft/70",
        withBorder && "border-t border-app-border/70"
      )}
    >
      <Avatar child={child} />
      <span className="min-w-0 flex-1 truncate text-[0.95rem] font-semibold">
        {fullName(child)}
      </span>
      {debtSum > 0 && (
        <span className="shrink-0 rounded-full bg-rose-100 px-2.5 py-1 text-[11px] font-bold text-rose-600 dark:bg-rose-500/15 dark:text-rose-300">
          долг {formatMoney(debtSum)}
        </span>
      )}
      <ChevronRight size={17} className="shrink-0 text-app-muted" />
    </button>
  );
}

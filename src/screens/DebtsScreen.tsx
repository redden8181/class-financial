import { ChevronRight, PartyPopper, Wallet, XCircle } from "lucide-react";
import { useNav } from "../app/nav";
import { useStore } from "../app/store";
import { debtsByChild, formatMoney, fullName, plural } from "../app/utils";
import { Avatar } from "../components/Avatar";
import { EmptyState } from "../components/ui";

export function DebtsScreen() {
  const { data } = useStore();
  const { push } = useNav();
  const debts = debtsByChild(data);
  const totalDebt = debts.reduce((s, d) => s + d.total, 0);

  return (
    <div
      className="px-4 pb-40"
      style={{ paddingTop: "max(env(safe-area-inset-top), 1.5rem)" }}
    >
      <header>
        <h1 className="text-[1.7rem] font-extrabold tracking-tight">Все долги</h1>
        <p className="mt-0.5 text-sm font-medium text-app-muted">
          кто и сколько должен по сборам
        </p>
      </header>

      {debts.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            icon={PartyPopper}
            title={data.collections.length === 0 ? "Долгов нет" : "Долгов нет — все сдали!"}
            text={
              data.collections.length === 0
                ? "Когда появятся неоплаченные сборы, они будут собраны здесь."
                : "Все сборы оплачены. Отличная работа родительского комитета!"
            }
          />
        </div>
      ) : (
        <>
          {/* Сводка */}
          <section className="card relative mt-5 overflow-hidden p-5">
            <div
              aria-hidden
              className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-rose-400/20 blur-2xl dark:bg-rose-400/10"
            />
            <div className="relative">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.12em] text-app-muted">
                <Wallet size={15} className="text-rose-500" />
                Общая задолженность
              </div>
              <div className="mt-1.5 text-[2.5rem] font-extrabold leading-none tracking-tight">
                {formatMoney(totalDebt)}
              </div>
              <div className="mt-2 text-xs font-medium text-app-muted">
                {debts.length}{" "}
                {plural(debts.length, "должник", "должника", "должников")}
              </div>
            </div>
          </section>

          {/* Список должников */}
          <div className="mt-5 space-y-3">
            {debts.map(({ child, items, total }) => (
              <div key={child.id} className="card overflow-hidden">
                <button
                  type="button"
                  onClick={() => push({ name: "child", childId: child.id })}
                  className="flex w-full items-center gap-3 p-4 text-left transition-colors active:bg-app-soft/70"
                >
                  <Avatar child={child} />
                  <span className="min-w-0 flex-1 truncate text-[0.95rem] font-bold">
                    {fullName(child)}
                  </span>
                  <ChevronRight size={17} className="shrink-0 text-app-muted" />
                </button>
                <div className="border-t border-app-border/70 px-4">
                  {items.map(({ collection }, i) => (
                    <div
                      key={collection.id}
                      className={
                        "flex items-center gap-2.5 py-2.5 " +
                        (i > 0 ? "border-t border-app-border/50" : "")
                      }
                    >
                      <XCircle size={15} className="shrink-0 text-rose-400" />
                      <span className="min-w-0 flex-1 truncate text-sm font-medium text-app-muted">
                        {collection.title}
                      </span>
                      <span className="shrink-0 text-sm font-bold">
                        {formatMoney(collection.amount)}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-between bg-app-soft/70 px-4 py-3">
                  <span className="text-xs font-bold uppercase tracking-wide text-app-muted">
                    Общий долг
                  </span>
                  <span className="text-sm font-extrabold text-rose-500 dark:text-rose-400">
                    {formatMoney(total)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

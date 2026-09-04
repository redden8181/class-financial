"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Baby, PartyPopper, Plus, Search, X } from "lucide-react";
import { useClassStore, useHydrated } from "@/lib/store";
import { getKidLedger, sortKids } from "@/lib/stats";
import { pluralKids } from "@/lib/format";
import { genderStyle, LinkButton, LinkIconButton, Splash, EmptyState, SectionTitle } from "@/components/ui";
import { TabHeader } from "@/components/TopBar";
import { KidRow } from "@/components/KidRow";
import type { Kid } from "@/lib/types";

export default function KidsPage() {
  const hydrated = useHydrated();
  const kids = useClassStore((s) => s.kids);
  const collections = useClassStore((s) => s.collections);
  const payments = useClassStore((s) => s.payments);
  const loadDemo = useClassStore((s) => s.loadDemo);
  const [query, setQuery] = useState("");

  const data = useMemo(() => ({ kids, collections, payments }), [kids, collections, payments]);

  const { boys, girls, results } = useMemo(() => {
    const q = query.trim().toLowerCase();
    const matches = (k: Kid) =>
      `${k.lastName} ${k.firstName}`.toLowerCase().includes(q) || `${k.firstName} ${k.lastName}`.toLowerCase().includes(q);
    const filtered = q ? kids.filter(matches) : kids;
    return {
      boys: sortKids(kids.filter((k) => k.gender === "boy")),
      girls: sortKids(kids.filter((k) => k.gender === "girl")),
      results: q ? sortKids(filtered) : null,
    };
  }, [kids, query]);

  if (!hydrated) return <Splash />;

  const debtOf = (id: string) => getKidLedger(data, id).debtTotal;

  return (
    <div>
      <TabHeader
        title="Дети"
        subtitle={kids.length > 0 ? `${kids.length} ${pluralKids(kids.length)} в классе` : "список класса пуст"}
        actions={
          <LinkIconButton
            href="/kids/new"
            label="Добавить ребёнка"
            className="bg-brand-500/10 text-brand-600 dark:bg-brand-400/10 dark:text-brand-300"
          >
            <Plus size={21} strokeWidth={2.8} />
          </LinkIconButton>
        }
      />

      {kids.length === 0 ? (
        <EmptyState
          icon={<Baby size={28} strokeWidth={2.2} />}
          title="Детей пока нет"
          hint="Добавьте учеников класса — они сразу появятся во всех сборах"
        >
          <LinkButton href="/kids/new" full>
            <Plus size={19} strokeWidth={2.8} />
            Добавить ребёнка
          </LinkButton>
          <button
            onClick={() => loadDemo()}
            className="inline-flex items-center justify-center gap-2 pt-1 text-[13px] font-bold text-brand-600 dark:text-brand-300"
          >
            <PartyPopper size={15} strokeWidth={2.4} />
            Заполнить примером
          </button>
        </EmptyState>
      ) : (
        <>
          <div className="mb-4 flex h-[52px] items-center gap-2.5 rounded-[1.15rem] border-[1.5px] border-black/[0.08] bg-white px-4 dark:border-white/10 dark:bg-white/[0.05]">
            <Search size={19} className="shrink-0 text-slate-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              type="search"
              placeholder="Найти по имени или фамилии"
              className="h-full w-full bg-transparent text-[16px] font-semibold outline-none placeholder:font-medium placeholder:text-slate-400 dark:placeholder:text-slate-500"
            />
            {query && (
              <button onClick={() => setQuery("")} aria-label="Очистить">
                <X size={18} className="text-slate-400" />
              </button>
            )}
          </div>

          {results ? (
            results.length === 0 ? (
              <div className="card px-6 py-8 text-center">
                <p className="font-extrabold">Никого не нашли</p>
                <p className="mt-1 text-sm font-medium text-slate-400">Проверьте написание имени или фамилии</p>
              </div>
            ) : (
              <div className="card divide-y divide-black/[0.05] px-4 py-1.5 dark:divide-white/[0.06]">
                {results.map((k, i) => (
                  <KidRow key={k.id} kid={k} debt={debtOf(k.id)} index={i} />
                ))}
              </div>
            )
          ) : (
            <>
              <KidGroup title="Мальчики" list={boys} dotClass={genderStyle("boy").dot} data={data} start={0} />
              <KidGroup title="Девочки" list={girls} dotClass={genderStyle("girl").dot} data={data} start={boys.length} />
            </>
          )}
        </>
      )}
    </div>
  );
}

function KidGroup({
  title,
  list,
  dotClass,
  data,
  start,
}: {
  title: string;
  list: Kid[];
  dotClass: string;
  data: Parameters<typeof getKidLedger>[0];
  start: number;
}) {
  if (list.length === 0) return null;
  return (
    <section>
      <SectionTitle dotClass={dotClass} count={list.length}>
        {title}
      </SectionTitle>
      <motion.div layout className="card divide-y divide-black/[0.05] px-4 py-1.5 dark:divide-white/[0.06]">
        {list.map((k, i) => (
          <KidRow key={k.id} kid={k} debt={getKidLedger(data, k.id).debtTotal} index={start + i} />
        ))}
      </motion.div>
    </section>
  );
}

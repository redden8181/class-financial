"use client";

import { useMemo } from "react";
import { Coins, Plus } from "lucide-react";
import { useClassStore, useHydrated } from "@/lib/store";
import { getCollectionStats } from "@/lib/stats";
import { pluralRu } from "@/lib/format";
import { EmptyState, LinkButton, LinkIconButton, Splash } from "@/components/ui";
import { TabHeader } from "@/components/TopBar";
import { CollectionCard } from "@/components/CollectionCard";

export default function CollectionsPage() {
  const hydrated = useHydrated();
  const kids = useClassStore((s) => s.kids);
  const collections = useClassStore((s) => s.collections);
  const payments = useClassStore((s) => s.payments);

  const data = useMemo(() => ({ kids, collections, payments }), [kids, collections, payments]);
  const sorted = useMemo(
    () => [...collections].sort((a, b) => b.date.localeCompare(a.date) || b.createdAt - a.createdAt),
    [collections],
  );

  if (!hydrated) return <Splash />;

  return (
    <div>
      <TabHeader
        title="Сборы"
        subtitle={`${collections.length} ${pluralRu(collections.length, "сбор", "сбора", "сборов")}`}
        actions={
          <LinkIconButton
            href="/collections/new"
            label="Новый сбор"
            className="bg-brand-500/10 text-brand-600 dark:bg-brand-400/10 dark:text-brand-300"
          >
            <Plus size={21} strokeWidth={2.8} />
          </LinkIconButton>
        }
      />

      {sorted.length === 0 ? (
        <EmptyState
          icon={<Coins size={28} strokeWidth={2.2} />}
          title="Сборов пока нет"
          hint="Создайте любой сбор: шторы, праздник, тетради, экскурсия — что угодно"
        >
          <LinkButton href="/collections/new" full>
            <Plus size={19} strokeWidth={2.8} />
            Новый сбор
          </LinkButton>
        </EmptyState>
      ) : (
        <div className="flex flex-col gap-3">
          {sorted.map((c, i) => (
            <CollectionCard key={c.id} collection={c} stats={getCollectionStats(data, c)} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}

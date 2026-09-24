import { HandCoins, Plus } from "lucide-react";
import { useState } from "react";
import { useNav } from "../app/nav";
import { useStore } from "../app/store";
import { sortCollections } from "../app/utils";
import { CollectionCard } from "../components/CollectionCard";
import { CollectionFormSheet } from "../components/CollectionFormSheet";
import { Button, EmptyState, IconButton } from "../components/ui";

export function CollectionsScreen() {
  const { data } = useStore();
  const { push } = useNav();
  const [formOpen, setFormOpen] = useState(false);
  const collections = sortCollections(data.collections);

  return (
    <div
      className="px-4 pb-40"
      style={{ paddingTop: "max(env(safe-area-inset-top), 1.5rem)" }}
    >
      <header className="flex items-end justify-between gap-3">
        <div>
          <h1 className="text-[1.7rem] font-extrabold tracking-tight">Сборы</h1>
          <p className="mt-0.5 text-sm font-medium text-app-muted">
            все денежные сборы класса
          </p>
        </div>
        <IconButton onClick={() => setFormOpen(true)} aria-label="Новый сбор">
          <Plus size={19} strokeWidth={2.4} />
        </IconButton>
      </header>

      <div className="mt-5 space-y-3">
        {collections.length === 0 ? (
          <EmptyState
            icon={HandCoins}
            title="Сборов пока нет"
            text={
              data.children.length === 0
                ? "Сначала добавьте детей в разделе «Дети», затем создайте первый сбор."
                : "Создайте сбор — укажите название, сумму с ребёнка и дату."
            }
            action={
              <Button
                onClick={() => setFormOpen(true)}
                disabled={data.children.length === 0}
              >
                <Plus size={18} strokeWidth={2.6} />
                Новый сбор
              </Button>
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

      <CollectionFormSheet
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onCreated={(id) => push({ name: "collection", collectionId: id })}
      />
    </div>
  );
}

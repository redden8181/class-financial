"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { CircleX, Coins, Save } from "lucide-react";
import { useClassStore, useHydrated } from "@/lib/store";
import { parseRublesToKopecks, todayISO, formatMoney } from "@/lib/format";
import { Button, cn, EmptyState, Field, LinkButton, Splash, TextArea, TextInput } from "@/components/ui";
import { BackHeader } from "@/components/TopBar";

const QUICK_AMOUNTS = [30000, 50000, 100000, 150000];

export function CollectionForm({ collectionId }: { collectionId?: string }) {
  const router = useRouter();
  const hydrated = useHydrated();
  const collection = useClassStore((s) => s.collections.find((c) => c.id === collectionId));
  const addCollection = useClassStore((s) => s.addCollection);
  const updateCollection = useClassStore((s) => s.updateCollection);

  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(todayISO());
  const [description, setDescription] = useState("");
  const [errors, setErrors] = useState<{ title?: string; amount?: string }>({});
  const [filled, setFilled] = useState(false);

  useEffect(() => {
    if (hydrated && collection && !filled) {
      setTitle(collection.title);
      setAmount(String(collection.amount / 100));
      setDate(collection.date);
      setDescription(collection.description ?? "");
      setFilled(true);
    }
  }, [hydrated, collection, filled]);

  if (!hydrated) return <Splash />;

  const editing = Boolean(collectionId);

  if (editing && !collection) {
    return (
      <div>
        <BackHeader title="Изменить сбор" />
        <EmptyState icon={<CircleX size={28} strokeWidth={2.2} />} title="Сбор не найден" hint="Возможно, он был удалён">
          <LinkButton href="/collections" full>
            Ко всем сборам
          </LinkButton>
        </EmptyState>
      </div>
    );
  }

  const submit = () => {
    const trimmed = title.trim();
    const kopecks = parseRublesToKopecks(amount);
    const next: typeof errors = {};
    if (!trimmed) next.title = "Введите название сбора";
    if (kopecks === null) next.amount = "Введите сумму больше нуля";
    setErrors(next);
    if (Object.keys(next).length > 0 || kopecks === null) return;

    const payload = {
      title: trimmed,
      amount: kopecks,
      date: date || todayISO(),
      description: description.trim() || undefined,
    };

    if (editing && collection) {
      updateCollection(collection.id, payload);
      router.replace(`/collection?id=${collection.id}`);
    } else {
      const created = addCollection(payload);
      router.replace(`/collection?id=${created.id}`);
    }
  };

  return (
    <div>
      <BackHeader title={editing ? "Изменить сбор" : "Новый сбор"} />

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-4">
        <div className="card flex flex-col gap-4 p-5">
          <Field label="Название" error={errors.title}>
            <TextInput
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Например: Шторы, Новый год, Экскурсия"
              autoComplete="off"
              maxLength={60}
            />
          </Field>

          <Field label="Сумма с одного ребёнка" error={errors.amount}>
            <div className="relative">
              <TextInput
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="500"
                inputMode="decimal"
                autoComplete="off"
                className="pr-10"
              />
              <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[17px] font-bold text-slate-400">
                ₽
              </span>
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5 px-1">
              {QUICK_AMOUNTS.map((k) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => setAmount(String(k / 100))}
                  className={cn(
                    "h-8 rounded-full border px-3 text-[12.5px] font-bold tabular-nums transition-colors",
                    parseRublesToKopecks(amount) === k
                      ? "border-brand-500 bg-brand-500/10 text-brand-600 dark:text-brand-300"
                      : "border-black/[0.08] text-slate-500 hover:border-brand-300 dark:border-white/10 dark:text-slate-400",
                  )}
                >
                  {formatMoney(k)}
                </button>
              ))}
            </div>
          </Field>

          <Field label="Дата" hint="Когда нужно сдать деньги">
            <TextInput type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </Field>

          <Field label="Описание" hint="Необязательно — зачем собираем">
            <TextArea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Например: на подарки детям и украшение класса"
              maxLength={200}
            />
          </Field>
        </div>

        <Button size="xl" full onClick={submit}>
          {editing ? <Save size={20} strokeWidth={2.6} /> : <Coins size={20} strokeWidth={2.5} />}
          {editing ? "Сохранить изменения" : "Создать сбор"}
        </Button>

        {!editing && (
          <p className="px-2 text-center text-[12.5px] font-medium leading-relaxed text-slate-400">
            После создания откроется список детей — отметьте, кто уже сдал деньги
          </p>
        )}
      </motion.div>
    </div>
  );
}

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { useStore } from "../app/store";
import type { Collection } from "../app/types";
import { todayInputValue } from "../app/utils";
import { Button, Sheet } from "./ui";

export function CollectionFormSheet({
  open,
  onClose,
  initial,
  onCreated,
}: {
  open: boolean;
  onClose(): void;
  initial?: Collection | null;
  /** вызывается после создания нового сбора */
  onCreated?: (id: string) => void;
}) {
  const { addCollection, updateCollection } = useStore();
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(todayInputValue());
  const [deadline, setDeadline] = useState("");

  useEffect(() => {
    if (open) {
      setTitle(initial?.title ?? "");
      setAmount(initial ? String(initial.amount) : "");
      setDescription(initial?.description ?? "");
      setDate(initial?.date ?? todayInputValue());
      setDeadline(initial?.deadline ?? "");
    }
  }, [open, initial]);

  const parsedAmount = Number.parseFloat(amount.replace(/\s/g, "").replace(",", "."));
  const valid =
    title.trim().length > 0 && Number.isFinite(parsedAmount) && parsedAmount > 0 && !!date;

  const save = () => {
    if (!valid) return;
    const payload = {
      title: title.trim(),
      amount: Math.round(parsedAmount * 100) / 100,
      description: description.trim() || undefined,
      date,
      deadline: deadline || undefined,
    };
    if (initial) {
      updateCollection(initial.id, payload);
    } else {
      const id = addCollection(payload);
      onCreated?.(id);
    }
    onClose();
  };

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={initial ? "Изменить сбор" : "Новый сбор"}
    >
      <div className="space-y-4">
        <div>
          <label className="label" htmlFor="coll-title">
            Название
          </label>
          <input
            id="coll-title"
            className="input"
            placeholder="Шторы, Новый год, экскурсия…"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            autoComplete="off"
          />
        </div>
        <div>
          <label className="label" htmlFor="coll-amount">
            Сумма с ребёнка
          </label>
          <div className="relative">
            <input
              id="coll-amount"
              className="input pr-9"
              placeholder="500"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              inputMode="decimal"
              autoComplete="off"
            />
            <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-app-muted">
              ₽
            </span>
          </div>
        </div>

        <div>
          <label className="label" htmlFor="coll-date">
            Дата создания
          </label>
          <input
            id="coll-date"
            type="date"
            className="input"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>
        <div>
          <label className="label" htmlFor="coll-deadline">
            Собрать до <span className="font-normal">(необязательно)</span>
          </label>
          <div className="relative">
            <input
              id="coll-deadline"
              type="date"
              className="input"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
            />
            {deadline && (
              <button
                type="button"
                aria-label="Убрать дату"
                onClick={() => setDeadline("")}
                className="absolute right-3 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full bg-app-soft text-app-muted transition-all active:scale-90"
              >
                <X size={14} />
              </button>
            )}
          </div>
          <p className="mt-1.5 text-xs leading-relaxed text-app-muted">
            Для долгих сборов: приложение покажет, сколько дней осталось.
            Деньги можно вносить частями.
          </p>
        </div>
        <div>
          <label className="label" htmlFor="coll-desc">
            Описание <span className="font-normal">(необязательно)</span>
          </label>
          <textarea
            id="coll-desc"
            className="input min-h-[84px] resize-none"
            placeholder="Например: сдать до пятницы классному руководителю"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
        <Button className="mt-2" onClick={save} disabled={!valid}>
          {initial ? "Сохранить" : "Создать сбор"}
        </Button>
      </div>
    </Sheet>
  );
}

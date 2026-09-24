import { useEffect, useState } from "react";
import { useStore } from "../app/store";
import type { Child, Gender } from "../app/types";
import { cn } from "../utils/cn";
import { Button, Sheet } from "./ui";

export function ChildFormSheet({
  open,
  onClose,
  initial,
}: {
  open: boolean;
  onClose(): void;
  initial?: Child | null;
}) {
  const { addChild, updateChild } = useStore();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [gender, setGender] = useState<Gender>("boy");

  useEffect(() => {
    if (open) {
      setFirstName(initial?.firstName ?? "");
      setLastName(initial?.lastName ?? "");
      setGender(initial?.gender ?? "boy");
    }
  }, [open, initial]);

  const valid = firstName.trim().length > 0 && lastName.trim().length > 0;

  const save = () => {
    if (!valid) return;
    const payload = {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      gender,
    };
    if (initial) updateChild(initial.id, payload);
    else addChild(payload);
    onClose();
  };

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={initial ? "Изменить ребёнка" : "Новый ребёнок"}
    >
      <div className="space-y-4">
        <div>
          <label className="label" htmlFor="kid-name">
            Имя
          </label>
          <input
            id="kid-name"
            className="input"
            placeholder="Иван"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            autoComplete="off"
            autoFocus
          />
        </div>
        <div>
          <label className="label" htmlFor="kid-lastname">
            Фамилия
          </label>
          <input
            id="kid-lastname"
            className="input"
            placeholder="Иванов"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            autoComplete="off"
          />
        </div>
        <div>
          <span className="label">Пол</span>
          <div className="grid grid-cols-2 gap-2.5">
            <GenderButton
              active={gender === "boy"}
              onClick={() => setGender("boy")}
              label="Мальчик"
              tone="boy"
            />
            <GenderButton
              active={gender === "girl"}
              onClick={() => setGender("girl")}
              label="Девочка"
              tone="girl"
            />
          </div>
        </div>
        <Button className="mt-2" onClick={save} disabled={!valid}>
          {initial ? "Сохранить" : "Добавить ребёнка"}
        </Button>
      </div>
    </Sheet>
  );
}

function GenderButton({
  active,
  onClick,
  label,
  tone,
}: {
  active: boolean;
  onClick(): void;
  label: string;
  tone: "boy" | "girl";
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex h-14 items-center justify-center gap-2 rounded-2xl border-2 text-sm font-bold transition-all duration-150 active:scale-[0.97]",
        active
          ? tone === "boy"
            ? "border-sky-400 bg-sky-50 text-sky-700 dark:border-sky-500/60 dark:bg-sky-500/10 dark:text-sky-300"
            : "border-rose-400 bg-rose-50 text-rose-600 dark:border-rose-500/60 dark:bg-rose-500/10 dark:text-rose-300"
          : "border-app-border bg-app-card text-app-muted"
      )}
    >
      <span
        className={cn(
          "h-2.5 w-2.5 rounded-full",
          tone === "boy"
            ? active
              ? "bg-sky-500"
              : "bg-sky-300/60"
            : active
              ? "bg-rose-500"
              : "bg-rose-300/60"
        )}
      />
      {label}
    </button>
  );
}

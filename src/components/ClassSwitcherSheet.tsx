import {
  Check,
  GraduationCap,
  Pencil,
  Plus,
  Trash2,
  TriangleAlert,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useStore } from "../app/store";
import type { SchoolClass } from "../app/types";
import { plural, vibrate } from "../app/utils";
import { cn } from "../utils/cn";
import { Button, Sheet } from "./ui";

/** Шторка со списком классов: переключение, создание, переименование, удаление. */
export function ClassSwitcherSheet({
  open,
  onClose,
}: {
  open: boolean;
  onClose(): void;
}) {
  const { classes, activeClass, root, addClass, renameClass, removeClass, switchClass } =
    useStore();

  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setAdding(false);
      setNewName("");
      setEditingId(null);
      setDeletingId(null);
    }
  }, [open]);

  const createClass = () => {
    const name = newName.trim();
    if (!name) return;
    addClass(name);
    setNewName("");
    setAdding(false);
    vibrate();
    onClose();
  };

  const saveName = () => {
    if (editingId) renameClass(editingId, editingName);
    setEditingId(null);
  };

  const classSummary = (c: SchoolClass) => {
    const data = root.byClass[c.id];
    const kids = data?.children.length ?? 0;
    const colls = data?.collections.length ?? 0;
    return `${kids} ${plural(kids, "ребёнок", "ребёнка", "детей")} · ${colls} ${plural(
      colls,
      "сбор",
      "сбора",
      "сборов"
    )}`;
  };

  return (
    <Sheet open={open} onClose={onClose} title="Мои классы">
      <div className="overflow-hidden rounded-2xl border border-app-border">
        {classes.map((c, i) => {
          const active = c.id === activeClass?.id;
          const editing = editingId === c.id;
          const deleting = deletingId === c.id;

          return (
            <div
              key={c.id}
              className={cn(
                "bg-app-card",
                i > 0 && "border-t border-app-border/70",
                active && "bg-amber-50 dark:bg-amber-500/10"
              )}
            >
              {editing ? (
                <div className="flex items-center gap-2 p-3">
                  <input
                    className="input h-11 flex-1 py-0"
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    placeholder="Название класса"
                    autoComplete="off"
                  />
                  <button
                    type="button"
                    onClick={saveName}
                    aria-label="Сохранить"
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-400 text-white transition-transform active:scale-90"
                  >
                    <Check size={18} strokeWidth={3} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingId(null)}
                    aria-label="Отмена"
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-app-soft text-app-muted transition-transform active:scale-90"
                  >
                    <X size={17} />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2 p-3 pl-3.5">
                  <button
                    type="button"
                    onClick={() => {
                      switchClass(c.id);
                      vibrate();
                      onClose();
                    }}
                    className="flex min-w-0 flex-1 items-center gap-3 text-left"
                  >
                    <span
                      className={cn(
                        "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
                        active ? "bg-amber-400 text-white" : "bg-app-soft text-app-muted"
                      )}
                    >
                      {active ? (
                        <Check size={18} strokeWidth={3} />
                      ) : (
                        <GraduationCap size={18} />
                      )}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-bold">{c.name}</span>
                      <span className="mt-0.5 block truncate text-[11px] font-medium text-app-muted">
                        {active ? "активный · " : ""}
                        {classSummary(c)}
                      </span>
                    </span>
                  </button>

                  <button
                    type="button"
                    aria-label="Переименовать"
                    onClick={() => {
                      setEditingId(c.id);
                      setEditingName(c.name);
                      setDeletingId(null);
                    }}
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-app-muted transition-transform active:scale-90"
                  >
                    <Pencil size={15} />
                  </button>
                  {classes.length > 1 && (
                    <button
                      type="button"
                      aria-label="Удалить класс"
                      onClick={() => setDeletingId(deleting ? null : c.id)}
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-app-muted transition-transform active:scale-90 active:text-rose-500"
                    >
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>
              )}

              {deleting && (
                <div className="border-t border-app-border/70 bg-rose-50 p-3.5 dark:bg-rose-500/10">
                  <div className="flex items-start gap-2 text-xs font-semibold leading-relaxed text-rose-700 dark:text-rose-300">
                    <TriangleAlert size={15} className="mt-px shrink-0" />
                    Удалить «{c.name}» со всеми детьми, сборами и чеками?
                  </div>
                  <div className="mt-3 flex gap-2">
                    <Button
                      size="md"
                      variant="danger"
                      onClick={() => {
                        removeClass(c.id);
                        setDeletingId(null);
                        vibrate();
                      }}
                    >
                      Удалить
                    </Button>
                    <Button
                      size="md"
                      variant="secondary"
                      onClick={() => setDeletingId(null)}
                    >
                      Отмена
                    </Button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {adding ? (
        <div className="mt-3 flex items-center gap-2">
          <input
            className="input h-12 flex-1 py-0"
            placeholder="Например: 3-Б класс"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            autoComplete="off"
          />
          <button
            type="button"
            onClick={createClass}
            disabled={!newName.trim()}
            aria-label="Создать класс"
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-amber-400 text-white transition-transform active:scale-90 disabled:opacity-40"
          >
            <Check size={19} strokeWidth={3} />
          </button>
          <button
            type="button"
            onClick={() => {
              setAdding(false);
              setNewName("");
            }}
            aria-label="Отмена"
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-app-soft text-app-muted transition-transform active:scale-90"
          >
            <X size={18} />
          </button>
        </div>
      ) : (
        <Button className="mt-3" onClick={() => setAdding(true)}>
          <Plus size={18} strokeWidth={2.8} />
          Создать новый класс
        </Button>
      )}

      <p className="mt-3 px-1 text-[11px] leading-relaxed text-app-muted">
        У каждого класса свои дети, сборы и расходы. Нажмите на класс, чтобы
        переключиться.
      </p>
    </Sheet>
  );
}

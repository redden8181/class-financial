import { Camera, ImageUp, Loader2, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { compressImage, deletePhoto, getPhoto, savePhoto } from "../app/photos";
import { useStore } from "../app/store";
import type { Expense } from "../app/types";
import { todayInputValue, uid } from "../app/utils";
import { Button, Sheet } from "./ui";

export function ExpenseFormSheet({
  open,
  onClose,
  collectionId,
  initial,
}: {
  open: boolean;
  onClose(): void;
  collectionId: string;
  initial?: Expense | null;
}) {
  const { addExpense, updateExpense } = useStore();
  const fileRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(todayInputValue());
  const [note, setNote] = useState("");
  const [photoId, setPhotoId] = useState<string | undefined>(undefined);
  const [preview, setPreview] = useState<string | null>(null);
  const [loadingPhoto, setLoadingPhoto] = useState(false);
  /** фото, сохранённые в этой сессии, но не подтверждённые кнопкой «Сохранить» */
  const draftPhotos = useRef<string[]>([]);

  useEffect(() => {
    if (!open) return;
    setTitle(initial?.title ?? "");
    setAmount(initial ? String(initial.amount) : "");
    setDate(initial?.date || todayInputValue());
    setNote(initial?.note ?? "");
    setPhotoId(initial?.photoId);
    draftPhotos.current = [];
    setPreview(null);
    if (initial?.photoId) {
      getPhoto(initial.photoId).then(setPreview);
    }
  }, [open, initial]);

  const pickPhoto = async (file: File | undefined) => {
    if (!file) return;
    setLoadingPhoto(true);
    try {
      const dataUrl = await compressImage(file);
      const id = uid();
      await savePhoto(id, dataUrl);
      draftPhotos.current.push(id);
      setPhotoId(id);
      setPreview(dataUrl);
    } catch {
      /* игнорируем неудачную загрузку */
    } finally {
      setLoadingPhoto(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const clearPhoto = () => {
    if (photoId && draftPhotos.current.includes(photoId)) void deletePhoto(photoId);
    setPhotoId(undefined);
    setPreview(null);
  };

  const cleanupDrafts = (keep?: string) => {
    for (const id of draftPhotos.current) {
      if (id !== keep) void deletePhoto(id);
    }
    draftPhotos.current = [];
  };

  const close = () => {
    cleanupDrafts();
    onClose();
  };

  const parsed = Number.parseFloat(amount.replace(/\s/g, "").replace(",", "."));
  const valid = title.trim().length > 0 && Number.isFinite(parsed) && parsed > 0;

  const save = () => {
    if (!valid) return;
    const payload = {
      title: title.trim(),
      amount: parsed,
      date: date || todayInputValue(),
      note: note.trim() || undefined,
      photoId,
    };
    if (initial) updateExpense(collectionId, initial.id, payload);
    else addExpense(collectionId, payload);
    cleanupDrafts(photoId);
    onClose();
  };

  return (
    <Sheet
      open={open}
      onClose={close}
      title={initial ? "Изменить расход" : "Новый расход"}
    >
      <div className="space-y-4">
        <div>
          <label className="label" htmlFor="exp-title">
            На что потратили
          </label>
          <input
            id="exp-title"
            className="input"
            placeholder="Рабочие тетради"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            autoComplete="off"
            autoFocus
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label" htmlFor="exp-amount">
              Сумма
            </label>
            <div className="relative">
              <input
                id="exp-amount"
                className="input pr-9"
                placeholder="3 500"
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
            <label className="label" htmlFor="exp-date">
              Дата
            </label>
            <input
              id="exp-date"
              type="date"
              className="input"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
        </div>

        {/* Фото чека */}
        <div>
          <span className="label">Фото чека (необязательно)</span>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => void pickPhoto(e.target.files?.[0])}
          />
          {preview ? (
            <div className="relative overflow-hidden rounded-2xl border border-app-border">
              <img src={preview} alt="Чек" className="max-h-64 w-full object-cover" />
              <div className="flex gap-2 bg-app-card p-2">
                <Button
                  variant="soft"
                  size="md"
                  onClick={() => fileRef.current?.click()}
                >
                  <ImageUp size={16} />
                  Заменить
                </Button>
                <Button variant="soft" size="md" onClick={clearPhoto} className="text-rose-500">
                  <Trash2 size={16} />
                  Удалить
                </Button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={loadingPhoto}
              className="flex h-28 w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-app-border bg-app-soft/50 text-app-muted transition-transform active:scale-[0.98]"
            >
              {loadingPhoto ? (
                <Loader2 size={22} className="animate-spin" />
              ) : (
                <Camera size={22} />
              )}
              <span className="text-sm font-semibold">
                {loadingPhoto ? "Обрабатываем фото…" : "Сфотографировать или выбрать"}
              </span>
            </button>
          )}
        </div>

        <div>
          <label className="label" htmlFor="exp-note">
            Комментарий (необязательно)
          </label>
          <textarea
            id="exp-note"
            className="input min-h-[72px] resize-none"
            placeholder="Например: куплено в «Читай-городе», 25 шт."
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </div>

        <Button className="mt-1" onClick={save} disabled={!valid}>
          {initial ? "Сохранить" : "Добавить расход"}
        </Button>
      </div>
    </Sheet>
  );
}

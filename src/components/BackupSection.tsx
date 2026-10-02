import {
  CheckCircle2,
  DatabaseBackup,
  Download,
  FileUp,
  Loader2,
  TriangleAlert,
} from "lucide-react";
import { useRef, useState } from "react";
import { exportPhotos, importPhotos } from "../app/photos";
import { useStore } from "../app/store";
import {
  allPhotoIds,
  hasRootData,
  normalizeRootData,
  requestPersistentStorage,
} from "../app/storage";
import type { RootData } from "../app/types";
import { formatDate, plural } from "../app/utils";
import { Button } from "./ui";

interface BackupFile {
  app: "klassnaya-kopilka";
  version: 2;
  exportedAt: number;
  root: RootData;
  photos: Record<string, string>;
}

interface PendingImport {
  fileName: string;
  exportedAt?: number;
  root: RootData;
  photos: Record<string, string>;
}

/** Секция «Данные» внутри настроек: копия всех классов в один файл. */
export function BackupSection() {
  const { root, replaceRoot } = useStore();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState<"export" | "import" | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<PendingImport | null>(null);

  const exportBackup = async () => {
    setBusy("export");
    setMessage(null);
    setError(null);
    void requestPersistentStorage();

    try {
      const photos = await exportPhotos(allPhotoIds(root));
      const backup: BackupFile = {
        app: "klassnaya-kopilka",
        version: 2,
        exportedAt: Date.now(),
        root,
        photos,
      };
      const json = JSON.stringify(backup);
      const day = new Date().toISOString().slice(0, 10);
      const name = `klassnaya-kopilka-${day}.json`;
      const file = new File([json], name, { type: "application/json" });

      if (
        typeof navigator.share === "function" &&
        (!navigator.canShare || navigator.canShare({ files: [file] }))
      ) {
        try {
          await navigator.share({
            files: [file],
            title: "Резервная копия Классной копилки",
          });
          setMessage("Копия готова — сохраните её в «Файлы».");
        } catch (shareError) {
          if ((shareError as DOMException)?.name !== "AbortError") throw shareError;
        }
      } else {
        const url = URL.createObjectURL(file);
        const a = document.createElement("a");
        a.href = url;
        a.download = name;
        a.click();
        window.setTimeout(() => URL.revokeObjectURL(url), 1_000);
        setMessage("Резервная копия сохранена на устройство.");
      }
    } catch {
      setError("Не удалось создать копию. Попробуйте ещё раз.");
    } finally {
      setBusy(null);
    }
  };

  const readBackup = async (file: File | undefined) => {
    if (!file) return;
    setBusy("import");
    setMessage(null);
    setError(null);
    setPending(null);
    try {
      const raw = JSON.parse(await file.text()) as Record<string, unknown>;
      const wrapped = raw.app === "klassnaya-kopilka";
      // поддерживаем копии v2 (все классы), v1 (один класс) и голые данные
      const source = wrapped ? (raw.root ?? raw.data) : raw;
      const restored = normalizeRootData(source);
      if (!hasRootData(restored)) throw new Error("empty");

      setPending({
        fileName: file.name,
        exportedAt: typeof raw.exportedAt === "number" ? raw.exportedAt : undefined,
        root: restored,
        photos:
          wrapped && raw.photos && typeof raw.photos === "object"
            ? (raw.photos as Record<string, string>)
            : {},
      });
    } catch {
      setError("Файл не похож на резервную копию «Классной копилки».");
    } finally {
      setBusy(null);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const restore = async () => {
    if (!pending) return;
    setBusy("import");
    setError(null);
    try {
      await importPhotos(pending.photos);
      replaceRoot(pending.root);
      const count = pending.root.classes.length;
      setPending(null);
      setMessage(
        `Восстановлено ${count} ${plural(count, "класс", "класса", "классов")}.`
      );
    } catch {
      setError("Не удалось восстановить копию. Файл мог быть повреждён.");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-3">
      <p className="text-xs leading-relaxed text-app-muted">
        В файл войдут все классы, дети, сборы, взносы, расходы и фотографии чеков.
        Данные хранятся только на этом телефоне.
      </p>

      <Button
        size="md"
        onClick={() => void exportBackup()}
        disabled={busy !== null || !hasRootData(root)}
      >
        {busy === "export" ? (
          <Loader2 size={16} className="animate-spin" />
        ) : (
          <Download size={16} />
        )}
        Сохранить копию в файл
      </Button>

      <input
        ref={inputRef}
        type="file"
        accept="application/json,.json"
        className="hidden"
        onChange={(e) => void readBackup(e.target.files?.[0])}
      />
      <Button
        size="md"
        variant="secondary"
        onClick={() => inputRef.current?.click()}
        disabled={busy !== null}
      >
        {busy === "import" ? (
          <Loader2 size={16} className="animate-spin" />
        ) : (
          <FileUp size={16} />
        )}
        Восстановить из файла
      </Button>

      {pending && (
        <div className="rounded-2xl border border-amber-300 bg-amber-50 p-4 dark:border-amber-500/30 dark:bg-amber-500/10">
          <div className="flex items-start gap-2.5">
            <DatabaseBackup
              size={18}
              className="mt-0.5 shrink-0 text-amber-600 dark:text-amber-400"
            />
            <div className="min-w-0">
              <div className="truncate text-sm font-bold">{pending.fileName}</div>
              <p className="mt-1 text-xs leading-relaxed text-app-muted">
                {pending.root.classes.length}{" "}
                {plural(pending.root.classes.length, "класс", "класса", "классов")}
                {pending.exportedAt ? ` · копия от ${formatDate(pending.exportedAt)}` : ""}
              </p>
            </div>
          </div>
          <div className="mt-3 flex items-start gap-2 text-xs leading-relaxed text-amber-700 dark:text-amber-300">
            <TriangleAlert size={14} className="mt-0.5 shrink-0" />
            Текущие данные всех классов будут заменены копией.
          </div>
          <div className="mt-3 space-y-2">
            <Button size="md" onClick={() => void restore()}>
              Восстановить
            </Button>
            <Button size="md" variant="secondary" onClick={() => setPending(null)}>
              Отмена
            </Button>
          </div>
        </div>
      )}

      {message && (
        <div className="flex items-start gap-2.5 rounded-2xl bg-emerald-100 p-3.5 text-xs font-semibold leading-relaxed text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
          <CheckCircle2 size={16} className="mt-px shrink-0" />
          {message}
        </div>
      )}
      {error && (
        <div className="flex items-start gap-2.5 rounded-2xl bg-rose-100 p-3.5 text-xs font-semibold leading-relaxed text-rose-700 dark:bg-rose-500/10 dark:text-rose-300">
          <TriangleAlert size={16} className="mt-px shrink-0" />
          {error}
        </div>
      )}
    </div>
  );
}

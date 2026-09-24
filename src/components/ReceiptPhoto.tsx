import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { useEffect, useState } from "react";
import { getPhoto } from "../app/photos";
import { cn } from "../utils/cn";

/** Миниатюра фото чека из IndexedDB с просмотром на весь экран */
export function ReceiptPhoto({
  photoId,
  className,
}: {
  photoId: string;
  className?: string;
}) {
  const [src, setSrc] = useState<string | null>(null);
  const [zoom, setZoom] = useState(false);

  useEffect(() => {
    let alive = true;
    getPhoto(photoId).then((v) => {
      if (alive) setSrc(v);
    });
    return () => {
      alive = false;
    };
  }, [photoId]);

  if (!src) {
    return (
      <div
        className={cn(
          "shrink-0 animate-pulse rounded-xl bg-app-soft",
          className ?? "h-12 w-12"
        )}
      />
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setZoom(true);
        }}
        className={cn(
          "shrink-0 overflow-hidden rounded-xl border border-app-border transition-transform active:scale-95",
          className ?? "h-12 w-12"
        )}
        aria-label="Посмотреть чек"
      >
        <img src={src} alt="Чек" className="h-full w-full object-cover" />
      </button>

      <AnimatePresence>
        {zoom && (
          <motion.div
            className="fixed inset-0 z-[90] flex items-center justify-center bg-black/90 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setZoom(false)}
          >
            <motion.img
              src={src}
              alt="Чек"
              className="max-h-full max-w-full rounded-2xl object-contain"
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
            />
            <button
              type="button"
              onClick={() => setZoom(false)}
              aria-label="Закрыть"
              className="absolute right-5 flex h-11 w-11 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur"
              style={{ top: "max(env(safe-area-inset-top), 1.25rem)" }}
            >
              <X size={20} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

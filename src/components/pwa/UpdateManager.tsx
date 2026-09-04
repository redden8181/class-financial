"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { SW_URL } from "@/lib/pwa";

const RELOADED_FLAG = "kk-updated-flag";

/**
 * Управляет жизненным циклом service worker:
 * - регистрирует SW;
 * - периодически (и на фокусе вкладки) проверяет наличие новой версии;
 * - как только новая версия готова — активирует её и мягко перезагружает
 *   приложение (ожидая видимости вкладки), пользователю ничего чистить не нужно;
 * - после обновления показывает короткое уведомление.
 *
 * Пользовательские данные (IndexedDB) обновлением не затрагиваются.
 */
export function UpdateManager() {
  const [justUpdated, setJustUpdated] = useState(false);

  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;

    // Если мы только что перезагрузились ради обновления — покажем тост.
    if (sessionStorage.getItem(RELOADED_FLAG)) {
      sessionStorage.removeItem(RELOADED_FLAG);
      setJustUpdated(true);
      const t = setTimeout(() => setJustUpdated(false), 4200);
      return () => clearTimeout(t);
    }
    return undefined;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;

    let interval: number | undefined;

    const reload = () => {
      sessionStorage.setItem(RELOADED_FLAG, "1");
      if (document.visibilityState === "visible") {
        window.location.reload();
      } else {
        // Перезагрузим, когда пользователь вернётся во вкладку.
        const onVisible = () => {
          if (document.visibilityState === "visible") {
            document.removeEventListener("visibilitychange", onVisible);
            window.location.reload();
          }
        };
        document.addEventListener("visibilitychange", onVisible);
      }
    };

    let refreshing = false;
    const onControllerChange = () => {
      if (refreshing) return;
      refreshing = true;
      reload();
    };
    navigator.serviceWorker.addEventListener("controllerchange", onControllerChange);

    navigator.serviceWorker
      .register(SW_URL, { updateViaCache: "none" })
      .then((registration) => {
        const activate = (worker: ServiceWorker | null) => {
          worker?.postMessage({ type: "SKIP_WAITING" });
        };

        // Версия уже скачана и ждёт активации (обновление пришло раньше загрузки страницы).
        if (registration.waiting && navigator.serviceWorker.controller) {
          activate(registration.waiting);
        }

        registration.addEventListener("updatefound", () => {
          const next = registration.installing;
          if (!next) return;
          next.addEventListener("statechange", () => {
            // Новый SW установлен, а страница ещё контролируется старым — обновление.
            if (next.state === "installed" && navigator.serviceWorker.controller) {
              activate(next);
            }
          });
        });

        // Регулярная фоновая проверка новой версии на сервере.
        interval = window.setInterval(() => registration.update(), 60_000);
        const checkOnVisible = () => {
          if (document.visibilityState === "visible") void registration.update();
        };
        document.addEventListener("visibilitychange", checkOnVisible);
        window.addEventListener("focus", checkOnVisible);
      })
      .catch(() => undefined);

    return () => {
      navigator.serviceWorker.removeEventListener("controllerchange", onControllerChange);
      if (interval !== undefined) window.clearInterval(interval);
    };
  }, []);

  return (
    <AnimatePresence>
      {justUpdated && (
        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 12, scale: 0.97 }}
          transition={{ type: "spring", stiffness: 380, damping: 28 }}
          className="pointer-events-none fixed inset-x-0 bottom-[calc(env(safe-area-inset-bottom,0px)+7rem)] z-[90] flex justify-center px-4"
        >
          <div className="flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2.5 text-[13px] font-bold text-white shadow-xl dark:bg-white dark:text-slate-900">
            <Sparkles size={15} strokeWidth={2.5} className="text-emerald-400 dark:text-emerald-500" />
            Приложение обновлено до последней версии
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

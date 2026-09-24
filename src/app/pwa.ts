/**
 * Регистрация service worker.
 * Обновление: при выходе новой версии на GitHub Pages воркер обновляется,
 * сразу активируется (skipWaiting) и страница один раз перезагружается —
 * пользователь всегда видит свежую версию, офлайн продолжает работать.
 */
export function registerSW(): void {
  if (!("serviceWorker" in navigator)) return;
  if (import.meta.env.DEV) return;

  // перезагружаемся только при смене версии, а не при первой установке
  const hadController = Boolean(navigator.serviceWorker.controller);
  let refreshing = false;
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (refreshing || !hadController) return;
    refreshing = true;
    window.location.reload();
  });

  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("./sw.js")
      .then((reg) => {
        // новая версия уже ждёт активации
        if (reg.waiting && navigator.serviceWorker.controller) {
          reg.waiting.postMessage({ type: "SKIP_WAITING" });
        }

        reg.addEventListener("updatefound", () => {
          const worker = reg.installing;
          if (!worker) return;
          worker.addEventListener("statechange", () => {
            if (worker.state === "installed" && navigator.serviceWorker.controller) {
              worker.postMessage({ type: "SKIP_WAITING" });
            }
          });
        });

        // проверяем обновления при возврате в приложение и периодически
        const check = () => reg.update().catch(() => undefined);
        document.addEventListener("visibilitychange", () => {
          if (document.visibilityState === "visible") check();
        });
        window.setInterval(check, 60_000);
      })
      .catch(() => undefined);
  });
}

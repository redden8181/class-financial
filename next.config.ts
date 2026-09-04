import type { NextConfig } from "next";
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

/**
 * Два режима сборки:
 * - локально / в песочнице: обычная Next.js-сборка (npm run build / npm start);
 * - GitHub Pages:        GITHUB_PAGES=true + NEXT_PUBLIC_BASE_PATH=/<repo> →
 *                        полностью статический экспорт в ./out без сервера.
 */
const isGithubPages = process.env.GITHUB_PAGES === "true";
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

/**
 * При production-сборке генерирует public/sw.js из scripts/sw.template.js:
 * подставляет уникальную версию сборки (номер запуска GitHub Actions / SHA /
 * timestamp) и базовый путь. Новая версия → новые имена кэшей →
 * корректное автоматическое обновление PWA у пользователей.
 * Данные пользователей (IndexedDB) при этом не затрагиваются.
 */
function stampServiceWorker() {
  const isBuild = process.env.NODE_ENV === "production" || process.argv.includes("build");
  if (!isBuild) return;
  try {
    const pkg = JSON.parse(readFileSync(join(process.cwd(), "package.json"), "utf8")) as { version?: string };
    const buildId =
      process.env.GITHUB_RUN_NUMBER ??
      process.env.GITHUB_SHA?.slice(0, 8) ??
      `${Date.now()}`;
    const version = `${pkg.version ?? "0"}-${buildId}`;
    const template = readFileSync(join(process.cwd(), "scripts/sw.template.js"), "utf8");
    const sw = template
      .replaceAll("__KK_CACHE_VERSION__", version)
      .replaceAll("__KK_BASE_PATH__", basePath);
    writeFileSync(join(process.cwd(), "public/sw.js"), sw);
    // GitHub Pages: отключаем Jekyll-обработку (каталоги вида _next иначе игнорируются)
    writeFileSync(join(process.cwd(), "public/.nojekyll"), "");
    console.log(`[pwa] service worker обновлён: версия ${version}, базовый путь "${basePath || "/"}"`);
  } catch (error) {
    console.warn("[pwa] не удалось обновить service worker:", error);
  }
}

stampServiceWorker();

const nextConfig: NextConfig = {
  output: isGithubPages ? "export" : undefined,
  basePath: basePath || undefined,
  trailingSlash: true,
  images: { unoptimized: true },
};

export default nextConfig;

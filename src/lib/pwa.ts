/**
 * Путь-константы, учитывающие базовый путь деплоя (для GitHub Pages
 * приложение живёт по адресу /<repo>/, локально — с корня).
 */
export const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

/** URL файла service worker'а; область действия — BASE_PATH/ */
export const SW_URL = `${BASE_PATH}/sw.js`;

import type { MetadataRoute } from "next";

/**
 * Web App Manifest генерируется при сборке и учитывает базовый путь
 * (для GitHub Pages — /<repo>)/, поэтому ссылки на иконки и start_url
 * всегда корректны и локально, и в проде.
 */
const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export const dynamic = "force-static";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "КлассКасса — сборы одного класса",
    short_name: "КлассКасса",
    description:
      "Список детей класса, денежные сборы, долги и история оплат. Работает офлайн, данные хранятся на устройстве.",
    lang: "ru",
    dir: "ltr",
    start_url: `${BASE}/`,
    scope: `${BASE}/`,
    id: `${BASE}/`,
    display: "standalone",
    orientation: "portrait",
    background_color: "#eef0f7",
    theme_color: "#5b48ea",
    categories: ["finance", "education", "utilities"],
    icons: [
      { src: `${BASE}/icons/icon-192.png`, sizes: "192x192", type: "image/png", purpose: "any" },
      { src: `${BASE}/icons/icon-512.png`, sizes: "512x512", type: "image/png", purpose: "any" },
      { src: `${BASE}/icons/maskable-512.png`, sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}

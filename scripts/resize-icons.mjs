import { mkdir, copyFile } from "node:fs/promises";

const SRC = "public/icons/icon-source.png";

const targets = [
  ["public/icons/icon-192.png", 192],
  ["public/icons/icon-512.png", 512],
  ["public/icons/maskable-512.png", 512],
  ["public/icons/apple-touch-icon.png", 180],
  ["src/app/icon.png", 96],
  ["src/app/apple-icon.png", 180],
];

await mkdir("public/icons", { recursive: true });

let sharp = null;
try {
  sharp = (await import("sharp")).default;
} catch {
  console.log("sharp недоступен — копирую исходник без изменения размера");
}

for (const [dest, size] of targets) {
  if (sharp) {
    await sharp(SRC).resize(size, size, { fit: "cover" }).png().toFile(dest);
  } else {
    await copyFile(SRC, dest);
  }
  console.log("ok:", dest, size);
}

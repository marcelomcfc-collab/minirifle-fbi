import sharp from "sharp";
import { mkdirSync } from "node:fs";
import path from "node:path";

const outDir = path.join(process.cwd(), "public", "icons");
mkdirSync(outDir, { recursive: true });

const BG = "#14171a";
const GOLD = "#d4af6a";

function targetSvg(size, padding) {
  const c = size / 2;
  const maxR = c - padding;
  const r1 = maxR;
  const r2 = maxR * 0.58;
  const r3 = maxR * 0.2;
  const sw = size * 0.045;
  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${size}" height="${size}" fill="${BG}"/>
  <circle cx="${c}" cy="${c}" r="${r1}" fill="none" stroke="${GOLD}" stroke-width="${sw}"/>
  <circle cx="${c}" cy="${c}" r="${r2}" fill="none" stroke="${GOLD}" stroke-width="${sw}"/>
  <circle cx="${c}" cy="${c}" r="${r3}" fill="${GOLD}"/>
</svg>`;
}

async function render(name, size, paddingRatio) {
  const svg = targetSvg(size, size * paddingRatio);
  await sharp(Buffer.from(svg)).png().toFile(path.join(outDir, name));
  console.log("wrote", name);
}

await render("icon-192.png", 192, 0.08);
await render("icon-512.png", 512, 0.08);
await render("icon-maskable-192.png", 192, 0.2);
await render("icon-maskable-512.png", 512, 0.2);
await render("apple-touch-icon.png", 180, 0.12);

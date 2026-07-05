/**
 * Generate square PNG icons for PWA install from icons/icon.jpg.
 * Run: npm run build:icons
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const iconsDir = path.join(root, "icons");
const source = path.join(iconsDir, "icon.jpg");
const background = "#0f0f1a";

if (!fs.existsSync(source)) {
  console.error("Missing source icon:", source);
  process.exit(1);
}

async function writeSquareIcon(size, outputName, { maskable = false } = {}) {
  const output = path.join(iconsDir, outputName);
  const contentSize = maskable ? Math.round(size * 0.72) : Math.round(size * 0.88);
  const padding = Math.floor((size - contentSize) / 2);

  const resized = await sharp(source)
    .resize(contentSize, contentSize, {
      fit: "contain",
      background: { r: 15, g: 15, b: 26, alpha: 1 },
    })
    .png()
    .toBuffer();

  await sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background,
    },
  })
    .composite([{ input: resized, top: padding, left: padding }])
    .png()
    .toFile(output);

  console.log(`Wrote ${outputName}`);
}

async function main() {
  await writeSquareIcon(180, "icon-180.png");
  await writeSquareIcon(192, "icon-192.png");
  await writeSquareIcon(512, "icon-512.png");
  await writeSquareIcon(192, "icon-maskable-192.png", { maskable: true });
  await writeSquareIcon(512, "icon-maskable-512.png", { maskable: true });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

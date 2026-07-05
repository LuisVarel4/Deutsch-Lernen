/**
 * Copy only static site files into dist/ for GitHub Pages.
 * Run: npm run prepare:dist
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const dist = path.join(root, "dist");

const files = ["index.html", "manifest.webmanifest", "sw.js"];
const dirs = ["css", "js", "icons"];

if (fs.existsSync(dist)) {
  fs.rmSync(dist, { recursive: true, force: true });
}
fs.mkdirSync(dist, { recursive: true });

for (const file of files) {
  const src = path.join(root, file);
  if (!fs.existsSync(src)) {
    console.error(`Missing required file: ${file}`);
    process.exit(1);
  }
  fs.copyFileSync(src, path.join(dist, file));
}

for (const dir of dirs) {
  const src = path.join(root, dir);
  if (!fs.existsSync(src)) {
    console.error(`Missing required directory: ${dir}`);
    process.exit(1);
  }
  fs.cpSync(src, path.join(dist, dir), { recursive: true });
}

fs.writeFileSync(path.join(dist, ".nojekyll"), "");
console.log("Prepared dist/ for GitHub Pages");

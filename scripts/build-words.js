/**
 * Regenerate js/words.js from words.text.
 * Add nouns/prepositions at the bottom of words.text using:
 *   V. sein — to be
 *   N. der Mann — man
 *   P. in — in
 * Or edit js/words.js directly for nouns with articles.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const text = fs.readFileSync(path.join(root, "words.text"), "utf8");
const lines = text.split(/\r?\n/).filter((l) => l.trim());

const verbs = new Map();
const nouns = [];
const prepositions = [];

for (const line of lines) {
  let m = line.match(/^V\.\s+(.+?)\s+—\s+(.+)$/i);
  if (m) {
    const german = m[1].trim();
    const english = m[2].trim();
    if (verbs.has(german)) {
      const existing = verbs.get(german);
      if (!existing.english.includes(english)) {
        existing.english += ", " + english;
      }
    } else {
      verbs.set(german, { german, english, type: "verb" });
    }
    continue;
  }

  m = line.match(/^N\.\s+(der|die|das)\s+(\S+)\s+—\s+(.+)$/i);
  if (m) {
    nouns.push({
      german: m[2].trim(),
      article: m[1].toLowerCase(),
      english: m[3].trim(),
      type: "noun",
    });
    continue;
  }

  m = line.match(/^P\.\s+(.+?)\s+—\s+(.+)$/);
  if (m) {
    prepositions.push({
      german: m[1].trim(),
      english: m[2].trim(),
      type: "preposition",
    });
  }
}

const all = [...verbs.values(), ...nouns, ...prepositions];
const out =
  "/** Auto-generated from words.text — run: node scripts/build-words.js */\n" +
  "export const WORDS = " +
  JSON.stringify(all, null, 2) +
  ";\n";

fs.writeFileSync(path.join(root, "js", "words.js"), out);
console.log(
  `Generated ${all.length} words (${verbs.size} verbs, ${nouns.length} nouns, ${prepositions.length} prepositions)`
);

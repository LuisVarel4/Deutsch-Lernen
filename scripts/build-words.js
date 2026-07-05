/**
 * Regenerate js/words.js from words.text.
 * Line format: PREFIX german — english
 * Category comments: #Verbs, #Adjectives, etc.
 *
 *   V. sein — to be
 *   A. gut — good
 *   C. und — and
 *   Num. eins — one
 *   Adv. sehr — very
 *   Int. ja — yes
 *   N. der Mann — man
 *   P. in — in
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const text = fs.readFileSync(path.join(root, "words.text"), "utf8");
const lines = text.split(/\r?\n/).filter((l) => l.trim() && !l.trim().startsWith("#"));

const verbs = new Map();
const nouns = [];
const buckets = {
  adjective: [],
  conjunction: [],
  number: [],
  adverb: [],
  interjection: [],
  preposition: [],
};

function addSimple(type, german, english) {
  buckets[type].push({ german, english, type });
}

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

  m = line.match(/^A\.\s+(.+?)\s+—\s+(.+)$/i);
  if (m) {
    addSimple("adjective", m[1].trim(), m[2].trim());
    continue;
  }

  m = line.match(/^C\.\s+(.+?)\s+—\s+(.+)$/i);
  if (m) {
    addSimple("conjunction", m[1].trim(), m[2].trim());
    continue;
  }

  m = line.match(/^Num\.\s+(.+?)\s+—\s+(.+)$/i);
  if (m) {
    addSimple("number", m[1].trim(), m[2].trim());
    continue;
  }

  m = line.match(/^Adv\.\s+(.+?)\s+—\s+(.+)$/i);
  if (m) {
    addSimple("adverb", m[1].trim(), m[2].trim());
    continue;
  }

  m = line.match(/^Int\.\s+(.+?)\s+—\s+(.+)$/i);
  if (m) {
    addSimple("interjection", m[1].trim(), m[2].trim());
    continue;
  }

  m = line.match(/^P\.\s+(.+?)\s+—\s+(.+)$/);
  if (m) {
    addSimple("preposition", m[1].trim(), m[2].trim());
  }
}

const all = [
  ...verbs.values(),
  ...nouns,
  ...buckets.adjective,
  ...buckets.conjunction,
  ...buckets.number,
  ...buckets.adverb,
  ...buckets.interjection,
  ...buckets.preposition,
];

const out =
  "/** Auto-generated from words.text — run: npm run build:words */\n" +
  "export const WORDS = " +
  JSON.stringify(all, null, 2) +
  ";\n";

fs.writeFileSync(path.join(root, "js", "words.js"), out);
console.log(
  `Generated ${all.length} words (${verbs.size} verbs, ${nouns.length} nouns, ` +
    `${buckets.adjective.length} adjectives, ${buckets.conjunction.length} conjunctions, ` +
    `${buckets.number.length} numbers, ${buckets.adverb.length} adverbs, ` +
    `${buckets.interjection.length} interjections, ${buckets.preposition.length} prepositions)`
);

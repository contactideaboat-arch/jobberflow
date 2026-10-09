/**
 * Scans src for the "looks vibecoded" markers. Reports only; safe to run
 * repeatedly. Exits non-zero when a banned pattern is found so it can gate CI.
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const IGNORE = new Set(["node_modules", ".git", "dist", ".output", ".wrangler"]);
const rules = [
  { id: 2, name: "lucide icons", re: /lucide-react/g },
  { id: 5, name: "drop shadows", re: /shadow-(sm|md|lg|xl|2xl|panel|drop)\b/g },
  { id: 9, name: "em dash", re: /\s—\s|\u2014/g },
  { id: 10, name: "Space Grotesk / DM Sans", re: /Space Grotesk|DM Sans/g },
  { id: 23, name: "dot or grid background", re: /background-image:\s*linear-gradient|radial-gradient/g },
  { id: 30, name: "pastel palette", re: /bg-(pink|rose|amber|violet|indigo|cyan|emerald)-(100|200)\b/g },
];

function walk(dir, out = []) {
  for (const e of readdirSync(dir)) {
    if (IGNORE.has(e)) continue;
    const f = join(dir, e);
    if (statSync(f).isDirectory()) walk(f, out);
    else if (/\.(tsx?|css)$/.test(e)) out.push(f);
  }
  return out;
}

let total = 0;
for (const file of walk("src")) {
  const src = readFileSync(file, "utf8");
  const lines = src.split(/\r?\n/);
  for (const rule of rules) {
    rule.re.lastIndex = 0;
    lines.forEach((line, i) => {
      rule.re.lastIndex = 0;
      if (!rule.re.test(line)) return;
      // Legal copy and prose quoting an em dash is fine; flag code + UI strings.
      const isProse = /^\s*(\/\/|\*|p:|\/\*)/.test(line);
      if (rule.id === 9 && isProse) return;
      total++;
      console.log(`#${rule.id} ${rule.name}\n  ${file}:${i + 1}\n  ${line.trim().slice(0, 110)}`);
    });
  }
}

console.log(total === 0 ? "\nclean: no banned patterns found" : `\n${total} occurrence(s) found`);
process.exit(total === 0 ? 0 : 1);

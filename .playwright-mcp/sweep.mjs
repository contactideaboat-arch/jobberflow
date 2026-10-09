// Responsive + a11y sweep. Read-only: navigates, measures, screenshots.
// Run: node .playwright-mcp/sweep.mjs [width] [route]
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const BASE = "http://localhost:5173";
const OUT = "C:/ideabot internships/jobberflow/.playwright-mcp/sweep";
mkdirSync(OUT, { recursive: true });

const ROUTES = [
  ["landing", "/"],
  ["auth", "/auth"],
  ["legal-privacy", "/legal/privacy"],
  ["legal-terms", "/legal/terms"],
];

const WIDTHS = [375, 768, 1440];

const browser = await chromium.launch({
  // Reuse a Chrome already on this machine rather than downloading another
  // browser build.
  channel: "chrome",
});
const report = [];

for (const width of WIDTHS) {
  const ctx = await browser.newContext({ viewport: { width, height: 900 } });
  const page = await ctx.newPage();
  const consoleErrors = [];
  page.on("console", (m) => {
    if (m.type() === "error") consoleErrors.push(m.text().slice(0, 200));
  });
  page.on("pageerror", (e) => consoleErrors.push("pageerror: " + String(e).slice(0, 200)));

  for (const [name, path] of ROUTES) {
    consoleErrors.length = 0;
    await page.goto(BASE + path, { waitUntil: "networkidle", timeout: 45000 }).catch(() => {});
    await page.waitForTimeout(700);

    const audit = await page.evaluate(() => {
      const de = document.documentElement;
      const overflow = de.scrollWidth - de.clientWidth;

      // Widest elements that poke past the viewport, with an ancestry trail.
      const offenders = [];
      if (overflow > 1) {
        for (const el of document.querySelectorAll("body *")) {
          const r = el.getBoundingClientRect();
          if (r.width === 0) continue;
          const over = Math.round(r.right - de.clientWidth);
          if (over <= 1) continue;
          // An element inside a horizontal scroll container is not causing
          // page overflow; it is doing exactly what it should. Only report
          // elements with no scrollable ancestor.
          let inScroller = false;
          for (let a = el.parentElement; a && a !== document.body; a = a.parentElement) {
            const ov = getComputedStyle(a).overflowX;
            if (ov === "auto" || ov === "scroll" || ov === "hidden") {
              inScroller = true;
              break;
            }
          }
          if (inScroller) continue;
          const trail = [];
          let n = el;
          for (let i = 0; i < 4 && n && n !== document.body; i++) {
            trail.push(
              n.tagName.toLowerCase() +
                (n.className && typeof n.className === "string"
                  ? "." + n.className.split(/\s+/).slice(0, 3).join(".")
                  : ""),
            );
            n = n.parentElement;
          }
          offenders.push({ over, trail: trail.join(" < ") });
        }
        offenders.sort((a, b) => b.over - a.over);
      }

      // Accessible-name check on interactive elements.
      const nameless = [];
      for (const el of document.querySelectorAll("button, a[href], input, select, textarea")) {
        const r = el.getBoundingClientRect();
        if (r.width === 0 && r.height === 0) continue;
        const name =
          el.getAttribute("aria-label") ||
          el.getAttribute("title") ||
          (el.labels && el.labels.length ? el.labels[0].innerText : "") ||
          el.innerText ||
          el.getAttribute("placeholder") ||
          "";
        if (!name.trim()) {
          nameless.push(
            el.tagName.toLowerCase() + "." + (el.className || "").toString().slice(0, 60),
          );
        }
      }

      // Sub-11px computed type, with where it is.
      const tiny = [];
      for (const el of document.querySelectorAll("body *")) {
        if (!el.childNodes.length) continue;
        const hasText = Array.from(el.childNodes).some(
          (n) => n.nodeType === 3 && n.textContent.trim(),
        );
        if (!hasText) continue;
        const fs = parseFloat(getComputedStyle(el).fontSize);
        if (fs && fs < 11) {
          tiny.push(`${fs.toFixed(1)}px "${el.innerText.trim().slice(0, 40)}"`);
        }
      }

      // Heading outline.
      const headings = Array.from(document.querySelectorAll("h1,h2,h3")).map((h) => ({
        level: h.tagName,
        text: h.innerText.slice(0, 60),
      }));

      // Touch targets under 44px on this width.
      const small = [];
      for (const el of document.querySelectorAll("button, a[href], select, input[type=checkbox]")) {
        const r = el.getBoundingClientRect();
        if (r.width === 0 || r.height === 0) continue;
        if (r.height < 40) {
          small.push(
            `${Math.round(r.width)}x${Math.round(r.height)} ${el.tagName.toLowerCase()} "${(el.innerText || el.getAttribute("aria-label") || "").trim().slice(0, 28)}"`,
          );
        }
      }

      return {
        overflow,
        offenders: offenders.slice(0, 6),
        nameless: nameless.slice(0, 8),
        tiny: [...tiny],
        headings: headings.slice(0, 6),
        h1count: document.querySelectorAll("h1").length,
        small: small.slice(0, 10),
        title: document.title,
      };
    });

    report.push({ width, name, path, ...audit, consoleErrors: [...consoleErrors] });
    await page.screenshot({
      path: `${OUT}/${name}-${width}.png`,
      fullPage: false,
    });
  }
  await ctx.close();
}

await browser.close();
console.log(JSON.stringify(report, null, 1));

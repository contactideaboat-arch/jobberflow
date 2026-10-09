import { supabase } from "@/integrations/supabase/client";

/*
 * Formatting helpers.
 *
 * Formatters are module-level singletons: ERP tables call these once per cell,
 * and re-instantiating Intl.NumberFormat on every render is a measurable cost
 * on a 500-row voucher register.
 */

const LOCALE = "en-IN";

const kgFormat = new Intl.NumberFormat(LOCALE, {
  minimumFractionDigits: 3,
  maximumFractionDigits: 3,
});

const pcsFormat = new Intl.NumberFormat(LOCALE, { maximumFractionDigits: 0 });

const pctFormat = new Intl.NumberFormat(LOCALE, {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const countFormat = new Intl.NumberFormat(LOCALE, { maximumFractionDigits: 0 });

export const KG = (n: number | string | null | undefined) => kgFormat.format(Number(n ?? 0));

export const PCS = (n: number | string | null | undefined) => pcsFormat.format(Number(n ?? 0));

export const PCT = (n: number | string | null | undefined) =>
  `${pctFormat.format(Number(n ?? 0))}%`;

/** Plain integer count for UI chrome ("8 jobbers", not "8.000"). */
export const NUM = (n: number | string | null | undefined) => countFormat.format(Number(n ?? 0));

/**
 * Today's date in the operator's own timezone, as "YYYY-MM-DD".
 *
 * `toISOString()` is UTC, so between local midnight and 05:29 IST it returns
 * yesterday. Every new voucher would then default to the previous day, which is
 * exactly the off-by-one this module exists to prevent. Build the string from
 * local getters instead.
 */
export function today() {
  const now = new Date();
  const month = `${now.getMonth() + 1}`.padStart(2, "0");
  const day = `${now.getDate()}`.padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

/*
 * Postgres hands back calendar dates as "YYYY-MM-DD". Feeding that straight to
 * `new Date()` parses it as UTC midnight, which renders as the previous day for
 * anyone west of Greenwich, an off-by-one on every posted voucher date. Pin the
 * formatter to UTC so the calendar date survives the round trip.
 */
const dmyShort = new Intl.DateTimeFormat(LOCALE, {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  timeZone: "UTC",
});

const dmyLong = new Intl.DateTimeFormat(LOCALE, {
  day: "2-digit",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

function toUtcDate(value: string | Date | null | undefined) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(`${value.slice(0, 10)}T00:00:00Z`);
  return Number.isNaN(date.getTime()) ? null : date;
}

export const dmy = (d: string | Date | null | undefined) => {
  const date = toUtcDate(d);
  return date ? dmyShort.format(date) : "·";
};

export const dmyLongDate = (d: string | Date | null | undefined) => {
  const date = toUtcDate(d);
  return date ? dmyLong.format(date) : "·";
};

export type VoucherStatus = "DRAFT" | "POSTED" | "CANCELLED";

export const MATERIAL_CATEGORIES = [
  "Plastic Raw Material",
  "Master Batch",
  "Packaging",
  "Bags",
  "Stickers",
  "Labels",
  "Other",
];

export async function nextVoucherNumber(prefix: string) {
  const { data, error } = await supabase.rpc("next_voucher_number", { _prefix: prefix });
  if (error) throw error;
  return data as string;
}

export function errMsg(e: unknown) {
  const msg = (e as { message?: string })?.message ?? String(e);
  return msg.replace(/^.*?:\s*/, "").trim() || "Something went wrong";
}

/* -------- exports -------- */

export function downloadCsv(filename: string, rows: Record<string, unknown>[]) {
  if (!rows.length) return;
  const headers = Object.keys(rows[0]!);
  const escape = (v: unknown) => {
    const s = v == null ? "" : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const csv = [
    headers.join(","),
    ...rows.map((r) => headers.map((h) => escape(r[h])).join(",")),
  ].join("\n");
  const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8;" });
  triggerDownload(blob, `${filename}.csv`);
}

export function downloadExcel(filename: string, rows: Record<string, unknown>[]) {
  if (!rows.length) return;
  const headers = Object.keys(rows[0]!);
  const esc = (v: unknown) =>
    String(v ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  const html = `<html xmlns:x="urn:schemas-microsoft-com:office:excel"><head><meta charset="utf-8" /></head><body>
<table border="1"><thead><tr>${headers.map((h) => `<th>${esc(h)}</th>`).join("")}</tr></thead>
<tbody>${rows
    .map((r) => `<tr>${headers.map((h) => `<td>${esc(r[h])}</td>`).join("")}</tr>`)
    .join("")}</tbody></table></body></html>`;
  triggerDownload(new Blob([html], { type: "application/vnd.ms-excel" }), `${filename}.xls`);
}

function triggerDownload(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Print / save-as-PDF the element with the given id.
 *
 * The print window is a separate document, so it needs its own stylesheet.
 * It must match the app it is printing from: same family, same weights, same
 * sentence case, same tabular figures. The earlier version of this loaded
 * Big Shoulders Display and JetBrains Mono (neither is used by the application)
 * and set table heads to uppercase 10px, so a printed voucher came out looking
 * like a different product.
 *
 * It also has to un-hide the print-only headings. The app marks them
 * `hidden print:block`, and a `print:` variant means nothing in a document
 * that has no print stylesheet, so the voucher used to print with no title,
 * no voucher number and no date.
 */
export function printElement(elementId: string, title: string) {
  const el = document.getElementById(elementId);
  if (!el) return;
  const win = window.open("", "_blank", "width=1024,height=768");
  if (!win) return;
  const face = getComputedStyle(document.body).fontFamily;
  win.document.write(`<!doctype html><html lang="en"><head><meta charset="utf-8" />
<title>${escapeHtml(title)}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Archivo:wght@400;500;600;700&display=swap">
<style>
  /* Print is always a light surface, whatever the screen is showing. */
  :root{color-scheme:light}
  body{font-family:${face};color:#111827;background:#fff;margin:24px;font-size:11pt;line-height:1.5}
  h1,h2,h3,h4{font-family:inherit;font-weight:600;letter-spacing:-.01em;margin:0 0 6px;text-transform:none}
  .num{font-variant-numeric:tabular-nums;font-feature-settings:"tnum"}
  table{width:100%;border-collapse:collapse;margin:10px 0;font-size:10pt}
  th,td{border:1px solid #c9d0da;padding:6px 8px;text-align:left}
  thead th{background:#eef1f6;font-weight:500}
  tfoot td,tfoot th{background:#eef1f6;font-weight:600}
  .right{text-align:right}
  .muted{color:#5c6675}
  .box{border:1px solid #c9d0da;padding:10px 12px;margin:10px 0}
  .sig{display:flex;justify-content:space-between;margin-top:48px}
  .sig div{border-top:1px solid #98a2b3;padding-top:6px;width:28%;text-align:center;font-size:10pt}
  .no-print{display:none!important}
  /* The app hides print-only blocks with a print: variant that means nothing
     out here, so reveal them explicitly. */
  .print\\:block{display:block!important}
  @page{margin:14mm}
</style></head><body>${el.innerHTML}</body></html>`);
  win.document.close();
  win.focus();
  // Let the webfont settle before measuring the page for print.
  setTimeout(() => win.print(), 400);
}

function escapeHtml(s: string) {
  return s.replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] as string,
  );
}

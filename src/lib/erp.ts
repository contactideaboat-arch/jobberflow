import { supabase } from "@/integrations/supabase/client";

export const KG = (n: number | string | null | undefined) =>
  Number(n ?? 0).toLocaleString("en-IN", { minimumFractionDigits: 3, maximumFractionDigits: 3 });

export const PCS = (n: number | string | null | undefined) =>
  Number(n ?? 0).toLocaleString("en-IN", { maximumFractionDigits: 0 });

export const PCT = (n: number | string | null | undefined) =>
  `${Number(n ?? 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`;

export const today = () => new Date().toISOString().slice(0, 10);

export const dmy = (d: string | null | undefined) => {
  if (!d) return "-";
  const parts = d.slice(0, 10).split("-");
  return `${parts[2]}-${parts[1]}-${parts[0]}`;
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
  const csv = [headers.join(","), ...rows.map((r) => headers.map((h) => escape(r[h])).join(","))].join("\n");
  const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8;" });
  triggerDownload(blob, `${filename}.csv`);
}

export function downloadExcel(filename: string, rows: Record<string, unknown>[]) {
  if (!rows.length) return;
  const headers = Object.keys(rows[0]!);
  const esc = (v: unknown) =>
    String(v ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
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

/** Print / save-as-PDF the element with the given id. */
export function printElement(elementId: string, title: string) {
  const el = document.getElementById(elementId);
  if (!el) return;
  const win = window.open("", "_blank", "width=1024,height=768");
  if (!win) return;
  win.document.write(`<!doctype html><html><head><title>${title}</title>
<style>
  body{font-family:"DM Sans",system-ui,sans-serif;color:#1c2431;margin:28px;font-size:12px}
  h1,h2,h3{font-family:"Space Grotesk",system-ui,sans-serif;margin:0 0 6px}
  table{width:100%;border-collapse:collapse;margin:10px 0;font-size:11.5px}
  th,td{border:1px solid #c9d0da;padding:6px 8px;text-align:left}
  th{background:#eef1f6;text-transform:uppercase;font-size:10px;letter-spacing:.04em}
  .right{text-align:right}
  .muted{color:#5c6675}
  .box{border:1px solid #c9d0da;padding:10px 12px;margin:10px 0}
  .sig{display:flex;justify-content:space-between;margin-top:48px}
  .sig div{border-top:1px solid #98a2b3;padding-top:6px;width:28%;text-align:center;font-size:11px}
  .no-print{display:none}
</style></head><body>${el.innerHTML}</body></html>`);
  win.document.close();
  win.focus();
  setTimeout(() => win.print(), 300);
}

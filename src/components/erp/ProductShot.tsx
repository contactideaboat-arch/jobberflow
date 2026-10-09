import { cn } from "@/lib/utils";

/**
 * Product captures, drawn as static HTML rather than bitmaps.
 *
 * A screenshot rots the day the UI changes. These are rebuilt from the same
 * tokens as the app, so they stay on-palette and stay legible at any width,
 * and they can never contradict the real thing by showing stale chrome. The
 * figures are illustrative.
 */

type Row = { code: string; name: string; qty: string; unit: string };

/**
 * `textCols` is how many leading columns hold text; everything after is numeric
 * and right-aligned. It has to be told rather than assumed, because a table with
 * a code column has two leading text columns, and a right-aligned header sitting
 * over left-aligned cells is visibly wrong.
 */
function Head({ cols, textCols = 1 }: { cols: string[]; textCols?: number }) {
  return (
    <thead>
      <tr>
        {cols.map((c, i) => (
          <th key={c} scope="col" className={cn(i >= textCols && "text-right")}>
            {c}
          </th>
        ))}
      </tr>
    </thead>
  );
}

/** Stock ledger: the screen a jobber's manager lives in. */
function LedgerShot() {
  // Materials match the categories the app actually masters (MATERIAL_CATEGORIES
  // in lib/erp.ts). A capture showing the wrong trade reads as a template.
  const rows: Row[] = [
    { code: "RM-0142", name: "PP plastic", qty: "1,284.500", unit: "KG" },
    { code: "RM-0208", name: "Master batch", qty: "612.000", unit: "KG" },
    { code: "RM-0311", name: "HDPE natural", qty: "48.250", unit: "KG" },
    { code: "RM-0455", name: "BOPP label", qty: "31.750", unit: "KG" },
  ];
  return (
    <div className="p-3">
      <div className="mb-3 flex items-center justify-between gap-3 border-b pb-2.5">
        <div>
          <p className="label-xs text-muted-foreground">Inventory</p>
          <p className="mt-1 text-sm font-semibold">Raw material stock</p>
        </div>
        <span className="label-xs text-accent-foreground">Posted</span>
      </div>
      <table className="erp-table">
        <Head cols={["Code", "Material", "Balance", "Unit"]} textCols={2} />
        <tbody>
          {rows.map((r) => (
            <tr key={r.code}>
              <td className="num text-muted-foreground">{r.code}</td>
              <td>{r.name}</td>
              <td className="num text-right font-semibold">{r.qty}</td>
              <td className="text-right text-muted-foreground">{r.unit}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Reconciliation: the screen that settles an argument. */
function ReconShot() {
  return (
    <div className="p-3">
      <div className="mb-3 flex items-center justify-between gap-3 border-b pb-2.5">
        <div>
          <p className="label-xs text-muted-foreground">Reports</p>
          <p className="mt-1 text-sm font-semibold">Jobber reconciliation</p>
        </div>
        <span className="num label-xs text-muted-foreground">JOB-004</span>
      </div>
      <table className="erp-table">
        <Head cols={["Material", "Issued", "Returned", "Consumed", "Wastage"]} />
        <tbody>
          <tr>
            <td>PP Plastic</td>
            <td className="num text-right">420.000</td>
            <td className="num text-right">58.500</td>
            <td className="num text-right">348.250</td>
            <td className="num text-right text-warning-foreground">13.250</td>
          </tr>
          <tr>
            <td>Master Batch</td>
            <td className="num text-right">180.000</td>
            <td className="num text-right">12.000</td>
            <td className="num text-right">163.400</td>
            <td className="num text-right text-warning-foreground">4.600</td>
          </tr>
          <tr>
            <td>HDPE Natural</td>
            <td className="num text-right">36.000</td>
            <td className="num text-right">4.250</td>
            <td className="num text-right">30.900</td>
            <td className="num text-right">0.850</td>
          </tr>
        </tbody>
        <tfoot>
          <tr>
            <th scope="row">Total</th>
            <td className="num text-right">636.000</td>
            <td className="num text-right">74.750</td>
            <td className="num text-right">542.550</td>
            <td className="num text-right">18.700</td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

/** Voucher entry: the most-touched screen in the whole product. */
function VoucherShot() {
  const lines = [
    { m: "PP Plastic", issue: "420.000", ret: "58.500" },
    { m: "Master Batch", issue: "180.000", ret: "12.000" },
    { m: "HDPE Natural", issue: "36.000", ret: "4.250" },
  ];
  return (
    /*
     * lg, not sm: this component is rendered inside a frame roughly 480px
     * wide on a 1440px screen, so an `sm:` breakpoint (640px) never applied to
     * the container, only to the viewport. The two-column split therefore has
     * to wait for a width the frame can actually reach, and until then the
     * summary stack sits under the table instead of being clipped off the
     * right edge.
     */
    <div className="grid gap-3 p-3 lg:grid-cols-[minmax(0,1fr)_11rem]">
      <div>
        <div className="mb-2.5 flex items-center justify-between gap-3 border-b pb-2.5">
          <div>
            <p className="label-xs text-muted-foreground">Transaction</p>
            <p className="mt-1 text-sm font-semibold">Product inward from jobber</p>
          </div>
        </div>
        <div className="mb-2.5 grid grid-cols-3 gap-2">
          {/* min-w-0 so the date value truncates instead of widening the row */}
          {[
            ["Jobber", "JOB-004"],
            ["Voucher", "PV-2411"],
            ["Date", "2026-03-18"],
          ].map(([k, v]) => (
            <div key={k} className="min-w-0 border px-2 py-1.5">
              <p className="label-xs text-muted-foreground">{k}</p>
              <p className="num mt-0.5 truncate text-xs font-semibold">{v}</p>
            </div>
          ))}
        </div>
        <table className="erp-table">
          <Head cols={["Material", "Issued", "Returned"]} />
          <tbody>
            {lines.map((l) => (
              <tr key={l.m}>
                <td className="text-xs">{l.m}</td>
                <td className="num text-right text-xs">{l.issue}</td>
                <td className="num text-right text-xs">{l.ret}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex flex-col gap-2">
        {[
          ["Finished qty", "1,840 PCS"],
          ["BOM applied", "Yes"],
          ["Wastage", "18.700 KG"],
        ].map(([k, v]) => (
          <div key={k} className="border px-2.5 py-2">
            <p className="label-xs text-muted-foreground">{k}</p>
            <p className="num mt-1 text-sm font-semibold">{v}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export const PRODUCT_SHOTS = {
  ledger: LedgerShot,
  reconcile: ReconShot,
  voucher: VoucherShot,
};

/** The three screens worth showing, with the argument each one makes. */
export const SHOWCASE = [
  {
    key: "voucher" as const,
    eyebrow: "Post production",
    title: "One voucher, every quantity accounted",
    body: "Issue, return, BOM consumption and wastage are captured on a single voucher. Nothing is re-keyed between stages, so the ledger and the floor can never disagree.",
    url: "jobberflow.app/transactions/product-inward",
  },
  {
    key: "ledger" as const,
    eyebrow: "Live stock",
    title: "Warehouse and jobber stock in one balance",
    body: "Material sitting on a jobber's floor is company property and it is counted as such. Both balances roll into a single number you can defend.",
    url: "jobberflow.app/inventory/warehouse",
  },
  {
    key: "reconcile" as const,
    eyebrow: "Reconcile",
    title: "The variance, named and quantified",
    body: "Reconciliation states exactly how much material was issued, returned, consumed and lost. Disagreements end at a number instead of at an argument.",
    url: "jobberflow.app/reconciliation",
  },
];

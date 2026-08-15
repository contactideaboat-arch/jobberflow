/* eslint-disable @typescript-eslint/no-explicit-any */
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/components/erp/AppShell";
import { EmptyRow, ExportBar, Field, KpiCard, Panel, SearchSelect } from "@/components/erp/bits";
import { Input } from "@/components/ui/input";
import { useRows } from "@/hooks/use-erp";
import { KG, PCS, PCT, dmy } from "@/lib/erp";

export const Route = createFileRoute("/_authenticated/reconciliation")({
  head: () => ({
    meta: [
      { title: "Jobber Reconciliation — JobWork ERP" },
      {
        name: "description",
        content: "Reconcile material issued, consumed, wasted and returned for each jobber with a printable statement.",
      },
      { property: "og:title", content: "Jobber Reconciliation — JobWork ERP" },
      { property: "og:description", content: "Printable jobber-wise material accountability statement." },
    ],
  }),
  component: Reconciliation,
});

function Reconciliation() {
  const [jobber, setJobber] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const { data: jobbers } = useRows("jobbers", ["jobbers", "all"], (b) => b.order("code"));
  const { data: products } = useRows("finished_products", ["finished_products", "all"], (b) => b.order("code"));
  const { data: settings } = useRows("company_settings", ["company_settings"]);
  const { data: stock } = useRows("jobber_stock", ["jobber_stock"]);
  const { data: heads } = useRows("product_inward_headers", ["pi_headers"], (b) =>
    b.order("voucher_date", { ascending: false }).limit(2000),
  );

  const company = (settings ?? [])[0];
  const jRow = (jobbers ?? []).find((j: any) => j.id === jobber);
  const inRange = (d: string) => (from ? d >= from : true) && (to ? d <= to : true);

  const lines = (stock ?? []).filter((r: any) => r.jobber_id === jobber);
  const production = (heads ?? []).filter(
    (h: any) => h.status === "POSTED" && h.jobber_id === jobber && inRange(h.voucher_date),
  );

  const totals = lines.reduce(
    (t: any, r: any) => ({
      received: t.received + Number(r.received ?? 0),
      consumed: t.consumed + Number(r.standard_consumed ?? 0),
      wastage: t.wastage + Number(r.wastage ?? 0),
      returned: t.returned + Number(r.returned ?? 0),
      balance: t.balance + Number(r.balance ?? 0),
    }),
    { received: 0, consumed: 0, wastage: 0, returned: 0, balance: 0 },
  );
  const wastagePct = totals.consumed > 0 ? (totals.wastage / totals.consumed) * 100 : 0;
  const producedPcs = production.reduce((s: number, h: any) => s + Number(h.finished_quantity ?? 0), 0);
  const pName = (id: string) => {
    const p = (products ?? []).find((x: any) => x.id === id);
    return p ? `${p.code} — ${p.name}` : "-";
  };

  return (
    <div>
      <PageHeader
        title="Jobber Reconciliation"
        breadcrumb={["Reports", "Jobber Reconciliation"]}
        subtitle="Material accountability statement: what was issued to the jobber, what production consumed, what was wasted and what is still lying with them."
        actions={
          jobber ? (
            <ExportBar
              filename={`reconciliation-${jRow?.code ?? "jobber"}`}
              printId="recon-print"
              title={`Jobber Reconciliation — ${jRow?.name ?? ""}`}
              rows={lines.map((r: any) => ({
                Material: `${r.material_code} — ${r.material_name}`,
                Received: r.received,
                "Standard Consumed": r.standard_consumed,
                Wastage: r.wastage,
                Returned: r.returned,
                Adjustment: r.adjustment,
                Balance: r.balance,
              }))}
            />
          ) : undefined
        }
      />

      <Panel className="mb-4">
        <div className="grid gap-3 p-3 sm:grid-cols-3">
          <Field label="Jobber">
            <SearchSelect
              options={(jobbers ?? []).map((j: any) => ({ value: j.id, label: `${j.code} — ${j.name}` }))}
              value={jobber}
              onChange={setJobber}
              placeholder="Select jobber…"
            />
          </Field>
          <Field label="Production from">
            <Input type="date" className="h-9" value={from} onChange={(e) => setFrom(e.target.value)} />
          </Field>
          <Field label="Production to">
            <Input type="date" className="h-9" value={to} onChange={(e) => setTo(e.target.value)} />
          </Field>
        </div>
      </Panel>

      {!jobber && (
        <Panel>
          <div className="p-10 text-center text-sm text-muted-foreground">
            Select a jobber to generate the reconciliation statement.
          </div>
        </Panel>
      )}

      {jobber && (
        <>
          <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <KpiCard label="Material Received" value={KG(totals.received)} unit="KG" />
            <KpiCard label="Standard Consumed" value={KG(totals.consumed)} unit="KG" tone="info" />
            <KpiCard label="Wastage" value={KG(totals.wastage)} unit="KG" tone="warning" hint={PCT(wastagePct)} />
            <KpiCard label="Returned" value={KG(totals.returned)} unit="KG" />
            <KpiCard label="Balance With Jobber" value={KG(totals.balance)} unit="KG" tone="accent" />
          </div>

          <div id="recon-print">
            <div className="mb-3 hidden print:block">
              <h1>{company?.company_name ?? "Company"}</h1>
              <div className="muted">Jobber Reconciliation Statement</div>
            </div>

            <Panel title={`Material Reconciliation — ${jRow?.name ?? ""}`} className="mb-4">
              <div className="overflow-x-auto">
                <table className="erp-table">
                  <thead>
                    <tr>
                      <th>Material</th>
                      <th className="text-right">Received</th>
                      <th className="text-right">Std. Consumed</th>
                      <th className="text-right">Wastage</th>
                      <th className="text-right">Returned</th>
                      <th className="text-right">Adjustment</th>
                      <th className="text-right">Balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lines.length === 0 && <EmptyRow cols={7} text="No material issued to this jobber yet." />}
                    {lines.map((r: any) => (
                      <tr key={r.material_id}>
                        <td>
                          <div className="num text-xs text-muted-foreground">{r.material_code}</div>
                          {r.material_name}
                        </td>
                        <td className="num text-right">{KG(r.received)}</td>
                        <td className="num text-right">{KG(r.standard_consumed)}</td>
                        <td className="num text-right text-warning-foreground">{KG(r.wastage)}</td>
                        <td className="num text-right">{KG(r.returned)}</td>
                        <td className="num text-right">{KG(r.adjustment)}</td>
                        <td className="num text-right font-semibold">{KG(r.balance)}</td>
                      </tr>
                    ))}
                    {lines.length > 0 && (
                      <tr className="font-semibold">
                        <td>Total</td>
                        <td className="num text-right">{KG(totals.received)}</td>
                        <td className="num text-right">{KG(totals.consumed)}</td>
                        <td className="num text-right">{KG(totals.wastage)}</td>
                        <td className="num text-right">{KG(totals.returned)}</td>
                        <td className="num text-right">-</td>
                        <td className="num text-right">{KG(totals.balance)}</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Panel>

            <Panel title={`Production Received — ${PCS(producedPcs)} PCS`}>
              <div className="overflow-x-auto">
                <table className="erp-table">
                  <thead>
                    <tr>
                      <th>Voucher</th>
                      <th>Date</th>
                      <th>Product</th>
                      <th className="text-right">Finished Qty</th>
                      <th className="text-right">Std. Consumption</th>
                      <th className="text-right">Wastage KG</th>
                      <th className="text-right">Wastage %</th>
                    </tr>
                  </thead>
                  <tbody>
                    {production.length === 0 && <EmptyRow cols={7} text="No production posted in this period." />}
                    {production.map((h: any) => (
                      <tr key={h.id}>
                        <td className="num whitespace-nowrap font-medium">{h.voucher_number}</td>
                        <td className="num whitespace-nowrap">{dmy(h.voucher_date)}</td>
                        <td>{pName(h.product_id)}</td>
                        <td className="num text-right">{PCS(h.finished_quantity)}</td>
                        <td className="num text-right">{KG(h.total_standard_consumption)}</td>
                        <td className="num text-right">{KG(h.overall_wastage_kg)}</td>
                        <td className="num text-right">{PCT(h.wastage_percentage)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Panel>

            <div className="sig hidden print:flex">
              <div>Prepared By</div>
              <div>Jobber Acknowledgement</div>
              <div>Authorised Signatory</div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

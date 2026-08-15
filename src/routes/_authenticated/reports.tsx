/* eslint-disable @typescript-eslint/no-explicit-any */
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/components/erp/AppShell";
import { EmptyRow, ExportBar, Field, Panel, SearchSelect } from "@/components/erp/bits";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useRows } from "@/hooks/use-erp";
import { KG, PCS, PCT, dmy } from "@/lib/erp";

export const Route = createFileRoute("/_authenticated/reports")({
  head: () => ({
    meta: [
      { title: "Reports Centre — JobWork ERP" },
      {
        name: "description",
        content: "Production register, wastage analysis, material consumption and jobber performance reports with export.",
      },
      { property: "og:title", content: "Reports Centre — JobWork ERP" },
      { property: "og:description", content: "Management reporting for job work production and wastage." },
    ],
  }),
  component: ReportsCentre,
});

function ReportsCentre() {
  const [jobber, setJobber] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const { data: jobbers } = useRows("jobbers", ["jobbers", "all"], (b) => b.order("code"));
  const { data: products } = useRows("finished_products", ["finished_products", "all"], (b) => b.order("code"));
  const { data: materials } = useRows("raw_materials", ["raw_materials", "all"], (b) => b.order("code"));
  const { data: settings } = useRows("company_settings", ["company_settings"]);
  const { data: heads } = useRows("product_inward_headers", ["pi_headers"], (b) =>
    b.order("voucher_date", { ascending: false }).limit(2000),
  );
  const { data: rmLedger } = useRows("raw_material_ledger", ["rm_ledger", "reports"], (b) => b.limit(5000));

  const threshold = Number((settings ?? [])[0]?.wastage_warning_threshold ?? 5);

  const inRange = (d: string) => (from ? d >= from : true) && (to ? d <= to : true);
  const name = (list: any[] | undefined, id: string | null) => {
    const r = (list ?? []).find((x: any) => x.id === id);
    return r ? `${r.code} — ${r.name}` : "-";
  };
  const jName = (id: string | null) => (jobbers ?? []).find((j: any) => j.id === id)?.name ?? "-";

  const posted = (heads ?? []).filter(
    (h: any) => h.status === "POSTED" && inRange(h.voucher_date) && (jobber ? h.jobber_id === jobber : true),
  );

  /* ---- production register ---- */
  const production = posted;

  /* ---- wastage analysis by jobber ---- */
  const wastageByJobber = Object.values(
    posted.reduce((acc: any, h: any) => {
      const k = h.jobber_id;
      acc[k] ??= { jobber: jName(k), vouchers: 0, produced: 0, standard: 0, wastage: 0 };
      acc[k].vouchers += 1;
      acc[k].produced += Number(h.finished_quantity ?? 0);
      acc[k].standard += Number(h.total_standard_consumption ?? 0);
      acc[k].wastage += Number(h.overall_wastage_kg ?? 0);
      return acc;
    }, {}),
  ).map((r: any) => ({ ...r, pct: r.standard > 0 ? (r.wastage / r.standard) * 100 : 0 }));

  /* ---- product-wise production ---- */
  const byProduct = Object.values(
    posted.reduce((acc: any, h: any) => {
      const k = h.product_id;
      acc[k] ??= { product: name(products, k), vouchers: 0, produced: 0, standard: 0, wastage: 0 };
      acc[k].vouchers += 1;
      acc[k].produced += Number(h.finished_quantity ?? 0);
      acc[k].standard += Number(h.total_standard_consumption ?? 0);
      acc[k].wastage += Number(h.overall_wastage_kg ?? 0);
      return acc;
    }, {}),
  ).map((r: any) => ({ ...r, pct: r.standard > 0 ? (r.wastage / r.standard) * 100 : 0 }));

  /* ---- material consumption ---- */
  const consumption = Object.values(
    (rmLedger ?? [])
      .filter(
        (l: any) =>
          l.transaction_type === "CONSUMPTION" &&
          inRange(l.transaction_date) &&
          (jobber ? l.jobber_id === jobber : true),
      )
      .reduce((acc: any, l: any) => {
        const k = l.material_id;
        acc[k] ??= { material: name(materials, k), standard: 0, wastage: 0, total: 0 };
        acc[k].standard += Number(l.standard_consumption ?? 0);
        acc[k].wastage += Number(l.wastage_quantity ?? 0);
        acc[k].total += Number(l.quantity_out ?? 0);
        return acc;
      }, {}),
  ).map((r: any) => ({ ...r, pct: r.standard > 0 ? (r.wastage / r.standard) * 100 : 0 }));

  return (
    <div>
      <PageHeader
        title="Reports Centre"
        breadcrumb={["Reports", "Reports Centre"]}
        subtitle={`Filter by jobber and date range, then export any report. Wastage above ${threshold}% is highlighted.`}
      />

      <Panel className="mb-4">
        <div className="grid gap-3 p-3 sm:grid-cols-3">
          <Field label="Jobber">
            <SearchSelect
              options={[
                { value: "", label: "All jobbers" },
                ...(jobbers ?? []).map((j: any) => ({ value: j.id, label: `${j.code} — ${j.name}` })),
              ]}
              value={jobber}
              onChange={setJobber}
              placeholder="All jobbers"
            />
          </Field>
          <Field label="From date">
            <Input type="date" className="h-9" value={from} onChange={(e) => setFrom(e.target.value)} />
          </Field>
          <Field label="To date">
            <Input type="date" className="h-9" value={to} onChange={(e) => setTo(e.target.value)} />
          </Field>
        </div>
      </Panel>

      <Tabs defaultValue="production">
        <TabsList className="mb-4 flex-wrap">
          <TabsTrigger value="production">Production Register</TabsTrigger>
          <TabsTrigger value="wastage">Wastage by Jobber</TabsTrigger>
          <TabsTrigger value="product">Product-wise</TabsTrigger>
          <TabsTrigger value="consumption">Material Consumption</TabsTrigger>
        </TabsList>

        <TabsContent value="production">
          <Panel
            title="Production Register"
            actions={
              <ExportBar
                filename="production-register"
                rows={production.map((h: any) => ({
                  Voucher: h.voucher_number,
                  Date: dmy(h.voucher_date),
                  Jobber: jName(h.jobber_id),
                  Product: name(products, h.product_id),
                  "Finished Qty": h.finished_quantity,
                  "Std. Consumption": h.total_standard_consumption,
                  "Wastage KG": h.overall_wastage_kg,
                  "Wastage %": h.wastage_percentage,
                  "Actual Consumption": h.actual_total_consumption,
                  Batch: h.batch_number,
                }))}
              />
            }
          >
            <div className="overflow-x-auto">
              <table className="erp-table">
                <thead>
                  <tr>
                    <th>Voucher</th>
                    <th>Date</th>
                    <th>Jobber</th>
                    <th>Product</th>
                    <th className="text-right">Finished</th>
                    <th className="text-right">Std. Cons.</th>
                    <th className="text-right">Wastage KG</th>
                    <th className="text-right">Wastage %</th>
                    <th className="text-right">Actual Cons.</th>
                  </tr>
                </thead>
                <tbody>
                  {production.length === 0 && <EmptyRow cols={9} />}
                  {production.map((h: any) => (
                    <tr key={h.id}>
                      <td className="num whitespace-nowrap font-medium">{h.voucher_number}</td>
                      <td className="num whitespace-nowrap">{dmy(h.voucher_date)}</td>
                      <td>{jName(h.jobber_id)}</td>
                      <td>{name(products, h.product_id)}</td>
                      <td className="num text-right">{PCS(h.finished_quantity)}</td>
                      <td className="num text-right">{KG(h.total_standard_consumption)}</td>
                      <td className="num text-right">{KG(h.overall_wastage_kg)}</td>
                      <td
                        className={`num text-right font-semibold ${Number(h.wastage_percentage) > threshold ? "text-destructive" : "text-success"}`}
                      >
                        {PCT(h.wastage_percentage)}
                      </td>
                      <td className="num text-right">{KG(h.actual_total_consumption)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>
        </TabsContent>

        <TabsContent value="wastage">
          <Panel
            title="Wastage Analysis by Jobber"
            actions={<ExportBar filename="wastage-by-jobber" rows={wastageByJobber as any} />}
          >
            <div className="overflow-x-auto">
              <table className="erp-table">
                <thead>
                  <tr>
                    <th>Jobber</th>
                    <th className="text-right">Vouchers</th>
                    <th className="text-right">Produced</th>
                    <th className="text-right">Std. Consumption</th>
                    <th className="text-right">Wastage KG</th>
                    <th className="text-right">Wastage %</th>
                  </tr>
                </thead>
                <tbody>
                  {wastageByJobber.length === 0 && <EmptyRow cols={6} />}
                  {wastageByJobber.map((r: any) => (
                    <tr key={r.jobber}>
                      <td>{r.jobber}</td>
                      <td className="num text-right">{r.vouchers}</td>
                      <td className="num text-right">{PCS(r.produced)}</td>
                      <td className="num text-right">{KG(r.standard)}</td>
                      <td className="num text-right">{KG(r.wastage)}</td>
                      <td
                        className={`num text-right font-semibold ${r.pct > threshold ? "text-destructive" : "text-success"}`}
                      >
                        {PCT(r.pct)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>
        </TabsContent>

        <TabsContent value="product">
          <Panel
            title="Product-wise Production &amp; Wastage"
            actions={<ExportBar filename="product-wise-production" rows={byProduct as any} />}
          >
            <div className="overflow-x-auto">
              <table className="erp-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th className="text-right">Vouchers</th>
                    <th className="text-right">Produced</th>
                    <th className="text-right">Std. Consumption</th>
                    <th className="text-right">Wastage KG</th>
                    <th className="text-right">Wastage %</th>
                  </tr>
                </thead>
                <tbody>
                  {byProduct.length === 0 && <EmptyRow cols={6} />}
                  {byProduct.map((r: any) => (
                    <tr key={r.product}>
                      <td>{r.product}</td>
                      <td className="num text-right">{r.vouchers}</td>
                      <td className="num text-right">{PCS(r.produced)}</td>
                      <td className="num text-right">{KG(r.standard)}</td>
                      <td className="num text-right">{KG(r.wastage)}</td>
                      <td
                        className={`num text-right font-semibold ${r.pct > threshold ? "text-destructive" : "text-success"}`}
                      >
                        {PCT(r.pct)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>
        </TabsContent>

        <TabsContent value="consumption">
          <Panel
            title="Material Consumption"
            actions={<ExportBar filename="material-consumption" rows={consumption as any} />}
          >
            <div className="overflow-x-auto">
              <table className="erp-table">
                <thead>
                  <tr>
                    <th>Material</th>
                    <th className="text-right">Standard Consumption</th>
                    <th className="text-right">Wastage</th>
                    <th className="text-right">Total Consumed</th>
                    <th className="text-right">Wastage %</th>
                  </tr>
                </thead>
                <tbody>
                  {consumption.length === 0 && <EmptyRow cols={5} />}
                  {consumption.map((r: any) => (
                    <tr key={r.material}>
                      <td>{r.material}</td>
                      <td className="num text-right">{KG(r.standard)}</td>
                      <td className="num text-right">{KG(r.wastage)}</td>
                      <td className="num text-right font-semibold">{KG(r.total)}</td>
                      <td
                        className={`num text-right font-semibold ${r.pct > threshold ? "text-destructive" : "text-success"}`}
                      >
                        {PCT(r.pct)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>
        </TabsContent>
      </Tabs>
    </div>
  );
}

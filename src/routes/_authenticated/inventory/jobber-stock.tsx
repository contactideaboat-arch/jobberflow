/* eslint-disable @typescript-eslint/no-explicit-any */
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/components/erp/AppShell";
import { EmptyRow, ExportBar, Panel, SearchSelect } from "@/components/erp/bits";
import { Input } from "@/components/ui/input";
import { useRows } from "@/hooks/use-erp";
import { KG } from "@/lib/erp";

export const Route = createFileRoute("/_authenticated/inventory/jobber-stock")({
  head: () => ({
    meta: [
      { title: "Jobber Stock — JobWork ERP" },
      {
        name: "description",
        content: "Company-owned raw material lying with each jobber, with received, consumed, wastage and return movement.",
      },
      { property: "og:title", content: "Jobber Stock — JobWork ERP" },
      { property: "og:description", content: "Material balance held by each job work vendor." },
    ],
  }),
  component: JobberStock,
});

function JobberStock() {
  const [q, setQ] = useState("");
  const [jobber, setJobber] = useState<string>("");
  const { data: rows } = useRows("jobber_stock", ["jobber_stock"]);
  const { data: jobbers } = useRows("jobbers", ["jobbers", "all"], (b) => b.order("code"));

  const filtered = (rows ?? [])
    .filter((r: any) => (jobber ? r.jobber_id === jobber : true))
    .filter((r: any) =>
      [r.jobber_code, r.jobber_name, r.material_code, r.material_name].join(" ").toLowerCase().includes(q.toLowerCase()),
    )
    .sort((a: any, b: any) =>
      `${a.jobber_code}${a.material_code}`.localeCompare(`${b.jobber_code}${b.material_code}`),
    );

  const total = filtered.reduce((s: number, r: any) => s + Number(r.balance ?? 0), 0);

  const exportRows = filtered.map((r: any) => ({
    Jobber: `${r.jobber_code} — ${r.jobber_name}`,
    Material: `${r.material_code} — ${r.material_name}`,
    Received: r.received,
    "Standard Consumed": r.standard_consumed,
    Wastage: r.wastage,
    Returned: r.returned,
    Adjustment: r.adjustment,
    Balance: r.balance,
    UOM: r.uom,
  }));

  return (
    <div>
      <PageHeader
        title="Jobber Stock"
        breadcrumb={["Inventory", "Jobber Stock"]}
        subtitle="Material issued to jobbers stays company stock until it is consumed in production or returned."
        actions={<ExportBar filename="jobber-stock" rows={exportRows} />}
      />
      <Panel>
        <div className="flex flex-wrap items-center gap-2 border-b p-3">
          <Input
            className="h-9 max-w-xs"
            placeholder="Search jobber or material…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <div className="w-56">
            <SearchSelect
              options={[
                { value: "", label: "All jobbers" },
                ...(jobbers ?? []).map((j: any) => ({ value: j.id, label: `${j.code} — ${j.name}` })),
              ]}
              value={jobber}
              onChange={setJobber}
              placeholder="All jobbers"
            />
          </div>
          <span className="ml-auto num text-xs text-muted-foreground">Balance {KG(total)} KG</span>
        </div>
        <div className="overflow-x-auto">
          <table className="erp-table">
            <thead>
              <tr>
                <th>Jobber</th>
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
              {filtered.length === 0 && <EmptyRow cols={8} />}
              {filtered.map((r: any) => (
                <tr key={`${r.jobber_id}-${r.material_id}`}>
                  <td>
                    <div className="num text-xs text-muted-foreground">{r.jobber_code}</div>
                    {r.jobber_name}
                  </td>
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
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}

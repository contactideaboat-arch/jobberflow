/* eslint-disable @typescript-eslint/no-explicit-any */
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/components/erp/AppShell";
import { EmptyRow, ExportBar, Panel } from "@/components/erp/bits";
import { Input } from "@/components/ui/input";
import { useRows } from "@/hooks/use-erp";
import { KG } from "@/lib/erp";

export const Route = createFileRoute("/_authenticated/inventory/warehouse")({
  head: () => ({
    meta: [
      { title: "Warehouse Stock — JobWork ERP" },
      { name: "description", content: "Live raw material balance in the company warehouse with low-stock highlighting." },
      { property: "og:title", content: "Warehouse Stock — JobWork ERP" },
      { property: "og:description", content: "Live warehouse raw material balances." },
    ],
  }),
  component: WarehouseStock,
});

function WarehouseStock() {
  const [q, setQ] = useState("");
  const { data: rows } = useRows("warehouse_stock", ["warehouse_stock"]);
  const filtered = (rows ?? [])
    .filter((r: any) => [r.code, r.name, r.category].join(" ").toLowerCase().includes(q.toLowerCase()))
    .sort((a: any, b: any) => String(a.code).localeCompare(String(b.code)));
  const total = filtered.reduce((s: number, r: any) => s + Number(r.balance), 0);

  return (
    <div>
      <PageHeader
        title="Warehouse Stock"
        breadcrumb={["Inventory", "Warehouse Stock"]}
        subtitle="Raw material physically lying in the company warehouse."
        actions={
          <ExportBar
            filename="warehouse-stock"
            rows={filtered.map((r: any) => ({
              Code: r.code,
              Material: r.name,
              Category: r.category,
              "Total In": r.total_in,
              "Total Out": r.total_out,
              Balance: r.balance,
              Minimum: r.minimum_stock,
              UOM: r.uom,
            }))}
          />
        }
      />
      <Panel>
        <div className="flex items-center gap-2 border-b p-3">
          <Input className="h-9 max-w-sm" placeholder="Search material…" value={q} onChange={(e) => setQ(e.target.value)} />
          <span className="ml-auto num text-xs text-muted-foreground">Total {KG(total)} KG</span>
        </div>
        <div className="overflow-x-auto">
          <table className="erp-table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Material</th>
                <th>Category</th>
                <th className="text-right">Total In</th>
                <th className="text-right">Total Out</th>
                <th className="text-right">Balance</th>
                <th className="text-right">Minimum</th>
                <th>UOM</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && <EmptyRow cols={8} />}
              {filtered.map((r: any) => (
                <tr key={r.material_id}>
                  <td className="num font-medium">{r.code}</td>
                  <td>{r.name}</td>
                  <td>{r.category}</td>
                  <td className="num text-right">{KG(r.total_in)}</td>
                  <td className="num text-right">{KG(r.total_out)}</td>
                  <td
                    className={`num text-right font-semibold ${Number(r.balance) < Number(r.minimum_stock) ? "text-destructive" : ""}`}
                  >
                    {KG(r.balance)}
                  </td>
                  <td className="num text-right">{KG(r.minimum_stock)}</td>
                  <td>{r.uom}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}

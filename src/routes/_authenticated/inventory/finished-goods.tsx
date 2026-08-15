/* eslint-disable @typescript-eslint/no-explicit-any */
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/components/erp/AppShell";
import { EmptyRow, ExportBar, Panel } from "@/components/erp/bits";
import { Input } from "@/components/ui/input";
import { useRows } from "@/hooks/use-erp";
import { PCS } from "@/lib/erp";

export const Route = createFileRoute("/_authenticated/inventory/finished-goods")({
  head: () => ({
    meta: [
      { title: "Finished Goods Stock — JobWork ERP" },
      { name: "description", content: "Finished product balances received from jobbers after production." },
      { property: "og:title", content: "Finished Goods Stock — JobWork ERP" },
      { property: "og:description", content: "Live finished product stock position." },
    ],
  }),
  component: FinishedGoodsStock,
});

function FinishedGoodsStock() {
  const [q, setQ] = useState("");
  const { data: rows } = useRows("finished_goods_stock", ["finished_goods_stock"]);
  const filtered = (rows ?? [])
    .filter((r: any) => [r.code, r.name].join(" ").toLowerCase().includes(q.toLowerCase()))
    .sort((a: any, b: any) => String(a.code).localeCompare(String(b.code)));
  const total = filtered.reduce((s: number, r: any) => s + Number(r.balance ?? 0), 0);

  return (
    <div>
      <PageHeader
        title="Finished Goods Stock"
        breadcrumb={["Inventory", "Finished Goods Stock"]}
        subtitle="Quantities of finished products received into the company after job work production."
        actions={
          <ExportBar
            filename="finished-goods-stock"
            rows={filtered.map((r: any) => ({
              Code: r.code,
              Product: r.name,
              "Total In": r.total_in,
              "Total Out": r.total_out,
              Balance: r.balance,
              UOM: r.uom,
            }))}
          />
        }
      />
      <Panel>
        <div className="flex items-center gap-2 border-b p-3">
          <Input
            className="h-9 max-w-sm"
            placeholder="Search product…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <span className="ml-auto num text-xs text-muted-foreground">Total {PCS(total)} PCS</span>
        </div>
        <div className="overflow-x-auto">
          <table className="erp-table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Product</th>
                <th className="text-right">Total In</th>
                <th className="text-right">Total Out</th>
                <th className="text-right">Balance</th>
                <th>UOM</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && <EmptyRow cols={6} />}
              {filtered.map((r: any) => (
                <tr key={r.product_id}>
                  <td className="num font-medium">{r.code}</td>
                  <td>{r.name}</td>
                  <td className="num text-right">{PCS(r.total_in)}</td>
                  <td className="num text-right">{PCS(r.total_out)}</td>
                  <td className="num text-right font-semibold">{PCS(r.balance)}</td>
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

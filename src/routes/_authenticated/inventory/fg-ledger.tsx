/* eslint-disable @typescript-eslint/no-explicit-any */
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/components/erp/AppShell";
import { EmptyRow, ExportBar, Panel, SearchSelect, Field } from "@/components/erp/bits";
import { Input } from "@/components/ui/input";
import { useRows } from "@/hooks/use-erp";
import { PCS, dmy } from "@/lib/erp";

export const Route = createFileRoute("/_authenticated/inventory/fg-ledger")({
  head: () => ({
    meta: [
      { title: "Finished Goods Ledger — JobWork ERP" },
      { name: "description", content: "Movement history of finished products with running balance per product." },
      { property: "og:title", content: "Finished Goods Ledger — JobWork ERP" },
      { property: "og:description", content: "Production inward, adjustment and reversal history." },
    ],
  }),
  component: FgLedger,
});

function FgLedger() {
  const [product, setProduct] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const { data: products } = useRows("finished_products", ["finished_products", "all"], (b) => b.order("code"));
  const { data: jobbers } = useRows("jobbers", ["jobbers", "all"], (b) => b.order("code"));
  const { data: rows } = useRows("finished_goods_ledger", ["fg_ledger"], (b) =>
    b.order("transaction_date", { ascending: true }).order("created_at", { ascending: true }).limit(5000),
  );

  const filtered = (rows ?? []).filter((r: any) => {
    if (product && r.product_id !== product) return false;
    if (from && r.transaction_date < from) return false;
    if (to && r.transaction_date > to) return false;
    return true;
  });

  const pName = (id: string) => {
    const p = (products ?? []).find((x: any) => x.id === id);
    return p ? `${p.code} — ${p.name}` : "-";
  };
  const jName = (id: string | null) => {
    if (!id) return "-";
    const j = (jobbers ?? []).find((x: any) => x.id === id);
    return j ? j.name : "-";
  };

  let running = 0;
  const withBalance = filtered.map((r: any) => {
    running += Number(r.quantity_in ?? 0) - Number(r.quantity_out ?? 0);
    return { ...r, running };
  });
  const view = [...withBalance].reverse();

  return (
    <div>
      <PageHeader
        title="Finished Goods Ledger"
        breadcrumb={["Inventory", "Finished Goods Ledger"]}
        subtitle="Every finished product receipt, adjustment and cancellation reversal in date order."
        actions={
          <ExportBar
            filename="finished-goods-ledger"
            rows={withBalance.map((r: any) => ({
              Date: dmy(r.transaction_date),
              Voucher: r.voucher_number,
              Type: r.transaction_type,
              Product: pName(r.product_id),
              Jobber: jName(r.jobber_id),
              In: r.quantity_in,
              Out: r.quantity_out,
              Balance: r.running,
              Remarks: r.remarks,
            }))}
          />
        }
      />
      <Panel>
        <div className="grid gap-3 border-b p-3 sm:grid-cols-3">
          <Field label="Product">
            <SearchSelect
              options={[
                { value: "", label: "All products" },
                ...(products ?? []).map((p: any) => ({ value: p.id, label: `${p.code} — ${p.name}` })),
              ]}
              value={product}
              onChange={setProduct}
              placeholder="All products"
            />
          </Field>
          <Field label="From date">
            <Input type="date" className="h-9" value={from} onChange={(e) => setFrom(e.target.value)} />
          </Field>
          <Field label="To date">
            <Input type="date" className="h-9" value={to} onChange={(e) => setTo(e.target.value)} />
          </Field>
        </div>
        <div className="overflow-x-auto">
          <table className="erp-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Voucher</th>
                <th>Type</th>
                <th>Product</th>
                <th>Jobber</th>
                <th className="text-right">In</th>
                <th className="text-right">Out</th>
                <th className="text-right">Balance</th>
              </tr>
            </thead>
            <tbody>
              {view.length === 0 && <EmptyRow cols={8} />}
              {view.map((r: any) => (
                <tr key={r.id}>
                  <td className="num whitespace-nowrap">{dmy(r.transaction_date)}</td>
                  <td className="num whitespace-nowrap text-xs">{r.voucher_number ?? "-"}</td>
                  <td className="text-xs font-medium">{r.transaction_type}</td>
                  <td>{pName(r.product_id)}</td>
                  <td className="text-xs">{jName(r.jobber_id)}</td>
                  <td className="num text-right text-success">{Number(r.quantity_in) ? PCS(r.quantity_in) : "-"}</td>
                  <td className="num text-right text-destructive">
                    {Number(r.quantity_out) ? PCS(r.quantity_out) : "-"}
                  </td>
                  <td className="num text-right font-semibold">{PCS(r.running)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}

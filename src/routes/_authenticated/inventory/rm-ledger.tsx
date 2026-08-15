/* eslint-disable @typescript-eslint/no-explicit-any */
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/components/erp/AppShell";
import { EmptyRow, ExportBar, Panel, SearchSelect, Field } from "@/components/erp/bits";
import { Input } from "@/components/ui/input";
import { useRows } from "@/hooks/use-erp";
import { KG, dmy } from "@/lib/erp";

export const Route = createFileRoute("/_authenticated/inventory/rm-ledger")({
  head: () => ({
    meta: [
      { title: "Raw Material Ledger — JobWork ERP" },
      {
        name: "description",
        content: "Complete raw material movement ledger across warehouse and jobber locations with running balance.",
      },
      { property: "og:title", content: "Raw Material Ledger — JobWork ERP" },
      { property: "og:description", content: "Every inward, transfer, consumption, wastage and return entry." },
    ],
  }),
  component: RmLedger,
});

function RmLedger() {
  const [material, setMaterial] = useState("");
  const [jobber, setJobber] = useState("");
  const [location, setLocation] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const { data: materials } = useRows("raw_materials", ["raw_materials", "all"], (b) => b.order("code"));
  const { data: jobbers } = useRows("jobbers", ["jobbers", "all"], (b) => b.order("code"));
  const { data: rows } = useRows("raw_material_ledger", ["rm_ledger"], (b) =>
    b.order("transaction_date", { ascending: true }).order("created_at", { ascending: true }).limit(5000),
  );

  const filtered = (rows ?? []).filter((r: any) => {
    if (material && r.material_id !== material) return false;
    if (jobber && r.jobber_id !== jobber) return false;
    if (location && r.location_type !== location) return false;
    if (from && r.transaction_date < from) return false;
    if (to && r.transaction_date > to) return false;
    return true;
  });

  const mName = (id: string) => {
    const m = (materials ?? []).find((x: any) => x.id === id);
    return m ? `${m.code} — ${m.name}` : "-";
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
        title="Raw Material Ledger"
        breadcrumb={["Inventory", "Raw Material Ledger"]}
        subtitle="Chronological movement of every raw material. Running balance is shown for the current filter selection."
        actions={
          <ExportBar
            filename="raw-material-ledger"
            rows={withBalance.map((r: any) => ({
              Date: dmy(r.transaction_date),
              Voucher: r.voucher_number,
              Type: r.transaction_type,
              Material: mName(r.material_id),
              Location: r.location_type,
              Jobber: jName(r.jobber_id),
              In: r.quantity_in,
              Out: r.quantity_out,
              "Std. Consumption": r.standard_consumption,
              Wastage: r.wastage_quantity,
              Balance: r.running,
              Remarks: r.remarks,
            }))}
          />
        }
      />
      <Panel>
        <div className="grid gap-3 border-b p-3 sm:grid-cols-2 lg:grid-cols-5">
          <Field label="Material">
            <SearchSelect
              options={[
                { value: "", label: "All materials" },
                ...(materials ?? []).map((m: any) => ({ value: m.id, label: `${m.code} — ${m.name}` })),
              ]}
              value={material}
              onChange={setMaterial}
              placeholder="All materials"
            />
          </Field>
          <Field label="Location">
            <SearchSelect
              options={[
                { value: "", label: "All locations" },
                { value: "WAREHOUSE", label: "Warehouse" },
                { value: "JOBBER", label: "Jobber" },
              ]}
              value={location}
              onChange={setLocation}
              placeholder="All locations"
            />
          </Field>
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
        <div className="overflow-x-auto">
          <table className="erp-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Voucher</th>
                <th>Type</th>
                <th>Material</th>
                <th>Location</th>
                <th>Jobber</th>
                <th className="text-right">In</th>
                <th className="text-right">Out</th>
                <th className="text-right">Wastage</th>
                <th className="text-right">Balance</th>
              </tr>
            </thead>
            <tbody>
              {view.length === 0 && <EmptyRow cols={10} />}
              {view.map((r: any) => (
                <tr key={r.id}>
                  <td className="num whitespace-nowrap">{dmy(r.transaction_date)}</td>
                  <td className="num whitespace-nowrap text-xs">{r.voucher_number ?? "-"}</td>
                  <td className="text-xs font-medium">{r.transaction_type}</td>
                  <td>{mName(r.material_id)}</td>
                  <td className="text-xs">{r.location_type}</td>
                  <td className="text-xs">{jName(r.jobber_id)}</td>
                  <td className="num text-right text-success">{Number(r.quantity_in) ? KG(r.quantity_in) : "-"}</td>
                  <td className="num text-right text-destructive">
                    {Number(r.quantity_out) ? KG(r.quantity_out) : "-"}
                  </td>
                  <td className="num text-right">{Number(r.wastage_quantity) ? KG(r.wastage_quantity) : "-"}</td>
                  <td className="num text-right font-semibold">{KG(r.running)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}

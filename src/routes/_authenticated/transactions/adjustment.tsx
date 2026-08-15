/* eslint-disable @typescript-eslint/no-explicit-any */
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Ban, Plus, Send } from "lucide-react";
import { PageHeader, StatusBadge } from "@/components/erp/AppShell";
import { EmptyRow, ExportBar, Field, NumInput, Panel, SearchSelect } from "@/components/erp/bits";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { canWrite, db, useInvalidate, useRole, useRows } from "@/hooks/use-erp";
import { KG, PCS, dmy, errMsg, nextVoucherNumber, today } from "@/lib/erp";

export const Route = createFileRoute("/_authenticated/transactions/adjustment")({
  head: () => ({
    meta: [
      { title: "Stock Adjustment — JobWork ERP" },
      {
        name: "description",
        content: "Correct raw material or finished goods stock with a reasoned, audited positive or negative adjustment.",
      },
      { property: "og:title", content: "Stock Adjustment — JobWork ERP" },
      { property: "og:description", content: "Audited stock corrections for warehouse, jobber and finished goods." },
    ],
  }),
  component: AdjustmentPage,
});

type Form = {
  voucher_date: string;
  location_type: "WAREHOUSE" | "JOBBER" | "FINISHED_GOODS";
  jobber_id: string;
  material_id: string;
  product_id: string;
  adjustment_type: "POSITIVE" | "NEGATIVE";
  quantity: number;
  reason: string;
  remarks: string;
};

const blank = (): Form => ({
  voucher_date: today(),
  location_type: "WAREHOUSE",
  jobber_id: "",
  material_id: "",
  product_id: "",
  adjustment_type: "POSITIVE",
  quantity: 0,
  reason: "",
  remarks: "",
});

function AdjustmentPage() {
  const { data: role } = useRole();
  const writable = canWrite(role);
  const invalidate = useInvalidate();

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Form>(blank());
  const [busy, setBusy] = useState(false);
  const [cancelId, setCancelId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState("");

  const { data: rows } = useRows("stock_adjustments", ["stock_adjustments"], (b) =>
    b.order("created_at", { ascending: false }).limit(500),
  );
  const { data: materials } = useRows("raw_materials", ["raw_materials", "all"], (b) => b.order("code"));
  const { data: products } = useRows("finished_products", ["finished_products", "all"], (b) => b.order("code"));
  const { data: jobbers } = useRows("jobbers", ["jobbers", "all"], (b) => b.order("code"));

  const set = (patch: Partial<Form>) => setForm((f) => ({ ...f, ...patch }));
  const isFg = form.location_type === "FINISHED_GOODS";

  const label = (list: any[] | undefined, id: string | null) => {
    const r = (list ?? []).find((x: any) => x.id === id);
    return r ? `${r.code} — ${r.name}` : "-";
  };

  const save = async (post: boolean) => {
    if (form.quantity <= 0) {
      toast.error("Quantity must be greater than zero");
      return;
    }
    if (isFg && !form.product_id) {
      toast.error("Select a finished product");
      return;
    }
    if (!isFg && !form.material_id) {
      toast.error("Select a raw material");
      return;
    }
    if (form.location_type === "JOBBER" && !form.jobber_id) {
      toast.error("Select a jobber");
      return;
    }
    if (!form.reason.trim()) {
      toast.error("Reason is mandatory for an adjustment");
      return;
    }

    setBusy(true);
    try {
      const voucher_number = await nextVoucherNumber("ADJ");
      const { data, error } = await db
        .from("stock_adjustments")
        .insert({
          voucher_number,
          voucher_date: form.voucher_date,
          location_type: form.location_type,
          jobber_id: form.location_type === "JOBBER" ? form.jobber_id : null,
          material_id: isFg ? null : form.material_id,
          product_id: isFg ? form.product_id : null,
          adjustment_type: form.adjustment_type,
          quantity: form.quantity,
          reason: form.reason,
          remarks: form.remarks || null,
          status: "DRAFT",
        })
        .select("id")
        .single();
      if (error) throw error;
      if (post) {
        const { error: pErr } = await db.rpc("post_stock_adjustment", { _id: data.id });
        if (pErr) throw pErr;
      }
      toast.success(post ? `Adjustment ${voucher_number} posted` : `Draft ${voucher_number} saved`);
      setOpen(false);
      setForm(blank());
      invalidate();
    } catch (e) {
      toast.error(errMsg(e));
    } finally {
      setBusy(false);
    }
  };

  const post = async (id: string) => {
    const { error } = await db.rpc("post_stock_adjustment", { _id: id });
    if (error) {
      toast.error(errMsg(error));
      return;
    }
    toast.success("Adjustment posted");
    invalidate();
  };

  const cancel = async () => {
    if (!cancelReason.trim()) {
      toast.error("Cancellation reason is required");
      return;
    }
    const { error } = await db.rpc("cancel_voucher", {
      _voucher_type: "ADJUSTMENT",
      _id: cancelId,
      _reason: cancelReason,
    });
    if (error) {
      toast.error(errMsg(error));
      return;
    }
    toast.success("Voucher cancelled and stock reversed");
    setCancelId(null);
    setCancelReason("");
    invalidate();
  };

  const qty = (r: any) =>
    r.location_type === "FINISHED_GOODS" ? `${PCS(r.quantity)} PCS` : `${KG(r.quantity)} KG`;

  return (
    <div>
      <PageHeader
        title="Stock Adjustment"
        breadcrumb={["Transactions", "Stock Adjustment"]}
        subtitle="Use adjustments only for physical verification differences, damages or data corrections. Every entry is audited."
        actions={
          <>
            <ExportBar
              filename="stock-adjustments"
              rows={(rows ?? []).map((r: any) => ({
                Voucher: r.voucher_number,
                Date: dmy(r.voucher_date),
                Location: r.location_type,
                Item:
                  r.location_type === "FINISHED_GOODS"
                    ? label(products, r.product_id)
                    : label(materials, r.material_id),
                Jobber: (jobbers ?? []).find((j: any) => j.id === r.jobber_id)?.name ?? "-",
                Type: r.adjustment_type,
                Quantity: r.quantity,
                Reason: r.reason,
                Status: r.status,
              }))}
            />
            {writable && (
              <Button size="sm" onClick={() => setOpen(true)}>
                <Plus className="size-3.5" /> New Adjustment
              </Button>
            )}
          </>
        }
      />

      <Panel>
        <div className="overflow-x-auto">
          <table className="erp-table">
            <thead>
              <tr>
                <th>Voucher</th>
                <th>Date</th>
                <th>Location</th>
                <th>Item</th>
                <th>Jobber</th>
                <th>Type</th>
                <th className="text-right">Quantity</th>
                <th>Reason</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {(rows ?? []).length === 0 && <EmptyRow cols={10} />}
              {(rows ?? []).map((r: any) => (
                <tr key={r.id}>
                  <td className="num whitespace-nowrap font-medium">{r.voucher_number}</td>
                  <td className="num whitespace-nowrap">{dmy(r.voucher_date)}</td>
                  <td className="text-xs">{r.location_type}</td>
                  <td>
                    {r.location_type === "FINISHED_GOODS"
                      ? label(products, r.product_id)
                      : label(materials, r.material_id)}
                  </td>
                  <td className="text-xs">
                    {(jobbers ?? []).find((j: any) => j.id === r.jobber_id)?.name ?? "-"}
                  </td>
                  <td
                    className={`text-xs font-semibold ${r.adjustment_type === "POSITIVE" ? "text-success" : "text-destructive"}`}
                  >
                    {r.adjustment_type}
                  </td>
                  <td className="num whitespace-nowrap text-right">{qty(r)}</td>
                  <td className="max-w-[16rem] truncate text-xs text-muted-foreground">{r.reason}</td>
                  <td>
                    <StatusBadge status={r.status} />
                  </td>
                  <td className="whitespace-nowrap text-right">
                    {writable && r.status === "DRAFT" && (
                      <Button size="sm" variant="outline" className="h-7" onClick={() => void post(r.id)}>
                        <Send className="size-3" /> Post
                      </Button>
                    )}
                    {writable && r.status === "POSTED" && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 text-destructive"
                        onClick={() => setCancelId(r.id)}
                      >
                        <Ban className="size-3" /> Cancel
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>New Stock Adjustment</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Voucher date">
              <Input
                type="date"
                className="h-9"
                value={form.voucher_date}
                onChange={(e) => set({ voucher_date: e.target.value })}
              />
            </Field>
            <Field label="Location">
              <SearchSelect
                options={[
                  { value: "WAREHOUSE", label: "Warehouse (raw material)" },
                  { value: "JOBBER", label: "Jobber (raw material)" },
                  { value: "FINISHED_GOODS", label: "Finished goods" },
                ]}
                value={form.location_type}
                onChange={(v) => set({ location_type: v as Form["location_type"], material_id: "", product_id: "" })}
              />
            </Field>
            {form.location_type === "JOBBER" && (
              <Field label="Jobber">
                <SearchSelect
                  options={(jobbers ?? []).map((j: any) => ({ value: j.id, label: `${j.code} — ${j.name}` }))}
                  value={form.jobber_id}
                  onChange={(v) => set({ jobber_id: v })}
                />
              </Field>
            )}
            <Field label={isFg ? "Finished product" : "Raw material"}>
              <SearchSelect
                options={(isFg ? products ?? [] : materials ?? []).map((m: any) => ({
                  value: m.id,
                  label: `${m.code} — ${m.name}`,
                }))}
                value={isFg ? form.product_id : form.material_id}
                onChange={(v) => set(isFg ? { product_id: v } : { material_id: v })}
              />
            </Field>
            <Field label="Adjustment type">
              <SearchSelect
                options={[
                  { value: "POSITIVE", label: "Positive (increase stock)" },
                  { value: "NEGATIVE", label: "Negative (decrease stock)" },
                ]}
                value={form.adjustment_type}
                onChange={(v) => set({ adjustment_type: v as Form["adjustment_type"] })}
              />
            </Field>
            <Field label={isFg ? "Quantity (PCS)" : "Quantity (KG)"}>
              <NumInput
                value={form.quantity}
                step={isFg ? "1" : "0.001"}
                onChange={(n) => set({ quantity: n })}
              />
            </Field>
            <div className="sm:col-span-2">
              <Field label="Reason (mandatory)">
                <Textarea
                  rows={2}
                  value={form.reason}
                  onChange={(e) => set({ reason: e.target.value })}
                  placeholder="Physical verification difference, damage, data correction…"
                />
              </Field>
            </div>
            <div className="sm:col-span-2">
              <Field label="Remarks">
                <Input className="h-9" value={form.remarks} onChange={(e) => set({ remarks: e.target.value })} />
              </Field>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" disabled={busy} onClick={() => void save(false)}>
              Save draft
            </Button>
            <Button disabled={busy} onClick={() => void save(true)}>
              <Send className="size-3.5" /> Save &amp; Post
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!cancelId} onOpenChange={(o) => !o && setCancelId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel adjustment</DialogTitle>
          </DialogHeader>
          <Field label="Cancellation reason" hint="Stock impact will be reversed with an audit entry.">
            <Textarea rows={3} value={cancelReason} onChange={(e) => setCancelReason(e.target.value)} />
          </Field>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelId(null)}>
              Keep voucher
            </Button>
            <Button variant="destructive" onClick={() => void cancel()}>
              Cancel voucher
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

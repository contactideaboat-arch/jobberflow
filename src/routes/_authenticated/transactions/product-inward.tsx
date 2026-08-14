/* eslint-disable @typescript-eslint/no-explicit-any */
import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AlertTriangle, Ban, CheckCircle2, Eye, Plus, Printer } from "lucide-react";
import { toast } from "sonner";
import { PageHeader, StatusBadge } from "@/components/erp/AppShell";
import { EmptyRow, ExportBar, Field, NumInput, Panel, SearchSelect } from "@/components/erp/bits";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { canWrite, db, useInvalidate, useRole, useRows } from "@/hooks/use-erp";
import { KG, PCS, PCT, dmy, errMsg, printElement, today } from "@/lib/erp";

export const Route = createFileRoute("/_authenticated/transactions/product-inward")({
  head: () => ({
    meta: [
      { title: "Product Inward from Jobber — JobWork ERP" },
      {
        name: "description",
        content:
          "Receive finished products from jobbers. Standard BOM consumption plus one overall wastage figure per voucher.",
      },
      { property: "og:title", content: "Product Inward from Jobber — JobWork ERP" },
      { property: "og:description", content: "Production inward with BOM consumption and voucher-level wastage." },
    ],
  }),
  component: ProductInward;
});

function ProductInward() {
  const { data: role } = useRole();
  const editable = canWrite(role);
  const invalidate = useInvalidate();

  const [open, setOpen] = useState(false);
  const [viewId, setViewId] = useState<string | null>(null);
  const [cancelId, setCancelId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [busy, setBusy] = useState(false);

  const [date, setDate] = useState(today());
  const [jobberId, setJobberId] = useState("");
  const [productId, setProductId] = useState("");
  const [qty, setQty] = useState(0);
  const [wastage, setWastage] = useState(0);
  const [challan, setChallan] = useState("");
  const [batch, setBatch] = useState("");
  const [prodRef, setProdRef] = useState("");
  const [wastageRemarks, setWastageRemarks] = useState("");
  const [remarks, setRemarks] = useState("");

  const { data: jobbers } = useRows("jobbers", ["jobbers"], (b) => b.eq("status", true).order("code"));
  const { data: products } = useRows("finished_products", ["finished_products"], (b) => b.eq("status", true).order("code"));
  const { data: boms } = useRows(
    "bom_headers",
    ["bom-active"],
    (b) => b.eq("active", true),
    "*, bom_items(*, raw_materials(code, name, uom))",
  );
  const { data: jb } = useRows("jobber_stock", ["jobber_stock"]);
  const { data: settings } = useRows("company_settings", ["company_settings"]);
  const { data: vouchers } = useRows(
    "product_inward_headers",
    ["pi-list"],
    (b) => b.order("voucher_date", { ascending: false }).limit(500),
    "*, jobbers(code, name), finished_products(code, name, uom), product_inward_consumption(*, raw_materials(code, name, uom))",
  );

  const threshold = Number((settings ?? [])[0]?.wastage_warning_threshold ?? 5);
  const bom = useMemo(() => (boms ?? []).find((b: any) => b.product_id === productId), [boms, productId]);
  const jobberOpts = (jobbers ?? []).map((j: any) => ({ value: j.id, label: `${j.code} — ${j.name}` }));
  const productOpts = (products ?? []).map((p: any) => ({ value: p.id, label: `${p.code} — ${p.name}` }));

  const primaryItem = (bom?.bom_items ?? []).find((i: any) => i.is_primary_material);

  const preview = useMemo(() => {
    if (!bom || !qty) return [];
    const base = Number(bom.base_quantity) || 1;
    return (bom.bom_items ?? [])
      .slice()
      .sort((a: any, b: any) => a.sequence - b.sequence)
      .map((i: any) => {
        const std = Math.round(((Number(qty) / base) * Number(i.standard_quantity) + Number.EPSILON) * 1000) / 1000;
        const waste = i.is_primary_material ? Number(wastage) || 0 : 0;
        const avail = Number((jb ?? []).find((s: any) => s.material_id === i.material_id && s.jobber_id === jobberId)?.balance ?? 0);
        return {
          material_id: i.material_id,
          name: `${i.raw_materials?.code} — ${i.raw_materials?.name}`,
          primary: i.is_primary_material,
          std,
          waste,
          total: std + waste,
          avail,
          short: std + waste > avail,
        };
      });
  }, [bom, qty, wastage, jb, jobberId]);

  const totalStd = preview.reduce((s: number, r: any) => s + r.std, 0);
  const wastagePct = totalStd > 0 ? ((Number(wastage) || 0) / totalStd) * 100 : 0;
  const shortages = preview.filter((r: any) => r.short);

  const reset = () => {
    setDate(today());
    setJobberId("");
    setProductId("");
    setQty(0);
    setWastage(0);
    setChallan("");
    setBatch("");
    setProdRef("");
    setWastageRemarks("");
    setRemarks("");
  };

  const save = async (post: boolean) => {
    if (!jobberId) return void toast.error("Select a jobber.");
    if (!productId) return void toast.error("Select a finished product.");
    if (!bom) return void toast.error("No active BOM exists for this product. Create one in BOM Master first.");
    if (!primaryItem) return void toast.error("The active BOM has no primary raw material defined.");
    if (Number(qty) <= 0) return void toast.error("Finished quantity must be greater than zero.");
    if (post && shortages.length)
      return void toast.error(`Insufficient jobber stock for ${shortages.map((s: any) => s.name).join(", ")}.`);

    setBusy(true);
    const { data: num, error: numErr } = await db.rpc("next_voucher_number", { _prefix: "PIN" });
    if (numErr) {
      setBusy(false);
      return void toast.error(errMsg(numErr));
    }
    const { data: created, error } = await db
      .from("product_inward_headers")
      .insert({
        voucher_number: num,
        voucher_date: date,
        jobber_id: jobberId,
        product_id: productId,
        bom_id: bom.id,
        finished_quantity: Number(qty),
        overall_wastage_kg: Number(wastage) || 0,
        jobber_challan_number: challan || null,
        batch_number: batch || null,
        production_reference: prodRef || null,
        wastage_remarks: wastageRemarks || null,
        remarks: remarks || null,
        status: "DRAFT",
      })
      .select("id")
      .single();
    if (error) {
      setBusy(false);
      return void toast.error(errMsg(error));
    }
    if (post) {
      const { error: postErr } = await db.rpc("post_product_inward", { _id: created.id });
      if (postErr) {
        setBusy(false);
        invalidate([["pi-list"]]);
        return void toast.error(errMsg(postErr));
      }
    }
    setBusy(false);
    toast.success(`${num} ${post ? "posted" : "saved as draft"}.`);
    setOpen(false);
    reset();
    invalidate([["pi-list"], ["jobber_stock"], ["finished_goods_stock"], ["warehouse_stock"]]);
  };

  const postExisting = async (id: string) => {
    const { error } = await db.rpc("post_product_inward", { _id: id });
    if (error) return void toast.error(errMsg(error));
    toast.success("Voucher posted.");
    invalidate([["pi-list"], ["jobber_stock"], ["finished_goods_stock"]]);
  };

  const cancelVoucher = async () => {
    if (!cancelId || cancelReason.trim().length < 3) return void toast.error("Enter a cancellation reason.");
    const { error } = await db.rpc("cancel_voucher", {
      _id: cancelId,
      _reason: cancelReason,
      _voucher_type: "PRODUCT_INWARD",
    });
    if (error) return void toast.error(errMsg(error));
    toast.success("Voucher cancelled and stock reversed.");
    setCancelId(null);
    setCancelReason("");
    invalidate([["pi-list"], ["jobber_stock"], ["finished_goods_stock"]]);
  };

  const viewing = useMemo(() => (vouchers ?? []).find((v: any) => v.id === viewId), [vouchers, viewId]);

  return (
    <div>
      <PageHeader
        title="Product Inward from Jobber"
        breadcrumb={["Transactions", "Product Inward"]}
        subtitle="Standard consumption comes from the active BOM. Wastage is entered once per voucher and is deducted from the primary raw material only."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <ExportBar
              filename="product-inward-vouchers"
              rows={(vouchers ?? []).map((v: any) => ({
                Voucher: v.voucher_number,
                Date: dmy(v.voucher_date),
                Jobber: v.jobbers?.name,
                Product: v.finished_products?.name,
                "Finished Qty": v.finished_quantity,
                "Standard Consumption": v.total_standard_consumption,
                "Overall Wastage KG": v.overall_wastage_kg,
                "Actual Consumption": v.actual_total_consumption,
                "Wastage %": v.wastage_percentage,
                Status: v.status,
              }))}
            />
            {editable && (
              <Button
                size="sm"
                onClick={() => {
                  reset();
                  setOpen(true);
                }}
              >
                <Plus className="size-4" /> New Voucher
              </Button>
            )}
          </div>
        }
      />

      <Panel title="Production Register">
        <div className="overflow-x-auto">
          <table className="erp-table">
            <thead>
              <tr>
                <th>Voucher No.</th>
                <th>Date</th>
                <th>Jobber</th>
                <th>Product</th>
                <th className="text-right">Finished Qty</th>
                <th className="text-right">Std Consumption</th>
                <th className="text-right">Wastage KG</th>
                <th className="text-right">Actual</th>
                <th className="text-right">Wastage %</th>
                <th>Status</th>
                <th className="text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {(vouchers ?? []).length === 0 && <EmptyRow cols={11} />}
              {(vouchers ?? []).map((v: any) => (
                <tr key={v.id}>
                  <td className="num font-medium">{v.voucher_number}</td>
                  <td className="num">{dmy(v.voucher_date)}</td>
                  <td>{v.jobbers?.name}</td>
                  <td>{v.finished_products?.name}</td>
                  <td className="num text-right">{PCS(v.finished_quantity)}</td>
                  <td className="num text-right">{KG(v.total_standard_consumption)}</td>
                  <td className="num text-right">{KG(v.overall_wastage_kg)}</td>
                  <td className="num text-right">{KG(v.actual_total_consumption)}</td>
                  <td
                    className={`num text-right font-semibold ${Number(v.wastage_percentage) > threshold ? "text-destructive" : ""}`}
                  >
                    {PCT(v.wastage_percentage)}
                  </td>
                  <td>
                    <StatusBadge status={v.status} />
                  </td>
                  <td className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button size="icon" variant="ghost" onClick={() => setViewId(v.id)}>
                        <Eye className="size-3.5" />
                      </Button>
                      {editable && v.status === "DRAFT" && (
                        <Button size="icon" variant="ghost" title="Post" onClick={() => void postExisting(v.id)}>
                          <CheckCircle2 className="size-3.5 text-success" />
                        </Button>
                      )}
                      {editable && v.status === "POSTED" && (
                        <Button size="icon" variant="ghost" title="Cancel" onClick={() => setCancelId(v.id)}>
                          <Ban className="size-3.5 text-destructive" />
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      {/* Entry */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>New Product Inward</DialogTitle>
          </DialogHeader>

          <div className="grid gap-3 sm:grid-cols-4">
            <Field label="Voucher Date *">
              <Input type="date" className="h-9" value={date} onChange={(e) => setDate(e.target.value)} />
            </Field>
            <div className="sm:col-span-2">
              <Field label="Jobber *">
                <SearchSelect options={jobberOpts} value={jobberId} onChange={setJobberId} />
              </Field>
            </div>
            <Field label="Jobber Challan No.">
              <Input className="h-9" value={challan} onChange={(e) => setChallan(e.target.value)} />
            </Field>
            <div className="sm:col-span-2">
              <Field label="Finished Product *" hint={bom ? `Active BOM: ${bom.bom_number} (${bom.version})` : "No active BOM"}>
                <SearchSelect options={productOpts} value={productId} onChange={setProductId} />
              </Field>
            </div>
            <Field label="Finished Quantity (PCS) *">
              <NumInput value={qty} step="1" onChange={setQty} />
            </Field>
            <Field label="Overall Wastage (KG)" hint={primaryItem ? `Applied to ${primaryItem.raw_materials?.name}` : ""}>
              <NumInput value={wastage} onChange={setWastage} />
            </Field>
            <Field label="Batch No.">
              <Input className="h-9" value={batch} onChange={(e) => setBatch(e.target.value)} />
            </Field>
            <Field label="Production Reference">
              <Input className="h-9" value={prodRef} onChange={(e) => setProdRef(e.target.value)} />
            </Field>
            <div className="sm:col-span-2">
              <Field label="Wastage Remarks">
                <Input className="h-9" value={wastageRemarks} onChange={(e) => setWastageRemarks(e.target.value)} />
              </Field>
            </div>
            <div className="sm:col-span-4">
              <Field label="Remarks">
                <Input className="h-9" value={remarks} onChange={(e) => setRemarks(e.target.value)} />
              </Field>
            </div>
          </div>

          <div className="mt-2 rounded-lg border">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b px-3 py-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Auto-calculated Consumption
              </span>
              <div className="flex flex-wrap items-center gap-3 text-xs">
                <span>
                  Standard: <span className="num font-semibold">{KG(totalStd)}</span> KG
                </span>
                <span>
                  Wastage: <span className="num font-semibold">{KG(wastage)}</span> KG
                </span>
                <span>
                  Actual: <span className="num font-semibold">{KG(totalStd + (Number(wastage) || 0))}</span> KG
                </span>
                <Badge variant={wastagePct > threshold ? "destructive" : "secondary"}>{PCT(wastagePct)} wastage</Badge>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="erp-table">
                <thead>
                  <tr>
                    <th>Material</th>
                    <th>Type</th>
                    <th className="text-right">Standard</th>
                    <th className="text-right">Wastage</th>
                    <th className="text-right">Total Deduction</th>
                    <th className="text-right">Jobber Stock</th>
                    <th className="text-right">Balance After</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.length === 0 && (
                    <EmptyRow cols={7} text="Select a product with an active BOM and enter the finished quantity." />
                  )}
                  {preview.map((r: any) => (
                    <tr key={r.material_id}>
                      <td>{r.name}</td>
                      <td>{r.primary ? <Badge>Primary</Badge> : "Secondary"}</td>
                      <td className="num text-right">{KG(r.std)}</td>
                      <td className="num text-right">{r.waste ? KG(r.waste) : "—"}</td>
                      <td className="num text-right font-semibold">{KG(r.total)}</td>
                      <td className="num text-right">{KG(r.avail)}</td>
                      <td className={`num text-right ${r.short ? "font-semibold text-destructive" : ""}`}>
                        {KG(r.avail - r.total)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {shortages.length > 0 && (
            <div className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/8 p-3 text-sm">
              <AlertTriangle className="mt-0.5 size-4 text-destructive" />
              <div>
                Insufficient jobber stock for {shortages.map((s: any) => s.name).join(", ")}. Transfer more material or
                reduce the finished quantity before posting.
              </div>
            </div>
          )}
          {wastagePct > threshold && (
            <div className="flex items-start gap-2 rounded-md border border-warning/50 bg-warning/12 p-3 text-sm">
              <AlertTriangle className="mt-0.5 size-4 text-warning-foreground" />
              <div>
                Wastage of {PCT(wastagePct)} is above the {threshold}% warning threshold. Add wastage remarks explaining
                the reason.
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button variant="secondary" disabled={busy} onClick={() => void save(false)}>
              Save Draft
            </Button>
            <Button disabled={busy || shortages.length > 0} onClick={() => void save(true)}>
              {busy ? "Posting…" : "Save & Post"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View */}
      <Dialog open={!!viewId} onOpenChange={(v) => !v && setViewId(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              Product Inward · {viewing?.voucher_number}
              <Button
                size="sm"
                variant="outline"
                className="ml-auto"
                onClick={() => printElement("pi-print", `Product Inward ${viewing?.voucher_number}`)}
              >
                <Printer className="size-3.5" /> Print
              </Button>
            </DialogTitle>
          </DialogHeader>
          <div id="pi-print" className="text-sm">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="text-muted-foreground">Date: </span>
                <span className="num">{dmy(viewing?.voucher_date)}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Jobber: </span>
                {viewing?.jobbers?.code} — {viewing?.jobbers?.name}
              </div>
              <div>
                <span className="text-muted-foreground">Product: </span>
                {viewing?.finished_products?.code} — {viewing?.finished_products?.name}
              </div>
              <div>
                <span className="text-muted-foreground">Finished Qty: </span>
                <span className="num">{PCS(viewing?.finished_quantity)}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Overall Wastage: </span>
                <span className="num">{KG(viewing?.overall_wastage_kg)} KG</span>
              </div>
              <div>
                <span className="text-muted-foreground">Wastage %: </span>
                <span className="num">{PCT(viewing?.wastage_percentage)}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Batch: </span>
                {viewing?.batch_number ?? "—"}
              </div>
              <div>
                <span className="text-muted-foreground">Status: </span>
                {viewing?.status}
              </div>
            </div>
            <table className="erp-table mt-3">
              <thead>
                <tr>
                  <th>Material</th>
                  <th className="text-right">Standard</th>
                  <th className="text-right">Wastage</th>
                  <th className="text-right">Total</th>
                  <th className="text-right">Stock Before</th>
                  <th className="text-right">Stock After</th>
                </tr>
              </thead>
              <tbody>
                {(viewing?.product_inward_consumption ?? []).length === 0 && (
                  <EmptyRow cols={6} text="Consumption is calculated when the voucher is posted." />
                )}
                {(viewing?.product_inward_consumption ?? []).map((c: any) => (
                  <tr key={c.id}>
                    <td>
                      {c.raw_materials?.code} — {c.raw_materials?.name}
                    </td>
                    <td className="num text-right">{KG(c.standard_consumption)}</td>
                    <td className="num text-right">{c.wastage_quantity > 0 ? KG(c.wastage_quantity) : "—"}</td>
                    <td className="num text-right font-semibold">
                      {KG(Number(c.standard_consumption) + Number(c.wastage_quantity))}
                    </td>
                    <td className="num text-right">{KG(c.stock_before)}</td>
                    <td className="num text-right">{KG(c.stock_after)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {viewing?.wastage_remarks && (
              <p className="mt-2 text-muted-foreground">Wastage remarks: {viewing.wastage_remarks}</p>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Cancel */}
      <Dialog open={!!cancelId} onOpenChange={(v) => !v && setCancelId(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Cancel Product Inward</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Cancelling reverses the finished goods receipt and restores the consumed raw material to the jobber.
          </p>
          <Field label="Cancellation Reason *">
            <Textarea rows={3} value={cancelReason} onChange={(e) => setCancelReason(e.target.value)} />
          </Field>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelId(null)}>
              Close
            </Button>
            <Button variant="destructive" onClick={() => void cancelVoucher()}>
              Cancel Voucher
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

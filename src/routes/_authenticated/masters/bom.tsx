/* eslint-disable @typescript-eslint/no-explicit-any */
import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Plus, Star, Trash2, Copy, Eye } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/erp/AppShell";
import { EmptyRow, ExportBar, Field, NumInput, Panel, SearchSelect } from "@/components/erp/bits";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { canWrite, db, useInvalidate, useRole, useRows } from "@/hooks/use-erp";
import { KG, dmy, errMsg, today } from "@/lib/erp";

export const Route = createFileRoute("/_authenticated/masters/bom")({
  head: () => ({
    meta: [
      { title: "BOM Master — JobWork ERP" },
      {
        name: "description",
        content: "Define versioned Bills of Materials with standard consumption and the primary raw material.",
      },
      { property: "og:title", content: "BOM Master — JobWork ERP" },
      { property: "og:description", content: "Versioned BOMs with standard consumption per base quantity." },
    ],
  }),
  component: BomMaster,
});

type Line = { material_id: string; standard_quantity: number; uom: string; is_primary_material: boolean };

function BomMaster() {
  const { data: role } = useRole();
  const editable = canWrite(role);
  const invalidate = useInvalidate();
  const [open, setOpen] = useState(false);
  const [viewId, setViewId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [productId, setProductId] = useState("");
  const [version, setVersion] = useState("V1");
  const [baseQty, setBaseQty] = useState(100);
  const [effFrom, setEffFrom] = useState(today());
  const [remarks, setRemarks] = useState("");
  const [lines, setLines] = useState<Line[]>([]);

  const { data: products } = useRows("finished_products", ["finished_products"], (b) => b.eq("status", true).order("code"));
  const { data: materials } = useRows("raw_materials", ["raw_materials"], (b) => b.eq("status", true).order("code"));
  const { data: boms } = useRows(
    "bom_headers",
    ["bom_headers-full"],
    (b) => b.order("created_at", { ascending: false }),
    "*, finished_products(code, name, uom), bom_items(*, raw_materials(code, name, uom))",
  );

  const productOpts = (products ?? []).map((p: any) => ({ value: p.id, label: `${p.code} — ${p.name}` }));
  const materialOpts = (materials ?? []).map((m: any) => ({ value: m.id, label: `${m.code} — ${m.name}`, hint: m.uom }));
  const matName = (id: string) => materialOpts.find((m) => m.value === id)?.label ?? "—";

  const viewing = useMemo(() => (boms ?? []).find((b: any) => b.id === viewId), [boms, viewId]);
  const totalStd = lines.reduce((s, l) => s + Number(l.standard_quantity || 0), 0);

  const resetForm = () => {
    setProductId("");
    setVersion("V1");
    setBaseQty(100);
    setEffFrom(today());
    setRemarks("");
    setLines([]);
  };

  const addLine = () =>
    setLines((l) => [...l, { material_id: "", standard_quantity: 0, uom: "KG", is_primary_material: l.length === 0 }]);
  const setLine = (i: number, patch: Partial<Line>) =>
    setLines((l) => l.map((row, idx) => (idx === i ? { ...row, ...patch } : row)));
  const markPrimary = (i: number) => setLines((l) => l.map((row, idx) => ({ ...row, is_primary_material: idx === i })));

  const cloneBom = (b: any) => {
    setProductId(b.product_id);
    setVersion(`V${(Number(String(b.version).replace(/\D/g, "")) || 1) + 1}`);
    setBaseQty(Number(b.base_quantity));
    setEffFrom(today());
    setRemarks(`Revision of ${b.bom_number}`);
    setLines(
      (b.bom_items ?? []).map((i: any) => ({
        material_id: i.material_id,
        standard_quantity: Number(i.standard_quantity),
        uom: i.uom,
        is_primary_material: i.is_primary_material,
      })),
    );
    setOpen(true);
  };

  const save = async () => {
    if (!productId) return toast.error("Select a finished product.");
    if (!lines.length) return toast.error("Add at least one raw material line.");
    if (lines.some((l) => !l.material_id || Number(l.standard_quantity) <= 0))
      return toast.error("Every line needs a material and a quantity greater than zero.");
    if (new Set(lines.map((l) => l.material_id)).size !== lines.length)
      return toast.error("A material can appear only once in a BOM.");
    if (lines.filter((l) => l.is_primary_material).length !== 1)
      return toast.error("Exactly one line must be marked as the primary material.");

    setBusy(true);
    const { data: num, error: numErr } = await db.rpc("next_voucher_number", { _prefix: "BOM" });
    if (numErr) {
      setBusy(false);
      return toast.error(errMsg(numErr));
    }
    await db.from("bom_headers").update({ active: false, effective_to: effFrom }).eq("product_id", productId).eq("active", true);
    const { data: header, error } = await db
      .from("bom_headers")
      .insert({
        bom_number: num,
        product_id: productId,
        version,
        base_quantity: Number(baseQty) || 1,
        effective_from: effFrom,
        remarks: remarks || null,
        active: true,
      })
      .select("id")
      .single();
    if (error) {
      setBusy(false);
      return toast.error(errMsg(error));
    }
    const { error: itemErr } = await db.from("bom_items").insert(
      lines.map((l, idx) => ({
        bom_id: header.id,
        material_id: l.material_id,
        standard_quantity: Number(l.standard_quantity),
        uom: l.uom || "KG",
        is_primary_material: l.is_primary_material,
        sequence: idx + 1,
      })),
    );
    setBusy(false);
    if (itemErr) return toast.error(errMsg(itemErr));
    toast.success(`BOM ${num} created. Earlier versions for this product were deactivated.`);
    setOpen(false);
    resetForm();
    invalidate([["bom_headers-full"], ["bom_headers"]]);
  };

  const toggleActive = async (b: any) => {
    if (!b.active) {
      await db.from("bom_headers").update({ active: false }).eq("product_id", b.product_id).eq("active", true);
    }
    const { error } = await db.from("bom_headers").update({ active: !b.active }).eq("id", b.id);
    if (error) return toast.error(errMsg(error));
    invalidate([["bom_headers-full"], ["bom_headers"]]);
  };

  return (
    <div>
      <PageHeader
        title="Bill of Materials"
        breadcrumb={["Masters", "BOM Master"]}
        subtitle="Standard consumption per base quantity. The primary material absorbs the voucher-wise overall wastage during production inward."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <ExportBar
              filename="bom-master"
              rows={(boms ?? []).flatMap((b: any) =>
                (b.bom_items ?? []).map((i: any) => ({
                  BOM: b.bom_number,
                  Version: b.version,
                  Product: `${b.finished_products?.code} — ${b.finished_products?.name}`,
                  "Base Qty": b.base_quantity,
                  Material: `${i.raw_materials?.code} — ${i.raw_materials?.name}`,
                  "Std Qty": i.standard_quantity,
                  UOM: i.uom,
                  Primary: i.is_primary_material ? "YES" : "",
                  Active: b.active ? "Active" : "Inactive",
                })),
              )}
            />
            {editable && (
              <Button
                size="sm"
                onClick={() => {
                  resetForm();
                  setOpen(true);
                }}
              >
                <Plus className="size-4" /> New BOM
              </Button>
            )}
          </div>
        }
      />

      <Panel title="BOM List">
        <div className="overflow-x-auto">
          <table className="erp-table">
            <thead>
              <tr>
                <th>BOM No.</th>
                <th>Product</th>
                <th>Version</th>
                <th className="text-right">Base Qty</th>
                <th className="text-right">Lines</th>
                <th>Primary Material</th>
                <th className="text-right">Std KG / Base</th>
                <th>Effective</th>
                <th>Status</th>
                <th className="text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {(boms ?? []).length === 0 && <EmptyRow cols={10} />}
              {(boms ?? []).map((b: any) => {
                const primary = (b.bom_items ?? []).find((i: any) => i.is_primary_material);
                const tot = (b.bom_items ?? []).reduce((s: number, i: any) => s + Number(i.standard_quantity), 0);
                return (
                  <tr key={b.id}>
                    <td className="num font-medium">{b.bom_number}</td>
                    <td>
                      {b.finished_products?.code} — {b.finished_products?.name}
                    </td>
                    <td className="num">{b.version}</td>
                    <td className="num text-right">{b.base_quantity}</td>
                    <td className="num text-right">{(b.bom_items ?? []).length}</td>
                    <td>{primary ? `${primary.raw_materials?.code} — ${primary.raw_materials?.name}` : "—"}</td>
                    <td className="num text-right">{KG(tot)}</td>
                    <td className="num">
                      {dmy(b.effective_from)}
                      {b.effective_to ? ` → ${dmy(b.effective_to)}` : ""}
                    </td>
                    <td>
                      <Badge variant={b.active ? "default" : "secondary"}>{b.active ? "Active" : "Inactive"}</Badge>
                    </td>
                    <td className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button size="icon" variant="ghost" onClick={() => setViewId(b.id)}>
                          <Eye className="size-3.5" />
                        </Button>
                        {editable && (
                          <>
                            <Button size="icon" variant="ghost" title="New revision" onClick={() => cloneBom(b)}>
                              <Copy className="size-3.5" />
                            </Button>
                            <Switch checked={b.active} onCheckedChange={() => void toggleActive(b)} />
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Panel>

      {/* Create BOM */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>New BOM / Revision</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 sm:grid-cols-4">
            <div className="sm:col-span-2">
              <Field label="Finished Product *">
                <SearchSelect options={productOpts} value={productId} onChange={setProductId} />
              </Field>
            </div>
            <Field label="Version">
              <Input value={version} onChange={(e) => setVersion(e.target.value)} />
            </Field>
            <Field label="Base Quantity (PCS) *" hint="Standard quantities are defined for this many pieces.">
              <NumInput value={baseQty} step="1" onChange={setBaseQty} />
            </Field>
            <Field label="Effective From">
              <Input type="date" value={effFrom} onChange={(e) => setEffFrom(e.target.value)} className="h-9" />
            </Field>
            <div className="sm:col-span-3">
              <Field label="Remarks">
                <Input value={remarks} onChange={(e) => setRemarks(e.target.value)} />
              </Field>
            </div>
          </div>

          <div className="mt-2 rounded-lg border">
            <div className="flex items-center justify-between border-b px-3 py-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Material Lines
              </span>
              <Button size="sm" variant="outline" onClick={addLine}>
                <Plus className="size-3.5" /> Add Material
              </Button>
            </div>
            <table className="erp-table">
              <thead>
                <tr>
                  <th className="w-10">#</th>
                  <th>Raw Material</th>
                  <th className="w-32 text-right">Std Qty</th>
                  <th className="w-24">UOM</th>
                  <th className="w-24 text-center">Primary</th>
                  <th className="w-12" />
                </tr>
              </thead>
              <tbody>
                {lines.length === 0 && <EmptyRow cols={6} text="Add the raw materials consumed per base quantity." />}
                {lines.map((l, i) => (
                  <tr key={i}>
                    <td className="num">{i + 1}</td>
                    <td>
                      <SearchSelect
                        options={materialOpts}
                        value={l.material_id}
                        onChange={(v) => setLine(i, { material_id: v, uom: materialOpts.find((m) => m.value === v)?.hint ?? "KG" })}
                      />
                    </td>
                    <td>
                      <NumInput value={l.standard_quantity} onChange={(n) => setLine(i, { standard_quantity: n })} />
                    </td>
                    <td className="num">{l.uom}</td>
                    <td className="text-center">
                      <Button
                        size="icon"
                        variant={l.is_primary_material ? "default" : "ghost"}
                        onClick={() => markPrimary(i)}
                        title="Mark as primary material"
                      >
                        <Star className="size-3.5" />
                      </Button>
                    </td>
                    <td>
                      <Button size="icon" variant="ghost" onClick={() => setLines((rows) => rows.filter((_, x) => x !== i))}>
                        <Trash2 className="size-3.5 text-destructive" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={2} className="text-right font-semibold">
                    Total standard consumption
                  </td>
                  <td className="num text-right font-semibold">{KG(totalStd)}</td>
                  <td colSpan={3} />
                </tr>
              </tfoot>
            </table>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button disabled={busy} onClick={() => void save()}>
              {busy ? "Saving…" : "Save BOM"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View BOM */}
      <Dialog open={!!viewId} onOpenChange={(v) => !v && setViewId(null)}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>
              {viewing?.bom_number} · {viewing?.finished_products?.name} · {viewing?.version}
            </DialogTitle>
          </DialogHeader>
          <p className="text-xs text-muted-foreground">
            Standard consumption for {viewing?.base_quantity} {viewing?.finished_products?.uom}.
          </p>
          <table className="erp-table">
            <thead>
              <tr>
                <th>Material</th>
                <th className="text-right">Std Qty</th>
                <th>UOM</th>
                <th>Type</th>
              </tr>
            </thead>
            <tbody>
              {(viewing?.bom_items ?? []).map((i: any) => (
                <tr key={i.id}>
                  <td>{matName(i.material_id)}</td>
                  <td className="num text-right">{KG(i.standard_quantity)}</td>
                  <td>{i.uom}</td>
                  <td>{i.is_primary_material ? <Badge>Primary</Badge> : "Secondary"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </DialogContent>
      </Dialog>
    </div>
  );
}

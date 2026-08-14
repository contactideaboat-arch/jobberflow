/* eslint-disable @typescript-eslint/no-explicit-any */
import { useMemo, useState } from "react";
import { Ban, CheckCircle2, Eye, Plus, Printer, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { PageHeader, StatusBadge } from "@/components/erp/AppShell";
import { EmptyRow, ExportBar, Field, NumInput, Panel, SearchSelect } from "@/components/erp/bits";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { canWrite, db, useInvalidate, useRole, useRows } from "@/hooks/use-erp";
import { KG, dmy, errMsg, printElement, today } from "@/lib/erp";

export type ExtraField = { key: string; label: string; type?: "text" | "date" | "select"; options?: string[]; hint?: string };

export type ItemVoucherConfig = {
  kind: string;
  title: string;
  breadcrumb: string[];
  subtitle: string;
  prefix: string;
  headerTable: string;
  itemTable: string;
  postRpc: string;
  needsJobber: boolean;
  /** where the stock is deducted from — used to show live availability */
  stockScope: "WAREHOUSE" | "JOBBER" | "NONE";
  extraFields: ExtraField[];
  itemLabel?: string;
};

type Line = { material_id: string; quantity: number; remarks: string };

export function ItemVoucher({ config }: { config: ItemVoucherConfig }) {
  const { data: role } = useRole();
  const editable = canWrite(role);
  const invalidate = useInvalidate();

  const [open, setOpen] = useState(false);
  const [viewId, setViewId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [date, setDate] = useState(today());
  const [jobberId, setJobberId] = useState("");
  const [extras, setExtras] = useState<Record<string, string>>({});
  const [remarks, setRemarks] = useState("");
  const [lines, setLines] = useState<Line[]>([]);
  const [cancelId, setCancelId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState("");

  const { data: materials } = useRows("raw_materials", ["raw_materials"], (b) => b.eq("status", true).order("code"));
  const { data: jobbers } = useRows("jobbers", ["jobbers"], (b) => b.eq("status", true).order("code"));
  const { data: wh } = useRows("warehouse_stock", ["warehouse_stock"]);
  const { data: jb } = useRows("jobber_stock", ["jobber_stock"]);
  const listKey = [`${config.kind}-list`];
  const { data: vouchers } = useRows(
    config.headerTable,
    listKey,
    (b) => b.order("voucher_date", { ascending: false }).order("voucher_number", { ascending: false }).limit(500),
    `*, ${config.needsJobber ? "jobbers(code, name)," : ""} ${config.itemTable}(*, raw_materials(code, name, uom))`,
  );

  const materialOpts = (materials ?? []).map((m: any) => ({ value: m.id, label: `${m.code} — ${m.name}`, hint: m.uom }));
  const jobberOpts = (jobbers ?? []).map((j: any) => ({ value: j.id, label: `${j.code} — ${j.name}` }));

  const available = (materialId: string) => {
    if (config.stockScope === "WAREHOUSE") return Number((wh ?? []).find((r: any) => r.material_id === materialId)?.balance ?? 0);
    if (config.stockScope === "JOBBER")
      return Number(
        (jb ?? []).find((r: any) => r.material_id === materialId && r.jobber_id === jobberId)?.balance ?? 0,
      );
    return 0;
  };

  const viewing = useMemo(() => (vouchers ?? []).find((v: any) => v.id === viewId), [vouchers, viewId]);
  const totalQty = lines.reduce((s, l) => s + Number(l.quantity || 0), 0);

  const reset = () => {
    setDate(today());
    setJobberId("");
    setExtras({});
    setRemarks("");
    setLines([]);
  };

  const save = async (post: boolean) => {
    if (config.needsJobber && !jobberId) {
      toast.error("Select a jobber.");
      return;
    }
    if (!lines.length) {
      toast.error("Add at least one material line.");
      return;
    }
    if (lines.some((l) => !l.material_id || Number(l.quantity) <= 0)) {
      toast.error("Every line needs a material and a quantity greater than zero.");
      return;
    }
    if (new Set(lines.map((l) => l.material_id)).size !== lines.length) {
      toast.error("A material can appear only once in a voucher.");
      return;
    }
    if (config.stockScope !== "NONE") {
      const short = lines.find((l) => Number(l.quantity) > available(l.material_id));
      if (short) {
        toast.error(
          `Insufficient stock for ${materialOpts.find((m) => m.value === short.material_id)?.label}. Available ${KG(available(short.material_id))} KG.`,
        );
        return;
      }
    }

    setBusy(true);
    const { data: num, error: numErr } = await db.rpc("next_voucher_number", { _prefix: config.prefix });
    if (numErr) {
      setBusy(false);
      toast.error(errMsg(numErr));
      return;
    }
    const header: any = { voucher_number: num, voucher_date: date, remarks: remarks || null, status: "DRAFT" };
    if (config.needsJobber) header.jobber_id = jobberId;
    config.extraFields.forEach((f) => {
      header[f.key] = extras[f.key] || (f.type === "select" ? f.options?.[0] : null);
    });
    const { data: created, error } = await db.from(config.headerTable).insert(header).select("id").single();
    if (error) {
      setBusy(false);
      toast.error(errMsg(error));
      return;
    }
    const { error: itemErr } = await db.from(config.itemTable).insert(
      lines.map((l) => ({
        header_id: created.id,
        material_id: l.material_id,
        quantity: Number(l.quantity),
        remarks: l.remarks || null,
      })),
    );
    if (itemErr) {
      setBusy(false);
      toast.error(errMsg(itemErr));
      return;
    }
    if (post) {
      const { error: postErr } = await db.rpc(config.postRpc, { _id: created.id });
      if (postErr) {
        setBusy(false);
        toast.error(errMsg(postErr));
        invalidate([listKey]);
        return;
      }
    }
    setBusy(false);
    toast.success(`${num} ${post ? "posted" : "saved as draft"}.`);
    setOpen(false);
    reset();
    invalidate([listKey, ["warehouse_stock"], ["jobber_stock"], ["rm-ledger"]]);
  };

  const postExisting = async (id: string) => {
    const { error } = await db.rpc(config.postRpc, { _id: id });
    if (error) {
      toast.error(errMsg(error));
      return;
    }
    toast.success("Voucher posted.");
    invalidate([listKey, ["warehouse_stock"], ["jobber_stock"], ["rm-ledger"]]);
  };

  const cancelVoucher = async () => {
    if (!cancelId || cancelReason.trim().length < 3) {
      toast.error("Enter a cancellation reason.");
      return;
    }
    const { error } = await db.rpc("cancel_voucher", { _id: cancelId, _reason: cancelReason, _voucher_type: config.kind });
    if (error) {
      toast.error(errMsg(error));
      return;
    }
    toast.success("Voucher cancelled and stock reversed.");
    setCancelId(null);
    setCancelReason("");
    invalidate([listKey, ["warehouse_stock"], ["jobber_stock"], ["rm-ledger"]]);
  };

  const rowsFor = (v: any) => v?.[config.itemTable] ?? [];

  return (
    <div>
      <PageHeader
        title={config.title}
        breadcrumb={config.breadcrumb}
        subtitle={config.subtitle}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <ExportBar
              filename={config.prefix.toLowerCase() + "-vouchers"}
              rows={(vouchers ?? []).flatMap((v: any) =>
                rowsFor(v).map((i: any) => ({
                  Voucher: v.voucher_number,
                  Date: dmy(v.voucher_date),
                  ...(config.needsJobber ? { Jobber: `${v.jobbers?.code} — ${v.jobbers?.name}` } : {}),
                  Material: `${i.raw_materials?.code} — ${i.raw_materials?.name}`,
                  Quantity: i.quantity,
                  UOM: i.raw_materials?.uom,
                  Status: v.status,
                })),
              )}
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

      <Panel title="Voucher Register">
        <div className="overflow-x-auto">
          <table className="erp-table">
            <thead>
              <tr>
                <th>Voucher No.</th>
                <th>Date</th>
                {config.needsJobber && <th>Jobber</th>}
                {config.extraFields.slice(0, 2).map((f) => (
                  <th key={f.key}>{f.label}</th>
                ))}
                <th className="text-right">Items</th>
                <th className="text-right">Total KG</th>
                <th>Status</th>
                <th className="text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {(vouchers ?? []).length === 0 && <EmptyRow cols={8} />}
              {(vouchers ?? []).map((v: any) => {
                const items = rowsFor(v);
                const tot = items.reduce((s: number, i: any) => s + Number(i.quantity), 0);
                return (
                  <tr key={v.id}>
                    <td className="num font-medium">{v.voucher_number}</td>
                    <td className="num">{dmy(v.voucher_date)}</td>
                    {config.needsJobber && <td>{v.jobbers?.name ?? "—"}</td>}
                    {config.extraFields.slice(0, 2).map((f) => (
                      <td key={f.key}>{v[f.key] ?? "—"}</td>
                    ))}
                    <td className="num text-right">{items.length}</td>
                    <td className="num text-right font-semibold">{KG(tot)}</td>
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
                );
              })}
            </tbody>
          </table>
        </div>
      </Panel>

      {/* Entry dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>New {config.title}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 sm:grid-cols-4">
            <Field label="Voucher Date *">
              <Input type="date" className="h-9" value={date} onChange={(e) => setDate(e.target.value)} />
            </Field>
            {config.needsJobber && (
              <div className="sm:col-span-2">
                <Field label="Jobber *">
                  <SearchSelect options={jobberOpts} value={jobberId} onChange={setJobberId} />
                </Field>
              </div>
            )}
            {config.extraFields.map((f) => (
              <Field key={f.key} label={f.label} hint={f.hint}>
                {f.type === "select" ? (
                  <SearchSelect
                    options={(f.options ?? []).map((o) => ({ value: o, label: o }))}
                    value={extras[f.key] ?? f.options?.[0]}
                    onChange={(v) => setExtras((e) => ({ ...e, [f.key]: v }))}
                  />
                ) : (
                  <Input
                    type={f.type === "date" ? "date" : "text"}
                    className="h-9"
                    value={extras[f.key] ?? ""}
                    onChange={(e) => setExtras((x) => ({ ...x, [f.key]: e.target.value }))}
                  />
                )}
              </Field>
            ))}
            <div className="sm:col-span-4">
              <Field label="Remarks">
                <Input value={remarks} onChange={(e) => setRemarks(e.target.value)} />
              </Field>
            </div>
          </div>

          <div className="mt-2 rounded-lg border">
            <div className="flex items-center justify-between border-b px-3 py-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                {config.itemLabel ?? "Material Lines"}
              </span>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setLines((l) => [...l, { material_id: "", quantity: 0, remarks: "" }])}
              >
                <Plus className="size-3.5" /> Add Material
              </Button>
            </div>
            <div className="overflow-x-auto">
              <table className="erp-table">
                <thead>
                  <tr>
                    <th className="w-10">#</th>
                    <th>Raw Material</th>
                    {config.stockScope !== "NONE" && <th className="w-28 text-right">Available</th>}
                    <th className="w-32 text-right">Quantity</th>
                    <th>Line Remarks</th>
                    <th className="w-12" />
                  </tr>
                </thead>
                <tbody>
                  {lines.length === 0 && <EmptyRow cols={6} text="Add material lines to this voucher." />}
                  {lines.map((l, i) => {
                    const avail = available(l.material_id);
                    const over = config.stockScope !== "NONE" && Number(l.quantity) > avail;
                    return (
                      <tr key={i}>
                        <td className="num">{i + 1}</td>
                        <td>
                          <SearchSelect
                            options={materialOpts}
                            value={l.material_id}
                            onChange={(v) => setLines((rs) => rs.map((r, x) => (x === i ? { ...r, material_id: v } : r)))}
                          />
                        </td>
                        {config.stockScope !== "NONE" && (
                          <td className="num text-right text-muted-foreground">{l.material_id ? KG(avail) : "—"}</td>
                        )}
                        <td>
                          <NumInput
                            value={l.quantity}
                            onChange={(n) => setLines((rs) => rs.map((r, x) => (x === i ? { ...r, quantity: n } : r)))}
                            className={over ? "border-destructive text-destructive" : ""}
                          />
                        </td>
                        <td>
                          <Input
                            className="h-9"
                            value={l.remarks}
                            onChange={(e) =>
                              setLines((rs) => rs.map((r, x) => (x === i ? { ...r, remarks: e.target.value } : r)))
                            }
                          />
                        </td>
                        <td>
                          <Button size="icon" variant="ghost" onClick={() => setLines((rs) => rs.filter((_, x) => x !== i))}>
                            <Trash2 className="size-3.5 text-destructive" />
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan={config.stockScope !== "NONE" ? 3 : 2} className="text-right font-semibold">
                      Total Quantity
                    </td>
                    <td className="num text-right font-semibold">{KG(totalQty)}</td>
                    <td colSpan={2} />
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button variant="secondary" disabled={busy} onClick={() => void save(false)}>
              Save Draft
            </Button>
            <Button disabled={busy} onClick={() => void save(true)}>
              {busy ? "Posting…" : "Save & Post"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View / print */}
      <Dialog open={!!viewId} onOpenChange={(v) => !v && setViewId(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {config.title} · {viewing?.voucher_number}
              <Button
                size="sm"
                variant="outline"
                className="ml-auto"
                onClick={() => printElement("voucher-print", `${config.title} ${viewing?.voucher_number}`)}
              >
                <Printer className="size-3.5" /> Print
              </Button>
            </DialogTitle>
          </DialogHeader>
          <div id="voucher-print">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-muted-foreground">Voucher No: </span>
                <span className="num font-medium">{viewing?.voucher_number}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Date: </span>
                <span className="num font-medium">{dmy(viewing?.voucher_date)}</span>
              </div>
              {config.needsJobber && (
                <div className="col-span-2">
                  <span className="text-muted-foreground">Jobber: </span>
                  <span className="font-medium">
                    {viewing?.jobbers?.code} — {viewing?.jobbers?.name}
                  </span>
                </div>
              )}
              {config.extraFields.map((f) => (
                <div key={f.key}>
                  <span className="text-muted-foreground">{f.label}: </span>
                  <span className="font-medium">{viewing?.[f.key] ?? "—"}</span>
                </div>
              ))}
              <div className="col-span-2">
                <span className="text-muted-foreground">Status: </span>
                <span className="font-medium">{viewing?.status}</span>
                {viewing?.cancellation_reason ? ` — ${viewing.cancellation_reason}` : ""}
              </div>
            </div>
            <table className="erp-table mt-3">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Material</th>
                  <th className="text-right">Quantity</th>
                  <th>UOM</th>
                  <th>Remarks</th>
                </tr>
              </thead>
              <tbody>
                {rowsFor(viewing).map((i: any, idx: number) => (
                  <tr key={i.id}>
                    <td className="num">{idx + 1}</td>
                    <td>
                      {i.raw_materials?.code} — {i.raw_materials?.name}
                    </td>
                    <td className="num text-right">{KG(i.quantity)}</td>
                    <td>{i.raw_materials?.uom}</td>
                    <td>{i.remarks ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={2} className="text-right font-semibold">
                    Total
                  </td>
                  <td className="num text-right font-semibold">
                    {KG(rowsFor(viewing).reduce((s: number, i: any) => s + Number(i.quantity), 0))}
                  </td>
                  <td colSpan={2} />
                </tr>
              </tfoot>
            </table>
            {viewing?.remarks && <p className="mt-2 text-sm text-muted-foreground">Remarks: {viewing.remarks}</p>}
          </div>
        </DialogContent>
      </Dialog>

      {/* Cancel dialog */}
      <Dialog open={!!cancelId} onOpenChange={(v) => !v && setCancelId(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Cancel Voucher</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Cancelling reverses every stock movement created by this voucher. The voucher is retained for audit.
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

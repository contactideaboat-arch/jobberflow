/* eslint-disable @typescript-eslint/no-explicit-any */
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Pencil, Plus, Search } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/erp/AppShell";
import { EmptyRow, ExportBar, Field, NumInput, Panel, SearchSelect } from "@/components/erp/bits";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { canWrite, db, useInvalidate, useRole, useRows } from "@/hooks/use-erp";
import { KG, MATERIAL_CATEGORIES, errMsg } from "@/lib/erp";

export const Route = createFileRoute("/_authenticated/masters/materials")({
  head: () => ({
    meta: [
      { title: "Raw Material Master — JobWork ERP" },
      { name: "description", content: "Maintain plastic raw materials, categories, UOM and minimum stock levels." },
      { property: "og:title", content: "Raw Material Master — JobWork ERP" },
      { property: "og:description", content: "Raw material codes, categories and reorder levels." },
    ],
  }),
  component: MaterialMaster;
});

const BLANK = { code: "", name: "", category: "GRANULES", uom: "KG", minimum_stock: 0, description: "", status: true };

function MaterialMaster() {
  const { data: role } = useRole();
  const editable = canWrite(role);
  const invalidate = useInvalidate();
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("ALL");
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<any>(BLANK);
  const [busy, setBusy] = useState(false);

  const { data: rows } = useRows("raw_materials", ["raw_materials"], (b) => b.order("code"));
  const { data: stock } = useRows("warehouse_stock", ["warehouse_stock"]);
  const balanceOf = (id: string) => Number((stock ?? []).find((s: any) => s.material_id === id)?.balance ?? 0);

  const filtered = (rows ?? [])
    .filter((r: any) => cat === "ALL" || r.category === cat)
    .filter((r: any) => [r.code, r.name, r.category].join(" ").toLowerCase().includes(q.toLowerCase()));

  const set = (k: string, v: unknown) => setForm((f: any) => ({ ...f, [k]: v }));

  const save = async () => {
    if (!form.code.trim() || !form.name.trim()) {
      toast.error("Material code and name are required.");
      return;
    }
    setBusy(true);
    const payload: any = {
      code: String(form.code).trim().toUpperCase(),
      name: String(form.name).trim(),
      category: form.category,
      uom: form.uom || "KG",
      minimum_stock: Number(form.minimum_stock) || 0,
      description: form.description || null,
      status: !!form.status,
    };
    const res = editId
      ? await db.from("raw_materials").update(payload).eq("id", editId)
      : await db.from("raw_materials").insert(payload);
    setBusy(false);
    if (res.error) {
      toast.error(errMsg(res.error));
      return;
    }
    toast.success(editId ? "Material updated." : "Material created.");
    setOpen(false);
    invalidate([["raw_materials"], ["warehouse_stock"]]);
  };

  return (
    <div>
      <PageHeader
        title="Raw Material Master"
        breadcrumb={["Masters", "Raw Material Master"]}
        subtitle="Granules, master batch, additives and packing material used in production."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <ExportBar
              filename="raw-material-master"
              rows={filtered.map((r: any) => ({
                Code: r.code,
                Name: r.name,
                Category: r.category,
                UOM: r.uom,
                "Minimum Stock": r.minimum_stock,
                "Current Balance": balanceOf(r.id),
                Status: r.status ? "Active" : "Inactive",
              }))}
            />
            {editable && (
              <Button
                size="sm"
                onClick={() => {
                  setEditId(null);
                  setForm(BLANK);
                  setOpen(true);
                }}
              >
                <Plus className="size-4" /> New Material
              </Button>
            )}
          </div>
        }
      />

      <Panel>
        <div className="flex flex-wrap items-center gap-2 border-b p-3">
          <Search className="size-4 text-muted-foreground" />
          <Input
            className="h-9 max-w-xs"
            placeholder="Search code or name…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <div className="w-56">
            <SearchSelect
              options={[{ value: "ALL", label: "All categories" }, ...MATERIAL_CATEGORIES.map((c) => ({ value: c, label: c }))]}
              value={cat}
              onChange={setCat}
            />
          </div>
          <span className="ml-auto text-xs text-muted-foreground">{filtered.length} records</span>
        </div>
        <div className="overflow-x-auto">
          <table className="erp-table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Material Name</th>
                <th>Category</th>
                <th>UOM</th>
                <th className="text-right">Minimum</th>
                <th className="text-right">Balance</th>
                <th>Status</th>
                <th className="text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && <EmptyRow cols={8} />}
              {filtered.map((r: any) => {
                const bal = balanceOf(r.id);
                return (
                  <tr key={r.id}>
                    <td className="num font-medium">{r.code}</td>
                    <td>{r.name}</td>
                    <td>{r.category}</td>
                    <td>{r.uom}</td>
                    <td className="num text-right">{KG(r.minimum_stock)}</td>
                    <td
                      className={`num text-right font-semibold ${bal < Number(r.minimum_stock) ? "text-destructive" : ""}`}
                    >
                      {KG(bal)}
                    </td>
                    <td>
                      <Badge variant={r.status ? "default" : "secondary"}>{r.status ? "Active" : "Inactive"}</Badge>
                    </td>
                    <td className="text-right">
                      {editable && (
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => {
                            setEditId(r.id);
                            setForm({ ...BLANK, ...r });
                            setOpen(true);
                          }}
                        >
                          <Pencil className="size-3.5" />
                        </Button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Panel>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editId ? "Edit Raw Material" : "New Raw Material"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Material Code *">
              <Input value={form.code ?? ""} onChange={(e) => set("code", e.target.value)} placeholder="RM001" />
            </Field>
            <Field label="Material Name *">
              <Input value={form.name ?? ""} onChange={(e) => set("name", e.target.value)} />
            </Field>
            <Field label="Category">
              <SearchSelect
                options={MATERIAL_CATEGORIES.map((c) => ({ value: c, label: c }))}
                value={form.category}
                onChange={(v) => set("category", v)}
              />
            </Field>
            <Field label="UOM">
              <SearchSelect
                options={[
                  { value: "KG", label: "KG" },
                  { value: "GM", label: "GM" },
                  { value: "PCS", label: "PCS" },
                ]}
                value={form.uom}
                onChange={(v) => set("uom", v)}
              />
            </Field>
            <Field label="Minimum Stock Level" hint="Used for low-stock alerts on the dashboard.">
              <NumInput value={form.minimum_stock} onChange={(n) => set("minimum_stock", n)} />
            </Field>
            <div className="flex items-end gap-2 pb-1">
              <Switch checked={!!form.status} onCheckedChange={(v) => set("status", v)} />
              <span className="text-sm">Active</span>
            </div>
            <div className="sm:col-span-2">
              <Field label="Description">
                <Textarea rows={2} value={form.description ?? ""} onChange={(e) => set("description", e.target.value)} />
              </Field>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button disabled={busy} onClick={() => void save()}>
              {busy ? "Saving…" : "Save Material"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

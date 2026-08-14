/* eslint-disable @typescript-eslint/no-explicit-any */
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Pencil, Plus, Search } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/erp/AppShell";
import { EmptyRow, ExportBar, Field, Panel, SearchSelect } from "@/components/erp/bits";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { canWrite, db, useInvalidate, useRole, useRows } from "@/hooks/use-erp";
import { PCS, errMsg } from "@/lib/erp";

export const Route = createFileRoute("/_authenticated/masters/products")({
  head: () => ({
    meta: [
      { title: "Finished Product Master — JobWork ERP" },
      { name: "description", content: "Maintain plastic household finished products, codes and units of measure." },
      { property: "og:title", content: "Finished Product Master — JobWork ERP" },
      { property: "og:description", content: "Finished product codes, categories and live stock balances." },
    ],
  }),
  component: ProductMaster,
});

const CATEGORIES = ["BUCKET", "MUG", "TUB", "CHAIR", "STOOL", "STORAGE", "CRATE", "OTHER"];
const BLANK = { code: "", name: "", category: "BUCKET", uom: "PCS", description: "", status: true };

function ProductMaster() {
  const { data: role } = useRole();
  const editable = canWrite(role);
  const invalidate = useInvalidate();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<any>(BLANK);
  const [busy, setBusy] = useState(false);

  const { data: rows } = useRows("finished_products", ["finished_products"], (b) => b.order("code"));
  const { data: stock } = useRows("finished_goods_stock", ["finished_goods_stock"]);
  const { data: boms } = useRows("bom_headers", ["bom_headers"], (b) => b.eq("active", true));

  const balanceOf = (id: string) => Number((stock ?? []).find((s: any) => s.product_id === id)?.balance ?? 0);
  const hasBom = (id: string) => (boms ?? []).some((b: any) => b.product_id === id);

  const filtered = (rows ?? []).filter((r: any) =>
    [r.code, r.name, r.category].join(" ").toLowerCase().includes(q.toLowerCase()),
  );

  const set = (k: string, v: unknown) => setForm((f: any) => ({ ...f, [k]: v }));

  const save = async () => {
    if (!form.code.trim() || !form.name.trim()) {
      toast.error("Product code and name are required.");
      return;
    }
    setBusy(true);
    const payload: any = {
      code: String(form.code).trim().toUpperCase(),
      name: String(form.name).trim(),
      category: form.category,
      uom: form.uom || "PCS",
      description: form.description || null,
      status: !!form.status,
    };
    const res = editId
      ? await db.from("finished_products").update(payload).eq("id", editId)
      : await db.from("finished_products").insert(payload);
    setBusy(false);
    if (res.error) {
      toast.error(errMsg(res.error));
      return;
    }
    toast.success(editId ? "Product updated." : "Product created.");
    setOpen(false);
    invalidate([["finished_products"]]);
  };

  return (
    <div>
      <PageHeader
        title="Finished Product Master"
        breadcrumb={["Masters", "Finished Product Master"]}
        subtitle="Products manufactured by jobbers and received into the finished goods store."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <ExportBar
              filename="finished-product-master"
              rows={filtered.map((r: any) => ({
                Code: r.code,
                Name: r.name,
                Category: r.category,
                UOM: r.uom,
                "BOM Defined": hasBom(r.id) ? "Yes" : "No",
                Balance: balanceOf(r.id),
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
                <Plus className="size-4" /> New Product
              </Button>
            )}
          </div>
        }
      />

      <Panel>
        <div className="flex items-center gap-2 border-b p-3">
          <Search className="size-4 text-muted-foreground" />
          <Input
            className="h-9 max-w-sm"
            placeholder="Search code, name or category…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <span className="ml-auto text-xs text-muted-foreground">{filtered.length} records</span>
        </div>
        <div className="overflow-x-auto">
          <table className="erp-table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Product Name</th>
                <th>Category</th>
                <th>UOM</th>
                <th>BOM</th>
                <th className="text-right">FG Balance</th>
                <th>Status</th>
                <th className="text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && <EmptyRow cols={8} />}
              {filtered.map((r: any) => (
                <tr key={r.id}>
                  <td className="num font-medium">{r.code}</td>
                  <td>{r.name}</td>
                  <td>{r.category ?? "—"}</td>
                  <td>{r.uom}</td>
                  <td>
                    <Badge variant={hasBom(r.id) ? "default" : "destructive"}>{hasBom(r.id) ? "Active BOM" : "No BOM"}</Badge>
                  </td>
                  <td className="num text-right font-semibold">{PCS(balanceOf(r.id))}</td>
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
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editId ? "Edit Finished Product" : "New Finished Product"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Product Code *">
              <Input value={form.code ?? ""} onChange={(e) => set("code", e.target.value)} placeholder="FP001" />
            </Field>
            <Field label="Product Name *">
              <Input value={form.name ?? ""} onChange={(e) => set("name", e.target.value)} />
            </Field>
            <Field label="Category">
              <SearchSelect
                options={CATEGORIES.map((c) => ({ value: c, label: c }))}
                value={form.category}
                onChange={(v) => set("category", v)}
              />
            </Field>
            <Field label="UOM">
              <SearchSelect
                options={[
                  { value: "PCS", label: "PCS" },
                  { value: "SET", label: "SET" },
                  { value: "KG", label: "KG" },
                ]}
                value={form.uom}
                onChange={(v) => set("uom", v)}
              />
            </Field>
            <div className="sm:col-span-2">
              <Field label="Description">
                <Textarea rows={2} value={form.description ?? ""} onChange={(e) => set("description", e.target.value)} />
              </Field>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={!!form.status} onCheckedChange={(v) => set("status", v)} />
              <span className="text-sm">Active</span>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button disabled={busy} onClick={() => void save()}>
              {busy ? "Saving…" : "Save Product"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

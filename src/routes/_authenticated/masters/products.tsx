/* eslint-disable @typescript-eslint/no-explicit-any */
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { IconPencil, IconPlus } from "@/components/icons";
import { PageHeader } from "@/components/erp/AppShell";
import {
  ExportBar,
  Field,
  FormSection,
  Panel,
  RegisterState,
  SearchSelect,
  queryStatus,
  useGuardedClose,
} from "@/components/erp/bits";
import {
  FilterSelect,
  GridPager,
  GridScroll,
  GridToolbar,
  NIL,
  SortHeader,
  useGrid,
} from "@/components/erp/grid";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { canWrite, db, useInvalidate, useRole, useRows } from "@/hooks/use-erp";
import { PCS, errMsg } from "@/lib/erp";

export const Route = createFileRoute("/_authenticated/masters/products")({
  head: () => ({
    meta: [
      { title: "Finished products | JobberFlow" },
      {
        name: "description",
        content: "Products your jobbers make, with their bill of material and stock.",
      },
    ],
  }),
  component: ProductMaster,
});

const CATEGORIES = ["BUCKET", "MUG", "TUB", "CHAIR", "STOOL", "STORAGE", "CRATE", "OTHER"];
const UOMS = ["PCS", "SET", "KG"];
const BLANK = { code: "", name: "", category: "BUCKET", uom: "PCS", description: "", status: true };

type Errors = { code?: string; name?: string };

function ProductMaster() {
  const { data: role } = useRole();
  const editable = canWrite(role);
  const invalidate = useInvalidate();
  const [category, setCategory] = useState("");
  const [bomFilter, setBomFilter] = useState("");
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<any>(BLANK);
  const [initialForm, setInitialForm] = useState<any>(BLANK);
  const [errors, setErrors] = useState<Errors>({});
  const [busy, setBusy] = useState(false);

  const query = useRows("finished_products", ["finished_products"], (b) => b.order("code"));
  const status = queryStatus(query);
  const { data: stock } = useRows("finished_goods_stock", ["finished_goods_stock"]);
  const { data: boms } = useRows("bom_headers", ["bom_headers"], (b) => b.eq("active", true));

  const balances = useMemo(
    () => new Map(((stock ?? []) as any[]).map((s) => [s.product_id, Number(s.balance ?? 0)])),
    [stock],
  );
  const activeBom = useMemo(
    () => new Map(((boms ?? []) as any[]).map((b) => [b.product_id, b])),
    [boms],
  );
  const balanceOf = (id: string) => balances.get(id) ?? 0;

  const grid = useGrid((query.data ?? []) as any[], {
    search: (r) => [r.code, r.name, r.category].join(" "),
    filter: (r) =>
      (!category || r.category === category) &&
      (!bomFilter || (bomFilter === "yes" ? activeBom.has(r.id) : !activeBom.has(r.id))),
    filtersActive: !!(category || bomFilter),
    sorters: {
      product: (r) => r.code,
      category: (r) => r.category,
      balance: (r) => balanceOf(r.id),
    },
    initialSort: { key: "product", direction: "asc" },
  });

  const dirty = JSON.stringify(form) !== JSON.stringify(initialForm);
  const [discardDialog, onOpenChange] = useGuardedClose(dirty && !busy, setOpen);
  const set = (k: string, v: unknown) => {
    setForm((f: any) => ({ ...f, [k]: v }));
    setErrors((e) => ({ ...e, [k]: undefined }));
  };
  const openForm = (row?: any) => {
    const next = row ? { ...BLANK, ...row } : BLANK;
    setEditId(row?.id ?? null);
    setForm(next);
    setInitialForm(next);
    setErrors({});
    setOpen(true);
  };

  const save = async () => {
    if (busy) return;
    const next: Errors = {};
    if (!String(form.code ?? "").trim()) next.code = "Enter a product code.";
    if (!String(form.name ?? "").trim()) next.name = "Enter the product name.";
    setErrors(next);
    if (Object.keys(next).length) return;
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
      toast.error(`Not saved. ${errMsg(res.error)}`);
      return;
    }
    toast.success(editId ? `${payload.code} updated.` : `${payload.code} created.`);
    setInitialForm(form);
    setOpen(false);
    invalidate([["finished_products"]]);
  };

  return (
    <div>
      <PageHeader
        title="Finished products"
        subtitle="Products your jobbers make. A product needs an active bill of material before its production can be received."
        actions={
          <>
            <ExportBar
              filename="finished-products"
              rows={grid.matched.map((r: any) => ({
                Code: r.code,
                Name: r.name,
                Category: r.category,
                UOM: r.uom,
                "Active BOM": activeBom.get(r.id)?.bom_number ?? "None",
                Balance: balanceOf(r.id),
                Status: r.status ? "Active" : "Inactive",
              }))}
            />
            {editable && (
              <Button size="sm" onClick={() => openForm()}>
                <IconPlus /> New product
              </Button>
            )}
          </>
        }
      />

      <Panel>
        <GridToolbar
          grid={grid}
          searchLabel="Search products"
          placeholder="Code, name or category"
          noun={["product", "products"]}
          onReset={() => {
            setCategory("");
            setBomFilter("");
          }}
        >
          <FilterSelect
            label="Category"
            value={category}
            onChange={(value) => {
              setCategory(value);
              grid.resetPage();
            }}
            options={[
              { value: "", label: "All categories" },
              ...CATEGORIES.map((c) => ({
                value: c,
                label: c.charAt(0) + c.slice(1).toLowerCase(),
              })),
            ]}
          />
          <FilterSelect
            label="BOM"
            value={bomFilter}
            onChange={(value) => {
              setBomFilter(value);
              grid.resetPage();
            }}
            options={[
              { value: "", label: "Any" },
              { value: "yes", label: "Has active BOM" },
              { value: "no", label: "No BOM" },
            ]}
          />
        </GridToolbar>
        <GridScroll sticky>
          <table className="erp-table min-w-[50rem]">
            <caption className="sr-only">
              Finished products with their bill of material and finished goods balance
            </caption>
            <thead>
              <tr>
                <SortHeader grid={grid} sortKey="product">
                  Product
                </SortHeader>
                <SortHeader grid={grid} sortKey="category">
                  Category
                </SortHeader>
                <th scope="col">UOM</th>
                <th scope="col">Bill of material</th>
                <SortHeader grid={grid} sortKey="balance" align="right">
                  In stock
                </SortHeader>
                <th scope="col">Status</th>
                <th scope="col">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {status !== "ready" ? (
                <RegisterState status={status} cols={7} onRetry={() => void query.refetch()} />
              ) : grid.matched.length === 0 ? (
                <RegisterState
                  status="ready"
                  cols={7}
                  emptyTitle={
                    grid.isFiltered
                      ? "No product matches these filters."
                      : "No finished products yet."
                  }
                  emptyBody={
                    grid.isFiltered
                      ? "Search by code, name or category, or clear the filters."
                      : "Add the products your jobbers make for you, then give each one a bill of material."
                  }
                  action={
                    !grid.isFiltered &&
                    editable && (
                      <Button size="sm" onClick={() => openForm()}>
                        <IconPlus /> New product
                      </Button>
                    )
                  }
                />
              ) : (
                grid.pageRows.map((r: any) => {
                  const bom = activeBom.get(r.id);
                  return (
                    <tr key={r.id}>
                      <th scope="row" className="text-left font-normal">
                        <span className="block font-medium">{r.name}</span>
                        <span className="num block text-xs text-muted-foreground">{r.code}</span>
                      </th>
                      <td>
                        {r.category
                          ? r.category.charAt(0) + r.category.slice(1).toLowerCase()
                          : NIL}
                      </td>
                      <td className="text-muted-foreground">{r.uom}</td>
                      <td>
                        {bom ? (
                          <Link
                            to="/masters/bom"
                            search={{ product: r.id }}
                            className="inline-flex items-center gap-2 hover:text-primary"
                          >
                            <Badge variant="success">Active</Badge>
                            <span className="num text-xs">{bom.bom_number}</span>
                          </Link>
                        ) : (
                          <span className="inline-flex items-center gap-2">
                            <Badge variant="warning">No BOM</Badge>
                            {editable && (
                              <Link
                                to="/masters/bom"
                                search={{ product: r.id }}
                                className="text-xs font-medium text-primary hover:underline"
                              >
                                Create
                              </Link>
                            )}
                          </span>
                        )}
                      </td>
                      <td className="num text-right font-semibold">{PCS(balanceOf(r.id))}</td>
                      <td>
                        <Badge variant={r.status ? "success" : "secondary"}>
                          {r.status ? "Active" : "Inactive"}
                        </Badge>
                      </td>
                      <td className="whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button size="sm" variant="ghost" asChild>
                            <Link
                              to="/inventory/fg-ledger"
                              search={{ product: r.id }}
                              aria-label={`Movements of ${r.name}`}
                            >
                              Movements
                            </Link>
                          </Button>
                          {editable && (
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => openForm(r)}
                              aria-label={`Edit ${r.name}`}
                              title="Edit"
                            >
                              <IconPencil className="size-3.5" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </GridScroll>
        <GridPager grid={grid} />
      </Panel>

      <Dialog open={open} onOpenChange={(value) => void onOpenChange(value)}>
        <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editId ? `Edit ${initialForm.name}` : "New finished product"}
            </DialogTitle>
            <DialogDescription>
              Stock comes from product inward vouchers and cannot be edited here.
            </DialogDescription>
          </DialogHeader>
          <form
            className="space-y-5"
            onSubmit={(event) => {
              event.preventDefault();
              void save();
            }}
          >
            <FormSection title="Identity">
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Product code" required error={errors.code} hint="Saved in capitals.">
                  <Input
                    value={form.code ?? ""}
                    onChange={(e) => set("code", e.target.value)}
                    placeholder="FP001"
                    autoComplete="off"
                  />
                </Field>
                <Field label="Product name" required error={errors.name}>
                  <Input value={form.name ?? ""} onChange={(e) => set("name", e.target.value)} />
                </Field>
                <Field label="Category">
                  <SearchSelect
                    options={CATEGORIES.map((c) => ({
                      value: c,
                      label: c.charAt(0) + c.slice(1).toLowerCase(),
                    }))}
                    value={form.category}
                    onChange={(v) => set("category", v)}
                  />
                </Field>
                <Field label="Unit of measure">
                  <SearchSelect
                    options={UOMS.map((u) => ({ value: u, label: u }))}
                    value={form.uom}
                    onChange={(v) => set("uom", v)}
                  />
                </Field>
                <Field label="Description" optional className="sm:col-span-2">
                  <Textarea
                    rows={2}
                    value={form.description ?? ""}
                    onChange={(e) => set("description", e.target.value)}
                  />
                </Field>
                <label className="flex cursor-pointer items-center gap-2 text-sm">
                  <Switch checked={!!form.status} onCheckedChange={(v) => set("status", v)} />
                  Active, available on new vouchers
                </label>
              </div>
            </FormSection>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => void onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" loading={busy}>
                {editId ? "Save changes" : "Create product"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      {discardDialog}
    </div>
  );
}

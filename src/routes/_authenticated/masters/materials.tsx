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
  NumInput,
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
import { KG, MATERIAL_CATEGORIES, errMsg } from "@/lib/erp";

export const Route = createFileRoute("/_authenticated/masters/materials")({
  head: () => ({
    meta: [
      { title: "Raw materials | JobberFlow" },
      {
        name: "description",
        content: "Raw materials with category, unit and the minimum level for low-stock warnings.",
      },
    ],
  }),
  component: MaterialMaster,
});

const BLANK = {
  code: "",
  name: "",
  // Must be one of MATERIAL_CATEGORIES (lib/erp.ts): the picker renders that
  // list, so a value outside it shows as an empty placeholder forever.
  category: MATERIAL_CATEGORIES[0]!,
  uom: "KG",
  minimum_stock: 0,
  description: "",
  status: true,
};

const UOMS = ["KG", "GM", "PCS"];

type Errors = { code?: string; name?: string; minimum_stock?: string };

function MaterialMaster() {
  const { data: role } = useRole();
  const editable = canWrite(role);
  const invalidate = useInvalidate();
  const [category, setCategory] = useState("");
  const [level, setLevel] = useState("");
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<any>(BLANK);
  const [initialForm, setInitialForm] = useState<any>(BLANK);
  const [errors, setErrors] = useState<Errors>({});
  const [busy, setBusy] = useState(false);

  const query = useRows("raw_materials", ["raw_materials"], (b) => b.order("code"));
  const status = queryStatus(query);
  const stock = useRows("warehouse_stock", ["warehouse_stock"]);
  const balances = useMemo(
    () =>
      new Map(((stock.data ?? []) as any[]).map((s) => [s.material_id, Number(s.balance ?? 0)])),
    [stock.data],
  );
  const balanceOf = (id: string) => balances.get(id) ?? 0;
  const isLow = (r: any) =>
    Number(r.minimum_stock) > 0 && balanceOf(r.id) < Number(r.minimum_stock);

  const grid = useGrid((query.data ?? []) as any[], {
    search: (r) => [r.code, r.name, r.category, r.description].join(" "),
    filter: (r) =>
      (!category || r.category === category) &&
      (!level ||
        (level === "low" && isLow(r)) ||
        (level === "ok" && !isLow(r)) ||
        (level === "inactive" && !r.status)),
    filtersActive: !!(category || level),
    sorters: {
      material: (r) => r.code,
      category: (r) => r.category,
      minimum: (r) => Number(r.minimum_stock ?? 0),
      balance: (r) => balanceOf(r.id),
    },
    initialSort: { key: "material", direction: "asc" },
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
    if (!String(form.code ?? "").trim()) next.code = "Enter a material code.";
    if (!String(form.name ?? "").trim()) next.name = "Enter the material name.";
    if (Number(form.minimum_stock) < 0) next.minimum_stock = "Minimum cannot be negative.";
    setErrors(next);
    if (Object.keys(next).length) return;

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
      toast.error(`Not saved. ${errMsg(res.error)}`);
      return;
    }
    toast.success(editId ? `${payload.code} updated.` : `${payload.code} created.`);
    setInitialForm(form);
    setOpen(false);
    invalidate([["raw_materials"], ["warehouse_stock"]]);
  };

  return (
    <div>
      <PageHeader
        title="Raw materials"
        subtitle="Granules, master batch, additives and packing material. The minimum level drives low-stock warnings."
        actions={
          <>
            <ExportBar
              filename="raw-materials"
              rows={grid.matched.map((r: any) => ({
                Code: r.code,
                Name: r.name,
                Category: r.category,
                UOM: r.uom,
                "Minimum stock": r.minimum_stock,
                "Godown balance": balanceOf(r.id),
                Status: r.status ? "Active" : "Inactive",
              }))}
            />
            {editable && (
              <Button size="sm" onClick={() => openForm()}>
                <IconPlus /> New material
              </Button>
            )}
          </>
        }
      />

      <Panel>
        <GridToolbar
          grid={grid}
          searchLabel="Search materials"
          placeholder="Code, name or category"
          noun={["material", "materials"]}
          onReset={() => {
            setCategory("");
            setLevel("");
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
              ...MATERIAL_CATEGORIES.map((c) => ({ value: c, label: c })),
            ]}
          />
          <FilterSelect
            label="Stock"
            value={level}
            onChange={(value) => {
              setLevel(value);
              grid.resetPage();
            }}
            options={[
              { value: "", label: "Any level" },
              { value: "low", label: "Below minimum" },
              { value: "ok", label: "At or above minimum" },
              { value: "inactive", label: "Inactive" },
            ]}
          />
        </GridToolbar>
        <GridScroll sticky>
          <table className="erp-table min-w-[52rem]">
            <caption className="sr-only">
              Raw materials with minimum level and current godown balance
            </caption>
            <thead>
              <tr>
                <SortHeader grid={grid} sortKey="material">
                  Material
                </SortHeader>
                <SortHeader grid={grid} sortKey="category">
                  Category
                </SortHeader>
                <th scope="col">UOM</th>
                <SortHeader grid={grid} sortKey="minimum" align="right">
                  Minimum
                </SortHeader>
                <SortHeader grid={grid} sortKey="balance" align="right">
                  Godown balance
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
                    grid.isFiltered ? "No material matches these filters." : "No materials yet."
                  }
                  emptyBody={
                    grid.isFiltered
                      ? "Clear the search or choose a different category."
                      : "Add the raw materials you buy and send out, with a minimum level for low-stock warnings."
                  }
                  action={
                    !grid.isFiltered &&
                    editable && (
                      <Button size="sm" onClick={() => openForm()}>
                        <IconPlus /> New material
                      </Button>
                    )
                  }
                />
              ) : (
                grid.pageRows.map((r: any) => {
                  const balance = balanceOf(r.id);
                  const low = isLow(r);
                  return (
                    <tr key={r.id}>
                      <th scope="row" className="text-left font-normal">
                        <span className="block font-medium">{r.name}</span>
                        <span className="num block text-xs text-muted-foreground">{r.code}</span>
                      </th>
                      <td>{r.category ?? NIL}</td>
                      <td className="text-muted-foreground">{r.uom}</td>
                      <td className="num text-right text-muted-foreground">
                        {Number(r.minimum_stock) > 0 ? KG(r.minimum_stock) : NIL}
                      </td>
                      <td className="text-right">
                        <span className="num block font-semibold">
                          {stock.isLoading ? "…" : KG(balance)}
                        </span>
                        {low && (
                          <Badge variant="warning" className="mt-0.5">
                            Below minimum
                          </Badge>
                        )}
                      </td>
                      <td>
                        <Badge variant={r.status ? "success" : "secondary"}>
                          {r.status ? "Active" : "Inactive"}
                        </Badge>
                      </td>
                      <td className="whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button size="sm" variant="ghost" asChild>
                            <Link
                              to="/inventory/rm-ledger"
                              search={{ material: r.id }}
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
            <DialogTitle>{editId ? `Edit ${initialForm.name}` : "New raw material"}</DialogTitle>
            <DialogDescription>
              {editId
                ? `Godown balance now ${KG(balanceOf(editId))} ${String(form.uom).toLowerCase()}. Balances come from vouchers and cannot be edited here.`
                : "Balances start at zero and change only through vouchers."}
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
                <Field label="Material code" required error={errors.code} hint="Saved in capitals.">
                  <Input
                    value={form.code ?? ""}
                    onChange={(e) => set("code", e.target.value)}
                    placeholder="RM001"
                    autoComplete="off"
                  />
                </Field>
                <Field label="Material name" required error={errors.name}>
                  <Input value={form.name ?? ""} onChange={(e) => set("name", e.target.value)} />
                </Field>
                <Field label="Category">
                  <SearchSelect
                    options={MATERIAL_CATEGORIES.map((c) => ({ value: c, label: c }))}
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
              </div>
            </FormSection>
            <FormSection title="Stock control">
              <div className="grid gap-3 sm:grid-cols-2">
                <Field
                  label={`Minimum level (${String(form.uom).toLowerCase()})`}
                  error={errors.minimum_stock}
                  hint="Zero turns off the low-stock warning."
                >
                  <NumInput value={form.minimum_stock} onChange={(n) => set("minimum_stock", n)} />
                </Field>
                <div className="flex items-end pb-2">
                  <label className="flex cursor-pointer items-center gap-2 text-sm">
                    <Switch checked={!!form.status} onCheckedChange={(v) => set("status", v)} />
                    Active, available on new vouchers
                  </label>
                </div>
                <Field label="Description" optional className="sm:col-span-2">
                  <Textarea
                    rows={2}
                    value={form.description ?? ""}
                    onChange={(e) => set("description", e.target.value)}
                  />
                </Field>
              </div>
            </FormSection>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => void onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" loading={busy}>
                {editId ? "Save changes" : "Create material"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      {discardDialog}
    </div>
  );
}

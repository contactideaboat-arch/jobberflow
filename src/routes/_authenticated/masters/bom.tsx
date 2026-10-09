/* eslint-disable @typescript-eslint/no-explicit-any */
import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { IconCopy, IconPlus, IconScrap, IconStar } from "@/components/icons";
import { PageHeader } from "@/components/erp/AppShell";
import {
  EmptyState,
  ExportBar,
  Field,
  FormSection,
  NumInput,
  Panel,
  RegisterState,
  SearchSelect,
  queryStatus,
  useConfirm,
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
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { canWrite, db, useInvalidate, useRole, useRows } from "@/hooks/use-erp";
import { KG, NUM, dmy, errMsg, today } from "@/lib/erp";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/masters/bom")({
  validateSearch: (search: Record<string, unknown>): { product?: string } =>
    typeof search["product"] === "string" ? { product: search["product"] } : {},
  head: () => ({
    meta: [
      { title: "Bills of material | JobberFlow" },
      {
        name: "description",
        content:
          "Versioned bills of material: the standard quantity of each raw material per base quantity of a finished product.",
      },
    ],
  }),
  component: BomMaster,
});

type Line = {
  material_id: string;
  standard_quantity: number;
  uom: string;
  is_primary_material: boolean;
};

type FormErrors = {
  product?: string | undefined;
  baseQty?: string | undefined;
  lines?: string | undefined;
  rows?: Record<number, string>;
};

function BomMaster() {
  const initial = Route.useSearch();
  const { data: role } = useRole();
  const editable = canWrite(role);
  const invalidate = useInvalidate();
  const [productFilter, setProductFilter] = useState(initial.product ?? "");
  const [activeFilter, setActiveFilter] = useState("");
  const [open, setOpen] = useState(false);
  const [viewId, setViewId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  /** A header already written by a failed save, so a retry adds lines instead of a second BOM. */
  const [pending, setPending] = useState<{ id: string; number: string } | null>(null);
  const [confirmDialog, ask] = useConfirm();

  const [productId, setProductId] = useState("");
  const [version, setVersion] = useState("V1");
  const [baseQty, setBaseQty] = useState(100);
  const [effFrom, setEffFrom] = useState(today());
  const [remarks, setRemarks] = useState("");
  const [lines, setLines] = useState<Line[]>([]);

  const { data: products } = useRows("finished_products", ["finished_products"], (b) =>
    b.eq("status", true).order("code"),
  );
  const { data: materials } = useRows("raw_materials", ["raw_materials"], (b) =>
    b.eq("status", true).order("code"),
  );
  const bomsQuery = useRows(
    "bom_headers",
    ["bom_headers-full"],
    (b) => b.order("created_at", { ascending: false }),
    "*, finished_products(code, name, uom), bom_items(*, raw_materials(code, name, uom))",
  );
  const boms = (bomsQuery.data ?? []) as any[];
  const status = queryStatus(bomsQuery);

  const productOpts = (products ?? []).map((p: any) => ({
    value: p.id,
    label: `${p.code}, ${p.name}`,
  }));
  const materialOpts = (materials ?? []).map((m: any) => ({
    value: m.id,
    label: `${m.code}, ${m.name}`,
    hint: m.uom,
  }));

  const viewing = useMemo(() => boms.find((b) => b.id === viewId), [boms, viewId]);
  const versionsOf = (product: string) => boms.filter((b) => b.product_id === product);
  const totalStd = lines.reduce((s, l) => s + Number(l.standard_quantity || 0), 0);
  const productName = (id: string) => productOpts.find((p) => p.value === id)?.label ?? "";

  const grid = useGrid(boms, {
    search: (b) =>
      [
        b.bom_number,
        b.version,
        b.finished_products?.code,
        b.finished_products?.name,
        ...(b.bom_items ?? []).map((i: any) => i.raw_materials?.name),
      ].join(" "),
    filter: (b) =>
      (!productFilter || b.product_id === productFilter) &&
      (!activeFilter || (activeFilter === "active" ? b.active : !b.active)),
    filtersActive: !!(productFilter || activeFilter),
    sorters: {
      bom: (b) => b.bom_number,
      product: (b) => b.finished_products?.code,
      effective: (b) => b.effective_from,
    },
  });

  const dirty =
    open && (!!productId || lines.length > 0 || !!remarks || version !== "V1" || baseQty !== 100);
  const [discardDialog, onOpenChange] = useGuardedClose(dirty && !busy, setOpen);

  const resetForm = (product = "") => {
    setProductId(product);
    setVersion(product ? `V${versionsOf(product).length + 1}` : "V1");
    setBaseQty(100);
    setEffFrom(today());
    setRemarks("");
    setLines([]);
    setErrors({});
    setPending(null);
  };

  const addLine = () =>
    setLines((l) => [
      ...l,
      { material_id: "", standard_quantity: 0, uom: "KG", is_primary_material: l.length === 0 },
    ]);
  const setLine = (i: number, patch: Partial<Line>) => {
    setLines((l) => l.map((row, idx) => (idx === i ? { ...row, ...patch } : row)));
    setErrors((e) => ({ ...e, lines: undefined, rows: { ...e.rows, [i]: "" } }));
  };
  const markPrimary = (i: number) =>
    setLines((l) => l.map((row, idx) => ({ ...row, is_primary_material: idx === i })));

  const cloneBom = (b: any) => {
    resetForm();
    setProductId(b.product_id);
    setVersion(`V${(Number(String(b.version).replace(/\D/g, "")) || 1) + 1}`);
    setBaseQty(Number(b.base_quantity));
    setRemarks(`Revision of ${b.bom_number}`);
    setLines(
      (b.bom_items ?? []).map((i: any) => ({
        material_id: i.material_id,
        standard_quantity: Number(i.standard_quantity),
        uom: i.uom,
        is_primary_material: i.is_primary_material,
      })),
    );
    setViewId(null);
    setOpen(true);
  };

  const validate = () => {
    const next: FormErrors = { rows: {} };
    if (!productId) next.product = "Choose the finished product.";
    if (!(Number(baseQty) > 0)) next.baseQty = "Base quantity must be more than zero.";
    if (!lines.length) next.lines = "Add at least one raw material line.";
    const seen = new Set<string>();
    lines.forEach((l, i) => {
      if (!l.material_id) next.rows![i] = "Choose a material.";
      else if (seen.has(l.material_id)) next.rows![i] = "This material is already in the BOM.";
      else if (!(Number(l.standard_quantity) > 0))
        next.rows![i] = "Quantity must be more than zero.";
      seen.add(l.material_id);
    });
    if (lines.length && lines.filter((l) => l.is_primary_material).length !== 1)
      next.lines = "Mark exactly one line as the primary material.";
    setErrors(next);
    return (
      !next.product && !next.baseQty && !next.lines && !Object.values(next.rows!).some(Boolean)
    );
  };

  const save = async () => {
    if (busy || !validate()) return;
    const replacing = versionsOf(productId).find((b) => b.active);
    if (!pending && replacing) {
      const ok = await ask({
        title: `Replace ${replacing.bom_number}?`,
        body: (
          <>
            <p>
              {replacing.bom_number} ({replacing.version}) is the active BOM for this product.
              Saving makes {version} active from {dmy(effFrom)} and closes {replacing.bom_number} on
              that date.
            </p>
            <p>Product inwards posted after this use the new quantities.</p>
          </>
        ),
        confirm: "Save and make active",
      });
      if (!ok) return;
    }

    setBusy(true);
    let header = pending;
    if (!header) {
      const { data: num, error: numErr } = await db.rpc("next_voucher_number", { _prefix: "BOM" });
      if (numErr) {
        setBusy(false);
        toast.error(`Not saved. ${errMsg(numErr)}`);
        return;
      }
      const { error: closeErr } = await db
        .from("bom_headers")
        .update({ active: false, effective_to: effFrom })
        .eq("product_id", productId)
        .eq("active", true);
      if (closeErr) {
        setBusy(false);
        toast.error(`Not saved. The current BOM could not be closed: ${errMsg(closeErr)}`);
        return;
      }
      const { data: created, error } = await db
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
        invalidate([["bom_headers-full"], ["bom_headers"]]);
        toast.error(
          `Not saved: ${errMsg(error)}. ${replacing ? `${replacing.bom_number} was already closed; reactivate it from the list if needed.` : ""}`,
        );
        return;
      }
      header = { id: created.id, number: num };
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
    if (itemErr) {
      setPending(header);
      invalidate([["bom_headers-full"], ["bom_headers"]]);
      toast.error(
        `${header.number} was created but its lines were not saved: ${errMsg(itemErr)}. Try again to add the lines to ${header.number}.`,
      );
      return;
    }
    toast.success(
      `${header.number} saved and active${replacing ? `. ${replacing.bom_number} is now closed` : ""}.`,
    );
    setPending(null);
    setOpen(false);
    setViewId(header.id);
    invalidate([["bom_headers-full"], ["bom_headers"]]);
  };

  const toggleActive = async (b: any) => {
    const current = versionsOf(b.product_id).find((x) => x.active && x.id !== b.id);
    const ok = await ask({
      title: b.active ? `Deactivate ${b.bom_number}?` : `Make ${b.bom_number} active?`,
      body: b.active ? (
        <p>
          {b.finished_products?.name} will have no active BOM, so its production cannot be received
          until another version is made active.
        </p>
      ) : (
        <p>
          Product inwards for {b.finished_products?.name} will use {b.version}.
          {current ? ` ${current.bom_number} (${current.version}) will be deactivated.` : ""}
        </p>
      ),
      confirm: b.active ? "Deactivate" : "Make active",
      tone: b.active ? "destructive" : "default",
    });
    if (!ok) return;
    if (!b.active) {
      const { error: offErr } = await db
        .from("bom_headers")
        .update({ active: false })
        .eq("product_id", b.product_id)
        .eq("active", true);
      if (offErr) {
        toast.error(`Not changed. ${errMsg(offErr)}`);
        return;
      }
    }
    const { error } = await db.from("bom_headers").update({ active: !b.active }).eq("id", b.id);
    invalidate([["bom_headers-full"], ["bom_headers"]]);
    if (error) {
      toast.error(`Not changed. ${errMsg(error)}`);
      return;
    }
    toast.success(`${b.bom_number} is now ${b.active ? "inactive" : "active"}.`);
  };

  const exportRows = grid.matched.flatMap((b: any) =>
    (b.bom_items ?? []).map((i: any) => ({
      BOM: b.bom_number,
      Version: b.version,
      Product: `${b.finished_products?.code}, ${b.finished_products?.name}`,
      "Base quantity": b.base_quantity,
      Material: `${i.raw_materials?.code}, ${i.raw_materials?.name}`,
      "Standard quantity": i.standard_quantity,
      UOM: i.uom,
      Primary: i.is_primary_material ? "Yes" : "",
      Status: b.active ? "Active" : "Inactive",
    })),
  );

  return (
    <div>
      <PageHeader
        title="Bills of material"
        subtitle="The standard quantity of each raw material for a base quantity of a finished product. The primary material absorbs a voucher's overall wastage at product inward."
        actions={
          <>
            <ExportBar filename="bills-of-material" rows={exportRows} />
            {editable && (
              <Button
                size="sm"
                onClick={() => {
                  resetForm(productFilter);
                  setOpen(true);
                }}
              >
                <IconPlus /> New BOM
              </Button>
            )}
          </>
        }
      />

      <Panel>
        <GridToolbar
          grid={grid}
          searchLabel="Search bills of material"
          placeholder="BOM, product or material"
          noun={["bill of material", "bills of material"]}
          onReset={() => {
            setProductFilter("");
            setActiveFilter("");
          }}
        >
          <FilterSelect
            label="Product"
            value={productFilter}
            onChange={(value) => {
              setProductFilter(value);
              grid.resetPage();
            }}
            options={[{ value: "", label: "All products" }, ...productOpts]}
          />
          <FilterSelect
            label="Status"
            value={activeFilter}
            onChange={(value) => {
              setActiveFilter(value);
              grid.resetPage();
            }}
            options={[
              { value: "", label: "All versions" },
              { value: "active", label: "Active" },
              { value: "inactive", label: "Inactive" },
            ]}
          />
        </GridToolbar>
        <GridScroll sticky>
          <table className="erp-table min-w-[60rem]">
            <caption className="sr-only">Bills of material by product and version</caption>
            <thead>
              <tr>
                <SortHeader grid={grid} sortKey="product">
                  Product
                </SortHeader>
                <SortHeader grid={grid} sortKey="bom">
                  BOM
                </SortHeader>
                <th scope="col" className="text-right!">
                  Base quantity
                </th>
                <th scope="col">Primary material</th>
                <th scope="col" className="text-right!">
                  Components
                </th>
                <th scope="col" className="text-right!">
                  Standard total
                </th>
                <SortHeader grid={grid} sortKey="effective">
                  Effective
                </SortHeader>
                <th scope="col">Status</th>
                <th scope="col">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {status !== "ready" ? (
                <RegisterState status={status} cols={9} onRetry={() => void bomsQuery.refetch()} />
              ) : grid.matched.length === 0 ? (
                <RegisterState
                  status="ready"
                  cols={9}
                  emptyTitle={
                    productFilter && !activeFilter
                      ? `${productName(productFilter) || "This product"} has no bill of material.`
                      : grid.isFiltered
                        ? "No bill of material matches these filters."
                        : "No bills of material yet."
                  }
                  emptyBody="A BOM is the recipe: how much of each material a base quantity of finished goods should use. Product inward applies it automatically."
                  action={
                    editable && (
                      <Button
                        size="sm"
                        onClick={() => {
                          resetForm(productFilter);
                          setOpen(true);
                        }}
                      >
                        <IconPlus /> New BOM
                      </Button>
                    )
                  }
                />
              ) : (
                grid.pageRows.map((b: any) => {
                  const items = b.bom_items ?? [];
                  const primary = items.find((i: any) => i.is_primary_material);
                  const tot = items.reduce(
                    (s: number, i: any) => s + Number(i.standard_quantity),
                    0,
                  );
                  return (
                    <tr key={b.id} aria-selected={viewId === b.id || undefined}>
                      <th scope="row" className="text-left font-normal">
                        <span className="block font-medium">{b.finished_products?.name}</span>
                        <span className="num block text-xs text-muted-foreground">
                          {b.finished_products?.code}
                        </span>
                      </th>
                      <td>
                        <button
                          type="button"
                          onClick={() => setViewId(b.id)}
                          className="num cursor-pointer text-left font-medium hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        >
                          {b.bom_number}
                          <span className="block text-xs font-normal text-muted-foreground">
                            {b.version}
                          </span>
                        </button>
                      </td>
                      <td className="num text-right">
                        {NUM(b.base_quantity)} {b.finished_products?.uom?.toLowerCase()}
                      </td>
                      <td>{primary ? primary.raw_materials?.name : NIL}</td>
                      <td className="num text-right">{NUM(items.length)}</td>
                      <td className="num text-right">{KG(tot)} kg</td>
                      <td className="num whitespace-nowrap">
                        {dmy(b.effective_from)}
                        {b.effective_to && (
                          <span className="block text-xs text-muted-foreground">
                            to {dmy(b.effective_to)}
                          </span>
                        )}
                      </td>
                      <td>
                        <Badge variant={b.active ? "success" : "secondary"}>
                          {b.active ? "Active" : "Inactive"}
                        </Badge>
                      </td>
                      <td className="text-right">
                        <Button size="sm" variant="ghost" onClick={() => setViewId(b.id)}>
                          Open
                        </Button>
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

      {/* Detail: the product and its components ------------------------------ */}
      <Sheet open={!!viewing} onOpenChange={(value) => !value && setViewId(null)}>
        <SheetContent side="right" className="flex w-full flex-col gap-0 p-0 sm:max-w-xl">
          {viewing && (
            <>
              <SheetHeader className="space-y-1 border-b p-5 pr-12 text-left">
                <div className="flex items-center gap-2">
                  <span className="num text-xs text-muted-foreground">
                    {viewing.bom_number} · {viewing.version}
                  </span>
                  <Badge variant={viewing.active ? "success" : "secondary"}>
                    {viewing.active ? "Active" : "Inactive"}
                  </Badge>
                </div>
                <SheetTitle>{viewing.finished_products?.name}</SheetTitle>
                <SheetDescription>
                  Standard quantities for{" "}
                  <span className="num font-medium text-foreground">
                    {NUM(viewing.base_quantity)} {viewing.finished_products?.uom?.toLowerCase()}
                  </span>
                  , effective {dmy(viewing.effective_from)}
                  {viewing.effective_to ? ` to ${dmy(viewing.effective_to)}` : " onwards"}.
                </SheetDescription>
                {editable && (
                  <div className="flex flex-wrap gap-2 pt-2">
                    <Button size="sm" variant="outline" onClick={() => cloneBom(viewing)}>
                      <IconCopy /> New revision from this
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => void toggleActive(viewing)}>
                      {viewing.active ? "Deactivate" : "Make active"}
                    </Button>
                  </div>
                )}
              </SheetHeader>
              <div className="flex-1 space-y-6 overflow-y-auto p-5">
                <section aria-labelledby="components-heading">
                  <h3 id="components-heading" className="mb-2 text-sm font-semibold">
                    Components
                  </h3>
                  <BomComponents bom={viewing} />
                </section>
                {viewing.remarks && (
                  <p className="text-sm text-muted-foreground">
                    <span className="font-medium text-foreground">Remarks: </span>
                    {viewing.remarks}
                  </p>
                )}
                <section aria-labelledby="versions-heading">
                  <h3 id="versions-heading" className="mb-2 text-sm font-semibold">
                    All versions for this product
                  </h3>
                  <ul className="divide-y rounded-md border">
                    {versionsOf(viewing.product_id).map((b) => (
                      <li key={b.id}>
                        <button
                          type="button"
                          onClick={() => setViewId(b.id)}
                          aria-current={b.id === viewing.id || undefined}
                          className={cn(
                            "flex w-full cursor-pointer items-center justify-between gap-3 px-3 py-2 text-left text-sm hover:bg-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring",
                            b.id === viewing.id && "bg-selected",
                          )}
                        >
                          <span className="num">
                            {b.bom_number} · {b.version}
                          </span>
                          <span className="num text-xs text-muted-foreground">
                            {dmy(b.effective_from)}
                            {b.effective_to ? ` to ${dmy(b.effective_to)}` : ""}
                          </span>
                          <Badge variant={b.active ? "success" : "secondary"}>
                            {b.active ? "Active" : "Inactive"}
                          </Badge>
                        </button>
                      </li>
                    ))}
                  </ul>
                </section>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Create a BOM or revision --------------------------------------------- */}
      <Dialog open={open} onOpenChange={(value) => void onOpenChange(value)}>
        <DialogContent className="max-h-[92dvh] overflow-y-auto sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>
              {pending ? `Finish ${pending.number}` : "New bill of material"}
            </DialogTitle>
            <DialogDescription>
              {pending
                ? `${pending.number} exists without lines. Saving adds these lines to it.`
                : "A new BOM becomes the product's active version from its effective date."}
            </DialogDescription>
          </DialogHeader>
          <form
            className="space-y-6"
            onSubmit={(event) => {
              event.preventDefault();
              void save();
            }}
          >
            <FormSection title="Finished product">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <Field label="Product" required error={errors.product} className="sm:col-span-2">
                  <SearchSelect
                    options={productOpts}
                    value={productId}
                    disabled={!!pending}
                    onChange={(value) => {
                      setProductId(value);
                      setVersion(`V${versionsOf(value).length + 1}`);
                      setErrors((e) => ({ ...e, product: undefined }));
                    }}
                  />
                </Field>
                <Field
                  label="Version"
                  hint={productId ? `${versionsOf(productId).length} existing` : undefined}
                >
                  <Input
                    value={version}
                    disabled={!!pending}
                    onChange={(e) => setVersion(e.target.value)}
                  />
                </Field>
                <Field label="Effective from" required>
                  <Input
                    type="date"
                    value={effFrom}
                    disabled={!!pending}
                    onChange={(e) => setEffFrom(e.target.value)}
                  />
                </Field>
                <Field
                  label="Base quantity (pcs)"
                  required
                  error={errors.baseQty}
                  hint="Standard quantities below are for this many pieces."
                >
                  <NumInput value={baseQty} step="1" disabled={!!pending} onChange={setBaseQty} />
                </Field>
                <Field label="Remarks" optional className="sm:col-span-3">
                  <Input
                    value={remarks}
                    disabled={!!pending}
                    onChange={(e) => setRemarks(e.target.value)}
                  />
                </Field>
              </div>
            </FormSection>

            <FormSection
              title="Components"
              description="Each raw material consumed per base quantity. The primary material absorbs all wastage at product inward."
            >
              <div className="overflow-hidden rounded-md border">
                <div className="overflow-x-auto">
                  <table className="erp-table min-w-[40rem]">
                    <thead>
                      <tr>
                        <th scope="col" className="w-10">
                          #
                        </th>
                        <th scope="col">Raw material</th>
                        <th scope="col" className="w-36 text-right!">
                          Standard quantity
                        </th>
                        <th scope="col" className="w-16">
                          UOM
                        </th>
                        <th scope="col" className="w-28 text-right!">
                          Per piece
                        </th>
                        <th scope="col" className="w-20 text-center!">
                          Primary
                        </th>
                        <th scope="col" className="w-12">
                          <span className="sr-only">Remove</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {lines.length === 0 && (
                        <EmptyState
                          cols={7}
                          title="No components yet."
                          body="Add each material and its standard quantity for the base quantity above."
                        />
                      )}
                      {lines.map((l, i) => {
                        const rowError = errors.rows?.[i];
                        return (
                          <tr key={i} aria-invalid={!!rowError || undefined}>
                            <td className="num text-muted-foreground">{i + 1}</td>
                            <td>
                              <SearchSelect
                                aria-label={`Material, line ${i + 1}`}
                                options={materialOpts}
                                value={l.material_id}
                                invalid={!!rowError}
                                onChange={(v) =>
                                  setLine(i, {
                                    material_id: v,
                                    uom: materialOpts.find((m) => m.value === v)?.hint ?? "KG",
                                  })
                                }
                              />
                              {rowError && (
                                <p className="mt-1 text-xs font-medium text-destructive">
                                  {rowError}
                                </p>
                              )}
                            </td>
                            <td>
                              <NumInput
                                aria-label={`Standard quantity, line ${i + 1}`}
                                value={l.standard_quantity}
                                onChange={(n) => setLine(i, { standard_quantity: n })}
                              />
                            </td>
                            <td className="text-muted-foreground">{l.uom}</td>
                            <td className="num text-right text-muted-foreground">
                              {Number(baseQty) > 0 && l.standard_quantity
                                ? (Number(l.standard_quantity) / Number(baseQty)).toFixed(5)
                                : NIL}
                            </td>
                            <td className="text-center">
                              <Button
                                type="button"
                                size="icon"
                                variant={l.is_primary_material ? "default" : "ghost"}
                                onClick={() => markPrimary(i)}
                                aria-pressed={l.is_primary_material}
                                aria-label={`Primary material, line ${i + 1}`}
                                title="Primary material"
                              >
                                <IconStar className="size-3.5" />
                              </Button>
                            </td>
                            <td>
                              <Button
                                type="button"
                                size="icon"
                                variant="ghost"
                                aria-label={`Remove line ${i + 1}`}
                                title="Remove line"
                                onClick={() => setLines((rows) => rows.filter((_, x) => x !== i))}
                              >
                                <IconScrap className="size-3.5" />
                              </Button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot>
                      <tr>
                        <td colSpan={2}>
                          <Button type="button" size="sm" variant="outline" onClick={addLine}>
                            <IconPlus /> Add material
                          </Button>
                        </td>
                        <td className="num text-right">{KG(totalStd)}</td>
                        <td colSpan={4} className="text-xs font-normal text-muted-foreground">
                          Total standard quantity, calculated
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
              {errors.lines && (
                <p className="text-xs font-medium text-destructive" role="alert">
                  {errors.lines}
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                Per piece is standard quantity ÷ base quantity, shown for checking only. It is not
                saved.
              </p>
            </FormSection>

            {productId && !pending && versionsOf(productId).some((b) => b.active) && (
              <div className="rounded-md border border-warning/60 bg-warning-soft px-3 py-2 text-sm text-warning-foreground">
                Saving replaces the active BOM for {productName(productId)} from {dmy(effFrom)}.
              </div>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => void onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" loading={busy}>
                {pending ? `Add lines to ${pending.number}` : "Save BOM"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      {discardDialog}
      {confirmDialog}
    </div>
  );
}

/** A BOM's components: what each is, how much, and how it compares to the rest. */
function BomComponents({ bom }: { bom: any }) {
  const items = [...(bom.bom_items ?? [])].sort(
    (a: any, b: any) => Number(a.sequence ?? 0) - Number(b.sequence ?? 0),
  );
  const total = items.reduce((s: number, i: any) => s + Number(i.standard_quantity), 0);
  if (items.length === 0)
    return <p className="text-sm text-muted-foreground">This BOM has no component lines.</p>;
  return (
    <table className="erp-table rounded-md border">
      <thead>
        <tr>
          <th scope="col">Material</th>
          <th scope="col" className="text-right!">
            Standard
          </th>
          <th scope="col" className="text-right!">
            Share
          </th>
          <th scope="col" className="text-right!">
            Per piece
          </th>
        </tr>
      </thead>
      <tbody>
        {items.map((i: any) => (
          <tr key={i.id}>
            <th scope="row" className="text-left font-normal">
              <span className="flex items-center gap-2">
                {i.raw_materials?.name}
                {i.is_primary_material && <Badge variant="default">Primary</Badge>}
              </span>
              <span className="num block text-xs text-muted-foreground">
                {i.raw_materials?.code}
              </span>
            </th>
            <td className="num whitespace-nowrap text-right">
              {KG(i.standard_quantity)} {String(i.uom ?? "").toLowerCase()}
            </td>
            <td className="num text-right text-muted-foreground">
              {total > 0 ? `${Math.round((Number(i.standard_quantity) / total) * 100)}%` : NIL}
            </td>
            <td className="num text-right text-muted-foreground">
              {Number(bom.base_quantity) > 0
                ? (Number(i.standard_quantity) / Number(bom.base_quantity)).toFixed(5)
                : NIL}
            </td>
          </tr>
        ))}
      </tbody>
      <tfoot>
        <tr>
          <td>Total</td>
          <td className="num text-right">{KG(total)}</td>
          <td className="num text-right">100%</td>
          <td />
        </tr>
      </tfoot>
    </table>
  );
}

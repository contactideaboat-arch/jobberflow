/* eslint-disable @typescript-eslint/no-explicit-any */
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { IconAlert, IconPlus, IconPrint } from "@/components/icons";
import { PageHeader, StatusBadge } from "@/components/erp/AppShell";
import {
  EmptyState,
  ExportBar,
  Field,
  FormSection,
  NumInput,
  Panel,
  ReadOnlyValue,
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
import { DateFilter } from "@/components/erp/LedgerFilters";
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
import { Textarea } from "@/components/ui/textarea";
import { canWrite, db, useInvalidate, useRole, useRows } from "@/hooks/use-erp";
import { KG, PCS, PCT, dmy, errMsg, printElement, today } from "@/lib/erp";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/transactions/product-inward")({
  head: () => ({
    meta: [
      { title: "Product inward | JobberFlow" },
      {
        name: "description",
        content:
          "Receive finished products from jobbers. Standard BOM consumption plus one overall wastage figure per voucher.",
      },
    ],
  }),
  component: ProductInward,
});

const STATUSES = [
  { value: "", label: "All statuses" },
  { value: "DRAFT", label: "Draft" },
  { value: "POSTED", label: "Posted" },
  { value: "CANCELLED", label: "Cancelled" },
];

type Errors = {
  jobber?: string | undefined;
  product?: string | undefined;
  qty?: string | undefined;
  wastage?: string | undefined;
};

function ProductInward() {
  const { data: role } = useRole();
  const editable = canWrite(role);
  const invalidate = useInvalidate();
  const [confirmDialog, ask] = useConfirm();

  const [open, setOpen] = useState(false);
  const [viewId, setViewId] = useState<string | null>(null);
  const [lastSavedId, setLastSavedId] = useState<string | null>(null);
  const [cancelId, setCancelId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelError, setCancelError] = useState("");
  const [cancelBusy, setCancelBusy] = useState(false);
  const [busy, setBusy] = useState<"draft" | "post" | null>(null);
  const [errors, setErrors] = useState<Errors>({});
  const [statusFilter, setStatusFilter] = useState("");
  const [jobberFilter, setJobberFilter] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

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

  const { data: jobbers } = useRows("jobbers", ["jobbers"], (b) =>
    b.eq("status", true).order("code"),
  );
  const { data: products } = useRows("finished_products", ["finished_products"], (b) =>
    b.eq("status", true).order("code"),
  );
  const { data: boms } = useRows(
    "bom_headers",
    ["bom-active"],
    (b) => b.eq("active", true),
    "*, bom_items(*, raw_materials(code, name, uom))",
  );
  const { data: jb } = useRows("jobber_stock", ["jobber_stock"]);
  const { data: settings } = useRows("company_settings", ["company_settings"]);
  const vouchersQuery = useRows(
    "product_inward_headers",
    ["pi-list"],
    (b) => b.order("voucher_date", { ascending: false }).limit(500),
    "*, jobbers(code, name), finished_products(code, name, uom), product_inward_consumption(*, raw_materials(code, name, uom))",
  );
  const vouchers = (vouchersQuery.data ?? []) as any[];
  const status = queryStatus(vouchersQuery);

  const threshold = Number((settings ?? [])[0]?.wastage_warning_threshold ?? 5);
  const bom = useMemo(
    () => (boms ?? []).find((b: any) => b.product_id === productId),
    [boms, productId],
  );
  const jobberOpts = (jobbers ?? []).map((j: any) => ({
    value: j.id,
    label: `${j.code}, ${j.name}`,
  }));
  const productOpts = (products ?? []).map((p: any) => ({
    value: p.id,
    label: `${p.code}, ${p.name}`,
  }));
  const jobberName = (jobbers ?? []).find((j: any) => j.id === jobberId)?.name;
  const productName = (products ?? []).find((p: any) => p.id === productId)?.name;

  const primaryItem = (bom?.bom_items ?? []).find((i: any) => i.is_primary_material);

  /*
   * Preview of what posting will deduct. The server recalculates on post;
   * this mirrors it so the operator sees the effect before saving.
   */
  const preview = useMemo(() => {
    if (!bom || !qty) return [];
    const base = Number(bom.base_quantity) || 1;
    return (bom.bom_items ?? [])
      .slice()
      .sort((a: any, b: any) => a.sequence - b.sequence)
      .map((i: any) => {
        const std =
          Math.round(((Number(qty) / base) * Number(i.standard_quantity) + Number.EPSILON) * 1000) /
          1000;
        const waste = i.is_primary_material ? Number(wastage) || 0 : 0;
        const avail = Number(
          (jb ?? []).find((s: any) => s.material_id === i.material_id && s.jobber_id === jobberId)
            ?.balance ?? 0,
        );
        return {
          material_id: i.material_id,
          name: i.raw_materials?.name,
          code: i.raw_materials?.code,
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
  const overThreshold = wastagePct > threshold;

  const grid = useGrid(vouchers, {
    search: (v) =>
      [
        v.voucher_number,
        v.jobbers?.name,
        v.finished_products?.name,
        v.finished_products?.code,
        v.batch_number,
        v.jobber_challan_number,
        v.production_reference,
      ].join(" "),
    filter: (v) =>
      (!statusFilter || v.status === statusFilter) &&
      (!jobberFilter || v.jobber_id === jobberFilter) &&
      (!from || v.voucher_date >= from) &&
      (!to || v.voucher_date <= to),
    filtersActive: !!(statusFilter || jobberFilter || from || to),
    sorters: {
      number: (v) => v.voucher_number,
      date: (v) => v.voucher_date,
      qty: (v) => Number(v.finished_quantity),
      wastage: (v) => Number(v.wastage_percentage),
    },
    initialSort: { key: "date", direction: "desc" },
  });

  const dirty = !!jobberId || !!productId || !!qty || !!wastage || !!remarks || !!challan;
  const [discardDialog, onOpenChange] = useGuardedClose(dirty && !busy, setOpen);

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
    setErrors({});
  };

  const validate = (post: boolean) => {
    const next: Errors = {};
    if (!jobberId) next.jobber = "Choose the jobber who returned the goods.";
    if (!productId) next.product = "Choose the finished product.";
    else if (!bom) next.product = "This product has no active BOM. Create one before receiving it.";
    else if (!primaryItem) next.product = "The active BOM has no primary material.";
    if (!(Number(qty) > 0)) next.qty = "Enter the pieces received, more than zero.";
    if (Number(wastage) < 0) next.wastage = "Wastage cannot be negative.";
    setErrors(next);
    if (Object.values(next).some(Boolean)) return false;
    if (post && shortages.length) {
      toast.error("The jobber does not hold enough material for this quantity. See the table.");
      return false;
    }
    return true;
  };

  const refresh = () =>
    invalidate([
      ["pi-list"],
      ["jobber_stock"],
      ["finished_goods_stock"],
      ["warehouse_stock"],
      ["rm_ledger"],
      ["fg_ledger"],
    ]);

  const save = async (post: boolean) => {
    if (busy || !validate(post)) return;
    setBusy(post ? "post" : "draft");
    const { data: num, error: numErr } = await db.rpc("next_voucher_number", { _prefix: "PIN" });
    if (numErr) {
      setBusy(null);
      return void toast.error(`Not saved. ${errMsg(numErr)}`);
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
      setBusy(null);
      return void toast.error(`Not saved. ${errMsg(error)}`);
    }
    if (post) {
      const { error: postErr } = await db.rpc("post_product_inward", { _id: created.id });
      if (postErr) {
        // The draft exists; close so it cannot be written twice.
        setBusy(null);
        setOpen(false);
        reset();
        setLastSavedId(created.id);
        invalidate([["pi-list"]]);
        return void toast.error(
          `${num} is saved as a draft, but posting failed: ${errMsg(postErr)}. No stock moved. Post it from the register once fixed.`,
          { duration: 10000 },
        );
      }
    }
    setBusy(null);
    toast.success(
      post
        ? `${num} posted. ${PCS(qty)} pcs of ${productName} received from ${jobberName}; ${KG(totalStd + (Number(wastage) || 0))} kg deducted from the jobber.`
        : `${num} saved as a draft. No stock has moved yet.`,
    );
    setOpen(false);
    reset();
    setLastSavedId(created.id);
    refresh();
  };

  const postExisting = async (v: any) => {
    const ok = await ask({
      title: `Post ${v.voucher_number}?`,
      body: (
        <>
          <p>
            Posting receives{" "}
            <span className="num font-medium text-foreground">{PCS(v.finished_quantity)} pcs</span>{" "}
            of {v.finished_products?.name} into finished goods and deducts the BOM consumption plus{" "}
            <span className="num font-medium text-foreground">{KG(v.overall_wastage_kg)} kg</span>{" "}
            wastage from {v.jobbers?.name}.
          </p>
          <p>A posted voucher can only be reversed by cancelling it.</p>
        </>
      ),
      confirm: "Post voucher",
    });
    if (!ok) return;
    const { error } = await db.rpc("post_product_inward", { _id: v.id });
    if (error)
      return void toast.error(`${v.voucher_number} not posted. ${errMsg(error)} No stock moved.`);
    toast.success(`${v.voucher_number} posted.`);
    setLastSavedId(v.id);
    refresh();
  };

  const cancelVoucher = async () => {
    if (cancelBusy || !cancelId) return;
    if (cancelReason.trim().length < 3) {
      setCancelError("Give a reason of at least 3 characters. It is kept with the voucher.");
      return;
    }
    setCancelBusy(true);
    const { error } = await db.rpc("cancel_voucher", {
      _id: cancelId,
      _reason: cancelReason,
      _voucher_type: "PRODUCT_INWARD",
    });
    setCancelBusy(false);
    if (error) return void setCancelError(`Not cancelled. ${errMsg(error)}`);
    const cancelled = vouchers.find((v) => v.id === cancelId);
    toast.success(`${cancelled?.voucher_number ?? "Voucher"} cancelled and its stock reversed.`);
    setLastSavedId(cancelId);
    setCancelId(null);
    setCancelReason("");
    refresh();
  };

  const viewing = useMemo(() => vouchers.find((v) => v.id === viewId), [vouchers, viewId]);
  const cancelling = vouchers.find((v) => v.id === cancelId);

  return (
    <div>
      <PageHeader
        title="Product inward"
        subtitle="Receive finished goods from a jobber. The active BOM sets standard consumption; one wastage figure per voucher is charged to the primary material."
        actions={
          <>
            <ExportBar
              filename="product-inward-vouchers"
              rows={grid.matched.map((v: any) => ({
                Voucher: v.voucher_number,
                Date: dmy(v.voucher_date),
                Jobber: v.jobbers?.name,
                Product: v.finished_products?.name,
                "Finished quantity": v.finished_quantity,
                "Standard consumption": v.total_standard_consumption,
                "Overall wastage (kg)": v.overall_wastage_kg,
                "Actual consumption": v.actual_total_consumption,
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
                <IconPlus /> New inward
              </Button>
            )}
          </>
        }
      />

      <Panel>
        <GridToolbar
          grid={grid}
          searchLabel="Search product inwards"
          placeholder="Voucher, jobber, product, batch or challan"
          noun={["voucher", "vouchers"]}
          onReset={() => {
            setStatusFilter("");
            setJobberFilter("");
            setFrom("");
            setTo("");
          }}
        >
          <FilterSelect
            label="Status"
            value={statusFilter}
            onChange={(value) => {
              setStatusFilter(value);
              grid.resetPage();
            }}
            options={STATUSES}
          />
          <FilterSelect
            label="Jobber"
            value={jobberFilter}
            onChange={(value) => {
              setJobberFilter(value);
              grid.resetPage();
            }}
            options={[{ value: "", label: "All jobbers" }, ...jobberOpts]}
          />
          <DateFilter label="From" value={from} onChange={setFrom} max={to || undefined} />
          <DateFilter label="To" value={to} onChange={setTo} min={from || undefined} />
        </GridToolbar>
        <GridScroll sticky>
          <table className="erp-table min-w-[64rem]">
            <caption className="sr-only">Product inward vouchers</caption>
            <thead>
              <tr>
                <SortHeader grid={grid} sortKey="number">
                  Voucher
                </SortHeader>
                <SortHeader grid={grid} sortKey="date">
                  Date
                </SortHeader>
                <th scope="col">Jobber</th>
                <th scope="col">Product</th>
                <SortHeader grid={grid} sortKey="qty" align="right">
                  Pieces
                </SortHeader>
                <th scope="col" className="text-right!">
                  Standard (kg)
                </th>
                <th scope="col" className="text-right!">
                  Wastage (kg)
                </th>
                <th scope="col" className="text-right!">
                  Actual (kg)
                </th>
                <SortHeader grid={grid} sortKey="wastage" align="right">
                  Wastage %
                </SortHeader>
                <th scope="col">Status</th>
                <th scope="col">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {status !== "ready" ? (
                <RegisterState
                  status={status}
                  cols={11}
                  onRetry={() => void vouchersQuery.refetch()}
                />
              ) : grid.matched.length === 0 ? (
                <RegisterState
                  status="ready"
                  cols={11}
                  emptyTitle={
                    grid.isFiltered
                      ? "No voucher matches these filters."
                      : "No production received yet."
                  }
                  emptyBody={
                    grid.isFiltered
                      ? "Widen the dates or clear the filters."
                      : "Record an inward when a jobber returns finished goods. It applies the BOM and records wastage."
                  }
                />
              ) : (
                grid.pageRows.map((v: any) => {
                  const over = Number(v.wastage_percentage) > threshold;
                  return (
                    <tr
                      key={v.id}
                      aria-selected={lastSavedId === v.id || viewId === v.id || undefined}
                    >
                      <th scope="row" className="text-left font-normal">
                        <button
                          type="button"
                          onClick={() => setViewId(v.id)}
                          className="num cursor-pointer font-medium hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        >
                          {v.voucher_number}
                        </button>
                      </th>
                      <td className="num whitespace-nowrap">{dmy(v.voucher_date)}</td>
                      <td className="max-w-40 truncate">{v.jobbers?.name}</td>
                      <td className="max-w-44 truncate">{v.finished_products?.name}</td>
                      <td className="num text-right">{PCS(v.finished_quantity)}</td>
                      <td className="num text-right">{KG(v.total_standard_consumption)}</td>
                      <td className="num text-right">{KG(v.overall_wastage_kg)}</td>
                      <td className="num text-right">{KG(v.actual_total_consumption)}</td>
                      <td
                        className={cn(
                          "num whitespace-nowrap text-right",
                          over && "font-semibold text-destructive",
                        )}
                      >
                        {PCT(v.wastage_percentage)}
                        {over && <span className="sr-only"> (over the {threshold}% limit)</span>}
                        {over && (
                          <IconAlert
                            className="ml-1 inline size-3.5 align-[-2px]"
                            aria-hidden="true"
                          />
                        )}
                      </td>
                      <td>
                        <StatusBadge status={v.status} />
                      </td>
                      <td className="whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button size="sm" variant="ghost" onClick={() => setViewId(v.id)}>
                            Open
                          </Button>
                          {editable && v.status === "DRAFT" && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => void postExisting(v)}
                            >
                              Post
                            </Button>
                          )}
                          {editable && v.status === "POSTED" && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setCancelId(v.id);
                                setCancelReason("");
                                setCancelError("");
                              }}
                            >
                              Cancel
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

      {/* Entry ------------------------------------------------------------------- */}
      <Dialog open={open} onOpenChange={(value) => void onOpenChange(value)}>
        <DialogContent className="max-h-[92dvh] overflow-y-auto sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>New product inward</DialogTitle>
            <DialogDescription>
              Standard consumption comes from the product's active BOM. Wastage is charged to the
              primary material only.
            </DialogDescription>
          </DialogHeader>
          <form
            className="space-y-6"
            onSubmit={(event) => {
              event.preventDefault();
              void save(true);
            }}
          >
            <FormSection title="Source">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <Field label="Voucher date" required>
                  <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
                </Field>
                <Field label="Jobber" required error={errors.jobber} className="sm:col-span-2">
                  <SearchSelect
                    options={jobberOpts}
                    value={jobberId}
                    onChange={(value) => {
                      setJobberId(value);
                      setErrors((e) => ({ ...e, jobber: undefined }));
                    }}
                  />
                </Field>
                <Field label="Jobber challan number" optional>
                  <Input value={challan} onChange={(e) => setChallan(e.target.value)} />
                </Field>
              </div>
            </FormSection>

            <FormSection title="Production received">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <Field
                  label="Finished product"
                  required
                  error={errors.product}
                  className="sm:col-span-2"
                  hint={
                    bom ? (
                      <>
                        Active BOM <span className="num">{bom.bom_number}</span> ({bom.version}),
                        for {PCS(bom.base_quantity)} pcs.
                      </>
                    ) : productId ? undefined : (
                      "Only products with an active BOM can be received."
                    )
                  }
                >
                  <SearchSelect
                    options={productOpts}
                    value={productId}
                    onChange={(value) => {
                      setProductId(value);
                      setErrors((e) => ({ ...e, product: undefined }));
                    }}
                  />
                </Field>
                <Field label="Pieces received" required error={errors.qty}>
                  <NumInput
                    value={qty}
                    step="1"
                    onChange={(n) => {
                      setQty(n);
                      setErrors((e) => ({ ...e, qty: undefined }));
                    }}
                  />
                </Field>
                <Field label="Batch number" optional>
                  <Input value={batch} onChange={(e) => setBatch(e.target.value)} />
                </Field>
                <Field label="Production reference" optional className="sm:col-span-2">
                  <Input value={prodRef} onChange={(e) => setProdRef(e.target.value)} />
                </Field>
                <Field label="Remarks" optional className="sm:col-span-2">
                  <Input value={remarks} onChange={(e) => setRemarks(e.target.value)} />
                </Field>
              </div>
            </FormSection>

            <FormSection title="Wastage">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <Field
                  label="Overall wastage (kg)"
                  error={errors.wastage}
                  hint={
                    primaryItem
                      ? `Charged to ${primaryItem.raw_materials?.name}.`
                      : "Charged to the BOM's primary material."
                  }
                >
                  <NumInput value={wastage} onChange={setWastage} />
                </Field>
                <Field label="Wastage %" calculated hint={`Your limit is ${PCT(threshold)}.`}>
                  <ReadOnlyValue align="right" className={cn(overThreshold && "text-destructive")}>
                    {PCT(wastagePct)}
                    {overThreshold && (
                      <span className="ml-1.5 text-xs font-medium">Over limit</span>
                    )}
                  </ReadOnlyValue>
                </Field>
                <Field
                  label="Wastage remarks"
                  optional={!overThreshold}
                  className="sm:col-span-2"
                  hint={overThreshold ? "Explain why wastage is over the limit." : undefined}
                >
                  <Input
                    value={wastageRemarks}
                    onChange={(e) => setWastageRemarks(e.target.value)}
                  />
                </Field>
              </div>
            </FormSection>

            <section aria-labelledby="effect-heading" className="space-y-2">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h3 id="effect-heading" className="text-sm font-semibold">
                  What posting will deduct from {jobberName ?? "the jobber"}
                </h3>
                <span className="text-xs text-muted-foreground">Calculated from the BOM</span>
              </div>
              <div className="overflow-hidden rounded-md border">
                <div className="overflow-x-auto">
                  <table className="erp-table min-w-[40rem]">
                    <thead>
                      <tr>
                        <th scope="col">Material</th>
                        <th scope="col" className="text-right!">
                          Standard
                        </th>
                        <th scope="col" className="text-right!">
                          Wastage
                        </th>
                        <th scope="col" className="text-right!">
                          Deducted
                        </th>
                        <th scope="col" className="text-right!">
                          Jobber holds
                        </th>
                        <th scope="col" className="text-right!">
                          Left after
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {preview.length === 0 && (
                        <EmptyState
                          cols={6}
                          title="Choose a jobber, a product with an active BOM and the pieces received."
                          body="This shows the standard use, the wastage charged and what each material will have left."
                        />
                      )}
                      {preview.map((r: any) => (
                        <tr key={r.material_id}>
                          <th scope="row" className="text-left font-normal">
                            <span className="flex items-center gap-2">
                              {r.name}
                              {r.primary && <Badge>Primary</Badge>}
                            </span>
                            <span className="num block text-xs text-muted-foreground">
                              {r.code}
                            </span>
                          </th>
                          <td className="num text-right">{KG(r.std)}</td>
                          <td className="num text-right">{r.waste ? KG(r.waste) : NIL}</td>
                          <td className="num text-right font-semibold">{KG(r.total)}</td>
                          <td className="num text-right text-muted-foreground">{KG(r.avail)}</td>
                          <td
                            className={cn(
                              "num whitespace-nowrap text-right",
                              r.short && "font-semibold text-destructive",
                            )}
                          >
                            {KG(r.avail - r.total)}
                            {r.short && <span className="block text-xs font-medium">Short</span>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    {preview.length > 0 && (
                      <tfoot>
                        <tr>
                          <td>Total</td>
                          <td className="num text-right">{KG(totalStd)}</td>
                          <td className="num text-right">{KG(wastage)}</td>
                          <td className="num text-right">
                            {KG(totalStd + (Number(wastage) || 0))}
                          </td>
                          <td colSpan={2} />
                        </tr>
                      </tfoot>
                    )}
                  </table>
                </div>
              </div>
              {shortages.length > 0 && (
                <p
                  role="alert"
                  className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive-soft p-3 text-sm text-destructive"
                >
                  <IconAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                  <span>
                    {jobberName ?? "The jobber"} does not hold enough{" "}
                    {shortages.map((s: any) => s.name).join(", ")}. Transfer more material or reduce
                    the pieces before posting. You can still save a draft.
                  </span>
                </p>
              )}
            </section>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => void onOpenChange(false)}>
                Cancel
              </Button>
              <Button
                type="button"
                variant="secondary"
                loading={busy === "draft"}
                disabled={!!busy}
                onClick={() => void save(false)}
              >
                Save draft
              </Button>
              <Button
                type="submit"
                loading={busy === "post"}
                disabled={!!busy || shortages.length > 0}
              >
                Post and receive goods
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Detail ------------------------------------------------------------------- */}
      <Sheet open={!!viewing} onOpenChange={(value) => !value && setViewId(null)}>
        <SheetContent side="right" className="flex w-full flex-col gap-0 p-0 sm:max-w-2xl">
          {viewing && (
            <>
              <SheetHeader className="space-y-1 border-b p-5 pr-12 text-left">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Product inward</span>
                  <StatusBadge status={viewing.status} />
                </div>
                <SheetTitle className="num">{viewing.voucher_number}</SheetTitle>
                <SheetDescription>
                  {dmy(viewing.voucher_date)} · {PCS(viewing.finished_quantity)} pcs of{" "}
                  {viewing.finished_products?.name} from {viewing.jobbers?.name}
                </SheetDescription>
                <div className="flex flex-wrap gap-2 pt-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      printElement("pi-print", `Product inward ${viewing.voucher_number}`)
                    }
                  >
                    <IconPrint /> Print
                  </Button>
                  <Button size="sm" variant="outline" asChild>
                    <Link to="/reconciliation" search={{ jobber: viewing.jobber_id }}>
                      Reconcile jobber
                    </Link>
                  </Button>
                  {editable && viewing.status === "DRAFT" && (
                    <Button size="sm" onClick={() => void postExisting(viewing)}>
                      Post voucher
                    </Button>
                  )}
                  {editable && viewing.status === "POSTED" && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setCancelId(viewing.id);
                        setCancelReason("");
                        setCancelError("");
                      }}
                    >
                      Cancel voucher
                    </Button>
                  )}
                </div>
              </SheetHeader>
              <div id="pi-print" className="flex-1 space-y-5 overflow-y-auto p-5 text-sm">
                <h1 className="hidden text-base font-semibold print:block">
                  Product inward {viewing.voucher_number}
                </h1>
                <dl className="grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-3">
                  <Detail label="Date" value={dmy(viewing.voucher_date)} num />
                  <Detail
                    label="Jobber"
                    value={`${viewing.jobbers?.name} (${viewing.jobbers?.code})`}
                  />
                  <Detail
                    label="Product"
                    value={`${viewing.finished_products?.name} (${viewing.finished_products?.code})`}
                  />
                  <Detail
                    label="Pieces received"
                    value={`${PCS(viewing.finished_quantity)} pcs`}
                    num
                  />
                  <Detail
                    label="Standard consumption"
                    value={`${KG(viewing.total_standard_consumption)} kg`}
                    num
                  />
                  <Detail
                    label="Overall wastage"
                    value={`${KG(viewing.overall_wastage_kg)} kg`}
                    num
                  />
                  <Detail
                    label="Actual consumption"
                    value={`${KG(viewing.actual_total_consumption)} kg`}
                    num
                  />
                  <Detail
                    label="Wastage %"
                    value={`${PCT(viewing.wastage_percentage)}${Number(viewing.wastage_percentage) > threshold ? ", over limit" : ""}`}
                    num
                    tone={Number(viewing.wastage_percentage) > threshold ? "loss" : undefined}
                  />
                  <Detail label="Batch" value={viewing.batch_number} />
                  <Detail label="Jobber challan" value={viewing.jobber_challan_number} />
                  <Detail label="Production reference" value={viewing.production_reference} />
                  {viewing.status === "CANCELLED" && (
                    <Detail label="Cancellation reason" value={viewing.cancellation_reason} />
                  )}
                </dl>
                <section aria-labelledby="consumption-heading">
                  <h3 id="consumption-heading" className="mb-2 text-sm font-semibold">
                    Consumption recorded
                  </h3>
                  <table className="erp-table rounded-md border">
                    <thead>
                      <tr>
                        <th scope="col">Material</th>
                        <th scope="col" className="text-right!">
                          Standard
                        </th>
                        <th scope="col" className="text-right!">
                          Wastage
                        </th>
                        <th scope="col" className="text-right!">
                          Total
                        </th>
                        <th scope="col" className="text-right!">
                          Stock before
                        </th>
                        <th scope="col" className="text-right!">
                          Stock after
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {(viewing.product_inward_consumption ?? []).length === 0 && (
                        <EmptyState
                          cols={6}
                          title="Consumption is recorded when the voucher is posted."
                          body="Once posted, this shows standard BOM use, the wastage charged and the jobber's stock before and after for each material."
                        />
                      )}
                      {(viewing.product_inward_consumption ?? []).map((c: any) => (
                        <tr key={c.id}>
                          <th scope="row" className="text-left font-normal">
                            {c.raw_materials?.name}
                            <span className="num block text-xs text-muted-foreground">
                              {c.raw_materials?.code}
                            </span>
                          </th>
                          <td className="num text-right">{KG(c.standard_consumption)}</td>
                          <td className="num text-right">
                            {c.wastage_quantity > 0 ? KG(c.wastage_quantity) : NIL}
                          </td>
                          <td className="num text-right font-semibold">
                            {KG(Number(c.standard_consumption) + Number(c.wastage_quantity))}
                          </td>
                          <td className="num text-right">{KG(c.stock_before)}</td>
                          <td className="num text-right">{KG(c.stock_after)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </section>
                {viewing.wastage_remarks && (
                  <p>
                    <span className="text-muted-foreground">Wastage remarks: </span>
                    {viewing.wastage_remarks}
                  </p>
                )}
                {viewing.remarks && (
                  <p>
                    <span className="text-muted-foreground">Remarks: </span>
                    {viewing.remarks}
                  </p>
                )}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Cancel --------------------------------------------------------------------- */}
      <Dialog open={!!cancelId} onOpenChange={(v) => !v && !cancelBusy && setCancelId(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Cancel {cancelling?.voucher_number}?</DialogTitle>
            <DialogDescription>
              Cancelling removes{" "}
              <span className="num font-medium text-foreground">
                {PCS(cancelling?.finished_quantity)} pcs
              </span>{" "}
              from finished goods and returns the consumed raw material, including wastage, to{" "}
              {cancelling?.jobbers?.name}. The voucher stays in the register, marked cancelled.
            </DialogDescription>
          </DialogHeader>
          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              void cancelVoucher();
            }}
          >
            <Field label="Reason for cancelling" required error={cancelError || undefined}>
              <Textarea
                rows={3}
                value={cancelReason}
                onChange={(e) => {
                  setCancelReason(e.target.value);
                  setCancelError("");
                }}
              />
            </Field>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                disabled={cancelBusy}
                onClick={() => setCancelId(null)}
              >
                Keep voucher
              </Button>
              <Button type="submit" variant="destructive" loading={cancelBusy}>
                Cancel and reverse stock
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

function Detail({
  label,
  value,
  num,
  tone,
}: {
  label: string;
  value: string | null | undefined;
  num?: boolean;
  tone?: "loss" | undefined;
}) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className={cn("mt-0.5", num && "num", tone === "loss" && "font-medium text-destructive")}>
        {value || NIL}
      </dd>
    </div>
  );
}

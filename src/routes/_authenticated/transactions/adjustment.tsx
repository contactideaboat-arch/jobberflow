/* eslint-disable @typescript-eslint/no-explicit-any */
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { IconAlert, IconPlus } from "@/components/icons";
import { PageHeader, StatusBadge } from "@/components/erp/AppShell";
import {
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
import { Textarea } from "@/components/ui/textarea";
import { canWrite, db, useInvalidate, useRole, useRows } from "@/hooks/use-erp";
import { KG, PCS, dmy, errMsg, nextVoucherNumber, today } from "@/lib/erp";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/transactions/adjustment")({
  head: () => ({
    meta: [
      { title: "Stock adjustment | JobberFlow" },
      {
        name: "description",
        content:
          "Correct raw material or finished goods stock with a reasoned, audited increase or decrease.",
      },
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

type Errors = {
  jobber?: string | undefined;
  item?: string | undefined;
  quantity?: string | undefined;
  reason?: string | undefined;
};

const blank = (): Form => ({
  voucher_date: today(),
  location_type: "WAREHOUSE",
  jobber_id: "",
  material_id: "",
  product_id: "",
  adjustment_type: "NEGATIVE",
  quantity: 0,
  reason: "",
  remarks: "",
});

const LOCATION_LABEL: Record<string, string> = {
  WAREHOUSE: "Godown",
  JOBBER: "Jobber",
  FINISHED_GOODS: "Finished goods",
};

function AdjustmentPage() {
  const { data: role } = useRole();
  const writable = canWrite(role);
  const invalidate = useInvalidate();
  const [confirmDialog, ask] = useConfirm();

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Form>(blank());
  const [errors, setErrors] = useState<Errors>({});
  const [busy, setBusy] = useState<"draft" | "post" | null>(null);
  const [lastSavedId, setLastSavedId] = useState<string | null>(null);
  const [cancelId, setCancelId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelError, setCancelError] = useState("");
  const [cancelBusy, setCancelBusy] = useState(false);
  const [statusFilter, setStatusFilter] = useState("");
  const [locationFilter, setLocationFilter] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const query = useRows("stock_adjustments", ["stock_adjustments"], (b) =>
    b.order("created_at", { ascending: false }).limit(500),
  );
  const rows = (query.data ?? []) as any[];
  const status = queryStatus(query);
  const { data: materials } = useRows("raw_materials", ["raw_materials", "all"], (b) =>
    b.order("code"),
  );
  const { data: products } = useRows("finished_products", ["finished_products", "all"], (b) =>
    b.order("code"),
  );
  const { data: jobbers } = useRows("jobbers", ["jobbers", "all"], (b) => b.order("code"));
  const { data: wh } = useRows("warehouse_stock", ["warehouse_stock"]);
  const { data: jb } = useRows("jobber_stock", ["jobber_stock"]);
  const { data: fg } = useRows("finished_goods_stock", ["finished_goods_stock"]);

  const set = (patch: Partial<Form>) => {
    setForm((f) => ({ ...f, ...patch }));
    setErrors({});
  };
  const isFg = form.location_type === "FINISHED_GOODS";
  const unit = isFg ? "pcs" : "kg";
  const fmt = isFg ? PCS : KG;

  const label = (list: any[] | undefined, id: string | null) => {
    const r = (list ?? []).find((x: any) => x.id === id);
    return r ? `${r.code}, ${r.name}` : NIL;
  };
  const jobberName = (id: string | null) =>
    (jobbers ?? []).find((j: any) => j.id === id)?.name ?? NIL;
  const itemOf = (r: any) =>
    r.location_type === "FINISHED_GOODS"
      ? label(products, r.product_id)
      : label(materials, r.material_id);

  /** Current balance at the chosen location, for display only. */
  const current = (() => {
    if (isFg)
      return form.product_id
        ? Number((fg ?? []).find((r: any) => r.product_id === form.product_id)?.balance ?? 0)
        : null;
    if (!form.material_id) return null;
    if (form.location_type === "JOBBER")
      return form.jobber_id
        ? Number(
            (jb ?? []).find(
              (r: any) => r.material_id === form.material_id && r.jobber_id === form.jobber_id,
            )?.balance ?? 0,
          )
        : null;
    return Number((wh ?? []).find((r: any) => r.material_id === form.material_id)?.balance ?? 0);
  })();
  const signed = form.adjustment_type === "NEGATIVE" ? -form.quantity : form.quantity;
  const after = current === null ? null : current + signed;
  const where =
    form.location_type === "JOBBER"
      ? form.jobber_id
        ? jobberName(form.jobber_id)
        : "the jobber"
      : LOCATION_LABEL[form.location_type]!.toLowerCase() === "godown"
        ? "your godown"
        : "finished goods";
  const itemName = isFg ? label(products, form.product_id) : label(materials, form.material_id);

  const grid = useGrid(rows, {
    search: (r) =>
      [r.voucher_number, itemOf(r), jobberName(r.jobber_id), r.reason, r.remarks].join(" "),
    filter: (r) =>
      (!statusFilter || r.status === statusFilter) &&
      (!locationFilter || r.location_type === locationFilter) &&
      (!from || r.voucher_date >= from) &&
      (!to || r.voucher_date <= to),
    filtersActive: !!(statusFilter || locationFilter || from || to),
    sorters: {
      number: (r) => r.voucher_number,
      date: (r) => r.voucher_date,
      quantity: (r) => Number(r.quantity),
    },
    initialSort: { key: "date", direction: "desc" },
  });

  const dirty =
    JSON.stringify({ ...form, voucher_date: "" }) !==
    JSON.stringify({ ...blank(), voucher_date: "" });
  const [discardDialog, onOpenChange] = useGuardedClose(dirty && !busy, setOpen);

  const validate = () => {
    const next: Errors = {};
    if (form.location_type === "JOBBER" && !form.jobber_id) next.jobber = "Choose the jobber.";
    if (isFg && !form.product_id) next.item = "Choose the finished product.";
    if (!isFg && !form.material_id) next.item = "Choose the raw material.";
    if (!(form.quantity > 0)) next.quantity = "Enter a quantity more than zero.";
    if (!form.reason.trim()) next.reason = "Give the reason. It is kept with the adjustment.";
    setErrors(next);
    return !Object.values(next).some(Boolean);
  };

  const refresh = () =>
    invalidate([
      ["stock_adjustments"],
      ["warehouse_stock"],
      ["jobber_stock"],
      ["finished_goods_stock"],
      ["rm_ledger"],
      ["fg_ledger"],
    ]);

  const save = async (post: boolean) => {
    if (busy || !validate()) return;
    if (post) {
      const ok = await ask({
        title: "Post this adjustment?",
        body: (
          <>
            <p>
              {form.adjustment_type === "NEGATIVE" ? "Removes" : "Adds"}{" "}
              <span className="num font-medium text-foreground">
                {fmt(form.quantity)} {unit}
              </span>{" "}
              of {itemName} {form.adjustment_type === "NEGATIVE" ? "from" : "to"} {where}.
            </p>
            {current !== null && (
              <p>
                Balance goes from{" "}
                <span className="num font-medium text-foreground">{fmt(current)}</span> to{" "}
                <span className="num font-medium text-foreground">{fmt(after)}</span> {unit}.
              </p>
            )}
            <p>It can only be reversed by cancelling it.</p>
          </>
        ),
        confirm: "Post adjustment",
        tone: form.adjustment_type === "NEGATIVE" ? "destructive" : "default",
      });
      if (!ok) return;
    }
    setBusy(post ? "post" : "draft");
    let voucher_number = "";
    let createdId = "";
    try {
      voucher_number = await nextVoucherNumber("ADJ");
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
      createdId = data.id;
    } catch (e) {
      setBusy(null);
      toast.error(`Not saved. ${errMsg(e)}`);
      return;
    }
    if (post) {
      const { error: pErr } = await db.rpc("post_stock_adjustment", { _id: createdId });
      if (pErr) {
        setBusy(null);
        setOpen(false);
        setForm(blank());
        setLastSavedId(createdId);
        invalidate([["stock_adjustments"]]);
        toast.error(
          `${voucher_number} is saved as a draft, but posting failed: ${errMsg(pErr)}. No stock changed. Post it from the register once fixed.`,
          { duration: 10000 },
        );
        return;
      }
    }
    setBusy(null);
    toast.success(
      post
        ? `${voucher_number} posted. ${itemName} at ${where} is now ${after === null ? "updated" : `${fmt(after)} ${unit}`}.`
        : `${voucher_number} saved as a draft. No stock has changed yet.`,
    );
    setOpen(false);
    setForm(blank());
    setLastSavedId(createdId);
    refresh();
  };

  const post = async (r: any) => {
    const ok = await ask({
      title: `Post ${r.voucher_number}?`,
      body: (
        <p>
          {r.adjustment_type === "NEGATIVE" ? "Removes" : "Adds"}{" "}
          <span className="num font-medium text-foreground">{quantityOf(r)}</span> of {itemOf(r)}{" "}
          {r.adjustment_type === "NEGATIVE" ? "from" : "to"}{" "}
          {r.location_type === "JOBBER" ? jobberName(r.jobber_id) : LOCATION_LABEL[r.location_type]}
          .
        </p>
      ),
      confirm: "Post adjustment",
      tone: r.adjustment_type === "NEGATIVE" ? "destructive" : "default",
    });
    if (!ok) return;
    const { error } = await db.rpc("post_stock_adjustment", { _id: r.id });
    if (error) {
      toast.error(`${r.voucher_number} not posted. ${errMsg(error)} No stock changed.`);
      return;
    }
    toast.success(`${r.voucher_number} posted.`);
    setLastSavedId(r.id);
    refresh();
  };

  const cancel = async () => {
    if (cancelBusy || !cancelId) return;
    if (!cancelReason.trim()) {
      setCancelError("Give the reason for cancelling. It is kept with the adjustment.");
      return;
    }
    setCancelBusy(true);
    const { error } = await db.rpc("cancel_voucher", {
      _voucher_type: "ADJUSTMENT",
      _id: cancelId,
      _reason: cancelReason,
    });
    setCancelBusy(false);
    if (error) {
      setCancelError(`Not cancelled. ${errMsg(error)}`);
      return;
    }
    toast.success(
      `${rows.find((r) => r.id === cancelId)?.voucher_number ?? "Adjustment"} cancelled and its stock reversed.`,
    );
    setLastSavedId(cancelId);
    setCancelId(null);
    setCancelReason("");
    refresh();
  };

  const quantityOf = (r: any) =>
    r.location_type === "FINISHED_GOODS" ? `${PCS(r.quantity)} pcs` : `${KG(r.quantity)} kg`;
  const cancelling = rows.find((r) => r.id === cancelId);

  return (
    <div>
      <PageHeader
        title="Stock adjustment"
        subtitle="Only for a physical count difference, a damage or a data correction. Every adjustment carries a reason and is audited."
        actions={
          <>
            <ExportBar
              filename="stock-adjustments"
              rows={grid.matched.map((r: any) => ({
                Voucher: r.voucher_number,
                Date: dmy(r.voucher_date),
                Location: LOCATION_LABEL[r.location_type] ?? r.location_type,
                Item: itemOf(r),
                Jobber: r.jobber_id ? jobberName(r.jobber_id) : "",
                Direction: r.adjustment_type === "NEGATIVE" ? "Decrease" : "Increase",
                Quantity: r.quantity,
                Reason: r.reason,
                Status: r.status,
              }))}
            />
            {writable && (
              <Button
                size="sm"
                onClick={() => {
                  setForm(blank());
                  setErrors({});
                  setOpen(true);
                }}
              >
                <IconPlus /> New adjustment
              </Button>
            )}
          </>
        }
      />

      <Panel>
        <GridToolbar
          grid={grid}
          searchLabel="Search adjustments"
          placeholder="Voucher, item, jobber or reason"
          noun={["adjustment", "adjustments"]}
          onReset={() => {
            setStatusFilter("");
            setLocationFilter("");
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
            options={[
              { value: "", label: "All statuses" },
              { value: "DRAFT", label: "Draft" },
              { value: "POSTED", label: "Posted" },
              { value: "CANCELLED", label: "Cancelled" },
            ]}
          />
          <FilterSelect
            label="Location"
            value={locationFilter}
            onChange={(value) => {
              setLocationFilter(value);
              grid.resetPage();
            }}
            options={[
              { value: "", label: "All locations" },
              { value: "WAREHOUSE", label: "Godown" },
              { value: "JOBBER", label: "Jobber" },
              { value: "FINISHED_GOODS", label: "Finished goods" },
            ]}
          />
          <DateFilter label="From" value={from} onChange={setFrom} max={to || undefined} />
          <DateFilter label="To" value={to} onChange={setTo} min={from || undefined} />
        </GridToolbar>
        <GridScroll sticky>
          <table className="erp-table min-w-[60rem]">
            <caption className="sr-only">Stock adjustments</caption>
            <thead>
              <tr>
                <SortHeader grid={grid} sortKey="number">
                  Voucher
                </SortHeader>
                <SortHeader grid={grid} sortKey="date">
                  Date
                </SortHeader>
                <th scope="col">Location</th>
                <th scope="col">Item</th>
                <th scope="col">Change</th>
                <SortHeader grid={grid} sortKey="quantity" align="right">
                  Quantity
                </SortHeader>
                <th scope="col">Reason</th>
                <th scope="col">Status</th>
                <th scope="col">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {status !== "ready" ? (
                <RegisterState status={status} cols={9} onRetry={() => void query.refetch()} />
              ) : grid.matched.length === 0 ? (
                <RegisterState
                  status="ready"
                  cols={9}
                  emptyTitle={
                    grid.isFiltered
                      ? "No adjustment matches these filters."
                      : "No adjustments recorded."
                  }
                  emptyBody={
                    grid.isFiltered
                      ? "Widen the dates or clear the filters."
                      : "Use an adjustment only for a physical count difference, a damage or a data correction."
                  }
                />
              ) : (
                grid.pageRows.map((r: any) => (
                  <tr key={r.id} aria-selected={lastSavedId === r.id || undefined}>
                    <th scope="row" className="num whitespace-nowrap text-left font-medium">
                      {r.voucher_number}
                    </th>
                    <td className="num whitespace-nowrap">{dmy(r.voucher_date)}</td>
                    <td className="whitespace-nowrap">
                      {r.location_type === "JOBBER"
                        ? jobberName(r.jobber_id)
                        : LOCATION_LABEL[r.location_type]}
                      {r.location_type === "JOBBER" && (
                        <span className="block text-xs text-muted-foreground">Jobber</span>
                      )}
                    </td>
                    <td className="max-w-56 truncate">{itemOf(r)}</td>
                    <td>
                      <Badge variant={r.adjustment_type === "NEGATIVE" ? "secondary" : "info"}>
                        {r.adjustment_type === "NEGATIVE" ? "Decrease" : "Increase"}
                      </Badge>
                    </td>
                    <td className="num whitespace-nowrap text-right font-medium">
                      {r.adjustment_type === "NEGATIVE" ? "−" : "+"}
                      {quantityOf(r)}
                    </td>
                    <td className="max-w-64 truncate text-muted-foreground" title={r.reason}>
                      {r.reason}
                    </td>
                    <td>
                      <StatusBadge status={r.status} />
                    </td>
                    <td className="whitespace-nowrap text-right">
                      {writable && r.status === "DRAFT" && (
                        <Button size="sm" variant="outline" onClick={() => void post(r)}>
                          Post
                        </Button>
                      )}
                      {writable && r.status === "POSTED" && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setCancelId(r.id);
                            setCancelReason("");
                            setCancelError("");
                          }}
                        >
                          Cancel
                        </Button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </GridScroll>
        <GridPager grid={grid} />
      </Panel>

      <Dialog open={open} onOpenChange={(value) => void onOpenChange(value)}>
        <DialogContent className="max-h-[92dvh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>New stock adjustment</DialogTitle>
            <DialogDescription>
              Posting changes the balance immediately. Save a draft if it needs checking first.
            </DialogDescription>
          </DialogHeader>
          <form
            className="space-y-6"
            onSubmit={(event) => {
              event.preventDefault();
              void save(true);
            }}
          >
            <FormSection title="What is being adjusted">
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Voucher date" required>
                  <Input
                    type="date"
                    value={form.voucher_date}
                    onChange={(e) => set({ voucher_date: e.target.value })}
                  />
                </Field>
                <Field label="Location" required>
                  <SearchSelect
                    options={[
                      { value: "WAREHOUSE", label: "Godown, raw material" },
                      { value: "JOBBER", label: "Jobber, raw material" },
                      { value: "FINISHED_GOODS", label: "Finished goods" },
                    ]}
                    value={form.location_type}
                    onChange={(v) =>
                      set({
                        location_type: v as Form["location_type"],
                        material_id: "",
                        product_id: "",
                        jobber_id: "",
                      })
                    }
                  />
                </Field>
                {form.location_type === "JOBBER" && (
                  <Field label="Jobber" required error={errors.jobber}>
                    <SearchSelect
                      options={(jobbers ?? []).map((j: any) => ({
                        value: j.id,
                        label: `${j.code}, ${j.name}`,
                      }))}
                      value={form.jobber_id}
                      onChange={(v) => set({ jobber_id: v })}
                    />
                  </Field>
                )}
                <Field
                  label={isFg ? "Finished product" : "Raw material"}
                  required
                  error={errors.item}
                >
                  <SearchSelect
                    options={(isFg ? (products ?? []) : (materials ?? [])).map((m: any) => ({
                      value: m.id,
                      label: `${m.code}, ${m.name}`,
                    }))}
                    value={isFg ? form.product_id : form.material_id}
                    onChange={(v) => set(isFg ? { product_id: v } : { material_id: v })}
                  />
                </Field>
              </div>
            </FormSection>

            <FormSection title="Change">
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="sm:col-span-3">
                  <p id="direction-label" className="mb-1.5 text-[0.8125rem] font-medium">
                    Direction
                  </p>
                  {/*
                    Toggle buttons in a labelled group, not role="radio". A
                    radiogroup promises arrow-key navigation and a single tab
                    stop; these are two independent toggles and behaved like
                    neither. aria-pressed states each button's own condition.
                  */}
                  <div
                    role="group"
                    aria-labelledby="direction-label"
                    className="inline-flex h-control items-center gap-0.5 rounded-md border bg-subtle p-0.5 pointer-coarse:min-h-11"
                  >
                    {(["NEGATIVE", "POSITIVE"] as const).map((type) => (
                      <button
                        key={type}
                        type="button"
                        aria-pressed={form.adjustment_type === type}
                        onClick={() => set({ adjustment_type: type })}
                        className={cn(
                          "h-full cursor-pointer rounded-[5px] px-3 text-[0.8125rem] font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring pointer-coarse:min-h-11",
                          form.adjustment_type === type &&
                            "bg-card text-foreground ring-1 ring-border",
                        )}
                      >
                        {type === "NEGATIVE" ? "Decrease stock" : "Increase stock"}
                      </button>
                    ))}
                  </div>
                </div>
                <Field label={`Quantity (${unit})`} required error={errors.quantity}>
                  <NumInput
                    value={form.quantity}
                    step={isFg ? "1" : "0.001"}
                    onChange={(n) => set({ quantity: n })}
                  />
                </Field>
                <Field label="Balance now" calculated>
                  <ReadOnlyValue align="right">
                    {current === null ? NIL : `${fmt(current)} ${unit}`}
                  </ReadOnlyValue>
                </Field>
                <Field label="Balance after posting" calculated>
                  <ReadOnlyValue
                    align="right"
                    className={cn(after !== null && after < 0 && "text-destructive")}
                  >
                    {after === null ? NIL : `${fmt(after)} ${unit}`}
                  </ReadOnlyValue>
                </Field>
              </div>
              {after !== null && after < 0 && (
                <p
                  role="alert"
                  className="flex items-start gap-2 text-xs font-medium text-destructive"
                >
                  <IconAlert className="mt-px size-3.5 shrink-0" aria-hidden="true" />
                  This takes the balance below zero. Check the count before posting.
                </p>
              )}
            </FormSection>

            <FormSection title="Why">
              <div className="grid gap-3">
                <Field
                  label="Reason"
                  required
                  error={errors.reason}
                  hint="For example: physical count on 12/08, damaged in storage, wrong quantity on an earlier voucher."
                >
                  <Textarea
                    rows={2}
                    value={form.reason}
                    onChange={(e) => set({ reason: e.target.value })}
                  />
                </Field>
                <Field label="Remarks" optional>
                  <Input value={form.remarks} onChange={(e) => set({ remarks: e.target.value })} />
                </Field>
              </div>
            </FormSection>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                disabled={!!busy}
                onClick={() => void onOpenChange(false)}
              >
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
              <Button type="submit" loading={busy === "post"} disabled={!!busy}>
                Review and post
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!cancelId} onOpenChange={(o) => !o && !cancelBusy && setCancelId(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Cancel {cancelling?.voucher_number}?</DialogTitle>
            <DialogDescription>
              Cancelling reverses this adjustment: the{" "}
              {cancelling?.adjustment_type === "NEGATIVE" ? "decrease" : "increase"} of{" "}
              <span className="num font-medium text-foreground">
                {cancelling ? quantityOf(cancelling) : ""}
              </span>{" "}
              is undone with an audit entry. The adjustment stays in the register, marked cancelled.
            </DialogDescription>
          </DialogHeader>
          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              void cancel();
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
                Keep adjustment
              </Button>
              <Button type="submit" variant="destructive" loading={cancelBusy}>
                Cancel and reverse
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

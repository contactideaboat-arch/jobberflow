/* eslint-disable @typescript-eslint/no-explicit-any */
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { IconArrowRight, IconPlus, IconPrint, IconScrap } from "@/components/icons";
import { PageHeader, StatusBadge } from "@/components/erp/AppShell";
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
import { DateFilter } from "@/components/erp/LedgerFilters";
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
import { KG, NUM, dmy, errMsg, printElement, today } from "@/lib/erp";

export type ExtraField = {
  key: string;
  label: string;
  type?: "text" | "date" | "select";
  options?: string[];
  hint?: string;
};

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
  /** where the stock is deducted from, used to show live availability */
  stockScope: "WAREHOUSE" | "JOBBER" | "NONE";
  extraFields: ExtraField[];
  itemLabel?: string;
};

type Line = { material_id: string; quantity: number; remarks: string };
type Errors = {
  jobber?: string | undefined;
  lines?: string | undefined;
  rows?: Record<number, string>;
};

const STATUSES = [
  { value: "", label: "All statuses" },
  { value: "DRAFT", label: "Draft" },
  { value: "POSTED", label: "Posted" },
  { value: "CANCELLED", label: "Cancelled" },
];

const sentence = (value: string) => value.charAt(0) + value.slice(1).toLowerCase();

/**
 * One register-and-entry screen for every material voucher that moves stock
 * between the supplier, the godown and a jobber: raw material inward,
 * transfer to jobber and material return. The config says which.
 */
export function ItemVoucher({ config }: { config: ItemVoucherConfig }) {
  const { data: role } = useRole();
  const editable = canWrite(role);
  const invalidate = useInvalidate();
  const [confirmDialog, ask] = useConfirm();

  const [open, setOpen] = useState(false);
  const [viewId, setViewId] = useState<string | null>(null);
  const [lastSavedId, setLastSavedId] = useState<string | null>(null);
  const [busy, setBusy] = useState<"draft" | "post" | null>(null);
  const [date, setDate] = useState(today());
  const [jobberId, setJobberId] = useState("");
  const [extras, setExtras] = useState<Record<string, string>>({});
  const [remarks, setRemarks] = useState("");
  const [lines, setLines] = useState<Line[]>([]);
  const [errors, setErrors] = useState<Errors>({});
  /** A voucher already written by a save that failed part-way; a retry continues it. */
  const [pending, setPending] = useState<{
    id: string;
    number: string;
    linesSaved: boolean;
  } | null>(null);
  const [cancelId, setCancelId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelError, setCancelError] = useState("");
  const [cancelBusy, setCancelBusy] = useState(false);
  const [statusFilter, setStatusFilter] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const { data: materials } = useRows("raw_materials", ["raw_materials"], (b) =>
    b.eq("status", true).order("code"),
  );
  const { data: jobbers } = useRows("jobbers", ["jobbers"], (b) =>
    b.eq("status", true).order("code"),
  );
  const { data: wh } = useRows("warehouse_stock", ["warehouse_stock"]);
  const { data: jb } = useRows("jobber_stock", ["jobber_stock"]);
  const listKey = [`${config.kind}-list`];
  const vouchersQuery = useRows(
    config.headerTable,
    listKey,
    (b) =>
      b
        .order("voucher_date", { ascending: false })
        .order("voucher_number", { ascending: false })
        .limit(500),
    `*, ${config.needsJobber ? "jobbers(code, name)," : ""} ${config.itemTable}(*, raw_materials(code, name, uom))`,
  );
  const vouchers = (vouchersQuery.data ?? []) as any[];
  const status = queryStatus(vouchersQuery);
  const rowsFor = (v: any) => (v?.[config.itemTable] ?? []) as any[];
  const totalOf = (v: any) => rowsFor(v).reduce((s, i) => s + Number(i.quantity), 0);
  const visibleExtras = config.extraFields.slice(0, 2);
  const REGISTER_COLS = 6 + (config.needsJobber ? 1 : 0) + visibleExtras.length;

  const materialOpts = (materials ?? []).map((m: any) => ({
    value: m.id,
    label: `${m.code}, ${m.name}`,
    hint: m.uom,
  }));
  const jobberOpts = (jobbers ?? []).map((j: any) => ({
    value: j.id,
    label: `${j.code}, ${j.name}`,
  }));
  const jobberName = (jobbers ?? []).find((j: any) => j.id === jobberId)?.name as
    string | undefined;

  const available = (materialId: string) => {
    if (config.stockScope === "WAREHOUSE")
      return Number((wh ?? []).find((r: any) => r.material_id === materialId)?.balance ?? 0);
    if (config.stockScope === "JOBBER")
      return Number(
        (jb ?? []).find((r: any) => r.material_id === materialId && r.jobber_id === jobberId)
          ?.balance ?? 0,
      );
    return 0;
  };

  /** Where posting this voucher moves material from and to, in words. */
  const flow = (v?: any) => {
    const jobber = v ? v.jobbers?.name : jobberName;
    const supplier = v ? v.supplier : extras["supplier"];
    if (config.stockScope === "WAREHOUSE")
      return { from: "Your godown", to: jobber ? `${jobber} (jobber)` : "the jobber" };
    if (config.stockScope === "JOBBER")
      return { from: jobber ? `${jobber} (jobber)` : "the jobber", to: "Your godown" };
    return { from: supplier || "Supplier", to: "Your godown" };
  };

  const viewing = useMemo(() => vouchers.find((v) => v.id === viewId), [vouchers, viewId]);
  const totalQty = lines.reduce((s, l) => s + Number(l.quantity || 0), 0);

  const grid = useGrid(vouchers, {
    search: (v) =>
      [
        v.voucher_number,
        v.jobbers?.name,
        v.jobbers?.code,
        ...config.extraFields.map((f) => v[f.key]),
        ...rowsFor(v).map((i) => i.raw_materials?.name),
        v.remarks,
      ].join(" "),
    filter: (v) =>
      (!statusFilter || v.status === statusFilter) &&
      (!from || v.voucher_date >= from) &&
      (!to || v.voucher_date <= to),
    filtersActive: !!(statusFilter || from || to),
    sorters: {
      number: (v) => v.voucher_number,
      date: (v) => v.voucher_date,
      total: (v) => totalOf(v),
    },
    initialSort: { key: "date", direction: "desc" },
  });

  const dirty = !!jobberId || lines.length > 0 || !!remarks || Object.values(extras).some(Boolean);
  const [discardDialog, onOpenChange] = useGuardedClose(dirty && !busy && !pending, setOpen);

  const reset = () => {
    setDate(today());
    setJobberId("");
    setExtras({});
    setRemarks("");
    setLines([]);
    setErrors({});
    setPending(null);
  };

  const setLine = (i: number, patch: Partial<Line>) => {
    setLines((rows) => rows.map((r, x) => (x === i ? { ...r, ...patch } : r)));
    setErrors((e) => ({ ...e, lines: undefined, rows: { ...e.rows, [i]: "" } }));
  };

  const validate = () => {
    const next: Errors = { rows: {} };
    if (config.needsJobber && !jobberId) next.jobber = "Choose the jobber.";
    if (!lines.length) next.lines = "Add at least one material line.";
    const seen = new Set<string>();
    lines.forEach((l, i) => {
      if (!l.material_id) next.rows![i] = "Choose a material.";
      else if (seen.has(l.material_id)) next.rows![i] = "This material is already on the voucher.";
      else if (!(Number(l.quantity) > 0)) next.rows![i] = "Enter a quantity more than zero.";
      else if (config.stockScope !== "NONE" && Number(l.quantity) > available(l.material_id))
        next.rows![i] = `Only ${KG(available(l.material_id))} available.`;
      seen.add(l.material_id);
    });
    setErrors(next);
    return !next.jobber && !next.lines && !Object.values(next.rows!).some(Boolean);
  };

  const refreshStock = () =>
    invalidate([listKey, ["warehouse_stock"], ["jobber_stock"], ["rm_ledger"], ["rm-ledger"]]);

  const save = async (post: boolean) => {
    if (busy) return;
    if (!pending && !validate()) return;
    setBusy(post ? "post" : "draft");

    let header = pending;
    if (!header) {
      const { data: num, error: numErr } = await db.rpc("next_voucher_number", {
        _prefix: config.prefix,
      });
      if (numErr) {
        setBusy(null);
        toast.error(`Not saved. ${errMsg(numErr)}`);
        return;
      }
      const record: any = {
        voucher_number: num,
        voucher_date: date,
        remarks: remarks || null,
        status: "DRAFT",
      };
      if (config.needsJobber) record.jobber_id = jobberId;
      config.extraFields.forEach((f) => {
        record[f.key] = extras[f.key] || (f.type === "select" ? f.options?.[0] : null);
      });
      const { data: created, error } = await db
        .from(config.headerTable)
        .insert(record)
        .select("id")
        .single();
      if (error) {
        setBusy(null);
        toast.error(`Not saved. ${errMsg(error)}`);
        return;
      }
      header = { id: created.id, number: num, linesSaved: false };
    }

    if (!header.linesSaved) {
      const { error: itemErr } = await db.from(config.itemTable).insert(
        lines.map((l) => ({
          header_id: header!.id,
          material_id: l.material_id,
          quantity: Number(l.quantity),
          remarks: l.remarks || null,
        })),
      );
      if (itemErr) {
        // The header exists. Keep the form and remember it, so a retry adds
        // the lines to this voucher instead of creating a second one.
        setPending(header);
        setBusy(null);
        invalidate([listKey]);
        toast.error(
          `${header.number} was created but its lines were not saved: ${errMsg(itemErr)}. Try again to finish ${header.number}.`,
        );
        return;
      }
      header = { ...header, linesSaved: true };
    }

    if (post) {
      const { error: postErr } = await db.rpc(config.postRpc, { _id: header.id });
      if (postErr) {
        // Saved as a draft but not posted. Nothing moved. Close the form so
        // the same voucher cannot be written again; it waits in the register.
        setBusy(null);
        setOpen(false);
        reset();
        setLastSavedId(header.id);
        invalidate([listKey]);
        toast.error(
          `${header.number} is saved as a draft, but posting failed: ${errMsg(postErr)}. No stock moved. Post it from the register once fixed.`,
          { duration: 10000 },
        );
        return;
      }
    }

    const moved = flow();
    setBusy(null);
    toast.success(
      post
        ? `${header.number} posted. ${KG(totalQty)} kg moved from ${moved.from} to ${moved.to}.`
        : `${header.number} saved as a draft. No stock has moved yet.`,
    );
    setOpen(false);
    reset();
    setLastSavedId(header.id);
    refreshStock();
  };

  const postExisting = async (v: any) => {
    const moved = flow(v);
    const ok = await ask({
      title: `Post ${v.voucher_number}?`,
      body: (
        <>
          <p>
            Posting moves{" "}
            <span className="num font-medium text-foreground">{KG(totalOf(v))} kg</span> from{" "}
            {moved.from} to {moved.to} and writes it to the ledger.
          </p>
          <p>A posted voucher can only be reversed by cancelling it.</p>
        </>
      ),
      confirm: "Post voucher",
    });
    if (!ok) return;
    const { error } = await db.rpc(config.postRpc, { _id: v.id });
    if (error) {
      toast.error(`${v.voucher_number} not posted. ${errMsg(error)} No stock moved.`);
      return;
    }
    toast.success(`${v.voucher_number} posted. ${KG(totalOf(v))} kg moved to ${moved.to}.`);
    setLastSavedId(v.id);
    refreshStock();
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
      _voucher_type: config.kind,
    });
    setCancelBusy(false);
    if (error) {
      setCancelError(`Not cancelled. ${errMsg(error)}`);
      return;
    }
    const cancelled = vouchers.find((v) => v.id === cancelId);
    toast.success(`${cancelled?.voucher_number ?? "Voucher"} cancelled and its stock reversed.`);
    setLastSavedId(cancelId);
    setCancelId(null);
    setCancelReason("");
    refreshStock();
  };

  const cancelling = vouchers.find((v) => v.id === cancelId);
  const formFlow = flow();

  return (
    <div>
      <PageHeader
        title={config.title}
        subtitle={config.subtitle}
        actions={
          <>
            <ExportBar
              filename={config.prefix.toLowerCase() + "-vouchers"}
              rows={grid.matched.flatMap((v: any) =>
                rowsFor(v).map((i: any) => ({
                  Voucher: v.voucher_number,
                  Date: dmy(v.voucher_date),
                  ...(config.needsJobber
                    ? { Jobber: `${v.jobbers?.code}, ${v.jobbers?.name}` }
                    : {}),
                  Material: `${i.raw_materials?.code}, ${i.raw_materials?.name}`,
                  Quantity: i.quantity,
                  UOM: i.raw_materials?.uom,
                  Status: sentence(v.status),
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
                <IconPlus /> New voucher
              </Button>
            )}
          </>
        }
      />

      <Panel>
        <GridToolbar
          grid={grid}
          searchLabel="Search vouchers"
          placeholder={
            config.needsJobber ? "Voucher, jobber or material" : "Voucher, supplier or material"
          }
          noun={["voucher", "vouchers"]}
          onReset={() => {
            setStatusFilter("");
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
          <DateFilter label="From" value={from} onChange={setFrom} max={to || undefined} />
          <DateFilter label="To" value={to} onChange={setTo} min={from || undefined} />
        </GridToolbar>
        <GridScroll sticky>
          <table className="erp-table min-w-[52rem]">
            <caption className="sr-only">{config.title} vouchers</caption>
            <thead>
              <tr>
                <SortHeader grid={grid} sortKey="number">
                  Voucher
                </SortHeader>
                <SortHeader grid={grid} sortKey="date">
                  Date
                </SortHeader>
                {config.needsJobber && <th scope="col">Jobber</th>}
                {visibleExtras.map((f) => (
                  <th scope="col" key={f.key}>
                    {f.label}
                  </th>
                ))}
                <th scope="col" className="text-right!">
                  Lines
                </th>
                <SortHeader grid={grid} sortKey="total" align="right">
                  Total (kg)
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
                  cols={REGISTER_COLS}
                  onRetry={() => void vouchersQuery.refetch()}
                />
              ) : grid.matched.length === 0 ? (
                <RegisterState
                  status="ready"
                  cols={REGISTER_COLS}
                  emptyTitle={
                    grid.isFiltered
                      ? "No voucher matches these filters."
                      : `No ${config.title.toLowerCase()} vouchers yet.`
                  }
                  emptyBody={
                    grid.isFiltered
                      ? "Widen the dates or clear the filters."
                      : "Saved and posted vouchers appear here with their stock effect."
                  }
                />
              ) : (
                grid.pageRows.map((v: any) => (
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
                    {config.needsJobber && (
                      <td className="max-w-44 truncate">{v.jobbers?.name ?? NIL}</td>
                    )}
                    {visibleExtras.map((f) => (
                      <td key={f.key} className="max-w-40 truncate">
                        {v[f.key]
                          ? f.type === "select"
                            ? sentence(String(v[f.key]))
                            : v[f.key]
                          : NIL}
                      </td>
                    ))}
                    <td className="num text-right text-muted-foreground">
                      {NUM(rowsFor(v).length)}
                    </td>
                    <td className="num text-right font-semibold">{KG(totalOf(v))}</td>
                    <td>
                      <StatusBadge status={v.status} />
                    </td>
                    <td className="whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button size="sm" variant="ghost" onClick={() => setViewId(v.id)}>
                          Open
                        </Button>
                        {editable && v.status === "DRAFT" && (
                          <Button size="sm" variant="outline" onClick={() => void postExisting(v)}>
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
                ))
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
            <DialogTitle>
              {pending ? `Finish ${pending.number}` : `New ${config.title.toLowerCase()}`}
            </DialogTitle>
            <DialogDescription>
              {pending
                ? `${pending.number} was created but its lines were not saved. Saving again adds them to ${pending.number}.`
                : "Save as a draft to post later, or post now to move the stock."}
            </DialogDescription>
          </DialogHeader>
          <form
            className="space-y-6"
            onSubmit={(event) => {
              event.preventDefault();
              void save(true);
            }}
          >
            <FormSection title="Voucher">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <Field label="Voucher date" required>
                  <Input
                    type="date"
                    value={date}
                    disabled={!!pending}
                    onChange={(e) => setDate(e.target.value)}
                  />
                </Field>
                {config.needsJobber && (
                  <Field
                    label="Jobber"
                    required
                    error={errors.jobber}
                    className="sm:col-span-3"
                    hint={
                      config.stockScope === "JOBBER"
                        ? "Available quantities below are this jobber's balances."
                        : undefined
                    }
                  >
                    <SearchSelect
                      options={jobberOpts}
                      value={jobberId}
                      disabled={!!pending}
                      onChange={(value) => {
                        setJobberId(value);
                        setErrors((e) => ({ ...e, jobber: undefined }));
                      }}
                    />
                  </Field>
                )}
                {config.extraFields.map((f) => (
                  <Field key={f.key} label={f.label} hint={f.hint} optional={f.type !== "select"}>
                    {f.type === "select" ? (
                      <SearchSelect
                        options={(f.options ?? []).map((o) => ({ value: o, label: sentence(o) }))}
                        value={extras[f.key] ?? f.options?.[0]}
                        disabled={!!pending}
                        onChange={(v) => setExtras((e) => ({ ...e, [f.key]: v }))}
                      />
                    ) : (
                      <Input
                        type={f.type === "date" ? "date" : "text"}
                        value={extras[f.key] ?? ""}
                        disabled={!!pending}
                        onChange={(e) => setExtras((x) => ({ ...x, [f.key]: e.target.value }))}
                      />
                    )}
                  </Field>
                ))}
                <Field label="Remarks" optional className="sm:col-span-4">
                  <Input
                    value={remarks}
                    disabled={!!pending}
                    onChange={(e) => setRemarks(e.target.value)}
                  />
                </Field>
              </div>
            </FormSection>

            <FormSection
              title={config.itemLabel ?? "Material lines"}
              description={
                config.stockScope === "NONE"
                  ? "Each material received and its quantity."
                  : "Each material and its quantity. A line cannot exceed what is available."
              }
            >
              <div className="overflow-hidden rounded-md border">
                <div className="overflow-x-auto">
                  <table className="erp-table min-w-[38rem]">
                    <thead>
                      <tr>
                        <th scope="col" className="w-10">
                          #
                        </th>
                        <th scope="col">Raw material</th>
                        {config.stockScope !== "NONE" && (
                          <th scope="col" className="w-32 text-right!">
                            Available
                          </th>
                        )}
                        <th scope="col" className="w-36 text-right!">
                          Quantity
                        </th>
                        <th scope="col">Line remarks</th>
                        <th scope="col" className="w-12">
                          <span className="sr-only">Remove</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {lines.length === 0 && (
                        <EmptyState
                          cols={config.stockScope !== "NONE" ? 6 : 5}
                          title="No lines yet."
                          body="Add each material and its quantity."
                        />
                      )}
                      {lines.map((l, i) => {
                        const avail = available(l.material_id);
                        const rowError = errors.rows?.[i];
                        const uom = materialOpts.find((m) => m.value === l.material_id)?.hint;
                        return (
                          <tr key={i}>
                            <td className="num text-muted-foreground">{i + 1}</td>
                            <td>
                              <SearchSelect
                                aria-label={`Material, line ${i + 1}`}
                                options={materialOpts}
                                value={l.material_id}
                                invalid={!!rowError}
                                disabled={!!pending}
                                onChange={(v) => setLine(i, { material_id: v })}
                              />
                              {rowError && (
                                <p className="mt-1 text-xs font-medium text-destructive">
                                  {rowError}
                                </p>
                              )}
                            </td>
                            {config.stockScope !== "NONE" && (
                              <td className="num text-right text-muted-foreground">
                                {l.material_id
                                  ? `${KG(avail)} ${String(uom ?? "kg").toLowerCase()}`
                                  : NIL}
                              </td>
                            )}
                            <td>
                              <NumInput
                                aria-label={`Quantity, line ${i + 1}`}
                                value={l.quantity}
                                disabled={!!pending}
                                aria-invalid={!!rowError || undefined}
                                onChange={(n) => setLine(i, { quantity: n })}
                              />
                            </td>
                            <td>
                              <Input
                                aria-label={`Remarks, line ${i + 1}`}
                                value={l.remarks}
                                disabled={!!pending}
                                onChange={(e) => setLine(i, { remarks: e.target.value })}
                              />
                            </td>
                            <td>
                              <Button
                                type="button"
                                size="icon"
                                variant="ghost"
                                disabled={!!pending}
                                aria-label={`Remove line ${i + 1}`}
                                title="Remove line"
                                onClick={() => setLines((rs) => rs.filter((_, x) => x !== i))}
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
                        <td colSpan={config.stockScope !== "NONE" ? 3 : 2}>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            disabled={!!pending}
                            onClick={() =>
                              setLines((l) => [...l, { material_id: "", quantity: 0, remarks: "" }])
                            }
                          >
                            <IconPlus /> Add material
                          </Button>
                        </td>
                        <td className="num text-right">{KG(totalQty)}</td>
                        <td colSpan={2} className="text-xs font-normal text-muted-foreground">
                          Total, calculated
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
            </FormSection>

            <section
              aria-label="What posting will do"
              className="rounded-md border bg-subtle px-4 py-3 text-sm"
            >
              <p className="text-xs font-medium text-muted-foreground">When posted</p>
              <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
                <span className="num font-semibold">{KG(totalQty)} kg</span>
                <span className="text-muted-foreground">moves from</span>
                <span className="font-medium">{formFlow.from}</span>
                {/* Every icon in components/icons is aria-hidden, so a label
                    placed on the glyph is discarded. The connector is real
                    text, otherwise the sentence reads "from Your godown the
                    jobber" with no link between the two ends. */}
                <IconArrowRight className="size-4 text-muted-foreground" aria-hidden="true" />
                <span className="sr-only">to</span>
                <span className="font-medium">{formFlow.to}</span>
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                A draft moves nothing until it is posted.
              </p>
            </section>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => void onOpenChange(false)}>
                {pending ? "Close" : "Cancel"}
              </Button>
              <Button
                type="button"
                variant="secondary"
                loading={busy === "draft"}
                disabled={!!busy}
                onClick={() => void save(false)}
              >
                {pending ? "Save lines as draft" : "Save draft"}
              </Button>
              <Button type="submit" loading={busy === "post"} disabled={!!busy}>
                Post and move stock
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Detail ------------------------------------------------------------------- */}
      <Sheet open={!!viewing} onOpenChange={(value) => !value && setViewId(null)}>
        <SheetContent side="right" className="flex w-full flex-col gap-0 p-0 sm:max-w-xl">
          {viewing && (
            <>
              <SheetHeader className="space-y-1 border-b p-5 pr-12 text-left">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">{config.title}</span>
                  <StatusBadge status={viewing.status} />
                </div>
                <SheetTitle className="num">{viewing.voucher_number}</SheetTitle>
                <SheetDescription>
                  {dmy(viewing.voucher_date)} · {flow(viewing).from} to {flow(viewing).to}
                </SheetDescription>
                <div className="flex flex-wrap gap-2 pt-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      printElement("voucher-print", `${config.title} ${viewing.voucher_number}`)
                    }
                  >
                    <IconPrint /> Print
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
              <div id="voucher-print" className="flex-1 space-y-5 overflow-y-auto p-5">
                <h1 className="hidden text-base font-semibold print:block">
                  {config.title} {viewing.voucher_number}
                </h1>
                <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                  <div>
                    <dt className="text-xs text-muted-foreground">Voucher number</dt>
                    <dd className="num mt-0.5 font-medium">{viewing.voucher_number}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted-foreground">Date</dt>
                    <dd className="num mt-0.5">{dmy(viewing.voucher_date)}</dd>
                  </div>
                  {config.needsJobber && (
                    <div className="col-span-2">
                      <dt className="text-xs text-muted-foreground">Jobber</dt>
                      <dd className="mt-0.5">
                        {viewing.jobbers?.name}{" "}
                        <span className="num text-muted-foreground">{viewing.jobbers?.code}</span>
                      </dd>
                    </div>
                  )}
                  {config.extraFields.map((f) => (
                    <div key={f.key}>
                      <dt className="text-xs text-muted-foreground">{f.label}</dt>
                      <dd className="mt-0.5">
                        {viewing[f.key]
                          ? f.type === "select"
                            ? sentence(String(viewing[f.key]))
                            : viewing[f.key]
                          : NIL}
                      </dd>
                    </div>
                  ))}
                  {viewing.status === "CANCELLED" && (
                    <div className="col-span-2">
                      <dt className="text-xs text-muted-foreground">Cancelled</dt>
                      <dd className="mt-0.5">
                        {viewing.cancelled_at ? dmy(viewing.cancelled_at) : ""}
                        {viewing.cancellation_reason ? `, ${viewing.cancellation_reason}` : ""}
                      </dd>
                    </div>
                  )}
                </dl>
                <table className="erp-table rounded-md border">
                  <thead>
                    <tr>
                      <th scope="col">#</th>
                      <th scope="col">Material</th>
                      <th scope="col" className="text-right!">
                        Quantity
                      </th>
                      <th scope="col">Remarks</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rowsFor(viewing).map((i: any, idx: number) => (
                      <tr key={i.id}>
                        <td className="num text-muted-foreground">{idx + 1}</td>
                        <th scope="row" className="text-left font-normal">
                          {i.raw_materials?.name}
                          <span className="num block text-xs text-muted-foreground">
                            {i.raw_materials?.code}
                          </span>
                        </th>
                        <td className="num whitespace-nowrap text-right">
                          {KG(i.quantity)} {String(i.raw_materials?.uom ?? "").toLowerCase()}
                        </td>
                        <td className="text-muted-foreground">{i.remarks ?? ""}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colSpan={2}>Total</td>
                      <td className="num text-right">{KG(totalOf(viewing))}</td>
                      <td />
                    </tr>
                  </tfoot>
                </table>
                {viewing.remarks && (
                  <p className="text-sm">
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
              Cancelling reverses every stock movement this voucher made:{" "}
              <span className="num font-medium text-foreground">{KG(totalOf(cancelling))} kg</span>{" "}
              goes back from {flow(cancelling).to} to {flow(cancelling).from}. The voucher stays in
              the register, marked cancelled.
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              void cancelVoucher();
            }}
            className="space-y-4"
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

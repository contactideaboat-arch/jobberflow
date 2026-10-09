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
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { canWrite, db, useInvalidate, useRole, useRows } from "@/hooks/use-erp";
import { KG, errMsg } from "@/lib/erp";

export const Route = createFileRoute("/_authenticated/masters/jobbers")({
  head: () => ({
    meta: [
      { title: "Jobbers | JobberFlow" },
      {
        name: "description",
        content: "Job work units that receive raw material and return finished products.",
      },
    ],
  }),
  component: JobberMaster,
});

const BLANK = {
  code: "",
  name: "",
  company_name: "",
  contact_person: "",
  phone: "",
  alt_phone: "",
  email: "",
  gst_number: "",
  pan_number: "",
  address: "",
  city: "",
  state: "",
  pin_code: "",
  remarks: "",
  status: true,
};

const STATUS_FILTER = [
  { value: "", label: "All" },
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
];

function JobberMaster() {
  const { data: role } = useRole();
  const editable = canWrite(role);
  const invalidate = useInvalidate();
  const [statusFilter, setStatusFilter] = useState("");
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [form, setForm] = useState<any>(BLANK);
  const [initialForm, setInitialForm] = useState<any>(BLANK);
  const [errors, setErrors] = useState<{ code?: string; name?: string; email?: string }>({});
  const [busy, setBusy] = useState(false);
  const [confirmDialog, ask] = useConfirm();

  const query = useRows("jobbers", ["jobbers"], (b) => b.order("code"));
  const stock = useRows("jobber_stock", ["jobber_stock"]);
  const status = queryStatus(query);

  const heldByJobber = useMemo(() => {
    const map = new Map<string, { kg: number; lines: any[] }>();
    for (const row of (stock.data ?? []) as any[]) {
      const entry = map.get(row.jobber_id) ?? { kg: 0, lines: [] };
      entry.kg += Number(row.balance ?? 0);
      entry.lines.push(row);
      map.set(row.jobber_id, entry);
    }
    return map;
  }, [stock.data]);

  const grid = useGrid((query.data ?? []) as any[], {
    search: (r) => [r.code, r.name, r.company_name, r.city, r.gst_number, r.phone].join(" "),
    filter: (r) => !statusFilter || (statusFilter === "active" ? !!r.status : !r.status),
    filtersActive: !!statusFilter,
    sorters: {
      code: (r) => r.code,
      name: (r) => r.name,
      city: (r) => r.city,
      held: (r) => heldByJobber.get(r.id)?.kg ?? 0,
    },
    initialSort: { key: "code", direction: "asc" },
  });

  const dirty = JSON.stringify(form) !== JSON.stringify(initialForm);
  const [discardDialog, onOpenChange] = useGuardedClose(dirty && !busy, setOpen);
  const set = (k: string, v: unknown) => {
    setForm((f: any) => ({ ...f, [k]: v }));
    if ((errors as Record<string, string | undefined>)[k]) setErrors((e) => ({ ...e, [k]: "" }));
  };

  const openForm = (row?: any) => {
    const next = row ? { ...BLANK, ...row } : BLANK;
    setEditId(row?.id ?? null);
    setForm(next);
    setInitialForm(next);
    setErrors({});
    setOpen(true);
  };

  const validate = () => {
    const next: { code?: string; name?: string; email?: string } = {};
    if (!String(form.code ?? "").trim()) next.code = "Enter a jobber code.";
    if (!String(form.name ?? "").trim()) next.name = "Enter the jobber's name.";
    if (form.email && !/^\S+@\S+\.\S+$/.test(form.email)) next.email = "Enter a valid email.";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const save = async () => {
    if (busy || !validate()) return;
    setBusy(true);
    const payload = { ...form };
    for (const key of ["id", "created_at", "updated_at", "created_by", "updated_by"])
      delete payload[key];
    Object.keys(payload).forEach((k) => {
      if (payload[k] === "") payload[k] = null;
    });
    payload.code = String(form.code).trim().toUpperCase();
    payload.name = String(form.name).trim();
    const res = editId
      ? await db.from("jobbers").update(payload).eq("id", editId)
      : await db.from("jobbers").insert(payload);
    setBusy(false);
    if (res.error) {
      // The form stays open with everything entered, so the user can fix and retry.
      toast.error(`Not saved. ${errMsg(res.error)}`);
      return;
    }
    toast.success(editId ? `${payload.code} updated.` : `${payload.code} created.`);
    setInitialForm(form);
    setOpen(false);
    invalidate([["jobbers"]]);
  };

  const toggle = async (r: any) => {
    const held = heldByJobber.get(r.id)?.kg ?? 0;
    if (r.status && held > 0.0005) {
      const ok = await ask({
        title: `Mark ${r.name} inactive?`,
        body: (
          <p>
            This jobber still holds <span className="num font-medium">{KG(held)} kg</span> of your
            material. Inactive jobbers are hidden from new vouchers, but their stock stays on
            record.
          </p>
        ),
        confirm: "Mark inactive",
      });
      if (!ok) return;
    }
    const { error } = await db.from("jobbers").update({ status: !r.status }).eq("id", r.id);
    if (error) {
      toast.error(`Status not changed. ${errMsg(error)}`);
      return;
    }
    toast.success(`${r.code} is now ${r.status ? "inactive" : "active"}.`);
    invalidate([["jobbers"]]);
  };

  const detail = (query.data ?? []).find((r: any) => r.id === detailId);
  const detailHeld = detail ? heldByJobber.get(detail.id) : undefined;

  return (
    <div>
      <PageHeader
        title="Jobbers"
        subtitle="Job work units that receive your raw material and return finished products."
        actions={
          <>
            <ExportBar
              filename="jobbers"
              rows={grid.matched.map((r: any) => ({
                Code: r.code,
                Name: r.name,
                Company: r.company_name,
                Contact: r.contact_person,
                Phone: r.phone,
                GST: r.gst_number,
                City: r.city,
                State: r.state,
                "Material held (kg)": heldByJobber.get(r.id)?.kg ?? 0,
                Status: r.status ? "Active" : "Inactive",
              }))}
            />
            {editable && (
              <Button size="sm" onClick={() => openForm()}>
                <IconPlus /> New jobber
              </Button>
            )}
          </>
        }
      />

      <Panel>
        <GridToolbar
          grid={grid}
          searchLabel="Search jobbers"
          placeholder="Code, name, city, GST or phone"
          noun={["jobber", "jobbers"]}
          onReset={() => setStatusFilter("")}
        >
          <FilterSelect
            label="Status"
            value={statusFilter}
            onChange={(value) => {
              setStatusFilter(value);
              grid.resetPage();
            }}
            options={STATUS_FILTER}
          />
        </GridToolbar>
        <GridScroll sticky>
          <table className="erp-table min-w-[56rem]">
            <caption className="sr-only">Jobbers with contact details and material held</caption>
            <thead>
              <tr>
                <SortHeader grid={grid} sortKey="name">
                  Jobber
                </SortHeader>
                <th scope="col">Contact</th>
                <th scope="col">GST</th>
                <SortHeader grid={grid} sortKey="city">
                  City
                </SortHeader>
                <SortHeader grid={grid} sortKey="held" align="right">
                  Material held (kg)
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
                    grid.isFiltered ? "No jobber matches these filters." : "No jobbers yet."
                  }
                  emptyBody={
                    grid.isFiltered
                      ? "Search by code, name, city, GST or phone, or clear the filters."
                      : "Add the units you send material to, so transfers and inwards can name them."
                  }
                  action={
                    !grid.isFiltered &&
                    editable && (
                      <Button size="sm" onClick={() => openForm()}>
                        <IconPlus /> New jobber
                      </Button>
                    )
                  }
                />
              ) : (
                grid.pageRows.map((r: any) => {
                  const held = heldByJobber.get(r.id)?.kg ?? 0;
                  return (
                    <tr key={r.id} aria-selected={detailId === r.id || undefined}>
                      <th scope="row" className="text-left font-normal">
                        <button
                          type="button"
                          onClick={() => setDetailId(r.id)}
                          className="cursor-pointer text-left hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        >
                          <span className="block font-medium">{r.name}</span>
                          <span className="num block text-xs text-muted-foreground">{r.code}</span>
                        </button>
                      </th>
                      <td>
                        <span className="block">{r.contact_person ?? NIL}</span>
                        <span className="num block text-xs text-muted-foreground">
                          {r.phone ?? ""}
                        </span>
                      </td>
                      <td className="num">{r.gst_number ?? NIL}</td>
                      <td>{r.city ?? NIL}</td>
                      <td className="num text-right font-medium">{held !== 0 ? KG(held) : NIL}</td>
                      <td>
                        <Badge variant={r.status ? "success" : "secondary"}>
                          {r.status ? "Active" : "Inactive"}
                        </Badge>
                      </td>
                      <td className="whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setDetailId(r.id)}
                            aria-label={`Open ${r.name}`}
                          >
                            Open
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

      {/* Detail ------------------------------------------------------------ */}
      <Sheet open={!!detail} onOpenChange={(value) => !value && setDetailId(null)}>
        <SheetContent side="right" className="flex w-full flex-col gap-0 p-0 sm:max-w-lg">
          {detail && (
            <>
              <SheetHeader className="space-y-1 border-b p-5 pr-12 text-left">
                <div className="flex items-center gap-2">
                  <span className="num text-xs text-muted-foreground">{detail.code}</span>
                  <Badge variant={detail.status ? "success" : "secondary"}>
                    {detail.status ? "Active" : "Inactive"}
                  </Badge>
                </div>
                <SheetTitle>{detail.name}</SheetTitle>
                <SheetDescription>{detail.company_name ?? "Job work unit"}</SheetDescription>
                <div className="flex flex-wrap gap-2 pt-2">
                  <Button size="sm" variant="outline" asChild>
                    <Link to="/reconciliation" search={{ jobber: detail.id }}>
                      Reconcile
                    </Link>
                  </Button>
                  <Button size="sm" variant="outline" asChild>
                    <Link to="/inventory/rm-ledger" search={{ jobber: detail.id }}>
                      Movements
                    </Link>
                  </Button>
                  {editable && (
                    <>
                      <Button size="sm" variant="outline" onClick={() => openForm(detail)}>
                        <IconPencil /> Edit
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => void toggle(detail)}>
                        {detail.status ? "Mark inactive" : "Mark active"}
                      </Button>
                    </>
                  )}
                </div>
              </SheetHeader>
              <div className="flex-1 space-y-6 overflow-y-auto p-5">
                <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                  <Detail label="Contact person" value={detail.contact_person} />
                  <Detail label="Phone" value={detail.phone} num />
                  <Detail label="Alternate phone" value={detail.alt_phone} num />
                  <Detail label="Email" value={detail.email} />
                  <Detail label="GST number" value={detail.gst_number} num />
                  <Detail label="PAN" value={detail.pan_number} num />
                  <Detail
                    label="Address"
                    value={[detail.address, detail.city, detail.state, detail.pin_code]
                      .filter(Boolean)
                      .join(", ")}
                    wide
                  />
                  {detail.remarks && <Detail label="Remarks" value={detail.remarks} wide />}
                </dl>
                <section aria-labelledby="held-heading">
                  <div className="mb-2 flex items-baseline justify-between">
                    <h3 id="held-heading" className="text-sm font-semibold">
                      Material held
                    </h3>
                    <span className="num text-sm font-semibold">{KG(detailHeld?.kg ?? 0)} kg</span>
                  </div>
                  {stock.isLoading ? (
                    <div className="skeleton-line w-full" />
                  ) : stock.isError ? (
                    <p className="text-sm text-warning-foreground">Stock could not be loaded.</p>
                  ) : !detailHeld || detailHeld.lines.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      Nothing has been transferred to this jobber.
                    </p>
                  ) : (
                    <table className="erp-table rounded-md border">
                      <thead>
                        <tr>
                          <th scope="col">Material</th>
                          <th scope="col" className="text-right!">
                            Received
                          </th>
                          <th scope="col" className="text-right!">
                            Balance
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {detailHeld.lines.map((line: any) => (
                          <tr key={line.material_id}>
                            <th scope="row" className="text-left font-normal">
                              {line.material_name}
                              <span className="num block text-xs text-muted-foreground">
                                {line.material_code}
                              </span>
                            </th>
                            <td className="num text-right">{KG(line.received)}</td>
                            <td
                              className={
                                Number(line.balance) < -0.0005
                                  ? "num text-right font-semibold text-destructive"
                                  : "num text-right font-semibold"
                              }
                            >
                              {KG(line.balance)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </section>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Form ----------------------------------------------------------------- */}
      <Dialog open={open} onOpenChange={(value) => void onOpenChange(value)}>
        <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editId ? `Edit ${initialForm.name}` : "New jobber"}</DialogTitle>
            <DialogDescription>
              Code and name are required. Everything else can be added later.
            </DialogDescription>
          </DialogHeader>
          <form
            className="space-y-6"
            onSubmit={(event) => {
              event.preventDefault();
              void save();
            }}
          >
            <FormSection title="Identity">
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Jobber code" required error={errors.code} hint="Saved in capitals.">
                  <Input
                    value={form.code ?? ""}
                    onChange={(e) => set("code", e.target.value)}
                    placeholder="JB001"
                    autoComplete="off"
                  />
                </Field>
                <Field label="Jobber name" required error={errors.name}>
                  <Input value={form.name ?? ""} onChange={(e) => set("name", e.target.value)} />
                </Field>
                <Field label="Company name" optional>
                  <Input
                    value={form.company_name ?? ""}
                    onChange={(e) => set("company_name", e.target.value)}
                  />
                </Field>
                <div className="flex items-end pb-2">
                  <label className="flex cursor-pointer items-center gap-2 text-sm">
                    <Switch checked={!!form.status} onCheckedChange={(v) => set("status", v)} />
                    Active, available on new vouchers
                  </label>
                </div>
              </div>
            </FormSection>
            <FormSection title="Contact">
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Contact person" optional>
                  <Input
                    value={form.contact_person ?? ""}
                    onChange={(e) => set("contact_person", e.target.value)}
                  />
                </Field>
                <Field label="Email" optional error={errors.email}>
                  <Input
                    type="email"
                    value={form.email ?? ""}
                    onChange={(e) => set("email", e.target.value)}
                  />
                </Field>
                <Field label="Phone" optional>
                  <Input
                    type="tel"
                    value={form.phone ?? ""}
                    onChange={(e) => set("phone", e.target.value)}
                  />
                </Field>
                <Field label="Alternate phone" optional>
                  <Input
                    type="tel"
                    value={form.alt_phone ?? ""}
                    onChange={(e) => set("alt_phone", e.target.value)}
                  />
                </Field>
              </div>
            </FormSection>
            <FormSection title="Tax and address">
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="GST number" optional>
                  <Input
                    value={form.gst_number ?? ""}
                    onChange={(e) => set("gst_number", e.target.value)}
                  />
                </Field>
                <Field label="PAN" optional>
                  <Input
                    value={form.pan_number ?? ""}
                    onChange={(e) => set("pan_number", e.target.value)}
                  />
                </Field>
                <Field label="Address" optional className="sm:col-span-2">
                  <Textarea
                    rows={2}
                    value={form.address ?? ""}
                    onChange={(e) => set("address", e.target.value)}
                  />
                </Field>
                <Field label="City" optional>
                  <Input value={form.city ?? ""} onChange={(e) => set("city", e.target.value)} />
                </Field>
                <Field label="State" optional>
                  <Input value={form.state ?? ""} onChange={(e) => set("state", e.target.value)} />
                </Field>
                <Field label="PIN code" optional>
                  <Input
                    inputMode="numeric"
                    value={form.pin_code ?? ""}
                    onChange={(e) => set("pin_code", e.target.value)}
                  />
                </Field>
                <Field label="Remarks" optional className="sm:col-span-2">
                  <Textarea
                    rows={2}
                    value={form.remarks ?? ""}
                    onChange={(e) => set("remarks", e.target.value)}
                  />
                </Field>
              </div>
            </FormSection>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => void onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" loading={busy}>
                {editId ? "Save changes" : "Create jobber"}
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
  wide,
}: {
  label: string;
  value: string | null | undefined;
  num?: boolean;
  wide?: boolean;
}) {
  return (
    <div className={wide ? "col-span-2" : undefined}>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className={num ? "num mt-0.5" : "mt-0.5"}>{value || NIL}</dd>
    </div>
  );
}

/* eslint-disable @typescript-eslint/no-explicit-any */
import { createFileRoute } from "@tanstack/react-router";
import { IconSave, IconShieldCheck } from "@/components/icons";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/erp/AppShell";
import {
  ExportBar,
  Field,
  Panel,
  RegisterState,
  ScopeNote,
  SearchSelect,
  queryStatus,
  sentenceCase,
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
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { db, useInvalidate, useRole, useRows } from "@/hooks/use-erp";
import { KG, NUM, dmy, errMsg } from "@/lib/erp";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Users & Settings. JobberFlow." },
      {
        name: "description",
        content:
          "Manage user roles, company details, wastage threshold and review the audit trail.",
      },
      { property: "og:title", content: "Users & Settings, JobWork ERP" },
      {
        property: "og:description",
        content: "Administration: roles, company settings and audit logs.",
      },
    ],
  }),
  component: AdminPage,
});

const ROLES = [
  { value: "admin", label: "Admin, full control" },
  { value: "store", label: "Store, create & post vouchers" },
  { value: "management", label: "Management, view & reports" },
  { value: "viewer", label: "Viewer, read only" },
];

/**
 * What each audit entity_type is, in the operator's words, and where the
 * record lives. Both tables come from the database trigger functions in
 * supabase/migrations; nothing here is inferred. A type not listed still
 * renders, it just gets no friendly name and no link.
 */
const ENTITY: Record<string, { label: string; to: string }> = {
  RM_INWARD: { label: "Raw material inward", to: "/transactions/rm-inward" },
  TRANSFER: { label: "Jobber transfer", to: "/transactions/transfer" },
  PRODUCT_INWARD: { label: "Product inward", to: "/transactions/product-inward" },
  MATERIAL_RETURN: { label: "Material return", to: "/transactions/material-return" },
  ADJUSTMENT: { label: "Stock adjustment", to: "/transactions/adjustment" },
};

/** The only two actions the trigger functions write. */
const ACTIONS = [
  { value: "", label: "All actions" },
  { value: "POSTED", label: "Posted" },
  { value: "CANCELLED", label: "Cancelled" },
];

/** Keys the triggers put in `details`, with the unit or meaning of each. */
const DETAIL_LABELS: Record<string, { label: string; kind: "kg" | "text" }> = {
  reason: { label: "Reason", kind: "text" },
  standard: { label: "Standard consumption", kind: "kg" },
  overall_wastage_kg: { label: "Wastage", kind: "kg" },
};

/**
 * Audit `details` is a jsonb blob whose keys come from the trigger functions.
 * Rendering it as `JSON.stringify` produced a truncated string nobody could
 * read, so the known keys are named and formatted, and anything unrecognised
 * is shown as key/value pairs rather than hidden.
 */
function DetailsCell({ details }: { details: unknown }) {
  if (!details || typeof details !== "object" || Array.isArray(details)) {
    return <span className="text-muted-foreground">{NIL}</span>;
  }
  const entries = Object.entries(details as Record<string, unknown>);
  if (!entries.length) return <span className="text-muted-foreground">{NIL}</span>;

  return (
    <dl className="flex flex-wrap gap-x-4 gap-y-0.5">
      {entries.map(([key, value]) => {
        const known = DETAIL_LABELS[key];
        const label = known?.label ?? sentenceCase(key);
        const shown =
          known?.kind === "kg" && typeof value === "number"
            ? KG(value)
            : value == null
              ? NIL
              : String(value);
        return (
          <div key={key} className="flex items-baseline gap-1.5">
            <dt className="text-muted-foreground">{label}:</dt>
            <dd className="num font-medium text-foreground">{shown}</dd>
          </div>
        );
      })}
    </dl>
  );
}

function AdminPage() {
  const { data: role } = useRole();
  const isAdmin = role === "admin";
  const invalidate = useInvalidate();

  const profilesQuery = useRows("profiles", ["profiles"], (b) => b.order("created_at"));
  const profiles = profilesQuery.data;
  const profilesStatus = queryStatus(profilesQuery);
  const { data: roles } = useRows("user_roles", ["user_roles"]);
  const { data: settingsRows } = useRows("company_settings", ["company_settings"]);
  const logsQuery = useRows("audit_logs", ["audit_logs"], (b) =>
    b.order("performed_at", { ascending: false }).limit(300),
  );
  const logs = logsQuery.data;
  const logsStatus = queryStatus(logsQuery);

  const [form, setForm] = useState<any>(null);
  const [savingSettings, setSavingSettings] = useState(false);
  const [savedForm, setSavedForm] = useState<string>("");
  const [roleBusy, setRoleBusy] = useState<string | null>(null);
  const [settingsError, setSettingsError] = useState<string | null>(null);
  const [entity, setEntity] = useState("");
  const [action, setAction] = useState("");
  useEffect(() => {
    const s = (settingsRows ?? [])[0];
    if (s && !form) {
      setForm(s);
      // Seed the clean baseline from what was loaded, so the form does not open
      // reporting unsaved changes it has never had.
      setSavedForm(JSON.stringify(s));
    }
  }, [settingsRows, form]);

  const roleOf = (uid: string) => (roles ?? []).find((r: any) => r.user_id === uid)?.role ?? "·";

  /**
   * Resolve the acting user from `profiles`. The audit row stores a uuid and
   * nothing else, so if the profile is missing the cell says so rather than
   * showing a bare uuid that looks like a bug.
   */
  const peopleById = useMemo(() => {
    const map = new Map<string, string>();
    for (const p of profiles ?? []) {
      map.set(p.id, p.full_name || p.email || "Unnamed user");
    }
    return map;
  }, [profiles]);

  const setRole = async (uid: string, newRole: string) => {
    // One role change at a time. The select is disabled while this runs so a
    // second pick cannot race the first write and leave the grid out of step.
    if (roleBusy) return;
    setRoleBusy(uid);
    const existing = (roles ?? []).find((r: any) => r.user_id === uid);
    const res = existing
      ? await db.from("user_roles").update({ role: newRole }).eq("id", existing.id)
      : await db.from("user_roles").insert({ user_id: uid, role: newRole });
    setRoleBusy(null);
    if (res.error) {
      toast.error(`Not saved. ${errMsg(res.error)}`);
      return;
    }
    toast.success("Role updated");
    invalidate([["user_roles"], ["my-role"]]);
  };

  const saveSettings = async () => {
    // Guard the write itself, not just the button. `loading` disables the
    // control, but a double click can land two clicks before React commits
    // the disabled state, and this is a write.
    if (savingSettings) return;

    // Validate before writing. `|| 0` used to turn a cleared field into a limit
    // of zero, which means "flag every voucher with any wastage at all" — a
    // rule the owner never set, applied to their whole history.
    const limitRaw = String(form.wastage_warning_threshold ?? "").trim();
    const limit = Number(limitRaw);
    if (limitRaw !== "" && (!Number.isFinite(limit) || limit < 0 || limit > 100)) {
      setSettingsError("Enter a percentage between 0 and 100, or leave it empty for no limit.");
      return;
    }
    setSettingsError(null);

    setSavingSettings(true);
    const { error } = await db
      .from("company_settings")
      .update({
        company_name: form.company_name,
        address: form.address,
        city: form.city,
        state: form.state,
        pin_code: form.pin_code,
        gst_number: form.gst_number,
        phone: form.phone,
        email: form.email,
        // Empty means "no limit set", which reports read as "nothing flagged".
        // Zero stays a real zero only if the owner typed one.
        wastage_warning_threshold: limitRaw === "" ? null : limit,
      })
      .eq("id", form.id);
    setSavingSettings(false);
    if (error) {
      toast.error(`Not saved. ${errMsg(error)}`);
      return;
    }
    // Snapshot what was written so the form knows it is clean. The edit fields
    // stay open and populated: the operator keeps their place.
    setSavedForm(JSON.stringify(form));
    toast.success("Company settings saved");
    invalidate([["company_settings"]]);
  };

  const logGrid = useGrid<any>(logs, {
    search: (l) =>
      [
        ENTITY[l.entity_type]?.label ?? l.entity_type,
        l.action,
        peopleById.get(l.performed_by ?? "") ?? "",
      ].join(" "),
    filter: (l) => (!entity || l.entity_type === entity) && (!action || l.action === action),
    filtersActive: !!(entity || action),
    sorters: {
      when: (l) => l.performed_at,
      entity: (l) => ENTITY[l.entity_type]?.label ?? l.entity_type,
      action: (l) => l.action,
      who: (l) => peopleById.get(l.performed_by ?? "") ?? "",
    },
    initialSort: { key: "when", direction: "desc" },
  });

  /** `performed_at` is a timestamptz; show it in the operator's own timezone. */
  const whenLabel = (value: string | null) => {
    if (!value) return NIL;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return dmy(value);
    const hh = `${date.getHours()}`.padStart(2, "0");
    const mm = `${date.getMinutes()}`.padStart(2, "0");
    return `${dmy(date)} ${hh}:${mm}`;
  };

  const f = (k: string) => (e: any) => setForm((p: any) => ({ ...p, [k]: e.target.value }));

  return (
    <div>
      <PageHeader
        title="Users &amp; Settings"
        breadcrumb={["Administration", "Users & Settings"]}
        subtitle="Roles decide who can post vouchers. Company details and the wastage threshold drive printed documents and report highlighting."
      />

      <Tabs defaultValue="users">
        <TabsList className="mb-4">
          <TabsTrigger value="users">Users &amp; Roles</TabsTrigger>
          <TabsTrigger value="company">Company Settings</TabsTrigger>
          <TabsTrigger value="audit">Audit Trail</TabsTrigger>
        </TabsList>

        <TabsContent value="users">
          <Panel
            title="Users"
            description="Every account that has signed in, and the role it holds."
          >
            <div className="overflow-x-auto">
              <table className="erp-table min-w-[40rem]">
                <caption className="sr-only">Users with email, join date and assigned role</caption>
                <thead>
                  <tr>
                    <th scope="col">Name</th>
                    <th scope="col">Email</th>
                    <th scope="col">Joined</th>
                    <th scope="col">Role</th>
                  </tr>
                </thead>
                <tbody>
                  {profilesStatus !== "ready" ? (
                    <RegisterState
                      status={profilesStatus}
                      cols={4}
                      onRetry={() => void profilesQuery.refetch()}
                    />
                  ) : (profiles ?? []).length === 0 ? (
                    <RegisterState
                      status="ready"
                      cols={4}
                      emptyTitle="No users yet."
                      emptyBody="Every account that signs in appears here with its assigned role."
                    />
                  ) : (
                    (profiles ?? []).map((p: any) => (
                      <tr key={p.id}>
                        <th scope="row" className="text-left font-medium">
                          {p.full_name ?? "Unnamed user"}
                        </th>
                        <td className="text-muted-foreground">{p.email ?? NIL}</td>
                        <td className="num whitespace-nowrap text-muted-foreground">
                          {dmy(p.created_at)}
                        </td>
                        <td className="w-64">
                          {isAdmin ? (
                            <SearchSelect
                              id={`role-${p.id}`}
                              aria-label={`Role for ${p.full_name ?? p.email ?? "this user"}`}
                              options={ROLES}
                              value={roleOf(p.id)}
                              // Disabled on every row while any write is in
                              // flight, not just this one. Leaving the others
                              // live made them focusable controls that
                              // accepted a pick and silently did nothing.
                              disabled={!!roleBusy}
                              busy={roleBusy === p.id}
                              onChange={(v) => void setRole(p.id, v)}
                              placeholder="Assign role…"
                            />
                          ) : (
                            <Badge variant="secondary">{roleOf(p.id)}</Badge>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            {!isAdmin && (
              <div className="flex items-center gap-2 border-t p-3 text-xs text-muted-foreground">
                <IconShieldCheck className="size-3.5" aria-hidden="true" /> Only administrators can
                change roles.
              </div>
            )}
          </Panel>
        </TabsContent>

        <TabsContent value="company">
          <Panel title="Company Settings">
            {form ? (
              <div className="grid gap-3 p-4 sm:grid-cols-2">
                <Field label="Company name">
                  <Input value={form.company_name ?? ""} onChange={f("company_name")} />
                </Field>
                <Field label="GST number">
                  <Input value={form.gst_number ?? ""} onChange={f("gst_number")} />
                </Field>
                <div className="sm:col-span-2">
                  <Field label="Address">
                    <Input value={form.address ?? ""} onChange={f("address")} />
                  </Field>
                </div>
                <Field label="City">
                  <Input value={form.city ?? ""} onChange={f("city")} />
                </Field>
                <Field label="State">
                  <Input value={form.state ?? ""} onChange={f("state")} />
                </Field>
                <Field label="PIN code">
                  <Input value={form.pin_code ?? ""} onChange={f("pin_code")} />
                </Field>
                <Field label="Phone">
                  <Input value={form.phone ?? ""} onChange={f("phone")} />
                </Field>
                <Field label="Email">
                  <Input value={form.email ?? ""} onChange={f("email")} />
                </Field>
                <Field
                  label="Wastage warning threshold (%)"
                  error={settingsError}
                  hint="Leave empty for no limit. Wastage above this percentage is flagged on reports and the dashboard."
                >
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    className="num"
                    placeholder="No limit set"
                    value={form.wastage_warning_threshold ?? ""}
                    onChange={(e) => {
                      setSettingsError(null);
                      f("wastage_warning_threshold")(e);
                    }}
                  />
                </Field>
                <div className="flex flex-wrap items-center gap-3 sm:col-span-2">
                  <Button
                    type="button"
                    loading={savingSettings}
                    disabled={!isAdmin || JSON.stringify(form) === savedForm}
                    onClick={() => void saveSettings()}
                  >
                    <IconSave className="size-3.5" />
                    {savingSettings ? "Saving" : "Save settings"}
                  </Button>
                  {isAdmin ? (
                    <span aria-live="polite" className="text-xs text-muted-foreground">
                      {JSON.stringify(form) === savedForm
                        ? "No unsaved changes."
                        : "Unsaved changes. Nothing is written until you save."}
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <IconShieldCheck className="size-3.5" /> Only administrators can change these.
                    </span>
                  )}
                </div>
              </div>
            ) : (
              <div className="p-8 text-center text-sm text-muted-foreground">Loading settings…</div>
            )}
          </Panel>
        </TabsContent>

        <TabsContent value="audit">
          <Panel
            title="Audit Trail"
            description="Every posting and cancellation written by the database, with who did it."
            actions={
              <ExportBar
                filename="audit-trail"
                rows={logGrid.matched.map((l: any) => ({
                  When: whenLabel(l.performed_at),
                  Entity: ENTITY[l.entity_type]?.label ?? l.entity_type,
                  Action: l.action,
                  By: peopleById.get(l.performed_by ?? "") ?? "Unknown",
                  Record: l.entity_id ?? "",
                  Details: l.details ? JSON.stringify(l.details) : "",
                }))}
              />
            }
          >
            <GridToolbar
              grid={logGrid}
              searchLabel="Search the audit trail"
              placeholder="Entity, action or person"
              noun={["entry", "entries"]}
              onReset={() => {
                setEntity("");
                setAction("");
              }}
            >
              <FilterSelect
                label="Entity"
                value={entity}
                onChange={(value) => {
                  setEntity(value);
                  logGrid.resetPage();
                }}
                options={[
                  { value: "", label: "All entities" },
                  ...Object.entries(ENTITY).map(([value, meta]) => ({
                    value,
                    label: meta.label,
                  })),
                ]}
              />
              <FilterSelect
                label="Action"
                value={action}
                onChange={(value) => {
                  setAction(value);
                  logGrid.resetPage();
                }}
                options={ACTIONS}
              />
            </GridToolbar>
            <ScopeNote>
              The {NUM(logGrid.matched.length)} most recent{" "}
              {logGrid.matched.length === 1 ? "entry" : "entries"}, newest first
              {logGrid.isFiltered ? " matching these filters" : ""}. Postings and cancellations
              only: this trail is written by the database, so it cannot be edited from the
              application.
            </ScopeNote>
            <GridScroll sticky>
              <table className="erp-table min-w-[54rem]">
                <caption className="sr-only">
                  Audit trail of posted and cancelled vouchers with the user, time and details
                </caption>
                <thead>
                  <tr>
                    <SortHeader grid={logGrid} sortKey="when">
                      When
                    </SortHeader>
                    <SortHeader grid={logGrid} sortKey="entity">
                      Voucher
                    </SortHeader>
                    <SortHeader grid={logGrid} sortKey="action">
                      Action
                    </SortHeader>
                    <SortHeader grid={logGrid} sortKey="who">
                      By
                    </SortHeader>
                    <th scope="col">Details</th>
                  </tr>
                </thead>
                <tbody>
                  {logsStatus !== "ready" ? (
                    <RegisterState
                      status={logsStatus}
                      cols={5}
                      onRetry={() => void logsQuery.refetch()}
                    />
                  ) : logGrid.matched.length === 0 ? (
                    <RegisterState
                      status="ready"
                      cols={5}
                      emptyTitle={
                        logGrid.isFiltered
                          ? "No entries match these filters."
                          : "Nothing recorded yet."
                      }
                      emptyBody={
                        logGrid.isFiltered
                          ? "Clear the filters to see every recent entry."
                          : "Posting, cancelling or correcting a voucher writes an entry here."
                      }
                      action={
                        logGrid.isFiltered ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setEntity("");
                              setAction("");
                              logGrid.setQuery("");
                            }}
                          >
                            Clear filters
                          </Button>
                        ) : undefined
                      }
                    />
                  ) : (
                    logGrid.pageRows.map((l: any) => {
                      const meta = ENTITY[l.entity_type];
                      const who = peopleById.get(l.performed_by ?? "");
                      return (
                        <tr key={l.id}>
                          <th scope="row" className="num whitespace-nowrap text-left font-normal">
                            {whenLabel(l.performed_at)}
                          </th>
                          <td className="whitespace-nowrap font-medium">
                            {meta?.label ?? l.entity_type}
                          </td>
                          <td>
                            {/*
                              A cancellation is a reversal, not a loss, so it
                              stays neutral. StatusBadge in AppShell.tsx encodes
                              the same rule; red here would read as "something
                              went wrong" for every correctly reversed voucher.
                            */}
                            <Badge variant={l.action === "CANCELLED" ? "secondary" : "success"}>
                              {l.action === "CANCELLED" ? "Cancelled" : "Posted"}
                            </Badge>
                          </td>
                          <td className="whitespace-nowrap">
                            {who ?? <span className="text-muted-foreground">Unknown user</span>}
                          </td>
                          <td className="max-w-[26rem] text-xs text-muted-foreground">
                            <DetailsCell details={l.details} />
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </GridScroll>
            <GridPager grid={logGrid} />
          </Panel>
        </TabsContent>
      </Tabs>
    </div>
  );
}

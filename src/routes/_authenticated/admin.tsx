/* eslint-disable @typescript-eslint/no-explicit-any */
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Save, ShieldCheck } from "lucide-react";
import { PageHeader } from "@/components/erp/AppShell";
import { EmptyRow, Field, Panel, SearchSelect } from "@/components/erp/bits";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { db, useInvalidate, useRole, useRows } from "@/hooks/use-erp";
import { dmy, errMsg } from "@/lib/erp";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Users & Settings — JobWork ERP" },
      { name: "description", content: "Manage user roles, company details, wastage threshold and review the audit trail." },
      { property: "og:title", content: "Users & Settings — JobWork ERP" },
      { property: "og:description", content: "Administration: roles, company settings and audit logs." },
    ],
  }),
  component: AdminPage,
});

const ROLES = [
  { value: "admin", label: "Admin — full control" },
  { value: "store", label: "Store — create & post vouchers" },
  { value: "management", label: "Management — view & reports" },
  { value: "viewer", label: "Viewer — read only" },
];

function AdminPage() {
  const { data: role } = useRole();
  const isAdmin = role === "admin";
  const invalidate = useInvalidate();

  const { data: profiles } = useRows("profiles", ["profiles"], (b) => b.order("created_at"));
  const { data: roles } = useRows("user_roles", ["user_roles"]);
  const { data: settingsRows } = useRows("company_settings", ["company_settings"]);
  const { data: logs } = useRows("audit_logs", ["audit_logs"], (b) =>
    b.order("performed_at", { ascending: false }).limit(300),
  );

  const [form, setForm] = useState<any>(null);
  useEffect(() => {
    const s = (settingsRows ?? [])[0];
    if (s && !form) setForm(s);
  }, [settingsRows, form]);

  const roleOf = (uid: string) => (roles ?? []).find((r: any) => r.user_id === uid)?.role ?? "—";

  const setRole = async (uid: string, newRole: string) => {
    const existing = (roles ?? []).find((r: any) => r.user_id === uid);
    const res = existing
      ? await db.from("user_roles").update({ role: newRole }).eq("id", existing.id)
      : await db.from("user_roles").insert({ user_id: uid, role: newRole });
    if (res.error) {
      toast.error(errMsg(res.error));
      return;
    }
    toast.success("Role updated");
    invalidate([["user_roles"], ["my-role"]]);
  };

  const saveSettings = async () => {
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
        wastage_warning_threshold: Number(form.wastage_warning_threshold) || 0,
      })
      .eq("id", form.id);
    if (error) {
      toast.error(errMsg(error));
      return;
    }
    toast.success("Company settings saved");
    invalidate([["company_settings"]]);
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
          <Panel title="Users">
            <div className="overflow-x-auto">
              <table className="erp-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Joined</th>
                    <th>Role</th>
                  </tr>
                </thead>
                <tbody>
                  {(profiles ?? []).length === 0 && <EmptyRow cols={4} />}
                  {(profiles ?? []).map((p: any) => (
                    <tr key={p.id}>
                      <td className="font-medium">{p.full_name ?? "—"}</td>
                      <td>{p.email}</td>
                      <td className="num whitespace-nowrap">{dmy(p.created_at)}</td>
                      <td className="w-64">
                        {isAdmin ? (
                          <SearchSelect
                            options={ROLES}
                            value={roleOf(p.id)}
                            onChange={(v) => void setRole(p.id, v)}
                            placeholder="Assign role…"
                          />
                        ) : (
                          <span className="text-xs font-semibold uppercase">{roleOf(p.id)}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {!isAdmin && (
              <div className="flex items-center gap-2 border-t p-3 text-xs text-muted-foreground">
                <ShieldCheck className="size-3.5" /> Only administrators can change roles.
              </div>
            )}
          </Panel>
        </TabsContent>

        <TabsContent value="company">
          <Panel title="Company Settings">
            {form ? (
              <div className="grid gap-3 p-4 sm:grid-cols-2">
                <Field label="Company name">
                  <Input className="h-9" value={form.company_name ?? ""} onChange={f("company_name")} />
                </Field>
                <Field label="GST number">
                  <Input className="h-9" value={form.gst_number ?? ""} onChange={f("gst_number")} />
                </Field>
                <div className="sm:col-span-2">
                  <Field label="Address">
                    <Input className="h-9" value={form.address ?? ""} onChange={f("address")} />
                  </Field>
                </div>
                <Field label="City">
                  <Input className="h-9" value={form.city ?? ""} onChange={f("city")} />
                </Field>
                <Field label="State">
                  <Input className="h-9" value={form.state ?? ""} onChange={f("state")} />
                </Field>
                <Field label="PIN code">
                  <Input className="h-9" value={form.pin_code ?? ""} onChange={f("pin_code")} />
                </Field>
                <Field label="Phone">
                  <Input className="h-9" value={form.phone ?? ""} onChange={f("phone")} />
                </Field>
                <Field label="Email">
                  <Input className="h-9" value={form.email ?? ""} onChange={f("email")} />
                </Field>
                <Field label="Wastage warning threshold (%)" hint="Wastage above this percentage is flagged in red.">
                  <Input
                    type="number"
                    step="0.01"
                    className="num h-9"
                    value={form.wastage_warning_threshold ?? 0}
                    onChange={f("wastage_warning_threshold")}
                  />
                </Field>
                <div className="sm:col-span-2">
                  <Button disabled={!isAdmin} onClick={() => void saveSettings()}>
                    <Save className="size-3.5" /> Save settings
                  </Button>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center text-sm text-muted-foreground">Loading settings…</div>
            )}
          </Panel>
        </TabsContent>

        <TabsContent value="audit">
          <Panel title="Audit Trail">
            <div className="overflow-x-auto">
              <table className="erp-table">
                <thead>
                  <tr>
                    <th>When</th>
                    <th>Entity</th>
                    <th>Action</th>
                    <th>Details</th>
                  </tr>
                </thead>
                <tbody>
                  {(logs ?? []).length === 0 && <EmptyRow cols={4} />}
                  {(logs ?? []).map((l: any) => (
                    <tr key={l.id}>
                      <td className="num whitespace-nowrap">
                        {dmy(l.performed_at)} {String(l.performed_at).slice(11, 16)}
                      </td>
                      <td className="text-xs font-medium">{l.entity_type}</td>
                      <td className="text-xs">{l.action}</td>
                      <td className="max-w-[28rem] truncate text-xs text-muted-foreground">
                        {l.details ? JSON.stringify(l.details) : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>
        </TabsContent>
      </Tabs>
    </div>
  );
}

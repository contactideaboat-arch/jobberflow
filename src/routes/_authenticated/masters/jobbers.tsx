/* eslint-disable @typescript-eslint/no-explicit-any */
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Pencil, Plus, Search } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/erp/AppShell";
import { EmptyRow, ExportBar, Field, Panel } from "@/components/erp/bits";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { canWrite, db, useInvalidate, useRole, useRows } from "@/hooks/use-erp";
import { errMsg } from "@/lib/erp";

export const Route = createFileRoute("/_authenticated/masters/jobbers")({
  head: () => ({
    meta: [
      { title: "Jobber Master — JobWork ERP" },
      { name: "description", content: "Create and maintain job work vendors with GST, PAN and contact details." },
      { property: "og:title", content: "Jobber Master — JobWork ERP" },
      { property: "og:description", content: "Maintain job work vendor master records." },
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

function JobberMaster() {
  const { data: role } = useRole();
  const editable = canWrite(role);
  const invalidate = useInvalidate();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<any>(BLANK);
  const [busy, setBusy] = useState(false);

  const { data: rows } = useRows("jobbers", ["jobbers"], (b) => b.order("code"));

  const filtered = (rows ?? []).filter((r: any) =>
    [r.code, r.name, r.company_name, r.city, r.gst_number].join(" ").toLowerCase().includes(q.toLowerCase()),
  );

  const set = (k: string, v: unknown) => setForm((f: any) => ({ ...f, [k]: v }));

  const openNew = () => {
    setEditId(null);
    setForm(BLANK);
    setOpen(true);
  };
  const openEdit = (r: any) => {
    setEditId(r.id);
    setForm({ ...BLANK, ...r });
    setOpen(true);
  };

  const save = async () => {
    if (!form.code.trim() || !form.name.trim()) {
      toast.error("Jobber code and name are required.");
      return;
    }
    setBusy(true);
    const payload = { ...form };
    delete payload.id;
    delete payload.created_at;
    delete payload.updated_at;
    delete payload.created_by;
    delete payload.updated_by;
    Object.keys(payload).forEach((k) => {
      if (payload[k] === "") payload[k] = null;
    });
    payload.code = String(form.code).trim().toUpperCase();
    payload.name = String(form.name).trim();
    const res = editId ? await db.from("jobbers").update(payload).eq("id", editId) : await db.from("jobbers").insert(payload);
    setBusy(false);
    if (res.error) {
      toast.error(errMsg(res.error));
      return;
    }
    toast.success(editId ? "Jobber updated." : "Jobber created.");
    setOpen(false);
    invalidate([["jobbers"]]);
  };

  const toggle = async (r: any) => {
    const { error } = await db.from("jobbers").update({ status: !r.status }).eq("id", r.id);
    if (error) {
      toast.error(errMsg(error));
      return;
    }
    invalidate([["jobbers"]]);
  };

  return (
    <div>
      <PageHeader
        title="Jobber Master"
        breadcrumb={["Masters", "Jobber Master"]}
        subtitle="Job work vendors who receive raw material and return finished products."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <ExportBar
              filename="jobber-master"
              rows={filtered.map((r: any) => ({
                Code: r.code,
                Name: r.name,
                Company: r.company_name,
                Contact: r.contact_person,
                Phone: r.phone,
                GST: r.gst_number,
                City: r.city,
                State: r.state,
                Status: r.status ? "Active" : "Inactive",
              }))}
            />
            {editable && (
              <Button size="sm" onClick={openNew}>
                <Plus className="size-4" /> New Jobber
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
            placeholder="Search code, name, city, GST…"
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
                <th>Jobber Name</th>
                <th>Company</th>
                <th>Contact</th>
                <th>Phone</th>
                <th>GST</th>
                <th>City</th>
                <th>Status</th>
                <th className="text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && <EmptyRow cols={9} />}
              {filtered.map((r: any) => (
                <tr key={r.id}>
                  <td className="num font-medium">{r.code}</td>
                  <td>{r.name}</td>
                  <td>{r.company_name ?? "—"}</td>
                  <td>{r.contact_person ?? "—"}</td>
                  <td className="num">{r.phone ?? "—"}</td>
                  <td className="num">{r.gst_number ?? "—"}</td>
                  <td>{r.city ?? "—"}</td>
                  <td>
                    <Badge variant={r.status ? "default" : "secondary"}>{r.status ? "Active" : "Inactive"}</Badge>
                  </td>
                  <td className="text-right">
                    {editable && (
                      <div className="flex items-center justify-end gap-2">
                        <Switch checked={r.status} onCheckedChange={() => void toggle(r)} />
                        <Button size="icon" variant="ghost" onClick={() => openEdit(r)}>
                          <Pencil className="size-3.5" />
                        </Button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editId ? "Edit Jobber" : "New Jobber"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Jobber Code *">
              <Input value={form.code ?? ""} onChange={(e) => set("code", e.target.value)} placeholder="JB001" />
            </Field>
            <Field label="Jobber Name *">
              <Input value={form.name ?? ""} onChange={(e) => set("name", e.target.value)} />
            </Field>
            <Field label="Company Name">
              <Input value={form.company_name ?? ""} onChange={(e) => set("company_name", e.target.value)} />
            </Field>
            <Field label="Contact Person">
              <Input value={form.contact_person ?? ""} onChange={(e) => set("contact_person", e.target.value)} />
            </Field>
            <Field label="Phone">
              <Input value={form.phone ?? ""} onChange={(e) => set("phone", e.target.value)} />
            </Field>
            <Field label="Alternate Phone">
              <Input value={form.alt_phone ?? ""} onChange={(e) => set("alt_phone", e.target.value)} />
            </Field>
            <Field label="Email">
              <Input value={form.email ?? ""} onChange={(e) => set("email", e.target.value)} />
            </Field>
            <Field label="GST Number">
              <Input value={form.gst_number ?? ""} onChange={(e) => set("gst_number", e.target.value)} />
            </Field>
            <Field label="PAN Number">
              <Input value={form.pan_number ?? ""} onChange={(e) => set("pan_number", e.target.value)} />
            </Field>
            <Field label="City">
              <Input value={form.city ?? ""} onChange={(e) => set("city", e.target.value)} />
            </Field>
            <Field label="State">
              <Input value={form.state ?? ""} onChange={(e) => set("state", e.target.value)} />
            </Field>
            <Field label="PIN Code">
              <Input value={form.pin_code ?? ""} onChange={(e) => set("pin_code", e.target.value)} />
            </Field>
            <div className="sm:col-span-2">
              <Field label="Address">
                <Textarea rows={2} value={form.address ?? ""} onChange={(e) => set("address", e.target.value)} />
              </Field>
            </div>
            <div className="sm:col-span-2">
              <Field label="Remarks">
                <Textarea rows={2} value={form.remarks ?? ""} onChange={(e) => set("remarks", e.target.value)} />
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
              {busy ? "Saving…" : "Save Jobber"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

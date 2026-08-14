/* eslint-disable @typescript-eslint/no-explicit-any */
import { createFileRoute, Link } from "@tanstack/react-router";
import { Warehouse, Factory, Boxes, Package, Trash2, TrendingUp, Users } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { PageHeader, StatusBadge } from "@/components/erp/AppShell";
import { KpiCard, Panel, EmptyRow } from "@/components/erp/bits";
import { useRows } from "@/hooks/use-erp";
import { KG, PCS, PCT, dmy } from "@/lib/erp";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — JobWork ERP" },
      { name: "description", content: "Live stock, production and wastage KPIs across warehouse and all jobbers." },
      { property: "og:title", content: "Dashboard — JobWork ERP" },
      { property: "og:description", content: "Warehouse stock, jobber stock, production received and wastage KPIs." },
    ],
  }),
  component: Dashboard,
});

const monthStart = () => new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10);

function Dashboard() {
  const warehouse = useRows("warehouse_stock", ["warehouse_stock"]);
  const jobberStock = useRows("jobber_stock", ["jobber_stock"]);
  const fg = useRows("finished_goods_stock", ["finished_goods_stock"]);
  const jobbers = useRows("jobbers", ["jobbers"], (q) => q.eq("status", true));
  const transfers = useRows(
    "jobber_transfer_headers",
    ["dash-transfers"],
    (q) => q.order("voucher_date", { ascending: false }).limit(8),
    "*, jobbers(name, code)",
  );
  const inwards = useRows(
    "product_inward_headers",
    ["dash-inwards"],
    (q) => q.order("voucher_date", { ascending: false }).limit(200),
    "*, jobbers(name, code), finished_products(name, code)",
  );

  const whTotal = (warehouse.data ?? []).reduce((s: number, r: any) => s + Number(r.balance), 0);
  const jbTotal = (jobberStock.data ?? []).reduce((s: number, r: any) => s + Number(r.balance), 0);
  const fgTotal = (fg.data ?? []).reduce((s: number, r: any) => s + Number(r.balance), 0);
  const posted = (inwards.data ?? []).filter((r: any) => r.status === "POSTED");
  const thisMonth = posted.filter((r: any) => r.voucher_date >= monthStart());
  const prodMonth = thisMonth.reduce((s: number, r: any) => s + Number(r.finished_quantity), 0);
  const wasteMonth = thisMonth.reduce((s: number, r: any) => s + Number(r.overall_wastage_kg), 0);
  const lowStock = (warehouse.data ?? []).filter((r: any) => Number(r.balance) < Number(r.minimum_stock));
  const highWastage = [...posted].sort((a: any, b: any) => b.wastage_percentage - a.wastage_percentage).slice(0, 6);

  const monthly = Object.values(
    posted.reduce((acc: Record<string, any>, r: any) => {
      const k = String(r.voucher_date).slice(0, 7);
      acc[k] ??= { month: k, production: 0, wastage: 0 };
      acc[k].production += Number(r.finished_quantity);
      acc[k].wastage += Number(r.overall_wastage_kg);
      return acc;
    }, {}),
  ).sort((a: any, b: any) => a.month.localeCompare(b.month));

  const byJobber = Object.values(
    posted.reduce((acc: Record<string, any>, r: any) => {
      const k = r.jobbers?.name ?? "—";
      acc[k] ??= { name: k, wastage: 0, production: 0 };
      acc[k].wastage += Number(r.overall_wastage_kg);
      acc[k].production += Number(r.finished_quantity);
      return acc;
    }, {}),
  );

  const byProduct = Object.values(
    posted.reduce((acc: Record<string, any>, r: any) => {
      const k = r.finished_products?.name ?? "—";
      acc[k] ??= { name: k, value: 0 };
      acc[k].value += Number(r.finished_quantity);
      return acc;
    }, {}),
  );

  const jobberSummary = Object.values(
    (jobberStock.data ?? []).reduce((acc: Record<string, any>, r: any) => {
      acc[r.jobber_id] ??= { name: r.jobber_name, code: r.jobber_code, materials: 0, balance: 0 };
      acc[r.jobber_id].materials += Number(r.balance) > 0 ? 1 : 0;
      acc[r.jobber_id].balance += Number(r.balance);
      return acc;
    }, {}),
  );

  const chartColors = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)"];

  return (
    <div>
      <PageHeader
        title="Operations Dashboard"
        breadcrumb={["Overview", "Dashboard"]}
        subtitle="Company-owned raw material across the warehouse and every jobber, production received and voucher-wise wastage."
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Warehouse Raw Material" value={KG(whTotal)} unit="KG" icon={<Warehouse className="size-4" />} />
        <KpiCard
          label="Raw Material at Jobbers"
          value={KG(jbTotal)}
          unit="KG"
          tone="accent"
          icon={<Factory className="size-4" />}
        />
        <KpiCard
          label="Total Company Raw Material"
          value={KG(whTotal + jbTotal)}
          unit="KG"
          tone="info"
          hint="Warehouse + all jobbers"
          icon={<Boxes className="size-4" />}
        />
        <KpiCard
          label="Finished Goods Stock"
          value={PCS(fgTotal)}
          unit="PCS"
          tone="success"
          icon={<Package className="size-4" />}
        />
        <KpiCard label="Active Jobbers" value={String(jobbers.data?.length ?? 0)} icon={<Users className="size-4" />} />
        <KpiCard
          label="Production Received (Month)"
          value={PCS(prodMonth)}
          unit="PCS"
          icon={<TrendingUp className="size-4" />}
        />
        <KpiCard
          label="Overall Wastage (Month)"
          value={KG(wasteMonth)}
          unit="KG"
          tone="warning"
          icon={<Trash2 className="size-4" />}
        />
        <KpiCard
          label="Product Inward Vouchers (Month)"
          value={String(thisMonth.length)}
          hint={`Avg wastage ${PCT(thisMonth.length ? thisMonth.reduce((s: number, r: any) => s + Number(r.wastage_percentage), 0) / thisMonth.length : 0)}`}
        />
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        <Panel title="Monthly Production (PCS)">
          <div className="h-64 p-3">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthly as any[]}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="month" fontSize={11} />
                <YAxis fontSize={11} />
                <Tooltip />
                <Bar dataKey="production" fill="var(--chart-1)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>
        <Panel title="Monthly Overall Wastage (KG)">
          <div className="h-64 p-3">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthly as any[]}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="month" fontSize={11} />
                <YAxis fontSize={11} />
                <Tooltip />
                <Line type="monotone" dataKey="wastage" stroke="var(--chart-2)" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Panel>
        <Panel title="Jobber-wise Wastage (KG)">
          <div className="h-64 p-3">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byJobber as any[]}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="name" fontSize={11} />
                <YAxis fontSize={11} />
                <Tooltip />
                <Bar dataKey="wastage" fill="var(--chart-5)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>
        <Panel title="Product-wise Production">
          <div className="h-64 p-3">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={byProduct as any[]} dataKey="value" nameKey="name" outerRadius={80} label>
                  {(byProduct as any[]).map((_, i) => (
                    <Cell key={i} fill={chartColors[i % chartColors.length]} />
                  ))}
                </Pie>
                <Legend />
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Panel>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        <Panel title="Jobber Stock Summary">
          <table className="erp-table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Jobber</th>
                <th className="text-right">Materials</th>
                <th className="text-right">Balance KG</th>
              </tr>
            </thead>
            <tbody>
              {jobberSummary.length === 0 && <EmptyRow cols={4} />}
              {(jobberSummary as any[]).map((j) => (
                <tr key={j.code}>
                  <td className="num">{j.code}</td>
                  <td>{j.name}</td>
                  <td className="num text-right">{j.materials}</td>
                  <td className="num text-right font-semibold">{KG(j.balance)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>

        <Panel title="Low Stock Materials">
          <table className="erp-table">
            <thead>
              <tr>
                <th>Material</th>
                <th className="text-right">Balance</th>
                <th className="text-right">Minimum</th>
              </tr>
            </thead>
            <tbody>
              {lowStock.length === 0 && <EmptyRow cols={3} text="All materials above minimum level." />}
              {(lowStock as any[]).map((m) => (
                <tr key={m.material_id}>
                  <td>
                    {m.code} — {m.name}
                  </td>
                  <td className="num text-right text-destructive">{KG(m.balance)}</td>
                  <td className="num text-right">{KG(m.minimum_stock)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>

        <Panel
          title="Recent Material Transfers"
          actions={
            <Link className="text-xs font-medium text-primary" to="/transactions/transfer">
              View all
            </Link>
          }
        >
          <table className="erp-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Voucher</th>
                <th>Jobber</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {(transfers.data ?? []).length === 0 && <EmptyRow cols={4} />}
              {(transfers.data ?? []).map((t: any) => (
                <tr key={t.id}>
                  <td className="num">{dmy(t.voucher_date)}</td>
                  <td className="num">{t.voucher_number}</td>
                  <td>{t.jobbers?.name}</td>
                  <td>
                    <StatusBadge status={t.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>

        <Panel
          title="High Wastage Vouchers"
          actions={
            <Link className="text-xs font-medium text-primary" to="/reports">
              Wastage reports
            </Link>
          }
        >
          <table className="erp-table">
            <thead>
              <tr>
                <th>Voucher</th>
                <th>Jobber</th>
                <th className="text-right">Wastage KG</th>
                <th className="text-right">%</th>
              </tr>
            </thead>
            <tbody>
              {highWastage.length === 0 && <EmptyRow cols={4} />}
              {(highWastage as any[]).map((v) => (
                <tr key={v.id}>
                  <td className="num">{v.voucher_number}</td>
                  <td>{v.jobbers?.name}</td>
                  <td className="num text-right">{KG(v.overall_wastage_kg)}</td>
                  <td className="num text-right font-semibold text-warning-foreground">{PCT(v.wastage_percentage)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
      </div>
    </div>
  );
}

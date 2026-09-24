/* eslint-disable @typescript-eslint/no-explicit-any */
import { createFileRoute, Link } from "@tanstack/react-router";
import type { LucideIcon } from "lucide-react";
import {
  Activity,
  ArrowLeftRight,
  ArrowRight,
  Boxes,
  Factory,
  FileBarChart2,
  Gauge,
  Layers3,
  Package,
  Settings2,
  ShieldCheck,
  Trash2,
  TrendingUp,
  Users,
  Warehouse,
} from "lucide-react";
import { PageHeader } from "@/components/erp/AppShell";
import { useRows } from "@/hooks/use-erp";
import { KG, PCS, PCT } from "@/lib/erp";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Operations Control Hub — JobWork ERP" },
      { name: "description", content: "Live operational KPIs and direct access to every JobWork ERP module." },
      { property: "og:title", content: "Operations Control Hub — JobWork ERP" },
      { property: "og:description", content: "Live stock and production KPIs with direct module navigation." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Dashboard,
});

type AppPath =
  | "/masters/jobbers"
  | "/masters/materials"
  | "/masters/products"
  | "/masters/bom"
  | "/inventory/warehouse"
  | "/inventory/jobber-stock"
  | "/inventory/finished-goods"
  | "/inventory/rm-ledger"
  | "/inventory/fg-ledger"
  | "/transactions/rm-inward"
  | "/transactions/transfer"
  | "/transactions/product-inward"
  | "/transactions/material-return"
  | "/transactions/adjustment"
  | "/reports"
  | "/reconciliation"
  | "/admin";

type ModuleTone = "primary" | "success" | "accent" | "info" | "neutral";

type Module = {
  title: string;
  eyebrow: string;
  metricLabel: string;
  metric: string;
  icon: LucideIcon;
  tone: ModuleTone;
  links: Array<{ label: string; description: string; to: AppPath }>;
};

const toneStyles: Record<ModuleTone, { top: string; icon: string; hover: string; text: string }> = {
  primary: {
    top: "border-t-primary",
    icon: "bg-primary/10 text-primary",
    hover: "hover:bg-primary/8 hover:text-primary",
    text: "text-primary",
  },
  success: {
    top: "border-t-success",
    icon: "bg-success/10 text-success",
    hover: "hover:bg-success/8 hover:text-success",
    text: "text-success",
  },
  accent: {
    top: "border-t-accent",
    icon: "bg-accent/12 text-accent-foreground",
    hover: "hover:bg-accent/10 hover:text-accent-foreground",
    text: "text-accent-foreground",
  },
  info: {
    top: "border-t-info",
    icon: "bg-info/10 text-info",
    hover: "hover:bg-info/8 hover:text-info",
    text: "text-info",
  },
  neutral: {
    top: "border-t-muted-foreground",
    icon: "bg-muted text-muted-foreground",
    hover: "hover:bg-muted hover:text-foreground",
    text: "text-foreground",
  },
};

function Dashboard() {
  const warehouse = useRows("warehouse_stock", ["warehouse_stock"]);
  const jobberStock = useRows("jobber_stock", ["jobber_stock"]);
  const fg = useRows("finished_goods_stock", ["finished_goods_stock"]);
  const jobbers = useRows("jobbers", ["jobbers"], (q) => q.eq("status", true));
  const products = useRows("finished_products", ["dashboard-products"], (q) => q.eq("status", true));
  const materials = useRows("raw_materials", ["dashboard-materials"], (q) => q.eq("status", true));
  const inwards = useRows(
    "product_inward_headers",
    ["dash-inwards"],
    (q) => q.order("voucher_date", { ascending: false }).limit(200),
  );

  const whTotal = (warehouse.data ?? []).reduce((sum: number, row: any) => sum + Number(row.balance), 0);
  const jobberTotal = (jobberStock.data ?? []).reduce((sum: number, row: any) => sum + Number(row.balance), 0);
  const fgTotal = (fg.data ?? []).reduce((sum: number, row: any) => sum + Number(row.balance), 0);
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10);
  const monthInwards = (inwards.data ?? []).filter((row: any) => row.status === "POSTED" && row.voucher_date >= monthStart);
  const productionMonth = monthInwards.reduce((sum: number, row: any) => sum + Number(row.finished_quantity), 0);
  const wastageMonth = monthInwards.reduce((sum: number, row: any) => sum + Number(row.overall_wastage_kg), 0);
  const averageWastage = monthInwards.length
    ? monthInwards.reduce((sum: number, row: any) => sum + Number(row.wastage_percentage), 0) / monthInwards.length
    : 0;

  const modules: Module[] = [
    {
      title: "Masters",
      eyebrow: "Core data",
      metricLabel: "Active records",
      metric: String((jobbers.data?.length ?? 0) + (products.data?.length ?? 0) + (materials.data?.length ?? 0)),
      icon: Layers3,
      tone: "primary",
      links: [
        { label: "Jobber Master", description: "Contractor profiles", to: "/masters/jobbers" },
        { label: "Raw Material Master", description: "Materials and stock limits", to: "/masters/materials" },
        { label: "Finished Product Master", description: "Product catalogue", to: "/masters/products" },
        { label: "BOM Master", description: "Recipes and revisions", to: "/masters/bom" },
      ],
    },
    {
      title: "Inventory",
      eyebrow: "Live stock",
      metricLabel: "Company raw material",
      metric: `${KG(whTotal + jobberTotal)} KG`,
      icon: Boxes,
      tone: "success",
      links: [
        { label: "Warehouse Stock", description: "Material at warehouse", to: "/inventory/warehouse" },
        { label: "Jobber Stock", description: "Material at jobbers", to: "/inventory/jobber-stock" },
        { label: "Finished Goods Stock", description: "Ready product balance", to: "/inventory/finished-goods" },
        { label: "Raw Material Ledger", description: "Material movement history", to: "/inventory/rm-ledger" },
        { label: "Finished Goods Ledger", description: "Product movement history", to: "/inventory/fg-ledger" },
      ],
    },
    {
      title: "Transactions",
      eyebrow: "Daily operations",
      metricLabel: "Inward vouchers this month",
      metric: String(monthInwards.length),
      icon: ArrowLeftRight,
      tone: "accent",
      links: [
        { label: "Raw Material Inward", description: "Receive materials", to: "/transactions/rm-inward" },
        { label: "Material Transfer to Jobber", description: "Issue for production", to: "/transactions/transfer" },
        { label: "Product Inward from Jobber", description: "Receive finished goods", to: "/transactions/product-inward" },
        { label: "Material Return from Jobber", description: "Return unused material", to: "/transactions/material-return" },
        { label: "Stock Adjustment", description: "Correct stock balances", to: "/transactions/adjustment" },
      ],
    },
    {
      title: "Reports",
      eyebrow: "Analysis",
      metricLabel: "Average wastage this month",
      metric: PCT(averageWastage),
      icon: FileBarChart2,
      tone: "info",
      links: [
        { label: "Reports Centre", description: "Production and wastage reports", to: "/reports" },
        { label: "Jobber Reconciliation", description: "Material accountability", to: "/reconciliation" },
      ],
    },
    {
      title: "Administration",
      eyebrow: "System control",
      metricLabel: "Access",
      metric: "Users & settings",
      icon: Settings2,
      tone: "neutral",
      links: [{ label: "Users & Settings", description: "Roles, company and audit trail", to: "/admin" }],
    },
  ];

  const kpis = [
    { label: "Warehouse raw material", value: KG(whTotal), unit: "KG", icon: Warehouse, to: "/inventory/warehouse" as AppPath, tone: "default" },
    { label: "Raw material at jobbers", value: KG(jobberTotal), unit: "KG", icon: Factory, to: "/inventory/jobber-stock" as AppPath, tone: "accent" },
    { label: "Finished goods stock", value: PCS(fgTotal), unit: "PCS", icon: Package, to: "/inventory/finished-goods" as AppPath, tone: "success" },
    { label: "Active jobbers", value: String(jobbers.data?.length ?? 0), icon: Users, to: "/masters/jobbers" as AppPath, tone: "info" },
    { label: "Production this month", value: PCS(productionMonth), unit: "PCS", icon: TrendingUp, to: "/transactions/product-inward" as AppPath, tone: "default" },
    { label: "Wastage this month", value: KG(wastageMonth), unit: "KG", icon: Trash2, to: "/reports" as AppPath, tone: "warning" },
  ];

  return (
    <div className="mx-auto max-w-[1480px]">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-5">
        <PageHeader
          title="Operational Control Hub"
          breadcrumb={["Overview", "Dashboard"]}
          subtitle="Live production control and direct access to every operational workspace."
        />
        <div className="mb-5 flex items-center gap-2 rounded-full border border-success/25 bg-success/10 px-3 py-1.5 text-[11px] font-bold uppercase text-success">
          <span className="size-2 rounded-full bg-success" />
          Live data connected
        </div>
      </div>

      <section aria-labelledby="kpi-heading" className="py-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 id="kpi-heading" className="text-sm font-bold uppercase text-muted-foreground">Operating position</h2>
          <span className="text-xs text-muted-foreground">Select any KPI to open its details</span>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
          {kpis.map((kpi) => {
            const Icon = kpi.icon;
            return (
              <Link
                key={kpi.label}
                to={kpi.to}
                className="group rounded-lg border bg-card p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/35 hover:shadow-panel focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="text-[10px] font-bold uppercase text-muted-foreground">{kpi.label}</div>
                  <Icon className="size-4 text-muted-foreground transition-colors group-hover:text-primary" />
                </div>
                <div className={cn("num mt-3 text-2xl font-bold", kpi.tone === "accent" && "text-accent-foreground", kpi.tone === "success" && "text-success", kpi.tone === "info" && "text-info", kpi.tone === "warning" && "text-warning-foreground")}>
                  {kpi.value}
                  {kpi.unit && <span className="ml-1 text-[10px] font-semibold text-muted-foreground">{kpi.unit}</span>}
                </div>
                <div className="mt-3 flex items-center gap-1 text-[11px] font-semibold text-primary opacity-70 transition-opacity group-hover:opacity-100">
                  View details <ArrowRight className="size-3 transition-transform group-hover:translate-x-0.5" />
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      <section aria-labelledby="modules-heading" className="pb-6">
        <div className="mb-3 flex items-center gap-2">
          <Gauge className="size-4 text-primary" />
          <h2 id="modules-heading" className="text-sm font-bold uppercase text-muted-foreground">Module command center</h2>
        </div>
        <div className="grid items-start gap-4 md:grid-cols-2 xl:grid-cols-3">
          {modules.map((module) => {
            const Icon = module.icon;
            const tone = toneStyles[module.tone];
            return (
              <article key={module.title} className={cn("overflow-hidden rounded-lg border border-t-4 bg-card shadow-sm transition-shadow duration-200 hover:shadow-panel", tone.top)}>
                <div className="flex items-start justify-between gap-4 border-b p-5">
                  <div>
                    <div className="mb-3 flex items-center gap-3">
                      <span className={cn("flex size-10 items-center justify-center rounded-lg", tone.icon)}>
                        <Icon className="size-5" />
                      </span>
                      <div>
                        <p className="text-[10px] font-bold uppercase text-muted-foreground">{module.eyebrow}</p>
                        <h3 className="text-lg font-bold">{module.title}</h3>
                      </div>
                    </div>
                  </div>
                  <div className="max-w-36 text-right">
                    <p className="text-[9px] font-bold uppercase text-muted-foreground">{module.metricLabel}</p>
                    <p className={cn("num mt-1 text-lg font-bold", tone.text)}>{module.metric}</p>
                  </div>
                </div>
                <nav aria-label={`${module.title} pages`} className="p-3">
                  {module.links.map((item) => (
                    <Link
                      key={item.to}
                      to={item.to}
                      className={cn("group/link flex min-h-14 items-center justify-between gap-3 rounded-md px-3 py-2 transition-colors", tone.hover)}
                    >
                      <span className="min-w-0">
                        <span className="block text-sm font-semibold">{item.label}</span>
                        <span className="block truncate text-[11px] text-muted-foreground">{item.description}</span>
                      </span>
                      <ArrowRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover/link:translate-x-0.5" />
                    </Link>
                  ))}
                </nav>
              </article>
            );
          })}

          <aside className="flex min-h-56 flex-col justify-between rounded-lg border bg-sidebar p-5 text-sidebar-foreground shadow-panel">
            <div>
              <div className="mb-4 flex items-center justify-between">
                <span className="flex size-10 items-center justify-center rounded-lg bg-sidebar-accent">
                  <ShieldCheck className="size-5 text-sidebar-primary" />
                </span>
                <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase text-sidebar-foreground/60">
                  <Activity className="size-3" /> Operational
                </span>
              </div>
              <h3 className="text-lg font-bold">Production snapshot</h3>
              <p className="mt-1 text-xs leading-relaxed text-sidebar-foreground/65">
                {PCS(productionMonth)} pieces received with {KG(wastageMonth)} KG recorded wastage this month.
              </p>
            </div>
            <Link
              to="/reports"
              className="mt-6 flex items-center justify-between rounded-md border border-sidebar-border bg-sidebar-accent px-3 py-2.5 text-xs font-bold transition-colors hover:text-sidebar-primary"
            >
              Open management reports <ArrowRight className="size-4" />
            </Link>
          </aside>
        </div>
      </section>
    </div>
  );
}
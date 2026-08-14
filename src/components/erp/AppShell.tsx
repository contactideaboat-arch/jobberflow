import { Link, useRouterState } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import {
  LayoutDashboard,
  Factory,
  Boxes,
  ArrowLeftRight,
  FileBarChart2,
  Settings2,
  Menu,
  LogOut,
  ScrollText,
  Package,
  ChevronDown,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useRole, useSession } from "@/hooks/use-erp";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type NavItem = { to: string; label: string };
type NavGroup = { label: string; icon: typeof Boxes; items: NavItem[] };

const NAV: NavGroup[] = [
  { label: "Overview", icon: LayoutDashboard, items: [{ to: "/dashboard", label: "Dashboard" }] },
  {
    label: "Masters",
    icon: Factory,
    items: [
      { to: "/masters/jobbers", label: "Jobber Master" },
      { to: "/masters/materials", label: "Raw Material Master" },
      { to: "/masters/products", label: "Finished Product Master" },
      { to: "/masters/bom", label: "BOM Master" },
    ],
  },
  {
    label: "Inventory",
    icon: Boxes,
    items: [
      { to: "/inventory/warehouse", label: "Warehouse Stock" },
      { to: "/inventory/jobber-stock", label: "Jobber Stock" },
      { to: "/inventory/finished-goods", label: "Finished Goods Stock" },
      { to: "/inventory/rm-ledger", label: "Raw Material Ledger" },
      { to: "/inventory/fg-ledger", label: "Finished Goods Ledger" },
    ],
  },
  {
    label: "Transactions",
    icon: ArrowLeftRight,
    items: [
      { to: "/transactions/rm-inward", label: "Raw Material Inward" },
      { to: "/transactions/transfer", label: "Material Transfer to Jobber" },
      { to: "/transactions/product-inward", label: "Product Inward from Jobber" },
      { to: "/transactions/material-return", label: "Material Return from Jobber" },
      { to: "/transactions/adjustment", label: "Stock Adjustment" },
    ],
  },
  {
    label: "Reports",
    icon: FileBarChart2,
    items: [
      { to: "/reports", label: "Reports Centre" },
      { to: "/reconciliation", label: "Jobber Reconciliation" },
    ],
  },
  { label: "Administration", icon: Settings2, items: [{ to: "/admin", label: "Users & Settings" }] },
];

function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const [closed, setClosed] = useState<string[]>([]);

  return (
    <nav className="flex-1 space-y-1 overflow-y-auto px-2 py-3">
      {NAV.map((group) => {
        const open = !closed.includes(group.label);
        const Icon = group.icon;
        return (
          <div key={group.label}>
            <button
              onClick={() => setClosed((c) => (open ? [...c, group.label] : c.filter((x) => x !== group.label)))}
              className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-sidebar-foreground/60 transition-colors hover:text-sidebar-foreground"
            >
              <Icon className="size-3.5" />
              {group.label}
              <ChevronDown className={cn("ml-auto size-3.5 transition-transform", !open && "-rotate-90")} />
            </button>
            {open && (
              <div className="mb-1 space-y-0.5">
                {group.items.map((item) => (
                  <Link
                    key={item.to}
                    to={item.to}
                    onClick={onNavigate}
                    className={cn(
                      "block rounded-md px-3 py-1.5 pl-8 text-[13px] text-sidebar-foreground/80 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                      path === item.to && "bg-sidebar-accent font-medium text-sidebar-primary",
                    )}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </nav>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { data: role } = useRole();
  const { data: user } = useSession();

  const signOut = async () => {
    await supabase.auth.signOut();
    window.location.href = "/auth";
  };

  const brand = (
    <div className="flex items-center gap-2 border-b border-sidebar-border px-4 py-4">
      <div className="flex size-9 items-center justify-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground">
        <Package className="size-5" />
      </div>
      <div className="leading-tight">
        <div className="font-display text-sm font-bold text-sidebar-foreground">JobWork ERP</div>
        <div className="text-[10px] uppercase tracking-wider text-sidebar-foreground/50">BOM &amp; Jobber Control</div>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="no-print hidden w-64 shrink-0 flex-col bg-sidebar lg:flex">
        {brand}
        <SidebarNav />
        <div className="border-t border-sidebar-border p-3">
          <div className="mb-2 truncate text-[11px] text-sidebar-foreground/60">{user?.email}</div>
          <div className="flex items-center justify-between gap-2">
            <Badge variant="outline" className="border-sidebar-border text-[10px] uppercase text-sidebar-primary">
              {role ?? "…"}
            </Badge>
            <Button size="sm" variant="ghost" onClick={signOut} className="h-7 text-sidebar-foreground/80">
              <LogOut className="size-3.5" /> Sign out
            </Button>
          </div>
        </div>
      </aside>

      {mobileOpen && (
        <div className="no-print fixed inset-0 z-50 flex lg:hidden">
          <div className="absolute inset-0 bg-foreground/40" onClick={() => setMobileOpen(false)} />
          <aside className="relative flex w-64 flex-col bg-sidebar">
            {brand}
            <SidebarNav onNavigate={() => setMobileOpen(false)} />
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="no-print flex items-center gap-3 border-b bg-card px-4 py-2.5 lg:hidden">
          <Button size="icon" variant="ghost" onClick={() => setMobileOpen(true)}>
            <Menu className="size-5" />
          </Button>
          <span className="font-display text-sm font-bold">JobWork ERP</span>
          <Button size="sm" variant="ghost" className="ml-auto" onClick={signOut}>
            <LogOut className="size-4" />
          </Button>
        </header>
        <main className="min-w-0 flex-1 p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}

export function PageHeader({
  title,
  subtitle,
  breadcrumb,
  actions,
}: {
  title: string;
  subtitle?: string;
  breadcrumb?: string[];
  actions?: ReactNode;
}) {
  return (
    <div className="no-print mb-5 flex flex-wrap items-end justify-between gap-3">
      <div>
        {breadcrumb && (
          <div className="mb-1 flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-muted-foreground">
            <ScrollText className="size-3" />
            {breadcrumb.join("  /  ")}
          </div>
        )}
        <h1 className="text-xl font-bold lg:text-2xl">{title}</h1>
        {subtitle && <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    POSTED: "bg-success/12 text-success border-success/30",
    DRAFT: "bg-warning/15 text-warning-foreground border-warning/40",
    CANCELLED: "bg-destructive/12 text-destructive border-destructive/30",
  };
  return (
    <span
      className={cn(
        "inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
        map[status] ?? "bg-muted text-muted-foreground border-border",
      )}
    >
      {status}
    </span>
  );
}

import { useRouterState } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import { CircleUserRound, LogOut, Menu, ScrollText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useRole, useSession } from "@/hooks/use-erp";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { SidebarBrand, SidebarNav } from "@/components/erp/AppNavigation";
import { findNavigation } from "@/components/erp/navigation";
import { WorkflowRail } from "@/components/erp/WorkflowRail";
import { cn } from "@/lib/utils";

export function AppShell({ children }: { children: ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const path = useRouterState({ select: (state) => state.location.pathname });
  const isLoading = useRouterState({ select: (state) => state.isLoading });
  const { data: role } = useRole();
  const { data: user } = useSession();
  const activeNavigation = findNavigation(path);
  const readOnly = role === "management" || role === "viewer";

  const signOut = async () => {
    await supabase.auth.signOut();
    window.location.assign("/auth");
  };

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <a href="#main-content" className="skip-link">
        Skip to content
      </a>
      <div className={cn("route-progress", isLoading && "is-active")} aria-hidden="true" />

      <div className="flex min-h-dvh">
        <aside className="no-print sticky top-0 hidden h-dvh w-68 shrink-0 flex-col border-r border-sidebar-border bg-sidebar lg:flex">
          <SidebarBrand />
          <SidebarNav />
          <div className="border-t border-sidebar-border p-3">
            <div className="flex items-center gap-2 px-2 py-2">
              <span className="flex size-8 items-center justify-center bg-sidebar-accent text-sidebar-foreground/75">
                <CircleUserRound className="size-4" aria-hidden="true" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-medium text-sidebar-foreground">
                  {user?.email}
                </p>
                <p className="mt-0.5 text-[9px] font-bold uppercase tracking-[0.14em] text-sidebar-primary">
                  {role ?? "Loading role"}
                </p>
              </div>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => void signOut()}
                aria-label="Sign out"
                className="text-sidebar-foreground/65 hover:bg-sidebar-accent hover:text-sidebar-foreground"
              >
                <LogOut className="size-4" />
              </Button>
            </div>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="no-print sticky top-0 z-30 hidden h-14 items-center gap-3 border-b bg-background/90 px-6 backdrop-blur-md lg:flex">
            <ScrollText className="size-4 text-muted-foreground" aria-hidden="true" />
            <div className="min-w-0">
              <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
                {activeNavigation?.group.label ?? "Workspace"}
              </p>
              <p className="truncate text-sm font-semibold">
                {activeNavigation?.item.label ?? "Operations overview"}
              </p>
            </div>
            {readOnly && (
              <span className="ml-3 border bg-muted px-2 py-1 text-[9px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
                Read-only access
              </span>
            )}
            <div className="ml-auto flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              <span className="size-1.5 rounded-full bg-success" aria-hidden="true" />
              Live workspace
            </div>
          </header>

          <header className="no-print sticky top-0 z-30 flex h-14 items-center gap-3 border-b bg-background/90 px-4 backdrop-blur-md lg:hidden">
            <Button
              size="icon"
              variant="ghost"
              onClick={() => setMobileOpen(true)}
              aria-label="Open navigation"
            >
              <Menu className="size-5" />
            </Button>
            <div>
              <p className="font-display text-sm font-bold leading-none">JobberFlow</p>
              <p className="mt-1 text-[9px] font-semibold uppercase tracking-[0.13em] text-muted-foreground">
                {activeNavigation?.item.label ?? "Operations overview"}
              </p>
            </div>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => void signOut()}
              aria-label="Sign out"
              className="ml-auto"
            >
              <LogOut className="size-4" />
            </Button>
          </header>

          <main
            id="main-content"
            className="min-w-0 flex-1 p-3 sm:p-4 lg:p-6"
            aria-busy={isLoading}
          >
            <div className="mx-auto max-w-[90rem]">
              <WorkflowRail path={path} />
              <div key={path} className="route-stage" aria-live="polite">
                {children}
              </div>
            </div>
          </main>
        </div>
      </div>

      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent
          side="left"
          className="w-[min(20rem,88vw)] gap-0 border-sidebar-border bg-sidebar p-0 text-sidebar-foreground"
        >
          <SheetTitle className="sr-only">JobberFlow navigation</SheetTitle>
          <SheetDescription className="sr-only">
            Move between operational workspaces and stages.
          </SheetDescription>
          <SidebarBrand />
          <SidebarNav onNavigate={() => setMobileOpen(false)} />
          <div className="flex items-center justify-between border-t border-sidebar-border p-4">
            <div className="min-w-0">
              <p className="truncate text-xs text-sidebar-foreground/70">{user?.email}</p>
              <Badge
                variant="outline"
                className="mt-1 border-sidebar-border text-[9px] uppercase tracking-wider text-sidebar-primary"
              >
                {role ?? "Loading role"}
              </Badge>
            </div>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => void signOut()}
              aria-label="Sign out"
            >
              <LogOut className="size-4" />
            </Button>
          </div>
        </SheetContent>
      </Sheet>
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
    <div className="no-print mb-5 flex flex-col gap-4 border-b pb-5 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {breadcrumb && (
          <div className="mb-2 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.13em] text-muted-foreground">
            <ScrollText className="size-3" aria-hidden="true" />
            {breadcrumb.map((item, index) => (
              <span key={item} className="contents">
                {index > 0 && (
                  <span aria-hidden="true" className="text-border">
                    /
                  </span>
                )}
                <span>{item}</span>
              </span>
            ))}
          </div>
        )}
        <h1 className="text-balance text-2xl font-bold tracking-[-0.025em] lg:text-[1.75rem]">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-1.5 max-w-2xl text-pretty text-sm leading-relaxed text-muted-foreground">
            {subtitle}
          </p>
        )}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
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
        "inline-flex rounded-sm border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
        map[status] ?? "border-border bg-muted text-muted-foreground",
      )}
    >
      {status}
    </span>
  );
}

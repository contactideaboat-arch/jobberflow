import { Link, useRouterState } from "@tanstack/react-router";
import { format } from "date-fns";
import { IconChevronRight, IconExit, IconMenu, Logo } from "@/components/icons";
import { useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useRole } from "@/hooks/use-erp";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { SidebarBrand, SidebarFooter, SidebarNav } from "@/components/erp/AppNavigation";
import { findNavigation } from "@/components/erp/navigation";
import { WorkflowRail } from "@/components/erp/WorkflowRail";
import { cn } from "@/lib/utils";

export function AppShell({ children }: { children: ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(readRailPreference);
  const path = useRouterState({ select: (state) => state.location.pathname });
  const isLoading = useRouterState({ select: (state) => state.isLoading });
  const { data: role } = useRole();
  const activeNavigation = findNavigation(path);
  const readOnly = role === "management" || role === "viewer";

  useEffect(() => {
    try {
      window.localStorage.setItem(RAIL_KEY, collapsed ? "1" : "0");
    } catch {
      // Storage can be blocked; the rail still works for this session.
    }
  }, [collapsed]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "b") {
        event.preventDefault();
        setCollapsed((value) => !value);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

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
        <aside
          className={cn(
            "no-print sticky top-0 hidden h-dvh shrink-0 flex-col border-r border-sidebar-border bg-sidebar transition-[width] duration-200 ease-out lg:flex",
            collapsed ? "w-[4.25rem]" : "w-64",
          )}
          data-collapsed={collapsed || undefined}
        >
          <SidebarBrand collapsed={collapsed} onToggle={() => setCollapsed((value) => !value)} />
          <SidebarNav collapsed={collapsed} />
          <SidebarFooter collapsed={collapsed} onToggle={() => setCollapsed((value) => !value)} />
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          {/* Top bar: where you are on the left; your access and the day on the right. */}
          <header className="no-print sticky top-0 z-30 hidden h-topbar items-center gap-6 border-b bg-card/95 px-8 backdrop-blur-sm lg:flex">
            <Breadcrumbs navigation={activeNavigation} />
            <div className="ml-auto flex items-center gap-4 text-xs">
              {readOnly && <Badge variant="secondary">Read only</Badge>}
              <span className="num text-muted-foreground" suppressHydrationWarning>
                {format(new Date(), "EEE dd/MM/yyyy")}
              </span>
            </div>
          </header>

          <header className="no-print sticky top-0 z-30 flex h-topbar items-center gap-2 border-b bg-card/95 px-2 backdrop-blur-sm lg:hidden">
            <Button
              size="icon"
              variant="ghost"
              onClick={() => setMobileOpen(true)}
              aria-label="Open navigation"
            >
              <IconMenu className="size-5" />
            </Button>
            <p className="flex min-w-0 items-center gap-2 truncate leading-none">
              <Logo className="size-[1.125rem] shrink-0 text-primary" />
              <span className="truncate text-sm font-semibold">
                {activeNavigation?.item.label ?? "Workspace"}
              </span>
            </p>
            {readOnly && (
              <Badge variant="secondary" className="ml-auto">
                Read only
              </Badge>
            )}
            <Button
              size="icon"
              variant="ghost"
              onClick={() => void signOut()}
              aria-label="Sign out"
              className={cn(!readOnly && "ml-auto")}
            >
              <IconExit className="size-4" />
            </Button>
          </header>

          <main
            id="main-content"
            // tabIndex -1 makes the skip link land on the landmark itself
            // rather than on the first focusable control inside it, which is
            // what makes it a skip and not just a scroll.
            tabIndex={-1}
            className="min-w-0 flex-1 px-4 py-5 outline-none sm:px-5 lg:px-8 lg:py-7"
            aria-busy={isLoading}
          >
            <div className="mx-auto max-w-content">
              <WorkflowRail path={path} />
              <div key={path} className="route-stage">
                {children}
              </div>
            </div>
          </main>
        </div>
      </div>

      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent
          side="left"
          className="flex w-[min(18rem,86vw)] flex-col gap-0 border-sidebar-border bg-sidebar p-0 text-sidebar-foreground"
        >
          <SheetTitle className="sr-only">JobberFlow navigation</SheetTitle>
          <SheetDescription className="sr-only">
            Move between operational workspaces and stages.
          </SheetDescription>
          <SidebarBrand />
          <SidebarNav onNavigate={() => setMobileOpen(false)} />
          <SidebarFooter onNavigate={() => setMobileOpen(false)} />
        </SheetContent>
      </Sheet>
    </div>
  );
}

/**
 * Group and page, read from the navigation model, so the trail can never
 * name a place the sidebar does not have. The group is context, not a link:
 * groups have no page of their own.
 */
function Breadcrumbs({ navigation }: { navigation: ReturnType<typeof findNavigation> }) {
  const showGroup = navigation && navigation.group.id !== "overview";
  return (
    <nav aria-label="Breadcrumb" className="min-w-0">
      <ol className="flex min-w-0 items-center gap-1.5 text-[0.8125rem]">
        {showGroup && (
          <li className="flex shrink-0 items-center gap-1.5 text-muted-foreground">
            {navigation.group.label}
            <IconChevronRight className="size-3.5 text-border-strong" aria-hidden="true" />
          </li>
        )}
        <li className="min-w-0 truncate">
          {navigation ? (
            <Link
              to={navigation.item.to}
              aria-current="page"
              className="font-medium text-foreground hover:text-primary"
            >
              {navigation.item.label}
            </Link>
          ) : (
            <span className="font-medium">Workspace</span>
          )}
        </li>
      </ol>
    </nav>
  );
}

/**
 * The top of every workspace page: title, one sentence of context, and the
 * page's own actions on the right. Location lives in the top bar.
 */
export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  /** Kept for call-site compatibility; the top bar shows location. */
  breadcrumb?: string[];
  actions?: ReactNode;
}) {
  return (
    <div className="no-print mb-6 flex flex-col gap-4 border-b pb-5 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <h1 className="text-xl font-semibold tracking-[-0.02em] text-foreground sm:text-2xl">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-1.5 max-w-prose-ui text-pretty text-sm leading-relaxed text-muted-foreground">
            {subtitle}
          </p>
        )}
      </div>
      {/*
        shrink, not shrink-0. A shrinking action group is what lets the header
        wrap on a phone; pinning its width to the unwrapped sum of the buttons
        pushes the page into horizontal overflow instead.
      */}
      {actions && <div className="flex max-w-full flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

const STATUS: Record<string, { label: string; variant: "success" | "warning" | "secondary" }> = {
  POSTED: { label: "Posted", variant: "success" },
  DRAFT: { label: "Draft", variant: "warning" },
  // A cancellation is a reversal, not a loss, so it is neutral rather than red.
  CANCELLED: { label: "Cancelled", variant: "secondary" },
};

export function StatusBadge({ status }: { status: string }) {
  const entry = STATUS[status];
  return (
    <Badge variant={entry?.variant ?? "secondary"}>
      {entry?.label ?? status.charAt(0) + status.slice(1).toLowerCase()}
    </Badge>
  );
}

const RAIL_KEY = "jobberflow:sidebar-rail";

function readRailPreference() {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(RAIL_KEY) === "1";
  } catch {
    return false;
  }
}

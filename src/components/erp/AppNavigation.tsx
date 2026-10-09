import { Link, useRouterState } from "@tanstack/react-router";
import { useCallback, useEffect, useState, type ReactNode } from "react";
import {
  IconChevronRight,
  IconExit,
  IconPanelLeft,
  IconPlus,
  Logo,
  type IconComponent,
} from "@/components/icons";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  NAV,
  QUICK_ACTIONS,
  findNavigation,
  isActivePath,
  type NavItem,
} from "@/components/erp/navigation";
import { canWrite, useRole, useSession } from "@/hooks/use-erp";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

type RailProps = { collapsed?: boolean | undefined; onNavigate?: (() => void) | undefined };

/** Wraps a rail control in a tooltip only when the label is hidden. */
function RailTip({
  collapsed,
  label,
  children,
}: {
  collapsed?: boolean | undefined;
  label: ReactNode;
  children: ReactNode;
}) {
  if (!collapsed) return <>{children}</>;
  return (
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent side="right" sideOffset={10}>
        {label}
      </TooltipContent>
    </Tooltip>
  );
}

export function SidebarBrand({
  collapsed,
  onToggle,
}: {
  collapsed?: boolean | undefined;
  onToggle?: (() => void) | undefined;
}) {
  return (
    <div
      className={cn(
        "flex h-14 shrink-0 items-center gap-2 pl-4 pr-3 transition-[padding] duration-200",
        collapsed && "pl-[1.125rem]",
      )}
    >
      <Link
        to="/dashboard"
        aria-label="JobberFlow dashboard"
        className="flex min-w-0 flex-1 items-center gap-3 rounded-sm"
      >
        <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground">
          <Logo className="size-[1.125rem]" />
        </span>
        <span className={cn("min-w-0 leading-none", collapsed && "sr-only")}>
          <span className="block text-[0.9375rem] font-semibold tracking-[-0.01em] text-sidebar-accent-foreground">
            JobberFlow
          </span>
          <span className="mt-1 block text-xs text-sidebar-subtle">Job work control</span>
        </span>
      </Link>
      {onToggle && !collapsed && (
        <button
          type="button"
          onClick={onToggle}
          aria-label="Collapse sidebar"
          aria-keyshortcuts="Control+B"
          title="Collapse sidebar (Ctrl B)"
          className="nav-row flex size-8 shrink-0 items-center justify-center rounded-sm pointer-coarse:size-11"
        >
          <IconPanelLeft className="nav-icon size-4" />
        </button>
      )}
    </div>
  );
}

function NewVoucher({ collapsed, onNavigate }: RailProps) {
  const { data: role, isLoading } = useRole();
  if (isLoading || !canWrite(role)) return null;

  return (
    <div className="px-3 pb-2">
      <DropdownMenu>
        <RailTip collapsed={collapsed} label="New voucher">
          <DropdownMenuTrigger
            className={cn(
              "group flex h-control w-full cursor-pointer items-center gap-2 rounded-md bg-primary px-3 text-[0.8125rem] font-medium text-primary-foreground transition-[background-color,transform] duration-150 hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar active:translate-y-px data-[state=open]:bg-primary-hover pointer-coarse:min-h-11",
              collapsed && "justify-center px-0",
            )}
          >
            <IconPlus className="size-4 shrink-0 transition-transform duration-200 group-data-[state=open]:rotate-45" />
            <span className={cn(collapsed && "sr-only")}>New voucher</span>
          </DropdownMenuTrigger>
        </RailTip>
        <DropdownMenuContent
          side={collapsed ? "right" : "bottom"}
          align="start"
          sideOffset={collapsed ? 12 : 6}
          className="w-60 p-1.5"
        >
          <DropdownMenuLabel className="px-2 pb-1.5 pt-1 text-xs font-medium text-muted-foreground">
            Start a voucher
          </DropdownMenuLabel>
          {QUICK_ACTIONS.map((action) => {
            const Icon = action.icon;
            return (
              <DropdownMenuItem key={action.to} asChild className="gap-2.5 px-2 py-2">
                <Link to={action.to} onClick={onNavigate}>
                  <Icon className="text-muted-foreground" />
                  {action.label}
                </Link>
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

function NavRow({
  item,
  active,
  collapsed,
  onNavigate,
  node,
}: {
  item: NavItem;
  active: boolean;
  collapsed?: boolean | undefined;
  onNavigate?: (() => void) | undefined;
  /** Draw the icon as a station on the workflow path. */
  node?: boolean | undefined;
}) {
  const Icon: IconComponent = item.icon;
  return (
    <RailTip collapsed={collapsed} label={item.label}>
      <Link
        to={item.to}
        onClick={onNavigate}
        aria-current={active ? "page" : undefined}
        aria-label={collapsed ? item.label : undefined}
        className={cn(
          "nav-row group relative flex h-8 items-center gap-2.5 rounded-md px-2 text-[0.8125rem] pointer-coarse:h-11",
          active && "is-active",
          collapsed && "justify-center px-0",
        )}
      >
        <span
          className={cn(
            "relative z-10 flex size-6 shrink-0 items-center justify-center rounded-sm",
            node && "nav-node",
          )}
        >
          <Icon className="nav-icon size-4" />
        </span>
        <span className={cn("truncate", collapsed && "sr-only")}>{item.label}</span>
      </Link>
    </RailTip>
  );
}

export function SidebarNav({ collapsed, onNavigate }: RailProps) {
  const path = useRouterState({ select: (state) => state.location.pathname });
  const groups = NAV.filter((group) => group.id !== "admin");

  // Groups open on demand and stay open until closed. The group holding the
  // current page is always forced open, so collapsing a group can never hide
  // the page you are on.
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() => readOpenGroups());
  const activeGroupId = findNavigation(path)?.group.id;

  const setOpenGroup = useCallback((id: string, open: boolean) => {
    setOpenGroups((current) => {
      const next = { ...current, [id]: open };
      try {
        window.localStorage.setItem(OPEN_KEY, JSON.stringify(next));
      } catch {
        // Storage can be blocked; the choice still holds for this session.
      }
      return next;
    });
  }, []);

  // Keep the active group visible on navigation, including deep links straight
  // into a collapsed group.
  useEffect(() => {
    if (!activeGroupId) return;
    if (openGroups[activeGroupId] === false) setOpenGroup(activeGroupId, true);
  }, [activeGroupId, openGroups, setOpenGroup]);

  return (
    <TooltipProvider delayDuration={120} skipDelayDuration={0}>
      <NewVoucher collapsed={collapsed} onNavigate={onNavigate} />
      <nav
        aria-label="Primary navigation"
        className="flex-1 overflow-y-auto overflow-x-hidden px-3 pb-4 pt-2"
      >
        {groups.map((group, index) => (
          <section
            key={group.id}
            aria-labelledby={`nav-${group.id}`}
            className={cn(index > 0 && "mt-3.5")}
          >
            {collapsed ? (
              // The icon rail has no room for a disclosure control, so the
              // group label stays hidden and the rows are always visible.
              <>
                <h2 id={`nav-${group.id}`} className="sr-only">
                  {group.label}
                </h2>
                {index > 0 && (
                  <span
                    aria-hidden="true"
                    className="mx-auto -mt-2 mb-3 block h-px w-6 bg-sidebar-border"
                  />
                )}
                <ul className={cn("space-y-px", group.id === "flow" && "nav-path")}>
                  {group.items.map((item) => (
                    <li key={item.to}>
                      <NavRow
                        item={item}
                        active={isActivePath(path, item.to)}
                        collapsed={collapsed}
                        onNavigate={onNavigate}
                        node={group.id === "flow"}
                      />
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              <Collapsible
                open={openGroups[group.id] ?? false}
                onOpenChange={(open) => setOpenGroup(group.id, open)}
              >
                <h2 id={`nav-${group.id}`}>
                  <CollapsibleTrigger
                    className="group mb-0.5 flex h-5 w-full items-center gap-1 rounded-xs px-2 text-left font-sans text-[0.6875rem] font-semibold uppercase tracking-[0.08em] text-sidebar-subtle transition-colors hover:text-sidebar-accent-foreground focus-visible:outline-2 focus-visible:outline-sidebar-ring"
                  >
                    <span className="flex-1">{group.label}</span>
                    {/* Radix sets aria-expanded on the trigger, and the trigger
                    is the group, so the chevron turns with the disclosure. */}
                    <IconChevronRight
                      aria-hidden="true"
                      className="size-3 shrink-0 transition-transform duration-200 group-aria-expanded:rotate-90"
                    />
                  </CollapsibleTrigger>
                </h2>
                <CollapsibleContent>
                  <ul className={cn("space-y-px", group.id === "flow" && "nav-path")}>
                    {group.items.map((item) => (
                      <li key={item.to}>
                        <NavRow
                          item={item}
                          active={isActivePath(path, item.to)}
                          collapsed={collapsed}
                          onNavigate={onNavigate}
                          node={group.id === "flow"}
                        />
                      </li>
                    ))}
                  </ul>
                </CollapsibleContent>
              </Collapsible>
            )}
          </section>
        ))}
      </nav>
    </TooltipProvider>
  );
}

/**
 * Which sidebar groups are open. Persisted so the rail keeps the shape the
 * operator left it in. Defaults to everything closed except the group holding
 * the current page, which `SidebarNav` forces open anyway.
 */
const OPEN_KEY = "jobberflow:sidebar-groups";

function readOpenGroups(): Record<string, boolean> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(OPEN_KEY);
    const parsed = raw ? (JSON.parse(raw) as Record<string, unknown>) : null;
    if (!parsed || typeof parsed !== "object") return {};
    return Object.fromEntries(
      Object.entries(parsed).filter(([, value]) => typeof value === "boolean"),
    ) as Record<string, boolean>;
  } catch {
    return {};
  }
}

function initialsOf(email?: string | null) {
  if (!email) return "··";
  const name = (email.split("@")[0] ?? "").replace(/[^a-zA-Z]+/g, " ").trim();
  const parts = name.split(" ").filter(Boolean);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? parts[0]?.[1] ?? "")).toUpperCase() || "··";
}

const ROLE_LABEL: Record<string, string> = {
  admin: "Administrator",
  store: "Store",
  management: "Management · read only",
  viewer: "Viewer · read only",
};

export function SidebarFooter({
  collapsed,
  onToggle,
  onNavigate,
}: RailProps & { onToggle?: (() => void) | undefined }) {
  const path = useRouterState({ select: (state) => state.location.pathname });
  const { data: role } = useRole();
  const { data: user } = useSession();
  const admin = NAV.find((group) => group.id === "admin")?.items[0];

  const signOut = async () => {
    await supabase.auth.signOut();
    window.location.assign("/auth");
  };

  return (
    <TooltipProvider delayDuration={120} skipDelayDuration={0}>
      <div className="shrink-0 space-y-px border-t border-sidebar-border px-3 py-3">
        {admin && (
          <NavRow
            item={admin}
            active={isActivePath(path, admin.to)}
            collapsed={collapsed}
            onNavigate={onNavigate}
          />
        )}
        {onToggle && collapsed && (
          <RailTip collapsed={collapsed} label="Expand sidebar · Ctrl B">
            <button
              type="button"
              onClick={onToggle}
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              aria-keyshortcuts="Control+B"
              className={cn(
                "nav-row flex h-8 w-full items-center gap-2.5 rounded-md px-2 text-[0.8125rem] pointer-coarse:h-11",
                collapsed && "justify-center px-0",
              )}
            >
              <span className="flex size-6 shrink-0 items-center justify-center">
                <IconPanelLeft
                  className={cn(
                    "nav-icon size-4 transition-transform duration-200",
                    collapsed && "rotate-180",
                  )}
                />
              </span>
              <span className={cn("flex-1 text-left", collapsed && "sr-only")}>Collapse</span>
              {!collapsed && (
                <kbd className="rounded-xs border border-sidebar-border px-1.5 py-px font-sans text-[0.6875rem] text-sidebar-subtle">
                  Ctrl B
                </kbd>
              )}
            </button>
          </RailTip>
        )}

        <div
          className={cn(
            "mt-2 flex items-center gap-2.5 rounded-md border border-sidebar-border bg-card p-2",
            collapsed && "flex-col bg-transparent p-0 pt-1",
          )}
        >
          <RailTip collapsed={collapsed} label={user?.email ?? "Signed in"}>
            {/* role="img" + aria-label rather than tabIndex: a bare focus stop
                on a non-interactive element is a keyboard trap with nothing to
                activate. The initials are a picture of the account, so that is
                what it is announced as. */}
            <span
              className="flex size-8 shrink-0 items-center justify-center rounded-md bg-primary-soft text-xs font-semibold text-primary-soft-foreground"
              role="img"
              aria-label={user?.email ? `Signed in as ${user.email}` : "Signed in"}
            >
              {initialsOf(user?.email)}
            </span>
          </RailTip>
          <div className={cn("min-w-0 flex-1", collapsed && "sr-only")}>
            <p className="truncate text-xs font-medium text-sidebar-accent-foreground">
              {user?.email ?? "Loading account"}
            </p>
            <p className="mt-0.5 truncate text-xs text-sidebar-subtle">
              {role ? (ROLE_LABEL[role] ?? role) : "Checking access"}
            </p>
          </div>
          <RailTip collapsed={collapsed} label="Sign out">
            <button
              type="button"
              onClick={() => void signOut()}
              aria-label="Sign out"
              className="flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-md text-sidebar-subtle transition-colors hover:bg-accent hover:text-foreground pointer-coarse:size-11"
            >
              <IconExit className="size-4" />
            </button>
          </RailTip>
        </div>
      </div>
    </TooltipProvider>
  );
}

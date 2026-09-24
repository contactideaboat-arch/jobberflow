import { Link, useRouterState } from "@tanstack/react-router";
import { useState } from "react";
import { ChevronDown, PackageOpen } from "lucide-react";
import { NAV, isActivePath } from "@/components/erp/navigation";
import { cn } from "@/lib/utils";

export function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const path = useRouterState({ select: (state) => state.location.pathname });
  const [closed, setClosed] = useState<string[]>([]);

  return (
    <nav aria-label="Primary navigation" className="flex-1 overflow-y-auto px-3 py-4">
      <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.16em] text-sidebar-foreground/35">
        Workspace
      </p>
      <div className="space-y-1">
        {NAV.map((group) => {
          const open = !closed.includes(group.label);
          const Icon = group.icon;
          return (
            <div key={group.label}>
              <button
                type="button"
                onClick={() =>
                  setClosed((current) =>
                    open
                      ? [...current, group.label]
                      : current.filter((item) => item !== group.label),
                  )
                }
                aria-expanded={open}
                className="nav-group-button flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.11em] text-sidebar-foreground/55"
              >
                <Icon className="size-3.5" aria-hidden="true" />
                <span>{group.label}</span>
                <ChevronDown
                  className={cn(
                    "ml-auto size-3.5 transition-transform duration-200",
                    !open && "-rotate-90",
                  )}
                  aria-hidden="true"
                />
              </button>
              <div
                className={cn(
                  "grid transition-[grid-template-rows] duration-200",
                  open ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
                )}
              >
                <div className="overflow-hidden">
                  <div className="mb-1 ml-3 space-y-0.5 border-l border-sidebar-border pl-3">
                    {group.items.map((item) => {
                      const active = isActivePath(path, item.to);
                      return (
                        <Link
                          key={item.to}
                          to={item.to}
                          onClick={onNavigate}
                          aria-current={active ? "page" : undefined}
                          className={cn(
                            "sidebar-link relative block rounded-r-md px-3 py-2 text-[13px]",
                            active && "is-active",
                          )}
                        >
                          {item.label}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </nav>
  );
}

export function SidebarBrand() {
  return (
    <Link
      to="/dashboard"
      className="flex items-center gap-3 border-b border-sidebar-border px-5 py-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-sidebar-ring"
    >
      <span className="relative flex size-9 items-center justify-center bg-sidebar-primary text-sidebar-primary-foreground">
        <PackageOpen className="size-5" aria-hidden="true" />
        <span className="absolute -bottom-px -right-px size-2.5 border-2 border-sidebar bg-sidebar-primary" />
      </span>
      <span className="leading-tight">
        <span className="block font-display text-sm font-bold text-sidebar-foreground">
          JobberFlow
        </span>
        <span className="mt-0.5 block text-[9px] font-semibold uppercase tracking-[0.15em] text-sidebar-foreground/40">
          Operations control
        </span>
      </span>
    </Link>
  );
}

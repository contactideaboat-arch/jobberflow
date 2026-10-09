import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Browser-chrome frame for product captures.
 *
 * Not decoration. The three dots and the address bar tell the eye this is the
 * real application running, not an illustration of one. The chrome is drawn
 * in tokens so it survives a theme change.
 */
export function ShotFrame({
  url,
  children,
  className,
  label,
}: {
  url: string;
  children: ReactNode;
  className?: string;
  label?: string;
}) {
  return (
    <figure className={cn("overflow-hidden rounded-lg border bg-card", className)}>
      <div className="flex items-center gap-3 border-b bg-subtle px-3 py-2.5">
        <span className="flex gap-1.5" aria-hidden="true">
          <span className="size-2 rounded-full bg-border-strong" />
          <span className="size-2 rounded-full bg-border-strong" />
          <span className="size-2 rounded-full bg-border-strong" />
        </span>
        {/* label-xs, not an arbitrary 10px: the address bar is text someone
            has to be able to read. */}
        <span className="num min-w-0 truncate rounded-sm border bg-card px-2 py-0.5 label-xs text-muted-foreground">
          {url}
        </span>
        {label && <span className="label-xs ml-auto shrink-0 text-muted-foreground">{label}</span>}
      </div>
      {/*
        The capture is a fixed-width ERP screen: tables inside it have their own
        min-widths. It scrolls sideways inside the frame rather than widening
        the page, which is what kept this at zero overflow on a 375px phone.
      */}
      <div className="overflow-x-auto bg-background">{children}</div>
    </figure>
  );
}

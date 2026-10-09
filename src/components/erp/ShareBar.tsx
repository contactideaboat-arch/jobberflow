import { Link } from "@tanstack/react-router";
import type { CSSProperties } from "react";
import { cn } from "@/lib/utils";
import type { KpiPath } from "@/components/erp/Kpi";

/*
 * Where the material is, drawn as one object.
 *
 * A single horizontal band of segments whose widths are their shares of the
 * total kilograms. This is the only chart on the dashboard and it is
 * deliberately the simplest possible encoding: length is share, and there is
 * no second dimension, no axis, and no legend to decode.
 *
 * Accessibility is not an afterthought here. Length encodes information, so:
 *   - the band carries a full text description for screen readers,
 *   - the table underneath repeats every number in rows,
 *   - a long-out location is marked by a band of red plus a word, never by
 *     colour alone.
 */

export type Share = {
  id: string;
  name: string;
  kg: number;
  /** Percentage of the total, 0 to 100. Drives the segment width. */
  share: number;
  /** Chrome yellow is the warehouse field. Jobbers take the board paints. */
  paint: string;
  to: KpiPath;
  /** Formatted date of the last movement, or "Never". */
  lastMoveLabel: string;
  /** Days since the last movement. Null when there has never been one. */
  daysQuiet: number | null;
  /** Material that has sat with a jobber past the warning window. */
  longOut: boolean;
};

/**
 * The band. Each segment links to the records behind it, so the chart is also
 * the navigation into every number it draws.
 */
export function ShareBar({
  shares,
  label,
  className,
}: {
  shares: Share[];
  /** Full sentence for screen readers: what the band is, and every share. */
  label: string;
  className?: string | undefined;
}) {
  return (
    <div className={cn("share-bar", className)} role="img" aria-label={label}>
      {shares.map((share, index) => (
        <Link
          key={share.id}
          to={share.to}
          className="share-seg"
          style={
            {
              background: share.paint,
              width: `${Math.max(share.share, 1.2)}%`,
              animationDelay: `${index * 45}ms`,
            } as CSSProperties
          }
        >
          <span className="sr-only">
            {share.name}: {share.kg.toFixed(3)} kilograms, {Math.round(share.share)} percent of
            total.
            {share.longOut ? " No movement for over 30 days." : ""}
          </span>
        </Link>
      ))}
    </div>
  );
}

/**
 * The legend, in words. Every location named, weighed and dated, so the band
 * above is a summary of this list rather than a substitute for it.
 */
export function ShareTable({
  shares,
  formatKg,
  longOutDays,
  className,
}: {
  shares: Share[];
  formatKg: (value: number) => string;
  longOutDays: number;
  className?: string | undefined;
}) {
  return (
    <div className={cn("overflow-x-auto", className)}>
      <table className="erp-table">
        <caption className="sr-only">
          Kilograms held at each location, as a share of the total, with the date of the last
          movement.
        </caption>
        <thead>
          <tr>
            <th scope="col">Where it is</th>
            <th scope="col" className="text-right!">
              Kilograms
            </th>
            <th scope="col" className="text-right!">
              Share
            </th>
            <th scope="col">Last moved</th>
            <th scope="col" className="text-right!">
              Days sitting
            </th>
          </tr>
        </thead>
        <tbody>
          {shares.map((share) => (
            <tr key={share.id}>
              <th scope="row" className="whitespace-nowrap font-medium">
                <span className="flex items-center gap-2">
                  <span
                    aria-hidden="true"
                    className="size-2.5 shrink-0 rounded-xs"
                    style={{ background: share.paint }}
                  />
                  {share.name}
                </span>
              </th>
              <td className="num text-right font-semibold">{formatKg(share.kg)}</td>
              <td className="num text-right text-muted-foreground">{Math.round(share.share)}%</td>
              <td className="text-muted-foreground">{share.lastMoveLabel}</td>
              <td
                className={cn(
                  "num text-right",
                  share.longOut ? "font-semibold text-destructive" : "text-muted-foreground",
                )}
              >
                {share.longOut && (
                  <span className="mr-1.5 rounded-xs bg-destructive px-1 py-0.5 text-[0.625rem] font-semibold tracking-wide text-destructive-foreground uppercase">
                    Long out
                  </span>
                )}
                {share.daysQuiet ?? "Never"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/**
 * Months of production as a row of bars, oldest to newest.
 *
 * Three aligned rows so the eye can read straight down a column: the figure,
 * the bar, the month name. The bar sits inside a fixed-height track, because
 * a percentage height against an auto-height cell resolves against nothing
 * and every bar collapses to the same size.
 */
export function MonthBars({
  months,
  format,
  trackClassName = "h-24",
  className,
}: {
  months: { key: string; label: string; current: boolean; value: number }[];
  format: (value: number) => string;
  /** Height of the bar track. Fixed, so bar percentages mean something. */
  trackClassName?: string;
  className?: string | undefined;
}) {
  const peak = Math.max(...months.map((month) => month.value), 1);
  const hasHistory = months.some((month) => month.value > 0);
  return (
    <div
      className={cn("grid grid-cols-6 gap-1.5", className)}
      role="img"
      aria-label={monthLabel(months, format)}
    >
      {months.map((month) => (
        <div key={month.key} className="flex min-w-0 flex-col items-center gap-1.5">
          <span
            className={cn(
              "num w-full truncate text-center text-[0.6875rem] font-semibold",
              month.current ? "text-foreground" : "text-muted-foreground",
            )}
          >
            {format(month.value)}
          </span>
          <span className={cn("flex w-full items-end", trackClassName)}>
            <span
              className={cn(
                "grow-y w-full rounded-t-xs",
                month.current ? "bg-accent" : "bg-primary/70",
                !hasHistory && "bg-muted",
              )}
              style={{
                height: hasHistory ? `${Math.max((month.value / peak) * 100, 2)}%` : "2px",
              }}
            />
          </span>
          <span
            className={cn(
              "w-full border-t pt-1 text-center text-[0.6875rem]",
              month.current ? "font-semibold text-foreground" : "text-muted-foreground",
            )}
          >
            {month.label}
          </span>
        </div>
      ))}
    </div>
  );
}

function monthLabel(months: { label: string; value: number }[], format: (value: number) => string) {
  return `Pieces produced by month: ${months
    .map((month) => `${month.label} ${format(month.value)}`)
    .join(", ")}`;
}

/**
 * Cover bar for a stock level. The fill is the share of the minimum level
 * met, the track is the shortfall. Always paired with the numbers as text.
 */
export function CoverBar({
  cover,
  alert = false,
  className,
}: {
  /** 1 means the balance exactly meets the minimum level. */
  cover: number;
  alert?: boolean;
  className?: string | undefined;
}) {
  return (
    <span
      className={cn("block h-1.5 w-full overflow-hidden rounded-xs bg-muted", className)}
      aria-hidden="true"
    >
      <span
        className={cn("block h-full grow-x", alert ? "bg-destructive" : "bg-accent")}
        style={{ width: `${Math.min(Math.max(cover * 100, 2), 100)}%` }}
      />
    </span>
  );
}

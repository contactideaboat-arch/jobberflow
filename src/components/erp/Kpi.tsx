import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/*
 * KPI band.
 *
 * A KPI is a reading on an instrument, not a card. These components draw one
 * flat panel of figures divided by 1px ink rules, so a row of eight numbers
 * reads as one instrument face rather than eight floating boxes.
 *
 * Rules that keep the band honest:
 *   1. No box, no shadow, no rounding on the cell. The band's hairline
 *      divisions are the only separators.
 *   2. Every figure carries a plain-English note. A number with no sentence
 *      beside it is decoration; a number with one is an instrument.
 *   3. The decimal part of a kilogram figure is present but quiet. This trade
 *      runs to three decimals and hiding them would be a lie about precision.
 *   4. Motion happens once on arrival. A figure never counts up: a figure
 *      that animates cannot be trusted at a glance, and this is a financial
 *      instrument.
 */

export type KpiPath =
  | "/dashboard"
  | "/masters/jobbers"
  | "/masters/materials"
  | "/masters/products"
  | "/inventory/warehouse"
  | "/inventory/jobber-stock"
  | "/inventory/finished-goods"
  | "/transactions/rm-inward"
  | "/transactions/transfer"
  | "/transactions/product-inward"
  | "/transactions/material-return"
  | "/transactions/adjustment"
  | "/reconciliation"
  | "/reports";

/** Tone of a KPI figure. Red is reserved for loss and long-out material. */
export type KpiTone = "default" | "loss";

export type KpiSize = "sm" | "md" | "lg";

const BAND_COLUMNS = {
  2: "sm:grid-cols-2",
  3: "sm:grid-cols-2 lg:grid-cols-3",
  4: "sm:grid-cols-2 lg:grid-cols-4",
  5: "sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5",
  6: "sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6",
} as const;

export type KpiColumnCount = keyof typeof BAND_COLUMNS;

/**
 * Split a formatted number so the reader lands on the kilograms first and the
 * precise tail second. "12,480.500" becomes "12,480" over ".500".
 */
function splitNumber(value: string) {
  const [whole = "", ...rest] = value.split(".");
  return { whole, decimals: rest.length ? `.${rest.join(".")}` : "" };
}

/**
 * The figure itself: signage lettering, tabular figures, decimals split off
 * into a smaller quiet piece.
 */
export function KpiFigure({
  value,
  unit,
  tone = "default",
  size = "md",
  className,
}: {
  value: string;
  unit?: string | undefined;
  tone?: KpiTone | undefined;
  size?: KpiSize | undefined;
  className?: string | undefined;
}) {
  const { whole, decimals } = splitNumber(value);
  return (
    <span
      className={cn(
        "kpi-figure block",
        size === "sm" && "text-readout-sm",
        size === "md" && "text-readout",
        size === "lg" && "text-readout-lg",
        tone === "loss" && "text-destructive",
        className,
      )}
    >
      {whole}
      {decimals && <span className="kpi-decimals">{decimals}</span>}
      {unit && <span className="kpi-unit ml-1.5 align-baseline">{unit}</span>}
    </span>
  );
}

export type KpiBodyProps = {
  /** Plain-English name of the figure. No jargon. */
  label: string;
  value: string;
  unit?: string | undefined;
  /** One sentence saying what the figure means, in the operator's words. */
  note?: string | undefined;
  tone?: KpiTone | undefined;
  size?: KpiSize | undefined;
  /** Rendered beside the label. Usually a status word, never colour alone. */
  mark?: ReactNode;
  /** Extra rows under the note: the comparison line under a total. */
  rows?: ReactNode;
};

function KpiBody({
  label,
  value,
  unit,
  note,
  tone = "default",
  size = "md",
  mark,
  rows,
}: KpiBodyProps) {
  return (
    <>
      <div className="flex items-start justify-between gap-2">
        <span className="label-xs text-muted-foreground">{label}</span>
        {mark && <span className="shrink-0">{mark}</span>}
      </div>
      <KpiFigure value={value} unit={unit} tone={tone} size={size} />
      {note && <p className="text-xs leading-snug text-muted-foreground">{note}</p>}
      {rows}
    </>
  );
}

/** A figure with nowhere to go. */
export function Kpi(props: KpiBodyProps) {
  return (
    <div className="kpi-cell">
      <KpiBody {...props} />
    </div>
  );
}

/**
 * A figure that is a link. The whole cell is the hit area, so there is no
 * separate "view details" affordance to hunt for. Hover washes the ground
 * and brings the figure to ink; press sinks the cell.
 */
export function KpiLink({
  to,
  className,
  ...props
}: KpiBodyProps & { to: KpiPath; className?: string | undefined }) {
  return (
    <Link to={to} className={cn("kpi-cell kpi-link", className)}>
      <KpiBody {...props} />
    </Link>
  );
}

/**
 * The band: one panel, hairline divisions, N columns.
 *
 * Division is a 1px grid gap over a rule-coloured ground, so the rules stay
 * exactly 1px at every breakpoint with no border maths and no doubled seams.
 */
export function KpiBand({
  children,
  columns = 4,
  label,
  className,
}: {
  children: ReactNode;
  columns?: KpiColumnCount | undefined;
  /** Accessible name for the group of figures. */
  label: string;
  className?: string | undefined;
}) {
  return (
    <section aria-label={label} className={cn("kpi-band", BAND_COLUMNS[columns], className)}>
      {children}
    </section>
  );
}

/**
 * Loading state. Not a blinking block: the shape of each figure is held so
 * the page does not jump when the numbers land, and the sheen sweeps once to
 * say that the reading is being taken.
 */
export function KpiSkeleton({
  columns = 4,
  label,
  className,
  rows,
}: {
  columns?: KpiColumnCount | undefined;
  label: string;
  className?: string | undefined;
  /** How many label lines sit under each figure placeholder. */
  rows?: 1 | 2 | undefined;
}) {
  return (
    <section
      aria-label={label}
      aria-busy="true"
      className={cn("kpi-band", BAND_COLUMNS[columns], className)}
    >
      {Array.from({ length: columns }, (_, index) => (
        <div key={index} className="kpi-cell">
          <span className="skeleton-line w-24" />
          <span className="skeleton-block h-7 w-32" />
          {rows === 2 && <span className="skeleton-line w-full" />}
          <span className="skeleton-line w-40" />
        </div>
      ))}
    </section>
  );
}

/**
 * A wide band row: label and note on the left, figure on the right. Used
 * where the band is a summary strip rather than a set of equal readings.
 */
export function KpiSplit({
  label,
  value,
  unit,
  note,
  tone = "default",
  className,
}: {
  label: string;
  value: string;
  unit?: string | undefined;
  note?: string | undefined;
  tone?: KpiTone | undefined;
  className?: string | undefined;
}) {
  return (
    <div className={cn("kpi-cell flex-row items-start justify-between gap-4", className)}>
      <div className="min-w-0">
        <span className="label-xs text-muted-foreground">{label}</span>
        {note && <p className="mt-1 text-xs leading-snug text-muted-foreground">{note}</p>}
      </div>
      <KpiFigure value={value} unit={unit} tone={tone} size="sm" className="shrink-0" />
    </div>
  );
}

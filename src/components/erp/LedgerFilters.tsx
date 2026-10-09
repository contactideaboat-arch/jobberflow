import type { ReactNode } from "react";
import { dmy } from "@/lib/erp";

/** Raw ledger codes ("TRANSFER_OUT") as words ("Transfer out"). */
export function humanize(code: string | null | undefined) {
  if (!code) return "";
  const words = code.replace(/_/g, " ").toLowerCase();
  return words.charAt(0).toUpperCase() + words.slice(1);
}

/** A labelled date input for a report or ledger range. */
export function DateFilter({
  label,
  value,
  onChange,
  min,
  max,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  min?: string | undefined;
  max?: string | undefined;
}) {
  return (
    <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
      <span>{label}</span>
      <input
        type="date"
        value={value}
        min={min}
        max={max}
        onChange={(event) => onChange(event.target.value)}
        className="num h-control-sm rounded-md border border-border-strong bg-card px-2 text-[0.8125rem] text-foreground hover:border-input focus-visible:border-ring focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/20 pointer-coarse:min-h-11"
      />
    </label>
  );
}

/**
 * One line that states exactly what a report or ledger is showing: its scope
 * and its period. Exports carry the same scope, so the file and the screen
 * always agree.
 */
export function ScopeLine({
  parts,
  from,
  to,
  children,
}: {
  parts: (string | false | null | undefined)[];
  from?: string;
  to?: string;
  children?: ReactNode;
}) {
  const period =
    from && to
      ? `${dmy(from)} to ${dmy(to)}`
      : from
        ? `From ${dmy(from)}`
        : to
          ? `Up to ${dmy(to)}`
          : "All dates";
  return (
    <p className="border-b bg-subtle px-3 py-2 text-xs text-muted-foreground">
      <span className="font-medium text-foreground">Showing: </span>
      {[...parts.filter(Boolean), period].join(" · ")}
      {children}
    </p>
  );
}

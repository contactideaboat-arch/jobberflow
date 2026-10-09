import { useMemo, useState, type ReactNode } from "react";
import { IconChevronDown, IconChevronLeft, IconChevronRight, IconSearch } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { NUM, PCT } from "@/lib/erp";
import { cn } from "@/lib/utils";

/*
 * Operational data grid.
 *
 * One hook and four pieces, so every register in the app searches, filters,
 * sorts and pages the same way:
 *
 *   useGrid      state + derived rows. Search, filters, sort and page all
 *                happen on the rows the page already loaded; nothing here
 *                changes what is fetched or how it is calculated.
 *   GridToolbar  search box, filter slots, match count, reset.
 *   SortHeader   a <th> whose button cycles ascending / descending and
 *                reports it through aria-sort.
 *   GridPager    "1–25 of 140" with previous / next.
 *   FilterSelect a labelled native select, the most robust control for a
 *                short list of fixed options on every device.
 *
 * Exports should use `grid.matched` (every row that passes the current search
 * and filters, in the current order) so a file always contains what the
 * screen says it contains, not just the visible page.
 */

export type SortDirection = "asc" | "desc";
export type SortValue = string | number | null | undefined;

export function useGrid<T>(
  rows: T[] | undefined,
  options: {
    /** Text a row is searched by. Omit to disable search. */
    search?: (row: T) => string;
    /** Sortable columns: key → value to compare. */
    sorters?: Record<string, (row: T) => SortValue>;
    initialSort?: { key: string; direction: SortDirection };
    /** Extra filter applied before search, e.g. from FilterSelects. */
    filter?: (row: T) => boolean;
    /** True when the caller's own filters are not at their defaults. */
    filtersActive?: boolean;
    pageSize?: number;
  },
) {
  const { search, sorters, initialSort, filter, filtersActive = false, pageSize = 25 } = options;
  const [query, setQueryState] = useState("");
  const [sort, setSort] = useState(initialSort ?? null);
  const [page, setPage] = useState(0);

  const matched = useMemo(() => {
    const needle = query.trim().toLowerCase();
    let out = (rows ?? []).filter((row) => (filter ? filter(row) : true));
    if (needle && search) out = out.filter((row) => search(row).toLowerCase().includes(needle));
    const sorter = sort && sorters?.[sort.key];
    if (sort && sorter) {
      const factor = sort.direction === "asc" ? 1 : -1;
      out = [...out].sort((a, b) => compare(sorter(a), sorter(b)) * factor);
    }
    return out;
  }, [rows, filter, query, search, sort, sorters]);

  const pageCount = Math.max(1, Math.ceil(matched.length / pageSize));
  const current = Math.min(page, pageCount - 1);
  const start = current * pageSize;

  return {
    query,
    setQuery: (value: string) => {
      setQueryState(value);
      setPage(0);
    },
    sort,
    toggleSort: (key: string) => {
      setPage(0);
      setSort((previous) =>
        previous?.key === key
          ? { key, direction: previous.direction === "asc" ? "desc" : "asc" }
          : { key, direction: "asc" },
      );
    },
    /** Call after changing any caller-owned filter so the grid returns to page 1. */
    resetPage: () => setPage(0),
    page: current,
    setPage,
    pageCount,
    pageSize,
    total: rows?.length ?? 0,
    matched,
    pageRows: matched.slice(start, start + pageSize),
    from: matched.length === 0 ? 0 : start + 1,
    to: Math.min(start + pageSize, matched.length),
    isFiltered: query.trim() !== "" || filtersActive,
  };
}

export type Grid<T> = ReturnType<typeof useGrid<T>>;

function compare(a: SortValue, b: SortValue) {
  if (a == null && b == null) return 0;
  if (a == null) return 1;
  if (b == null) return -1;
  if (typeof a === "number" && typeof b === "number") return a - b;
  return String(a).localeCompare(String(b), "en-IN", { numeric: true, sensitivity: "base" });
}

export function GridToolbar<T>({
  grid,
  searchLabel,
  placeholder,
  children,
  onReset,
  noun = ["record", "records"],
}: {
  grid: Grid<T>;
  /** Accessible name for the search box, e.g. "Search jobbers". */
  searchLabel: string;
  placeholder: string;
  /** Filter controls. */
  children?: ReactNode;
  /** Clears caller-owned filters; the search box is cleared here. */
  onReset?: () => void;
  noun?: [string, string];
}) {
  return (
    <div className="flex flex-col gap-2.5 border-b p-3 lg:flex-row lg:items-center">
      <div className="relative min-w-0 lg:w-72">
        <IconSearch
          className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden="true"
        />
        <input
          type="search"
          aria-label={searchLabel}
          placeholder={placeholder}
          value={grid.query}
          onChange={(event) => grid.setQuery(event.target.value)}
          className="h-control-sm w-full rounded-md border border-input bg-card pl-8 pr-2.5 text-[0.8125rem] text-foreground transition-[border-color,box-shadow] placeholder:text-muted-foreground hover:border-muted-foreground focus-visible:border-ring focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/20 pointer-coarse:min-h-11"
        />
      </div>
      {children && <div className="flex flex-wrap items-center gap-2">{children}</div>}
      <div className="flex items-center gap-3 lg:ml-auto">
        <p className="text-xs text-muted-foreground" role="status">
          {grid.isFiltered
            ? `${NUM(grid.matched.length)} of ${NUM(grid.total)} ${grid.total === 1 ? noun[0] : noun[1]}`
            : `${NUM(grid.total)} ${grid.total === 1 ? noun[0] : noun[1]}`}
        </p>
        {grid.isFiltered && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              grid.setQuery("");
              onReset?.();
            }}
          >
            Clear filters
          </Button>
        )}
      </div>
    </div>
  );
}

export function SortHeader<T>({
  grid,
  sortKey,
  children,
  align = "left",
  className,
}: {
  grid: Grid<T>;
  sortKey: string;
  children: ReactNode;
  align?: "left" | "right";
  className?: string;
}) {
  const active = grid.sort?.key === sortKey;
  const direction = active ? grid.sort!.direction : undefined;
  return (
    <th
      scope="col"
      aria-sort={active ? (direction === "asc" ? "ascending" : "descending") : "none"}
      className={cn(align === "right" && "text-right!", className)}
    >
      <button
        type="button"
        onClick={() => grid.toggleSort(sortKey)}
        className={cn(
          "group -mx-1 inline-flex cursor-pointer items-center gap-1 rounded-xs px-1 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          align === "right" && "flex-row-reverse",
          active && "text-foreground",
        )}
      >
        {children}
        <IconChevronDown
          aria-hidden="true"
          className={cn(
            "size-3 transition-transform duration-150",
            !active && "opacity-0 group-hover:opacity-40",
            direction === "asc" && "rotate-180",
          )}
        />
      </button>
    </th>
  );
}

export function GridPager<T>({ grid }: { grid: Grid<T> }) {
  if (grid.matched.length <= grid.pageSize) return null;
  return (
    <div className="flex items-center justify-between gap-3 border-t px-3 py-2 text-xs text-muted-foreground">
      <span className="num">
        {NUM(grid.from)}–{NUM(grid.to)} of {NUM(grid.matched.length)}
      </span>
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          disabled={grid.page === 0}
          onClick={() => grid.setPage(grid.page - 1)}
        >
          <IconChevronLeft />
          Previous
        </Button>
        <span className="num px-1">
          Page {grid.page + 1} of {grid.pageCount}
        </span>
        <Button
          variant="ghost"
          size="sm"
          disabled={grid.page >= grid.pageCount - 1}
          onClick={() => grid.setPage(grid.page + 1)}
        >
          Next
          <IconChevronRight />
        </Button>
      </div>
    </div>
  );
}

/**
 * A labelled native select. The most robust control for a short list of fixed
 * options on every device, and the only one that keeps a real accessible name
 * without extra wiring.
 *
 * Pass `id` when the label sits outside the control (as <Field> does): the
 * id is forwarded so `htmlFor` reaches the select itself, and `label` then
 * becomes the visible caption only.
 */
export function FilterSelect({
  label,
  value,
  onChange,
  options,
  className,
  id,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  className?: string;
  id?: string;
}) {
  return (
    <label
      className={cn("flex items-center gap-1.5 text-xs text-muted-foreground", className)}
      htmlFor={id}
    >
      {label && <span className="whitespace-nowrap">{label}</span>}
      <select
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-control-sm max-w-52 cursor-pointer rounded-md border border-border-strong bg-card px-2 text-[0.8125rem] text-foreground hover:border-input focus-visible:border-ring focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/20 pointer-coarse:min-h-11"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

/** Horizontal scroll container for wide registers, with the first column kept in view. */
export function GridScroll({
  children,
  sticky = false,
  className,
}: {
  children: ReactNode;
  /** Keep the first column visible while the table scrolls sideways. */
  sticky?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "overflow-x-auto",
        sticky &&
          "[&_tbody_tr>*:first-child]:sticky [&_tbody_tr>*:first-child]:left-0 [&_tbody_tr>*:first-child]:z-[1] [&_tbody_tr>*:first-child]:bg-card [&_thead_tr>*:first-child]:sticky [&_thead_tr>*:first-child]:left-0 [&_thead_tr>*:first-child]:z-[1]",
        className,
      )}
    >
      {children}
    </div>
  );
}

/** The empty placeholder for a missing cell value. */
export const NIL = "–";

/**
 * A wastage percentage, flagged when it breaches the company threshold.
 *
 * The threshold is a number the owner sets in settings, and a figure that
 * breaches it is the single most important thing on a report row. Colour alone
 * would fail anyone who cannot separate the red, so the breach also carries a
 * word and a marker rule. Under the threshold nothing is added: no green, no
 * badge. Green is reserved for posted vouchers, and a clean wastage figure is
 * not an achievement worth a colour.
 */
export function WastageCell({ pct, threshold }: { pct: number; threshold: number | null }) {
  // A null threshold means the company has never set a limit. Nothing is
  // flagged: inventing one would paint a figure red against a rule that does
  // not exist.
  const over = threshold != null && Number.isFinite(threshold) && Number(pct) > threshold;
  return (
    <span className="inline-flex flex-col items-end">
      <span
        className={cn("num font-semibold", over ? "text-destructive" : "text-muted-foreground")}
      >
        {PCT(pct)}
      </span>
      {over && (
        <span className="label-xs mt-0.5 inline-flex items-center gap-1 font-medium text-destructive">
          <span aria-hidden="true" className="inline-block h-2 w-0.5 bg-destructive" />
          Over {PCT(threshold)}
        </span>
      )}
    </span>
  );
}

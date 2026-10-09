/* eslint-disable @typescript-eslint/no-explicit-any */
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { differenceInCalendarDays, differenceInMinutes, format } from "date-fns";
import { useState, type ReactNode } from "react";
import {
  IconAlert,
  IconArrowRight,
  IconCheckCircle,
  IconChevronDown,
  IconPlus,
  IconRefresh,
} from "@/components/icons";
import { QUICK_ACTIONS } from "@/components/erp/navigation";
import { StatusBadge } from "@/components/erp/AppShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { canWrite, db, useRole, useRows } from "@/hooks/use-erp";
import { KG, NUM, PCS, PCT, dmy } from "@/lib/erp";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Operations | JobberFlow" },
      {
        name: "description",
        content:
          "Material position, the exceptions that need action, recent vouchers and production, counted from posted vouchers.",
      },
      { property: "og:title", content: "Operations | JobberFlow" },
      {
        property: "og:description",
        content: "Material position, exceptions and production in one view.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Dashboard,
});

/** A jobber holding material with no transfer or inward for this long is flagged. */
const LONG_OUT_DAYS = 30;
/** Figures older than this are labelled stale and offered a refresh. */
const STALE_MINUTES = 15;
/** Balances are kept to three decimals; anything below this is rounding, not a difference. */
const KG_EPSILON = 0.0005;
/** How many attention items show before "Show all". */
const ATTENTION_PREVIEW = 6;

type VoucherRoute =
  | "/transactions/rm-inward"
  | "/transactions/transfer"
  | "/transactions/product-inward"
  | "/transactions/material-return"
  | "/transactions/adjustment";

/** The five voucher registers, with the table that backs each. */
const VOUCHER_KINDS: {
  table: string;
  label: string;
  plural: string;
  to: VoucherRoute;
  select: string;
}[] = [
  {
    table: "raw_material_inward_headers",
    label: "Material inward",
    plural: "material inward",
    to: "/transactions/rm-inward",
    select:
      "id, voucher_number, voucher_date, status, created_at, supplier, raw_material_inward_items(quantity)",
  },
  {
    table: "jobber_transfer_headers",
    label: "Transfer to jobber",
    plural: "transfer",
    to: "/transactions/transfer",
    select:
      "id, voucher_number, voucher_date, status, created_at, jobber_id, jobber_transfer_items(quantity)",
  },
  {
    table: "product_inward_headers",
    label: "Product inward",
    plural: "product inward",
    to: "/transactions/product-inward",
    select:
      "id, voucher_number, voucher_date, status, created_at, jobber_id, product_id, finished_quantity, wastage_percentage",
  },
  {
    table: "material_return_headers",
    label: "Material return",
    plural: "material return",
    to: "/transactions/material-return",
    select:
      "id, voucher_number, voucher_date, status, created_at, jobber_id, material_return_items(quantity)",
  },
  {
    table: "stock_adjustments",
    label: "Stock adjustment",
    plural: "stock adjustment",
    to: "/transactions/adjustment",
    select:
      "id, voucher_number, voucher_date, status, created_at, jobber_id, location_type, adjustment_type, quantity, product_id",
  },
];

const sumOf = (rows: any[] | undefined, key: string) =>
  (rows ?? []).reduce((total: number, row: any) => total + Number(row[key] ?? 0), 0);

const toDate = (value: string) => new Date(`${value.slice(0, 10)}T00:00:00`);

const plural = (count: number, one: string, many: string) =>
  `${NUM(count)} ${count === 1 ? one : many}`;

/** Recent vouchers of one kind, plus the count and oldest date of its drafts. */
function useVoucherKind(kind: (typeof VOUCHER_KINDS)[number]) {
  const recent = useRows(
    kind.table,
    ["dash-recent", kind.table],
    (q) => q.order("created_at", { ascending: false }).limit(6),
    kind.select,
  );
  const drafts = useQuery({
    queryKey: ["dash-drafts", kind.table],
    queryFn: async () => {
      const { data, count, error } = await db
        .from(kind.table)
        .select("voucher_date", { count: "exact" })
        .eq("status", "DRAFT")
        .order("voucher_date", { ascending: true })
        .limit(1);
      if (error) throw error;
      return { count: count ?? 0, oldest: (data?.[0]?.voucher_date as string | undefined) ?? null };
    },
  });
  return { kind, recent, drafts };
}

type Severity = "loss" | "warning" | "info";
type Attention = {
  key: string;
  severity: Severity;
  title: string;
  detail: ReactNode;
  action: ReactNode;
};

function Dashboard() {
  const { data: role } = useRole();
  const writer = canWrite(role);

  const warehouse = useRows("warehouse_stock", ["warehouse_stock"]);
  const jobberStock = useRows("jobber_stock", ["jobber_stock"]);
  const fg = useRows("finished_goods_stock", ["finished_goods_stock"]);
  const jobbers = useRows("jobbers", ["jobbers"], (q) => q.eq("status", true));
  const products = useRows("finished_products", ["dashboard-products"], (q) =>
    q.eq("status", true),
  );
  const materials = useRows("raw_materials", ["dashboard-materials"], (q) => q.eq("status", true));
  const settings = useRows("company_settings", ["company_settings"]);
  const inwards = useRows("product_inward_headers", ["dash-inwards"], (q) =>
    q.order("voucher_date", { ascending: false }).limit(200),
  );
  const transfers = useRows(
    "jobber_transfer_headers",
    ["dash-transfers"],
    (q) => q.eq("status", "POSTED").order("voucher_date", { ascending: false }).limit(500),
    "jobber_id, voucher_date, jobber_transfer_items(quantity)",
  );
  const kinds = [
    useVoucherKind(VOUCHER_KINDS[0]!),
    useVoucherKind(VOUCHER_KINDS[1]!),
    useVoucherKind(VOUCHER_KINDS[2]!),
    useVoucherKind(VOUCHER_KINDS[3]!),
    useVoucherKind(VOUCHER_KINDS[4]!),
  ];

  const sources = [
    { label: "godown stock", query: warehouse },
    { label: "jobber stock", query: jobberStock },
    { label: "finished goods", query: fg },
    { label: "jobbers", query: jobbers },
    { label: "products", query: products },
    { label: "materials", query: materials },
    { label: "settings", query: settings },
    { label: "product inward", query: inwards },
    { label: "transfers", query: transfers },
    ...kinds.flatMap((entry) => [
      { label: `${entry.kind.plural} vouchers`, query: entry.recent },
      { label: `${entry.kind.plural} drafts`, query: entry.drafts },
    ]),
  ];
  const isLoading = sources.some((source) => source.query.isLoading);
  const failed = sources.filter((source) => source.query.isError);
  const isFetching = sources.some((source) => source.query.isFetching);
  const updatedAt = Math.min(
    ...sources.map((source) => source.query.dataUpdatedAt).filter((time) => time > 0),
  );
  const refresh = () => {
    for (const source of sources) void source.query.refetch();
  };

  const now = new Date();
  const monthLabel = format(now, "MMMM");
  const monthStart = format(new Date(now.getFullYear(), now.getMonth(), 1), "yyyy-MM-dd");
  const stale = Number.isFinite(updatedAt) && differenceInMinutes(now, updatedAt) >= STALE_MINUTES;

  /* Position ------------------------------------------------------------ */
  const whTotal = sumOf(warehouse.data, "balance");
  const jobberTotal = sumOf(jobberStock.data, "balance");
  const custodyTotal = whTotal + jobberTotal;
  const fgTotal = sumOf(fg.data, "balance");
  const share = (kg: number) => (custodyTotal > 0 ? (kg / custodyTotal) * 100 : 0);

  /* This month ---------------------------------------------------------- */
  const posted = ((inwards.data ?? []) as any[]).filter((row) => row.status === "POSTED");
  const monthInwards = posted.filter((row) => row.voucher_date >= monthStart);
  const productionMonth = sumOf(monthInwards, "finished_quantity");
  const wastageMonth = sumOf(monthInwards, "overall_wastage_kg");
  const standardMonth = sumOf(monthInwards, "total_standard_consumption");
  const averageWastage = standardMonth > 0 ? (wastageMonth / standardMonth) * 100 : null;
  const wastageThreshold = Number((settings.data ?? [])[0]?.wastage_warning_threshold ?? 5);
  const overWastageLimit = averageWastage !== null && averageWastage > wastageThreshold;
  const monthTransfers = ((transfers.data ?? []) as any[]).filter(
    (row) => String(row.voucher_date) >= monthStart,
  );
  const sentMonth = monthTransfers.reduce((total: number, row: any) => {
    const lines: any[] = Array.isArray(row.jobber_transfer_items) ? row.jobber_transfer_items : [];
    return total + sumOf(lines, "quantity");
  }, 0);

  const months = Array.from({ length: 6 }, (_, offset) => {
    const date = new Date(now.getFullYear(), now.getMonth() - 5 + offset, 1);
    const key = format(date, "yyyy-MM");
    return {
      key,
      label: format(date, "MMM"),
      current: offset === 5,
      value: sumOf(
        posted.filter((row) => String(row.voucher_date).startsWith(key)),
        "finished_quantity",
      ),
    };
  });

  /* Holdings ------------------------------------------------------------ */
  const jobberNames = new Map(((jobbers.data ?? []) as any[]).map((row) => [row.id, row.name]));
  const productNames = new Map(((products.data ?? []) as any[]).map((row) => [row.id, row.name]));

  const lastMove = new Map<string, string>();
  for (const row of [...((transfers.data ?? []) as any[]), ...posted]) {
    const previous = lastMove.get(row.jobber_id);
    if (!previous || row.voucher_date > previous) lastMove.set(row.jobber_id, row.voucher_date);
  }

  const byJobber = new Map<
    string,
    { id: string; name: string; kg: number; short: { name: string; kg: number }[] }
  >();
  for (const row of (jobberStock.data ?? []) as any[]) {
    const id = row.jobber_id ?? row.jobber_name ?? "unknown";
    const entry = byJobber.get(id) ?? {
      id,
      name: row.jobber_name ?? "Unnamed jobber",
      kg: 0,
      short: [] as { name: string; kg: number }[],
    };
    const balance = Number(row.balance ?? 0);
    entry.kg += balance;
    if (balance < -KG_EPSILON)
      entry.short.push({ name: row.material_name ?? "Material", kg: balance });
    byJobber.set(id, entry);
  }
  const holdings = [...byJobber.values()]
    .filter((holding) => holding.kg > KG_EPSILON)
    .map((holding) => {
      const moved = lastMove.get(holding.id) ?? null;
      const daysQuiet = moved ? differenceInCalendarDays(now, toDate(moved)) : null;
      return { ...holding, lastMove: moved, daysQuiet, longOut: (daysQuiet ?? 0) > LONG_OUT_DAYS };
    })
    .sort((a, b) => b.kg - a.kg);
  const differences = [...byJobber.values()].filter((holding) => holding.short.length > 0);
  const longOut = holdings.filter((holding) => holding.longOut);

  /* Attention, most severe first ------------------------------------------ */
  const lowStock = ((warehouse.data ?? []) as any[])
    .filter((row) => Number(row.minimum_stock ?? 0) > 0)
    .map((row) => ({ ...row, cover: Number(row.balance ?? 0) / Number(row.minimum_stock) }))
    .filter((row) => row.cover < 1)
    .sort((a, b) => a.cover - b.cover);
  const overLimit = monthInwards
    .filter((row) => Number(row.wastage_percentage) > wastageThreshold)
    .sort((a, b) => Number(b.wastage_percentage) - Number(a.wastage_percentage));

  const attention: Attention[] = [
    ...differences.map((holding) => ({
      key: `diff-${holding.id}`,
      severity: "loss" as const,
      title: `Reconciliation difference at ${holding.name}`,
      detail: (
        <>
          {holding.short
            .slice(0, 2)
            .map((line) => `${line.name} ${KG(line.kg)} kg`)
            .join(", ")}
          {holding.short.length > 2 && ` and ${holding.short.length - 2} more`}. More was used or
          returned than was sent.
        </>
      ),
      action: (
        <ActionLink to="/reconciliation" search={{ jobber: holding.id }}>
          Reconcile
        </ActionLink>
      ),
    })),
    ...longOut.map((holding) => ({
      key: `long-${holding.id}`,
      severity: "loss" as const,
      title: `No movement at ${holding.name} for ${holding.daysQuiet} days`,
      detail: (
        <>
          <span className="num">{KG(holding.kg)} kg</span> held since{" "}
          <span className="num">{holding.lastMove ? dmy(holding.lastMove) : "never"}</span>. Limit
          is {LONG_OUT_DAYS} days.
        </>
      ),
      action: (
        <ActionLink to="/reconciliation" search={{ jobber: holding.id }}>
          Reconcile
        </ActionLink>
      ),
    })),
    ...overLimit.map((row) => ({
      key: `waste-${row.id}`,
      severity: "loss" as const,
      title: `Wastage ${PCT(row.wastage_percentage)} on ${row.voucher_number}`,
      detail: (
        <>
          {jobberNames.get(row.jobber_id) ?? "Unknown jobber"} ·{" "}
          {productNames.get(row.product_id) ?? "Inactive product"} · limit{" "}
          <span className="num">{PCT(wastageThreshold)}</span>
        </>
      ),
      action: <ActionLink to="/transactions/product-inward">Open inward</ActionLink>,
    })),
    ...lowStock.map((row) => ({
      key: `low-${row.material_id}`,
      severity: "warning" as const,
      title: `Low stock: ${row.name}`,
      detail: (
        <>
          <span className="num">
            {KG(row.balance)} of {KG(row.minimum_stock)} {String(row.uom ?? "kg").toLowerCase()}
          </span>{" "}
          minimum in your godown ({Math.round(row.cover * 100)}%).
        </>
      ),
      action: writer ? (
        <ActionLink to="/transactions/rm-inward">Receive</ActionLink>
      ) : (
        <ActionLink to="/inventory/warehouse">Open stock</ActionLink>
      ),
    })),
    ...kinds
      .filter((entry) => (entry.drafts.data?.count ?? 0) > 0)
      .map((entry) => ({
        key: `drafts-${entry.kind.table}`,
        severity: "info" as const,
        title: `${plural(entry.drafts.data!.count, `${entry.kind.plural} draft`, `${entry.kind.plural} drafts`)} not posted`,
        detail: (
          <>
            Oldest dated{" "}
            <span className="num">
              {entry.drafts.data!.oldest ? dmy(entry.drafts.data!.oldest) : "unknown"}
            </span>
            . Stock does not move until a voucher is posted.
          </>
        ),
        action: <ActionLink to={entry.kind.to}>Review</ActionLink>,
      })),
  ];
  const [showAll, setShowAll] = useState(false);
  const visibleAttention = showAll ? attention : attention.slice(0, ATTENTION_PREVIEW);

  /* Recent vouchers across all registers ---------------------------------- */
  const recent = kinds
    .flatMap((entry) =>
      ((entry.recent.data ?? []) as any[]).map((row) => ({ ...row, kind: entry.kind })),
    )
    .sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)))
    .slice(0, 8);

  return (
    <div className="pb-8">
      {/*
        Header. Deliberately not <PageHeader>: this screen's subtitle slot
        carries a live freshness reading with a status role, which the shared
        header's plain <p> cannot express. The outer rhythm is identical to
        PageHeader's (mb-6, border-b, pb-5) so the page gutter and the rule
        under the header match every other workspace.
      */}
      <header className="no-print mb-6 flex flex-col gap-4 border-b pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-xl font-semibold tracking-[-0.02em] sm:text-2xl">Operations</h1>
          <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[0.8125rem] text-muted-foreground">
            <span className="num" suppressHydrationWarning>
              {format(now, "EEEE dd/MM/yyyy")}
            </span>
            <span aria-hidden="true">·</span>
            <span role="status" suppressHydrationWarning>
              {isLoading ? (
                "Loading figures"
              ) : stale ? (
                <span className="font-medium text-warning-foreground">
                  Figures from {format(updatedAt, "HH:mm")}, may be out of date
                </span>
              ) : Number.isFinite(updatedAt) ? (
                `Updated ${format(updatedAt, "HH:mm")} from posted vouchers`
              ) : (
                "Not loaded"
              )}
            </span>
          </p>
        </div>
        <div className="flex max-w-full flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" onClick={refresh} loading={isFetching && !isLoading}>
            {!(isFetching && !isLoading) && <IconRefresh />}
            Refresh
          </Button>
          {writer ? <NewVoucherMenu /> : null}
        </div>
      </header>

      {failed.length > 0 && (
        <div
          role="alert"
          className="mb-5 flex flex-col gap-2 rounded-lg border border-warning/60 bg-warning-soft px-4 py-3 text-sm text-warning-foreground sm:flex-row sm:items-center sm:justify-between"
        >
          <p className="flex items-start gap-2">
            <IconAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            <span>
              Could not load {failed.map((source) => source.label).join(", ")}. Figures that depend
              on them are marked as not loaded.
            </span>
          </p>
          <Button size="sm" variant="outline" onClick={refresh} className="shrink-0">
            Try again
          </Button>
        </div>
      )}

      {/* Metrics ------------------------------------------------------------ */}
      <section
        aria-label="Material position"
        // Seven tracks, not six: the first metric spans two columns, so six
        // metrics fill seven cells. At six the last row was one tile beside an
        // empty cell, which read as a broken band.
        className="grid overflow-hidden rounded-lg border bg-border [gap:1px] sm:grid-cols-2 lg:grid-cols-7"
      >
        <Metric
          to="/inventory/warehouse"
          label="Material you own"
          className="sm:col-span-2"
          loading={isLoading}
          failed={warehouse.isError || jobberStock.isError}
          primary
          value={<Figure value={KG(custodyTotal)} unit="kg" size="lg" />}
          note={
            custodyTotal > 0 ? (
              <>
                <SplitBar godown={share(whTotal)} />
                <span className="mt-1.5 block">
                  {Math.round(share(whTotal))}% in godown · {Math.round(share(jobberTotal))}% with
                  jobbers
                </span>
              </>
            ) : (
              "No material on record yet."
            )
          }
        />
        <Metric
          to="/inventory/warehouse"
          label="In your godown"
          loading={isLoading}
          failed={warehouse.isError}
          value={<Figure value={KG(whTotal)} unit="kg" />}
          note={
            lowStock.length > 0
              ? `${plural(lowStock.length, "material", "materials")} below minimum`
              : "All above minimum"
          }
        />
        <Metric
          to="/inventory/jobber-stock"
          label="With jobbers"
          loading={isLoading}
          failed={jobberStock.isError}
          value={<Figure value={KG(jobberTotal)} unit="kg" />}
          note={`Across ${plural(holdings.length, "jobber", "jobbers")}`}
        />
        <Metric
          to="/inventory/finished-goods"
          label="Finished goods ready"
          loading={isLoading}
          failed={fg.isError}
          value={<Figure value={PCS(fgTotal)} unit="pcs" />}
          note="Counted and put away"
        />
        <Metric
          to="/reports"
          label={`Wastage, ${monthLabel}`}
          loading={isLoading}
          failed={inwards.isError || settings.isError}
          tone={overWastageLimit ? "loss" : undefined}
          value={
            averageWastage === null ? (
              <span className="readout text-readout text-muted-foreground">None yet</span>
            ) : (
              <Figure value={PCT(averageWastage).replace("%", "")} unit="%" />
            )
          }
          note={
            averageWastage === null
              ? "No production posted this month"
              : `${overWastageLimit ? "Over" : "Within"} the ${PCT(wastageThreshold)} limit`
          }
        />
      </section>

      {/* Attention and recent vouchers ------------------------------------- */}
      <div className="mt-5 grid gap-5 lg:grid-cols-12">
        <section
          aria-labelledby="attention-heading"
          className="overflow-hidden rounded-lg border bg-card lg:col-span-7"
        >
          <PanelHead
            id="attention-heading"
            title="Needs attention"
            meta={
              isLoading ? null : attention.length > 0 ? (
                <Badge
                  variant={
                    attention.some((item) => item.severity === "loss") ? "destructive" : "warning"
                  }
                >
                  {NUM(attention.length)} open
                </Badge>
              ) : null
            }
          />
          {isLoading ? (
            <RowSkeleton rows={4} />
          ) : attention.length === 0 ? (
            <p className="flex items-start gap-2.5 px-4 py-6 text-sm text-muted-foreground">
              <IconCheckCircle className="mt-0.5 size-4 shrink-0 text-success" aria-hidden="true" />
              Nothing needs attention. Stock is above minimum, every jobber has moved material in
              the last {LONG_OUT_DAYS} days, balances reconcile and no drafts are waiting.
            </p>
          ) : (
            <>
              <ul className="divide-y">
                {visibleAttention.map((item) => (
                  <li key={item.key} className="flex items-start gap-3 px-4 py-3">
                    <SeverityMark severity={item.severity} />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground">{item.title}</p>
                      <p className="mt-0.5 text-[0.8125rem] leading-snug text-muted-foreground">
                        {item.detail}
                      </p>
                    </div>
                    <div className="shrink-0 pt-0.5">{item.action}</div>
                  </li>
                ))}
              </ul>
              {attention.length > ATTENTION_PREVIEW && (
                <div className="border-t px-4 py-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowAll((value) => !value)}
                    aria-expanded={showAll}
                  >
                    <IconChevronDown
                      className={cn("transition-transform", showAll && "rotate-180")}
                    />
                    {showAll ? "Show fewer" : `Show all ${NUM(attention.length)}`}
                  </Button>
                </div>
              )}
            </>
          )}
        </section>

        <section
          aria-labelledby="recent-heading"
          className="overflow-hidden rounded-lg border bg-card lg:col-span-5"
        >
          <PanelHead
            id="recent-heading"
            title="Recent vouchers"
            meta={
              <Link
                to="/inventory/rm-ledger"
                className="text-xs font-medium text-primary hover:underline"
              >
                Material ledger
              </Link>
            }
          />
          {isLoading ? (
            <RowSkeleton rows={5} />
          ) : recent.length === 0 ? (
            <div className="px-4 py-6 text-sm text-muted-foreground">
              No vouchers yet.
              {writer && (
                <>
                  {" "}
                  <Link
                    to="/transactions/rm-inward"
                    className="font-medium text-primary hover:underline"
                  >
                    Record a material inward
                  </Link>{" "}
                  to start.
                </>
              )}
            </div>
          ) : (
            <ul className="divide-y">
              {recent.map((row) => (
                <li key={`${row.kind.table}-${row.id}`}>
                  <Link
                    to={row.kind.to}
                    className="flex items-start gap-3 px-4 py-2.5 transition-colors hover:bg-subtle focus-visible:bg-subtle focus-visible:outline-none"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="flex items-center gap-2 text-sm">
                        <span className="num font-medium text-foreground">
                          {row.voucher_number}
                        </span>
                        <span className="truncate text-muted-foreground">{row.kind.label}</span>
                      </p>
                      <p className="mt-0.5 truncate text-xs text-muted-foreground">
                        <span className="num">{dmy(row.voucher_date)}</span>
                        {" · "}
                        {partyOf(row, jobberNames)}
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1">
                      <span className="num text-[0.8125rem] font-medium text-foreground">
                        {quantityOf(row)}
                      </span>
                      <StatusBadge status={row.status} />
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {/* Production and material position --------------------------------- */}
      <div className="mt-5 grid gap-5 lg:grid-cols-12">
        <section
          aria-labelledby="production-heading"
          className="overflow-hidden rounded-lg border bg-card lg:col-span-7"
        >
          <PanelHead
            id="production-heading"
            title="Production"
            meta={
              <Link to="/reports" className="text-xs font-medium text-primary hover:underline">
                Reports
              </Link>
            }
          />
          {/*
            One column on a phone, three from `sm` up. Three at 375px left each
            label about 80px of text, which truncated "Sent out, October" to
            "Sent ou…". The divider follows the same axis as the layout.
          */}
          <dl className="grid grid-cols-1 divide-y border-b sm:grid-cols-3 sm:divide-y-0 sm:divide-x">
            <SmallReading
              label={`Sent out, ${monthLabel}`}
              loading={isLoading}
              value={`${KG(sentMonth)} kg`}
              note={plural(monthTransfers.length, "transfer", "transfers")}
            />
            <SmallReading
              label={`Made, ${monthLabel}`}
              loading={isLoading}
              value={`${PCS(productionMonth)} pcs`}
              note={plural(monthInwards.length, "inward", "inwards")}
            />
            <SmallReading
              label={`Wastage, ${monthLabel}`}
              loading={isLoading}
              value={`${KG(wastageMonth)} kg`}
              tone={overWastageLimit ? "loss" : undefined}
              note={averageWastage === null ? "No production yet" : PCT(averageWastage)}
            />
          </dl>
          <div className="px-4 py-4">
            <p className="text-xs font-medium text-muted-foreground">
              Pieces received from jobbers, last six months
            </p>
            {isLoading ? (
              <div className="skeleton-block mt-3 h-24 w-full" />
            ) : months.every((month) => month.value === 0) ? (
              <p className="mt-3 text-sm text-muted-foreground">
                No product inward posted in the last six months.
              </p>
            ) : (
              <MonthColumns months={months} />
            )}
          </div>
        </section>

        <section
          aria-labelledby="where-heading"
          // overflow-x-auto, not overflow-hidden: the custody table is wider
          // than a phone, and hiding the overflow makes the last columns
          // unreachable rather than scrollable.
          className="overflow-x-auto rounded-lg border bg-card lg:col-span-5"
        >
          <PanelHead
            id="where-heading"
            title="Where material sits"
            meta={
              <Link
                to="/inventory/jobber-stock"
                className="text-xs font-medium text-primary hover:underline"
              >
                Jobber stock
              </Link>
            }
          />
          {isLoading ? (
            <RowSkeleton rows={4} />
          ) : custodyTotal <= 0 ? (
            <p className="px-4 py-6 text-sm text-muted-foreground">
              No material on record yet. Receive raw material into your godown to begin.
            </p>
          ) : (
            <table className="erp-table">
              <caption className="sr-only">
                Kilograms held at each location, share of the total and days since last movement
              </caption>
              <thead>
                <tr>
                  <th scope="col">Location</th>
                  <th scope="col" className="text-right!">
                    kg
                  </th>
                  <th scope="col" className="text-right!">
                    Share
                  </th>
                  <th scope="col" className="text-right!">
                    Still
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <th scope="row" className="text-left font-medium">
                    <Link to="/inventory/warehouse" className="hover:text-primary">
                      Your godown
                    </Link>
                  </th>
                  <td className="num text-right font-medium">{KG(whTotal)}</td>
                  <td className="num text-right text-muted-foreground">
                    {Math.round(share(whTotal))}%
                  </td>
                  <td className="text-right text-muted-foreground">–</td>
                </tr>
                {holdings.slice(0, 5).map((holding) => (
                  <tr key={holding.id}>
                    <th scope="row" className="max-w-40 truncate text-left font-medium">
                      <Link
                        to="/reconciliation"
                        search={{ jobber: holding.id }}
                        className="hover:text-primary"
                      >
                        {holding.name}
                      </Link>
                    </th>
                    <td className="num text-right font-medium">{KG(holding.kg)}</td>
                    <td className="num text-right text-muted-foreground">
                      {Math.round(share(holding.kg))}%
                    </td>
                    <td
                      className={cn(
                        "num whitespace-nowrap text-right",
                        holding.longOut ? "font-medium text-destructive" : "text-muted-foreground",
                      )}
                    >
                      {holding.daysQuiet === null ? "Never moved" : `${holding.daysQuiet} d`}
                    </td>
                  </tr>
                ))}
              </tbody>
              {holdings.length > 5 && (
                <tfoot>
                  <tr>
                    <td colSpan={4} className="text-xs font-normal">
                      <Link
                        to="/inventory/jobber-stock"
                        className="font-medium text-primary hover:underline"
                      >
                        {plural(holdings.length - 5, "more jobber", "more jobbers")}
                      </Link>
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          )}
        </section>
      </div>

      <details className="group mt-5 rounded-lg border bg-card [&_summary::-webkit-details-marker]:hidden">
        <summary className="flex cursor-pointer list-none items-center gap-2 px-4 py-2.5 text-[0.8125rem] font-medium text-muted-foreground hover:text-foreground">
          <IconChevronDown className="size-4 -rotate-90 transition-transform group-open:rotate-0" />
          What the terms on this page mean
          <span className="ml-auto text-xs font-normal">
            {plural(jobbers.data?.length ?? 0, "active jobber", "active jobbers")} ·{" "}
            {plural(materials.data?.length ?? 0, "material", "materials")} ·{" "}
            {plural(products.data?.length ?? 0, "product", "products")}
          </span>
        </summary>
        <dl className="grid gap-x-8 gap-y-3 border-t px-4 py-4 text-sm sm:grid-cols-2">
          {TERMS.map((entry) => (
            <div key={entry.term}>
              <dt className="font-medium">{entry.term}</dt>
              <dd className="mt-0.5 text-[0.8125rem] leading-relaxed text-muted-foreground">
                {entry.meaning}
              </dd>
            </div>
          ))}
          <div className="sm:col-span-2">
            <Link
              to="/masters/jobbers"
              className="text-xs font-medium text-primary hover:underline"
            >
              Manage masters
            </Link>
          </div>
        </dl>
      </details>
    </div>
  );
}

const TERMS = [
  {
    term: "Jobber",
    meaning:
      "A factory you send raw material to. They make your products on your material and send the finished goods back.",
  },
  {
    term: "With jobbers",
    meaning: "Material sent out but not yet used. It is still yours, so it still counts.",
  },
  {
    term: "Reconciliation difference",
    meaning:
      "A jobber's balance for a material has gone below zero: more was used or returned than was ever sent.",
  },
  {
    term: "Wastage",
    meaning:
      "Material lost while making goods, recorded on the product inward voucher and compared with your limit.",
  },
];

function partyOf(row: any, jobberNames: Map<string, string>) {
  if (row.kind.table === "raw_material_inward_headers")
    return row.supplier || "Supplier not recorded";
  if (row.kind.table === "stock_adjustments")
    return row.location_type === "JOBBER"
      ? (jobberNames.get(row.jobber_id) ?? "Jobber")
      : row.location_type === "FINISHED_GOODS"
        ? "Finished goods store"
        : "Your godown";
  return jobberNames.get(row.jobber_id) ?? "Unknown jobber";
}

function quantityOf(row: any) {
  switch (row.kind.table) {
    case "product_inward_headers":
      return `${PCS(row.finished_quantity)} pcs`;
    case "stock_adjustments":
      return `${row.adjustment_type === "NEGATIVE" ? "−" : "+"}${
        row.product_id ? `${PCS(row.quantity)} pcs` : `${KG(row.quantity)} kg`
      }`;
    default: {
      const lines =
        row.raw_material_inward_items ?? row.jobber_transfer_items ?? row.material_return_items;
      return Array.isArray(lines) ? `${KG(sumOf(lines, "quantity"))} kg` : "";
    }
  }
}

function NewVoucherMenu() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="sm">
          <IconPlus />
          New voucher
          <IconChevronDown className="-mr-1 opacity-80" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 p-1.5">
        <DropdownMenuLabel>Start a voucher</DropdownMenuLabel>
        {QUICK_ACTIONS.map((action) => {
          const Icon = action.icon;
          return (
            <DropdownMenuItem key={action.to} asChild className="gap-2.5 px-2 py-2">
              <Link to={action.to}>
                <Icon className="text-muted-foreground" />
                {action.label}
              </Link>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function ActionLink({
  to,
  search,
  children,
}: {
  to: VoucherRoute | "/reconciliation" | "/inventory/warehouse";
  search?: { jobber: string };
  children: ReactNode;
}) {
  const className =
    "inline-flex h-control-sm items-center gap-1 rounded-md border border-border-strong bg-card px-2.5 text-xs font-medium text-foreground transition-colors hover:bg-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 pointer-coarse:min-h-11";
  return to === "/reconciliation" ? (
    <Link to={to} search={search ?? {}} className={className}>
      {children}
      <IconArrowRight className="size-3.5" aria-hidden="true" />
    </Link>
  ) : (
    <Link to={to} className={className}>
      {children}
      <IconArrowRight className="size-3.5" aria-hidden="true" />
    </Link>
  );
}

function SeverityMark({ severity }: { severity: Severity }) {
  const label = severity === "loss" ? "Loss risk" : severity === "warning" ? "Warning" : "To do";
  return (
    <span className="mt-1.5 flex shrink-0 items-center" title={label}>
      <span
        aria-hidden="true"
        className={cn(
          "size-2 rounded-full",
          severity === "loss" && "bg-destructive",
          severity === "warning" && "bg-warning",
          severity === "info" && "bg-primary",
        )}
      />
      <span className="sr-only">{label}:</span>
    </span>
  );
}

function PanelHead({ id, title, meta }: { id: string; title: string; meta?: ReactNode }) {
  return (
    <div className="flex h-11 items-center justify-between gap-3 border-b px-4">
      <h2 id={id} className="text-sm font-semibold">
        {title}
      </h2>
      {meta}
    </div>
  );
}

function Metric({
  to,
  label,
  value,
  note,
  loading,
  failed,
  primary,
  tone,
  className,
}: {
  to: "/inventory/warehouse" | "/inventory/jobber-stock" | "/inventory/finished-goods" | "/reports";
  label: string;
  value: ReactNode;
  note: ReactNode;
  loading: boolean;
  failed: boolean;
  primary?: boolean;
  tone?: "loss" | undefined;
  className?: string;
}) {
  return (
    <Link
      to={to}
      className={cn(
        "group flex min-w-0 flex-col gap-1.5 bg-card px-4 py-3.5 transition-colors hover:bg-subtle focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring",
        className,
      )}
    >
      <span className="flex items-center justify-between text-xs font-medium text-muted-foreground">
        {label}
        <IconArrowRight
          className="size-3.5 opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100"
          aria-hidden="true"
        />
      </span>
      <span className={cn(tone === "loss" && "text-destructive", primary && "mt-0.5")}>
        {loading ? (
          <span className={cn("skeleton-block block w-28", primary ? "h-9" : "h-7")} />
        ) : failed ? (
          <span className="text-sm font-medium text-warning-foreground">Not loaded</span>
        ) : (
          value
        )}
      </span>
      <span className="text-xs text-muted-foreground">{loading || failed ? " " : note}</span>
    </Link>
  );
}

function Figure({ value, unit, size = "md" }: { value: string; unit: string; size?: "md" | "lg" }) {
  const [whole, fraction] = value.split(".");
  return (
    <span className={cn("readout num block", size === "lg" ? "text-readout-xl" : "text-readout")}>
      {whole}
      {fraction && (
        <span className="text-[0.7em] font-medium text-muted-foreground">.{fraction}</span>
      )}
      <span className="ml-1 font-sans text-xs font-medium text-muted-foreground">{unit}</span>
    </span>
  );
}

function SplitBar({ godown }: { godown: number }) {
  return (
    <span
      className="mt-1 flex h-1.5 w-full max-w-sm overflow-hidden rounded-full bg-chart-2"
      aria-hidden="true"
    >
      <span className="grow-x block h-full bg-chart-6" style={{ width: `${godown}%` }} />
    </span>
  );
}

function SmallReading({
  label,
  value,
  note,
  loading,
  tone,
}: {
  label: string;
  value: string;
  note: string;
  loading: boolean;
  tone?: "loss" | undefined;
}) {
  return (
    <div className="min-w-0 px-4 py-3">
      <dt className="truncate text-xs text-muted-foreground">{label}</dt>
      <dd
        className={cn(
          "num mt-1 truncate text-sm font-semibold",
          tone === "loss" ? "text-destructive" : "text-foreground",
        )}
      >
        {loading ? <span className="skeleton-line block w-20" /> : value}
      </dd>
      <dd className="mt-0.5 truncate text-xs text-muted-foreground">{loading ? " " : note}</dd>
    </div>
  );
}

function MonthColumns({
  months,
}: {
  months: { key: string; label: string; current: boolean; value: number }[];
}) {
  const peak = Math.max(...months.map((month) => month.value), 1);
  return (
    <div
      className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-6"
      role="img"
      aria-label={`Pieces received by month: ${months.map((m) => `${m.label} ${PCS(m.value)}`).join(", ")}`}
    >
      {months.map((month) => (
        <div key={month.key} className="flex min-w-0 flex-col items-center gap-1">
          <span
            className={cn(
              "num w-full truncate text-center text-[0.6875rem]",
              month.current ? "font-semibold text-foreground" : "text-muted-foreground",
            )}
          >
            {PCS(month.value)}
          </span>
          <span className="flex h-20 w-full items-end">
            <span
              className={cn(
                "grow-y block w-full rounded-t-xs",
                month.current ? "bg-primary" : "bg-chart-2",
              )}
              style={{ height: `${Math.max((month.value / peak) * 100, 2)}%` }}
            />
          </span>
          <span
            className={cn(
              "w-full border-t pt-1 text-center text-xs",
              month.current ? "font-medium text-foreground" : "text-muted-foreground",
            )}
          >
            {month.label}
          </span>
        </div>
      ))}
    </div>
  );
}

function RowSkeleton({ rows }: { rows: number }) {
  return (
    <div className="space-y-4 px-4 py-4" aria-hidden="true">
      {Array.from({ length: rows }, (_, row) => (
        <div key={row} className="skeleton-line w-full" />
      ))}
    </div>
  );
}

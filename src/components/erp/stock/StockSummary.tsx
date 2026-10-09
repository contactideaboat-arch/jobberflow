import { Link } from "@tanstack/react-router";
import { KG, NUM } from "@/lib/erp";
import { cn } from "@/lib/utils";
import type { StockRow } from "./stock-types";

/**
 * The stock position in four readings on one ruled band. Every figure is the
 * sum of the rows in the register below, so the band and the table can never
 * disagree.
 */
export function StockSummary({
  rows,
  isLoading,
  isError,
}: {
  rows: StockRow[];
  isLoading: boolean;
  isError: boolean;
}) {
  const warehouse = rows.filter((row) => row.location === "warehouse");
  const jobber = rows.filter((row) => row.location === "jobbers");
  const warehouseBalance = warehouse.reduce((sum, row) => sum + row.balance, 0);
  const jobberBalance = jobber.reduce((sum, row) => sum + row.balance, 0);
  const lowStock = warehouse.filter(
    (row) => row.minimumStock > 0 && row.balance < row.minimumStock,
  ).length;
  const differences = jobber.filter((row) => row.balance < -0.0005).length;
  const holders = new Set(jobber.filter((row) => row.balance > 0.0005).map((row) => row.jobberId))
    .size;

  const readings = [
    {
      label: "Raw material owned",
      value: `${KG(warehouseBalance + jobberBalance)} kg`,
      note: "Godown and jobbers together",
    },
    {
      label: "In your godown",
      value: `${KG(warehouseBalance)} kg`,
      note: `${NUM(warehouse.length)} materials`,
    },
    {
      label: "With jobbers",
      value: `${KG(jobberBalance)} kg`,
      note: `${NUM(holders)} ${holders === 1 ? "jobber holds" : "jobbers hold"} material`,
    },
    {
      label: "Needs attention",
      value: NUM(lowStock + differences),
      note:
        lowStock + differences === 0
          ? "Nothing below minimum or negative"
          : `${NUM(lowStock)} below minimum · ${NUM(differences)} negative`,
      warn: lowStock + differences > 0,
    },
  ];

  return (
    <section
      aria-label="Raw material position"
      className="mb-5 grid overflow-hidden rounded-lg border bg-border [gap:1px] sm:grid-cols-2 xl:grid-cols-4"
    >
      {readings.map((reading) => (
        <div key={reading.label} className="min-w-0 bg-card px-4 py-3">
          <p className="text-xs font-medium text-muted-foreground">{reading.label}</p>
          <p
            className={cn(
              "readout num mt-1 text-readout",
              reading.warn ? "text-warning-foreground" : "text-foreground",
            )}
          >
            {isError ? (
              <span className="text-sm font-medium text-warning-foreground">Not loaded</span>
            ) : isLoading ? (
              <span className="skeleton-block block h-7 w-28" aria-label="Loading" />
            ) : (
              reading.value
            )}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {isLoading || isError ? " " : reading.note}
            {!isLoading && !isError && reading.warn && (
              <>
                {" "}
                <Link to="/dashboard" className="font-medium text-primary hover:underline">
                  See on dashboard
                </Link>
              </>
            )}
          </p>
        </div>
      ))}
    </section>
  );
}

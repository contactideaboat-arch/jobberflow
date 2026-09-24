import { AlertTriangle, Boxes, Factory, Warehouse } from "lucide-react";
import { KG } from "@/lib/erp";
import { cn } from "@/lib/utils";
import type { StockRow } from "./stock-types";

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
  const lowStock = warehouse.filter((row) => row.balance < row.minimumStock).length;
  const holders = new Set(jobber.map((row) => row.jobberId).filter(Boolean)).size;

  const measures = [
    {
      label: "Company raw material",
      value: KG(warehouseBalance + jobberBalance),
      unit: "KG",
      icon: Boxes,
    },
    { label: "At warehouse", value: KG(warehouseBalance), unit: "KG", icon: Warehouse },
    { label: "At jobbers", value: KG(jobberBalance), unit: "KG", icon: Factory },
    {
      label: "Stock attention",
      value: String(lowStock),
      unit: lowStock === 1 ? "material" : "materials",
      icon: AlertTriangle,
    },
  ];

  return (
    <section
      aria-label="Raw material position"
      className="mb-4 grid overflow-hidden border bg-card shadow-panel sm:grid-cols-2 xl:grid-cols-4"
    >
      {measures.map((measure, index) => {
        const Icon = measure.icon;
        return (
          <div
            key={measure.label}
            className={cn(
              "p-4",
              index > 0 && "border-t sm:border-l sm:border-t-0",
              index === 2 && "sm:border-l-0 xl:border-l",
            )}
          >
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.11em] text-muted-foreground">
              <Icon className="size-3.5" aria-hidden="true" />
              {measure.label}
            </div>
            <div className="num mt-2 text-2xl font-bold">
              {isError ? (
                <span className="text-base text-destructive">Unavailable</span>
              ) : isLoading ? (
                <span
                  className="inline-block h-7 w-20 animate-pulse bg-muted"
                  aria-label="Loading"
                />
              ) : (
                measure.value
              )}
              {!isLoading && !isError && (
                <span className="ml-1 text-[10px] font-semibold text-muted-foreground">
                  {measure.unit}
                </span>
              )}
            </div>
            {measure.label === "Stock attention" ? (
              <p className="mt-1 text-[11px] text-muted-foreground">
                {holders} active jobber holders
              </p>
            ) : (
              <p className="mt-1 text-[11px] text-muted-foreground">
                Across all raw material positions
              </p>
            )}
          </div>
        );
      })}
    </section>
  );
}

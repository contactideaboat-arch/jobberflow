import { Factory, PackageSearch, Warehouse } from "lucide-react";
import { EmptyRow } from "@/components/erp/bits";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { KG } from "@/lib/erp";
import { cn } from "@/lib/utils";
import type { StockRow } from "./stock-types";

export function StockTable({
  rows,
  isLoading,
  isError,
  retry,
}: {
  rows: StockRow[];
  isLoading: boolean;
  isError: boolean;
  retry: () => void;
}) {
  if (isError) {
    return (
      <div role="alert" className="flex flex-col items-center px-4 py-14 text-center">
        <PackageSearch className="size-8 text-destructive" aria-hidden="true" />
        <h2 className="mt-3 text-sm font-semibold">Stock positions could not be loaded</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Check the connection and try the request again.
        </p>
        <Button size="sm" variant="outline" onClick={retry} className="mt-4">
          Try again
        </Button>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto" aria-busy={isLoading}>
      <table className="erp-table min-w-[70rem]">
        <thead>
          <tr>
            <th>Location</th>
            <th>Holder / Jobber</th>
            <th>Material</th>
            <th className="text-right">In / Received</th>
            <th className="text-right">Out / Consumed</th>
            <th className="text-right">Wastage</th>
            <th className="text-right">Returned</th>
            <th className="text-right">Adjustment</th>
            <th className="text-right">Balance</th>
            <th className="text-right">Minimum</th>
          </tr>
        </thead>
        <tbody>
          {isLoading &&
            Array.from({ length: 5 }, (_, index) => (
              <tr key={index}>
                <td colSpan={10} className="p-2">
                  <Skeleton className="h-8 w-full" />
                </td>
              </tr>
            ))}
          {!isLoading && rows.length === 0 && (
            <EmptyRow cols={10} text="No stock positions match the selected filters." />
          )}
          {!isLoading &&
            rows.map((row) => {
              const low = row.location === "warehouse" && row.balance < row.minimumStock;
              return (
                <tr key={row.id}>
                  <td>
                    <span
                      className={cn(
                        "inline-flex items-center gap-1.5 font-medium",
                        row.location === "jobbers" ? "text-accent-foreground" : "text-primary",
                      )}
                    >
                      {row.location === "warehouse" ? (
                        <Warehouse className="size-3.5" />
                      ) : (
                        <Factory className="size-3.5" />
                      )}
                      {row.location === "warehouse" ? "Warehouse" : "Jobber"}
                    </span>
                  </td>
                  <td>
                    {row.jobberId ? (
                      <>
                        <span className="num block text-[11px] text-muted-foreground">
                          {row.jobberCode}
                        </span>
                        {row.jobberName}
                      </>
                    ) : (
                      <span className="text-muted-foreground">Company warehouse</span>
                    )}
                  </td>
                  <td>
                    <span className="num block text-[11px] text-muted-foreground">
                      {row.materialCode}
                    </span>
                    {row.materialName}
                  </td>
                  <td className="num text-right">{KG(row.inbound)}</td>
                  <td className="num text-right">{KG(row.outbound)}</td>
                  <td className="num text-right text-warning-foreground">
                    {row.wastage === null ? "—" : KG(row.wastage)}
                  </td>
                  <td className="num text-right">
                    {row.returned === null ? "—" : KG(row.returned)}
                  </td>
                  <td className="num text-right">
                    {row.adjustment === null ? "—" : KG(row.adjustment)}
                  </td>
                  <td className={cn("num text-right font-semibold", low && "text-destructive")}>
                    {KG(row.balance)}
                  </td>
                  <td className="num text-right">
                    {row.minimumStock ? KG(row.minimumStock) : "—"}
                  </td>
                </tr>
              );
            })}
        </tbody>
      </table>
    </div>
  );
}

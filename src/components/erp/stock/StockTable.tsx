import { Link } from "@tanstack/react-router";
import { EmptyState, ErrorState, LoadingRows } from "@/components/erp/bits";
import { GridScroll, NIL, SortHeader, type Grid } from "@/components/erp/grid";
import { Badge } from "@/components/ui/badge";
import { KG } from "@/lib/erp";
import { cn } from "@/lib/utils";
import type { StockRow } from "./stock-types";

const COLS = 11;

/**
 * The stock register. Identity first (material, then where it is), the
 * movement columns that produced the balance, then the balance and its
 * state in words, then the way into the movements behind it.
 */
export function StockTable({
  grid,
  isLoading,
  isError,
  retry,
}: {
  grid: Grid<StockRow>;
  isLoading: boolean;
  isError: boolean;
  retry: () => void;
}) {
  return (
    <GridScroll sticky>
      <table className="erp-table min-w-[72rem]" aria-busy={isLoading}>
        <caption className="sr-only">
          Raw material positions with movements, balance and minimum level
        </caption>
        <thead>
          <tr>
            <SortHeader grid={grid} sortKey="material" className="min-w-56">
              Material
            </SortHeader>
            <SortHeader grid={grid} sortKey="location" className="min-w-44">
              Location
            </SortHeader>
            <th scope="col">UOM</th>
            <SortHeader grid={grid} sortKey="inbound" align="right">
              In or received
            </SortHeader>
            <SortHeader grid={grid} sortKey="outbound" align="right">
              Out or consumed
            </SortHeader>
            <th scope="col" className="text-right!">
              Wastage
            </th>
            <th scope="col" className="text-right!">
              Returned
            </th>
            <th scope="col" className="text-right!">
              Adjustment
            </th>
            <SortHeader grid={grid} sortKey="balance" align="right">
              Balance
            </SortHeader>
            <SortHeader grid={grid} sortKey="minimum" align="right">
              Minimum
            </SortHeader>
            <th scope="col">
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {isLoading && <LoadingRows cols={COLS} />}
          {!isLoading && isError && (
            <ErrorState cols={COLS} title="Stock positions could not be loaded." onRetry={retry} />
          )}
          {!isLoading && !isError && grid.matched.length === 0 && (
            <EmptyState
              cols={COLS}
              title={
                grid.isFiltered ? "No stock positions match these filters." : "No stock on record."
              }
              body={
                grid.isFiltered
                  ? "Clear the filters to see every position."
                  : "Material appears here once a raw material inward or transfer voucher is posted."
              }
            />
          )}
          {!isLoading &&
            !isError &&
            grid.pageRows.map((row) => {
              const low =
                row.location === "warehouse" &&
                row.minimumStock > 0 &&
                row.balance < row.minimumStock;
              const difference = row.balance < -0.0005;
              return (
                <tr key={row.id}>
                  <th scope="row" className="text-left font-normal">
                    <span className="block font-medium text-foreground">{row.materialName}</span>
                    <span className="num block text-xs text-muted-foreground">
                      {row.materialCode}
                    </span>
                  </th>
                  <td>
                    {row.jobberId ? (
                      <>
                        <span className="block">{row.jobberName}</span>
                        <span className="num block text-xs text-muted-foreground">
                          Jobber · {row.jobberCode}
                        </span>
                      </>
                    ) : (
                      <>
                        <span className="block">Your godown</span>
                        <span className="block text-xs text-muted-foreground">Company stock</span>
                      </>
                    )}
                  </td>
                  <td className="text-muted-foreground">{row.uom}</td>
                  <td className="num text-right">{KG(row.inbound)}</td>
                  <td className="num text-right">{KG(row.outbound)}</td>
                  <td className="num text-right">{row.wastage === null ? NIL : KG(row.wastage)}</td>
                  <td className="num text-right">
                    {row.returned === null ? NIL : KG(row.returned)}
                  </td>
                  <td className="num text-right">
                    {row.adjustment === null ? NIL : KG(row.adjustment)}
                  </td>
                  <td className="text-right">
                    <span
                      className={cn(
                        "num block font-semibold",
                        difference ? "text-destructive" : "text-foreground",
                      )}
                    >
                      {KG(row.balance)}
                    </span>
                    {low && (
                      <Badge variant="warning" className="mt-0.5">
                        Below minimum
                      </Badge>
                    )}
                    {difference && (
                      <Badge variant="destructive" className="mt-0.5">
                        Difference
                      </Badge>
                    )}
                  </td>
                  <td className="num text-right text-muted-foreground">
                    {row.minimumStock ? KG(row.minimumStock) : NIL}
                  </td>
                  <td className="whitespace-nowrap text-right">
                    <div className="flex justify-end gap-3 text-xs font-medium">
                      <Link
                        to="/inventory/rm-ledger"
                        search={{
                          material: row.materialId,
                          ...(row.jobberId ? { jobber: row.jobberId } : {}),
                        }}
                        className="text-primary hover:underline"
                        aria-label={`Movements of ${row.materialName}${row.jobberName ? ` at ${row.jobberName}` : ""}`}
                      >
                        Movements
                      </Link>
                      {row.jobberId && (
                        <Link
                          to="/reconciliation"
                          search={{ jobber: row.jobberId }}
                          className="text-primary hover:underline"
                          aria-label={`Reconcile ${row.jobberName}`}
                        >
                          Reconcile
                        </Link>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
        </tbody>
      </table>
    </GridScroll>
  );
}

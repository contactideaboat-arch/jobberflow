/* eslint-disable @typescript-eslint/no-explicit-any */
import { useMemo, useState } from "react";
import { Boxes, Factory, PackageSearch, Warehouse } from "lucide-react";
import { PageHeader } from "@/components/erp/AppShell";
import { ExportBar, Panel, SearchSelect } from "@/components/erp/bits";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRows } from "@/hooks/use-erp";
import { KG } from "@/lib/erp";
import { cn } from "@/lib/utils";
import { StockSummary } from "./StockSummary";
import { StockTable } from "./StockTable";
import type { StockRow, StockView } from "./stock-types";

const viewOptions: Array<{ value: StockView; label: string; icon: typeof Boxes }> = [
  { value: "all", label: "All stock", icon: Boxes },
  { value: "warehouse", label: "Warehouse", icon: Warehouse },
  { value: "jobbers", label: "Jobbers", icon: Factory },
];

export function StockOverview({ initialView = "all" }: { initialView?: StockView }) {
  const [view, setView] = useState<StockView>(initialView);
  const [query, setQuery] = useState("");
  const [jobberId, setJobberId] = useState("");
  const warehouse = useRows("warehouse_stock", ["warehouse_stock"]);
  const jobbers = useRows("jobber_stock", ["jobber_stock"]);
  const jobberMaster = useRows("jobbers", ["jobbers", "all"], (builder) => builder.order("code"));

  const stockRows = useMemo<StockRow[]>(() => {
    const warehouseRows: StockRow[] = (warehouse.data ?? []).map((row: any) => ({
      id: `warehouse-${row.material_id}`,
      location: "warehouse",
      materialId: row.material_id,
      materialCode: row.code,
      materialName: row.name,
      category: row.category,
      uom: row.uom,
      inbound: Number(row.total_in ?? 0),
      outbound: Number(row.total_out ?? 0),
      wastage: null,
      returned: null,
      adjustment: null,
      balance: Number(row.balance ?? 0),
      minimumStock: Number(row.minimum_stock ?? 0),
    }));
    const jobberRows: StockRow[] = (jobbers.data ?? []).map((row: any) => ({
      id: `jobber-${row.jobber_id}-${row.material_id}`,
      location: "jobbers",
      jobberId: row.jobber_id,
      jobberCode: row.jobber_code,
      jobberName: row.jobber_name,
      materialId: row.material_id,
      materialCode: row.material_code,
      materialName: row.material_name,
      uom: row.uom,
      inbound: Number(row.received ?? 0),
      outbound: Number(row.standard_consumed ?? 0),
      wastage: Number(row.wastage ?? 0),
      returned: Number(row.returned ?? 0),
      adjustment: Number(row.adjustment ?? 0),
      balance: Number(row.balance ?? 0),
      minimumStock: 0,
    }));
    return [...warehouseRows, ...jobberRows];
  }, [warehouse.data, jobbers.data]);

  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return stockRows
      .filter((row) => view === "all" || row.location === view)
      .filter((row) => !jobberId || row.jobberId === jobberId)
      .filter((row) =>
        [row.materialCode, row.materialName, row.category, row.jobberCode, row.jobberName]
          .join(" ")
          .toLowerCase()
          .includes(normalizedQuery),
      )
      .sort((left, right) =>
        `${left.materialCode}${left.location}${left.jobberCode}`.localeCompare(
          `${right.materialCode}${right.location}${right.jobberCode}`,
        ),
      );
  }, [jobberId, query, stockRows, view]);

  const isLoading = warehouse.isLoading || jobbers.isLoading;
  const isError = warehouse.isError || jobbers.isError;
  const retry = () => {
    void warehouse.refetch();
    void jobbers.refetch();
  };
  const exportRows = filtered.map((row) => ({
    Location: row.location === "warehouse" ? "Company warehouse" : "Jobber",
    Jobber: row.jobberId ? `${row.jobberCode} — ${row.jobberName}` : "",
    "Material Code": row.materialCode,
    Material: row.materialName,
    "Inbound / Received": row.inbound,
    "Outbound / Standard Consumed": row.outbound,
    Wastage: row.wastage,
    Returned: row.returned,
    Adjustment: row.adjustment,
    Balance: row.balance,
    Minimum: row.minimumStock || "",
    UOM: row.uom,
  }));

  return (
    <div>
      <PageHeader
        title="Raw material stock"
        breadcrumb={["Inventory", "Stock overview"]}
        subtitle="See warehouse and jobber-held material together. Material remains company-owned until production consumes it."
        actions={<ExportBar filename="combined-raw-material-stock" rows={exportRows} />}
      />
      <StockSummary rows={stockRows} isLoading={isLoading} isError={isError} />
      <Panel>
        <div className="flex flex-col gap-3 border-b p-3 xl:flex-row xl:items-center">
          <div
            className="inline-grid w-full grid-cols-3 rounded-md bg-muted p-1 xl:inline-flex xl:w-auto"
            aria-label="Stock location filter"
          >
            {viewOptions.map((option) => {
              const Icon = option.icon;
              return (
                <Button
                  key={option.value}
                  type="button"
                  size="sm"
                  variant="ghost"
                  aria-pressed={view === option.value}
                  onClick={() => {
                    setView(option.value);
                    if (option.value !== "jobbers") setJobberId("");
                  }}
                  className={cn(
                    "justify-center",
                    view === option.value && "bg-card text-foreground shadow-sm hover:bg-card",
                  )}
                >
                  <Icon className="size-3.5" />
                  <span className="hidden sm:inline">{option.label}</span>
                </Button>
              );
            })}
          </div>
          <div className="relative min-w-0 flex-1 xl:max-w-sm">
            <Input
              className="h-9 pl-9"
              aria-label="Search combined stock"
              placeholder="Search material, jobber, or code…"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
            <PackageSearch
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
          </div>
          {view !== "warehouse" && (
            <div className="w-full xl:w-60">
              <SearchSelect
                options={[
                  { value: "", label: "All jobbers" },
                  ...(jobberMaster.data ?? []).map((row: any) => ({
                    value: row.id,
                    label: `${row.code} — ${row.name}`,
                  })),
                ]}
                value={jobberId}
                onChange={setJobberId}
                placeholder="All jobbers"
              />
            </div>
          )}
          <div className="ml-auto flex items-center gap-3 text-xs text-muted-foreground">
            <span>{filtered.length} positions</span>
            <span className="num font-semibold text-foreground">
              {KG(filtered.reduce((sum, row) => sum + row.balance, 0))} KG
            </span>
          </div>
        </div>
        <StockTable rows={filtered} isLoading={isLoading} isError={isError} retry={retry} />
      </Panel>
    </div>
  );
}

/* eslint-disable @typescript-eslint/no-explicit-any */
import { useMemo, useState } from "react";
import { PageHeader } from "@/components/erp/AppShell";
import { ExportBar, Panel } from "@/components/erp/bits";
import { FilterSelect, GridPager, GridToolbar, useGrid } from "@/components/erp/grid";
import { useRows } from "@/hooks/use-erp";
import { cn } from "@/lib/utils";
import { StockSummary } from "./StockSummary";
import { StockTable } from "./StockTable";
import type { StockRow, StockView } from "./stock-types";

const VIEWS: { value: StockView; label: string }[] = [
  { value: "all", label: "All locations" },
  { value: "warehouse", label: "Godown" },
  { value: "jobbers", label: "Jobbers" },
];

const STATES = [
  { value: "", label: "Any state" },
  { value: "below", label: "Below minimum" },
  { value: "difference", label: "Reconciliation difference" },
  { value: "held", label: "Has balance" },
];

/**
 * Raw material stock, wherever it sits. One register for the godown and every
 * jobber, because the question is "where is this material", and a location
 * filter answers it without a second screen.
 */
export function StockOverview({ initialView = "all" }: { initialView?: StockView }) {
  const [view, setView] = useState<StockView>(initialView);
  const [jobberId, setJobberId] = useState("");
  const [state, setState] = useState("");
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

  const grid = useGrid(stockRows, {
    search: (row) =>
      [row.materialCode, row.materialName, row.category, row.jobberCode, row.jobberName].join(" "),
    filter: (row) =>
      (view === "all" || row.location === view) &&
      (!jobberId || row.jobberId === jobberId) &&
      (!state ||
        (state === "below" && row.location === "warehouse" && row.balance < row.minimumStock) ||
        (state === "difference" && row.balance < -0.0005) ||
        (state === "held" && Math.abs(row.balance) > 0.0005)),
    filtersActive: view !== initialView || !!jobberId || !!state,
    sorters: {
      material: (row) => row.materialCode,
      location: (row) => (row.location === "warehouse" ? "" : (row.jobberName ?? "")),
      inbound: (row) => row.inbound,
      outbound: (row) => row.outbound,
      balance: (row) => row.balance,
      minimum: (row) => row.minimumStock,
    },
    initialSort: { key: "material", direction: "asc" },
  });

  const isLoading = warehouse.isLoading || jobbers.isLoading;
  const isError = warehouse.isError || jobbers.isError;
  const retry = () => {
    void warehouse.refetch();
    void jobbers.refetch();
  };
  const exportRows = grid.matched.map((row) => ({
    Location: row.location === "warehouse" ? "Company godown" : "Jobber",
    Jobber: row.jobberId ? `${row.jobberCode}, ${row.jobberName}` : "",
    "Material code": row.materialCode,
    Material: row.materialName,
    "In or received": row.inbound,
    "Out or standard consumed": row.outbound,
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
        subtitle="Every raw material balance, in your godown and at each jobber. Material stays company stock until production consumes it."
        actions={<ExportBar filename="raw-material-stock" rows={exportRows} />}
      />
      <StockSummary rows={stockRows} isLoading={isLoading} isError={isError} />
      <Panel>
        <GridToolbar
          grid={grid}
          searchLabel="Search stock"
          placeholder="Material, code or jobber"
          noun={["position", "positions"]}
          onReset={() => {
            setView(initialView);
            setJobberId("");
            setState("");
          }}
        >
          <div
            role="group"
            aria-label="Location"
            className="inline-flex h-control-sm items-center gap-0.5 rounded-md border bg-subtle p-0.5 pointer-coarse:min-h-11"
          >
            {VIEWS.map((option) => (
              <button
                key={option.value}
                type="button"
                aria-pressed={view === option.value}
                onClick={() => {
                  setView(option.value);
                  if (option.value === "warehouse") setJobberId("");
                  grid.resetPage();
                }}
                className={cn(
                  "h-full cursor-pointer rounded-[5px] px-2.5 text-[0.8125rem] font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring pointer-coarse:min-h-11",
                  view === option.value && "bg-card text-foreground ring-1 ring-border",
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
          {view !== "warehouse" && (
            <FilterSelect
              label="Jobber"
              value={jobberId}
              onChange={(value) => {
                setJobberId(value);
                grid.resetPage();
              }}
              options={[
                { value: "", label: "All jobbers" },
                ...(jobberMaster.data ?? []).map((row: any) => ({
                  value: row.id,
                  label: `${row.code}, ${row.name}`,
                })),
              ]}
            />
          )}
          <FilterSelect
            label="State"
            value={state}
            onChange={(value) => {
              setState(value);
              grid.resetPage();
            }}
            options={STATES}
          />
        </GridToolbar>
        <StockTable grid={grid} isLoading={isLoading} isError={isError} retry={retry} />
        <GridPager grid={grid} />
      </Panel>
    </div>
  );
}

/* eslint-disable @typescript-eslint/no-explicit-any */
import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { PageHeader } from "@/components/erp/AppShell";
import { ExportBar, Panel, RegisterState, queryStatus } from "@/components/erp/bits";
import {
  FilterSelect,
  GridPager,
  GridScroll,
  GridToolbar,
  NIL,
  useGrid,
} from "@/components/erp/grid";
import { DateFilter, ScopeLine, humanize } from "@/components/erp/LedgerFilters";
import { useRows } from "@/hooks/use-erp";
import { KG, dmy } from "@/lib/erp";

export const Route = createFileRoute("/_authenticated/inventory/rm-ledger")({
  validateSearch: (search: Record<string, unknown>): { material?: string; jobber?: string } => ({
    ...(typeof search["material"] === "string" ? { material: search["material"] } : {}),
    ...(typeof search["jobber"] === "string" ? { jobber: search["jobber"] } : {}),
  }),
  head: () => ({
    meta: [
      { title: "Raw material ledger | JobberFlow" },
      {
        name: "description",
        content:
          "Every raw material movement across the godown and jobbers, with a running balance per material.",
      },
    ],
  }),
  component: RmLedger,
});

const LOCATIONS = [
  { value: "", label: "All locations" },
  { value: "WAREHOUSE", label: "Godown" },
  { value: "JOBBER", label: "Jobber" },
];

function RmLedger() {
  const initial = Route.useSearch();
  const [material, setMaterial] = useState(initial.material ?? "");
  const [jobber, setJobber] = useState(initial.jobber ?? "");
  const [location, setLocation] = useState(initial.jobber ? "JOBBER" : "");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const { data: materials } = useRows("raw_materials", ["raw_materials", "all"], (b) =>
    b.order("code"),
  );
  const { data: jobbers } = useRows("jobbers", ["jobbers", "all"], (b) => b.order("code"));
  const query = useRows("raw_material_ledger", ["rm_ledger"], (b) =>
    b
      .order("transaction_date", { ascending: true })
      .order("created_at", { ascending: true })
      .limit(5000),
  );
  const status = queryStatus(query);

  const materialById = useMemo(
    () => new Map((materials ?? []).map((m: any) => [m.id, m])),
    [materials],
  );
  const jobberById = useMemo(() => new Map((jobbers ?? []).map((j: any) => [j.id, j])), [jobbers]);

  /*
   * The running balance is only meaningful for one material in one scope, so
   * it is accumulated over every movement in that scope from the beginning,
   * and the date range is applied afterwards. A from-date therefore shows the
   * true balance on each row instead of restarting at zero.
   */
  const scoped = useMemo(() => {
    let running = 0;
    return (query.data ?? [])
      .filter(
        (r: any) =>
          (!material || r.material_id === material) &&
          (!jobber || r.jobber_id === jobber) &&
          (!location || r.location_type === location),
      )
      .map((r: any) => {
        running += Number(r.quantity_in ?? 0) - Number(r.quantity_out ?? 0);
        return { ...r, running };
      });
  }, [query.data, material, jobber, location]);
  const inRange = scoped.filter(
    (r: any) => (!from || r.transaction_date >= from) && (!to || r.transaction_date <= to),
  );
  const newestFirst = useMemo(() => [...inRange].reverse(), [inRange]);
  const showBalance = !!material;

  const grid = useGrid(newestFirst, {
    search: (r: any) =>
      [
        r.voucher_number,
        r.transaction_type,
        materialById.get(r.material_id)?.name,
        materialById.get(r.material_id)?.code,
        jobberById.get(r.jobber_id)?.name,
        r.remarks,
      ].join(" "),
    filtersActive: !!(material || jobber || location || from || to),
    pageSize: 50,
  });

  const mName = (id: string) => {
    const m: any = materialById.get(id);
    return m ? `${m.code}, ${m.name}` : NIL;
  };
  const jName = (id: string | null) => (id ? ((jobberById.get(id) as any)?.name ?? NIL) : NIL);
  const cols = showBalance ? 10 : 9;

  return (
    <div>
      <PageHeader
        title="Raw material ledger"
        subtitle="Every raw material movement in date order. Choose one material to see its running balance."
        actions={
          <ExportBar
            filename="raw-material-ledger"
            rows={[...grid.matched].reverse().map((r: any) => ({
              Date: dmy(r.transaction_date),
              Voucher: r.voucher_number,
              Type: humanize(r.transaction_type),
              Material: mName(r.material_id),
              Location: r.location_type === "JOBBER" ? "Jobber" : "Godown",
              Jobber: r.jobber_id ? jName(r.jobber_id) : "",
              In: r.quantity_in,
              Out: r.quantity_out,
              "Standard consumption": r.standard_consumption,
              Wastage: r.wastage_quantity,
              ...(showBalance ? { "Running balance": r.running } : {}),
              Remarks: r.remarks,
            }))}
          />
        }
      />
      <Panel>
        <GridToolbar
          grid={grid}
          searchLabel="Search movements"
          placeholder="Voucher, type, material or remark"
          noun={["movement", "movements"]}
          onReset={() => {
            setMaterial("");
            setJobber("");
            setLocation("");
            setFrom("");
            setTo("");
          }}
        >
          <FilterSelect
            label="Material"
            value={material}
            onChange={(value) => {
              setMaterial(value);
              grid.resetPage();
            }}
            options={[
              { value: "", label: "All materials" },
              ...(materials ?? []).map((m: any) => ({
                value: m.id,
                label: `${m.code}, ${m.name}`,
              })),
            ]}
          />
          <FilterSelect
            label="Location"
            value={location}
            onChange={(value) => {
              setLocation(value);
              if (value === "WAREHOUSE") setJobber("");
              grid.resetPage();
            }}
            options={LOCATIONS}
          />
          {location !== "WAREHOUSE" && (
            <FilterSelect
              label="Jobber"
              value={jobber}
              onChange={(value) => {
                setJobber(value);
                grid.resetPage();
              }}
              options={[
                { value: "", label: "All jobbers" },
                ...(jobbers ?? []).map((j: any) => ({
                  value: j.id,
                  label: `${j.code}, ${j.name}`,
                })),
              ]}
            />
          )}
          <DateFilter label="From" value={from} onChange={setFrom} max={to || undefined} />
          <DateFilter label="To" value={to} onChange={setTo} min={from || undefined} />
        </GridToolbar>
        <ScopeLine
          parts={[
            material ? mName(material) : "All materials",
            location === "WAREHOUSE"
              ? "Godown"
              : location === "JOBBER"
                ? "Jobbers"
                : "All locations",
            jobber && jName(jobber),
          ]}
          from={from}
          to={to}
        />
        <GridScroll sticky>
          <table className="erp-table min-w-[60rem]">
            <caption className="sr-only">Raw material movements, newest first</caption>
            <thead>
              <tr>
                <th scope="col">Date</th>
                <th scope="col">Voucher</th>
                <th scope="col">Type</th>
                <th scope="col">Material</th>
                <th scope="col">Location</th>
                <th scope="col" className="text-right!">
                  In (kg)
                </th>
                <th scope="col" className="text-right!">
                  Out (kg)
                </th>
                <th scope="col" className="text-right!">
                  Wastage (kg)
                </th>
                {showBalance && (
                  <th scope="col" className="text-right!">
                    Balance (kg)
                  </th>
                )}
                <th scope="col">Remarks</th>
              </tr>
            </thead>
            <tbody>
              {status !== "ready" ? (
                <RegisterState status={status} cols={cols} onRetry={() => void query.refetch()} />
              ) : grid.matched.length === 0 ? (
                <RegisterState
                  status="ready"
                  cols={cols}
                  emptyTitle={
                    grid.isFiltered ? "No movements match these filters." : "No movements yet."
                  }
                  emptyBody={
                    grid.isFiltered
                      ? "Widen the date range or clear the filters."
                      : "Posting any voucher records its movements here."
                  }
                />
              ) : (
                grid.pageRows.map((r: any) => (
                  <tr key={r.id}>
                    <th scope="row" className="num whitespace-nowrap text-left font-normal">
                      {dmy(r.transaction_date)}
                    </th>
                    <td className="num whitespace-nowrap font-medium">{r.voucher_number ?? NIL}</td>
                    <td className="whitespace-nowrap">{humanize(r.transaction_type)}</td>
                    <td className="max-w-56 truncate">{mName(r.material_id)}</td>
                    <td className="whitespace-nowrap">
                      {r.location_type === "JOBBER" ? jName(r.jobber_id) : "Godown"}
                    </td>
                    <td className="num text-right">
                      {Number(r.quantity_in) ? KG(r.quantity_in) : NIL}
                    </td>
                    <td className="num text-right">
                      {Number(r.quantity_out) ? KG(r.quantity_out) : NIL}
                    </td>
                    <td className="num text-right">
                      {Number(r.wastage_quantity) ? KG(r.wastage_quantity) : NIL}
                    </td>
                    {showBalance && (
                      <td className="num text-right font-semibold">{KG(r.running)}</td>
                    )}
                    <td className="max-w-48 truncate text-muted-foreground">{r.remarks ?? ""}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </GridScroll>
        <GridPager grid={grid} />
      </Panel>
    </div>
  );
}

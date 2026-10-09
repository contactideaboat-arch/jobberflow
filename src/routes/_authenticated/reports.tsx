/* eslint-disable @typescript-eslint/no-explicit-any */
import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { IconRefresh } from "@/components/icons";
import { PageHeader } from "@/components/erp/AppShell";
import {
  ExportBar,
  Field,
  Panel,
  RegisterState,
  ScopeNote,
  SearchSelect,
  queryStatus,
} from "@/components/erp/bits";
import {
  FilterSelect,
  GridPager,
  GridScroll,
  GridToolbar,
  NIL,
  SortHeader,
  WastageCell,
  useGrid,
} from "@/components/erp/grid";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useRows } from "@/hooks/use-erp";
import { KG, NUM, PCS, PCT, dmy } from "@/lib/erp";

export const Route = createFileRoute("/_authenticated/reports")({
  head: () => ({
    meta: [
      { title: "Reports Centre. JobberFlow." },
      {
        name: "description",
        content:
          "Production register, wastage analysis, material consumption and jobber performance reports with export.",
      },
      { property: "og:title", content: "Reports Centre, JobWork ERP" },
      {
        property: "og:description",
        content: "Management reporting for job work production and wastage.",
      },
    ],
  }),
  component: ReportsCentre,
});

/**
 * Reports are grouped tables over posted vouchers, not live registers, so they
 * do not use useGrid's search box. Each report keeps its own sort, paging and
 * match count. Every calculation below is the one that was already here: the
 * numbers come from `product_inward_headers` and `raw_material_ledger`, summed
 * by the same keys, with the same threshold test. Nothing is recomputed here
 * and no figure is invented.
 */

type Tab = "production" | "wastage" | "product" | "consumption";

/** `YYYY-MM-DD` for a local Date. `toISOString` would shift the day in IST. */
const iso = (d: Date) =>
  `${d.getFullYear()}-${`${d.getMonth() + 1}`.padStart(2, "0")}-${`${d.getDate()}`.padStart(2, "0")}`;

/** The last `days` days, inclusive of today. */
function lastNDays(days: number) {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - (days - 1));
  return { from: iso(from), to: iso(to) };
}

/** The Indian financial year, 1 April to 31 March, containing `now`. */
function currentFinancialYear() {
  const now = new Date();
  const startYear = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
  return { from: `${startYear}-04-01`, to: `${startYear + 1}-03-31` };
}

const PRESETS = [
  { value: "", label: "All time" },
  { value: "30", label: "Last 30 days" },
  { value: "90", label: "Last 90 days" },
  { value: "fy", label: "This financial year" },
];

function ReportsCentre() {
  const [jobber, setJobber] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [preset, setPreset] = useState("");

  const { data: jobbers } = useRows("jobbers", ["jobbers", "all"], (b) => b.order("code"));
  const { data: products } = useRows("finished_products", ["finished_products", "all"], (b) =>
    b.order("code"),
  );
  const { data: materials } = useRows("raw_materials", ["raw_materials", "all"], (b) =>
    b.order("code"),
  );
  const { data: settings } = useRows("company_settings", ["company_settings"]);
  const headsQuery = useRows("product_inward_headers", ["pi_headers"], (b) =>
    b.order("voucher_date", { ascending: false }).limit(2000),
  );
  const heads = headsQuery.data;
  const rmLedgerQuery = useRows("raw_material_ledger", ["rm_ledger", "reports"], (b) =>
    b.limit(5000),
  );
  const rmLedger = rmLedgerQuery.data;
  const status = queryStatus(headsQuery);
  const consumptionStatus = queryStatus(rmLedgerQuery);

  /*
   * The wastage limit is the owner's rule, read from company_settings. If it
   * has never been set, this page must not invent one and start painting
   * vouchers red against a threshold nobody agreed to. `threshold` is null in
   * that case, and nothing is flagged; the subtitle says so instead.
   */
  const rawThreshold = (settings ?? [])[0]?.wastage_warning_threshold;
  const threshold = rawThreshold == null ? null : Number(rawThreshold);
  const hasThreshold = threshold != null && Number.isFinite(threshold);

  const name = (list: any[] | undefined, id: string | null) => {
    const r = (list ?? []).find((x: any) => x.id === id);
    return r ? `${r.code}, ${r.name}` : NIL;
  };
  const jName = (id: string | null) => (jobbers ?? []).find((j: any) => j.id === id)?.name ?? NIL;

  // Index the lookups once. Each report row resolves a name on render, and
  // these tables run to hundreds of rows.
  const productName = useMemo(() => {
    const map = new Map<string, string>();
    for (const p of products ?? []) map.set(p.id, `${p.code}, ${p.name}`);
    return (id: string | null) => map.get(id ?? "") ?? NIL;
  }, [products]);
  const materialName = useMemo(() => {
    const map = new Map<string, string>();
    for (const m of materials ?? []) map.set(m.id, `${m.code}, ${m.name}`);
    return (id: string | null) => map.get(id ?? "") ?? NIL;
  }, [materials]);
  const jobberName = useMemo(() => {
    const map = new Map<string, string>();
    for (const j of jobbers ?? []) map.set(j.id, j.name);
    return (id: string | null) => map.get(id ?? "") ?? NIL;
  }, [jobbers]);

  const posted = useMemo(
    () =>
      (heads ?? []).filter(
        (h: any) =>
          h.status === "POSTED" &&
          (from ? h.voucher_date >= from : true) &&
          (to ? h.voucher_date <= to : true) &&
          (jobber ? h.jobber_id === jobber : true),
      ),
    [heads, from, to, jobber],
  );

  /* ---- production register ---- */
  const productionGrid = useGrid<any>(posted, {
    sorters: {
      voucher: (h) => h.voucher_number,
      date: (h) => h.voucher_date,
      jobber: (h) => jobberName(h.jobber_id),
      product: (h) => productName(h.product_id),
      finished: (h) => Number(h.finished_quantity ?? 0),
      standard: (h) => Number(h.total_standard_consumption ?? 0),
      wastage: (h) => Number(h.overall_wastage_kg ?? 0),
      pct: (h) => Number(h.wastage_percentage ?? 0),
    },
    initialSort: { key: "date", direction: "desc" },
  });

  /* ---- wastage analysis by jobber ---- */
  const wastageByJobber = useMemo(
    () =>
      Object.values(
        posted.reduce((acc: any, h: any) => {
          const k = h.jobber_id;
          acc[k] ??= { jobber: jobberName(k), vouchers: 0, produced: 0, standard: 0, wastage: 0 };
          acc[k].vouchers += 1;
          acc[k].produced += Number(h.finished_quantity ?? 0);
          acc[k].standard += Number(h.total_standard_consumption ?? 0);
          acc[k].wastage += Number(h.overall_wastage_kg ?? 0);
          return acc;
        }, {}),
      ).map((r: any) => ({
        ...r,
        pct: r.standard > 0 ? (r.wastage / r.standard) * 100 : 0,
      })),
    [posted, jobberName],
  );
  const wastageGrid = useGrid<any>(wastageByJobber, {
    sorters: {
      jobber: (r) => r.jobber,
      vouchers: (r) => r.vouchers,
      produced: (r) => r.produced,
      standard: (r) => r.standard,
      wastage: (r) => r.wastage,
      pct: (r) => r.pct,
    },
    initialSort: { key: "pct", direction: "desc" },
  });

  /* ---- product-wise production ---- */
  const byProduct = useMemo(
    () =>
      Object.values(
        posted.reduce((acc: any, h: any) => {
          const k = h.product_id;
          acc[k] ??= {
            product: productName(k),
            vouchers: 0,
            produced: 0,
            standard: 0,
            wastage: 0,
          };
          acc[k].vouchers += 1;
          acc[k].produced += Number(h.finished_quantity ?? 0);
          acc[k].standard += Number(h.total_standard_consumption ?? 0);
          acc[k].wastage += Number(h.overall_wastage_kg ?? 0);
          return acc;
        }, {}),
      ).map((r: any) => ({
        ...r,
        pct: r.standard > 0 ? (r.wastage / r.standard) * 100 : 0,
      })),
    [posted, productName],
  );
  const productGrid = useGrid<any>(byProduct, {
    sorters: {
      product: (r) => r.product,
      vouchers: (r) => r.vouchers,
      produced: (r) => r.produced,
      standard: (r) => r.standard,
      wastage: (r) => r.wastage,
      pct: (r) => r.pct,
    },
    initialSort: { key: "pct", direction: "desc" },
  });

  /* ---- material consumption ---- */
  const consumption = useMemo(
    () =>
      Object.values(
        (rmLedger ?? [])
          .filter(
            (l: any) =>
              l.transaction_type === "CONSUMPTION" &&
              (from ? l.transaction_date >= from : true) &&
              (to ? l.transaction_date <= to : true) &&
              (jobber ? l.jobber_id === jobber : true),
          )
          .reduce((acc: any, l: any) => {
            const k = l.material_id;
            acc[k] ??= { material: materialName(k), standard: 0, wastage: 0, total: 0 };
            acc[k].standard += Number(l.standard_consumption ?? 0);
            acc[k].wastage += Number(l.wastage_quantity ?? 0);
            acc[k].total += Number(l.quantity_out ?? 0);
            return acc;
          }, {}),
      ).map((r: any) => ({
        ...r,
        pct: r.standard > 0 ? (r.wastage / r.standard) * 100 : 0,
      })),
    [rmLedger, from, to, jobber, materialName],
  );
  const consumptionGrid = useGrid<any>(consumption, {
    sorters: {
      material: (r) => r.material,
      standard: (r) => r.standard,
      wastage: (r) => r.wastage,
      total: (r) => r.total,
      pct: (r) => r.pct,
    },
    initialSort: { key: "total", direction: "desc" },
  });

  const applyPreset = (value: string) => {
    setPreset(value);
    if (value === "") {
      setFrom("");
      setTo("");
    } else if (value === "fy") {
      const range = currentFinancialYear();
      setFrom(range.from);
      setTo(range.to);
    } else {
      const range = lastNDays(Number(value));
      setFrom(range.from);
      setTo(range.to);
    }
  };

  const clearFilters = () => {
    setJobber("");
    setFrom("");
    setTo("");
    setPreset("");
  };

  const filtersActive = !!(jobber || from || to);
  const selectedJobber = jobber ? jobberName(jobber) : "all jobbers";

  /**
   * The scope line. It names the period, the jobber and the record count, so
   * the number on screen can be checked against what was asked for. It says
   * "no period set" rather than an unbounded range, because "All time" and
   * "the last 2000 vouchers" are not the same claim and the query is capped.
   */
  const scope = (
    <>
      {from || to ? (
        <>
          posted production dated {from ? dmy(from) : "the beginning"} to {to ? dmy(to) : "today"}
        </>
      ) : (
        "posted production across all dates"
      )}
      {jobber ? (
        <>
          {" "}
          for <span className="font-medium text-foreground">{selectedJobber}</span>
        </>
      ) : (
        " for every jobber"
      )}
      .
    </>
  );

  /** Count + period for one report's own scope note. */
  const scopeTail = (matched: number, total: number, noun: string) => (
    <>
      {NUM(matched)} {noun}
      {matched !== total ? ` of ${NUM(total)} matching this period` : ""}.
    </>
  );

  return (
    <div>
      <PageHeader
        title="Reports Centre"
        subtitle={
          hasThreshold
            ? `Every report is built from posted production inward vouchers and the material ledger. Wastage above ${PCT(threshold!)} is flagged; change the limit in Settings.`
            : "Every report is built from posted production inward vouchers and the material ledger. No wastage limit is set, so nothing is flagged."
        }
      />

      <Panel className="mb-4">
        <div className="flex flex-wrap items-end gap-3 p-3">
          <Field label="Jobber" className="min-w-56 flex-1">
            <SearchSelect
              options={[
                { value: "", label: "All jobbers" },
                ...(jobbers ?? []).map((j: any) => ({
                  value: j.id,
                  label: `${j.code}, ${j.name}`,
                })),
              ]}
              value={jobber}
              onChange={setJobber}
              placeholder="All jobbers"
            />
          </Field>
          <Field label="Period" className="w-48">
            <FilterSelect label="" value={preset} onChange={applyPreset} options={PRESETS} />
          </Field>
          <Field label="From" className="w-40">
            <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          </Field>
          <Field label="To" className="w-40">
            <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          </Field>
          {filtersActive && (
            <Button variant="outline" onClick={clearFilters} className="mb-0.5">
              <IconRefresh className="size-3.5" /> Clear
            </Button>
          )}
        </div>
        {from && to && from > to && (
          <p role="alert" className="border-t px-3 py-2 text-xs font-medium text-destructive">
            The from date is after the to date, so no record can match. Every report below is empty
            until one end is corrected.
          </p>
        )}
      </Panel>

      <Tabs defaultValue="production">
        <TabsList className="mb-4">
          <TabsTrigger value="production">Production Register</TabsTrigger>
          <TabsTrigger value="wastage">Wastage by Jobber</TabsTrigger>
          <TabsTrigger value="product">Product-wise</TabsTrigger>
          <TabsTrigger value="consumption">Material Consumption</TabsTrigger>
        </TabsList>

        <TabsContent value="production">
          <Panel
            title="Production Register"
            description="One row per posted production inward voucher."
            actions={
              <ExportBar
                filename="production-register"
                rows={productionGrid.matched.map((h: any) => ({
                  Voucher: h.voucher_number,
                  Date: dmy(h.voucher_date),
                  Jobber: jobberName(h.jobber_id),
                  Product: productName(h.product_id),
                  "Finished Qty": h.finished_quantity,
                  "Std. Consumption": h.total_standard_consumption,
                  "Wastage KG": h.overall_wastage_kg,
                  "Wastage %": h.wastage_percentage,
                  "Actual Consumption": h.actual_total_consumption,
                  Batch: h.batch_number,
                }))}
              />
            }
          >
            <ScopeNote>
              {scope} Sorted newest first,{" "}
              {scopeTail(productionGrid.matched.length, posted.length, "vouchers")} Exports contain
              every matching voucher, not only this page.
            </ScopeNote>
            <GridScroll sticky>
              <table className="erp-table min-w-[62rem]">
                <caption className="sr-only">
                  Posted production inward vouchers with finished quantity, standard and actual
                  consumption, and wastage
                </caption>
                <thead>
                  <tr>
                    <SortHeader grid={productionGrid} sortKey="voucher">
                      Voucher
                    </SortHeader>
                    <SortHeader grid={productionGrid} sortKey="date">
                      Date
                    </SortHeader>
                    <SortHeader grid={productionGrid} sortKey="jobber">
                      Jobber
                    </SortHeader>
                    <SortHeader grid={productionGrid} sortKey="product">
                      Product
                    </SortHeader>
                    <SortHeader grid={productionGrid} sortKey="finished" align="right">
                      Finished (pcs)
                    </SortHeader>
                    <SortHeader grid={productionGrid} sortKey="standard" align="right">
                      Std. cons. (kg)
                    </SortHeader>
                    <SortHeader grid={productionGrid} sortKey="wastage" align="right">
                      Wastage (kg)
                    </SortHeader>
                    <SortHeader grid={productionGrid} sortKey="pct" align="right">
                      Wastage %
                    </SortHeader>
                    <th scope="col" className="text-right">
                      Actual cons. (kg)
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {status !== "ready" ? (
                    <RegisterState
                      status={status}
                      cols={9}
                      emptyTitle="No production vouchers in this period."
                      emptyBody="Widen the date range, or clear the jobber filter."
                      onRetry={() => void headsQuery.refetch()}
                    />
                  ) : productionGrid.matched.length === 0 ? (
                    <RegisterState
                      status="ready"
                      cols={9}
                      emptyTitle={
                        filtersActive
                          ? "No production matches these filters."
                          : "No production yet."
                      }
                      emptyBody={
                        filtersActive
                          ? `Wastage and consumption are measured on posted production inward vouchers. Nothing posted${jobber ? ` for ${selectedJobber}` : ""} falls in this period.`
                          : "Wastage and consumption are measured on posted production inward vouchers. Nothing has been posted yet."
                      }
                      action={
                        filtersActive ? (
                          <Button size="sm" variant="outline" onClick={clearFilters}>
                            Clear filters
                          </Button>
                        ) : undefined
                      }
                    />
                  ) : (
                    productionGrid.pageRows.map((h: any) => (
                      <tr key={h.id}>
                        <th scope="row" className="num whitespace-nowrap text-left font-medium">
                          {h.voucher_number}
                        </th>
                        <td className="num whitespace-nowrap">{dmy(h.voucher_date)}</td>
                        <td>{jobberName(h.jobber_id)}</td>
                        <td>{productName(h.product_id)}</td>
                        <td className="num text-right">{PCS(h.finished_quantity)}</td>
                        <td className="num text-right">{KG(h.total_standard_consumption)}</td>
                        <td className="num text-right">{KG(h.overall_wastage_kg)}</td>
                        <td className="text-right">
                          <WastageCell
                            pct={Number(h.wastage_percentage ?? 0)}
                            threshold={threshold}
                          />
                        </td>
                        <td className="num text-right">{KG(h.actual_total_consumption)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </GridScroll>
            <GridPager grid={productionGrid} />
          </Panel>
        </TabsContent>

        <TabsContent value="wastage">
          <Panel
            title="Wastage Analysis by Jobber"
            description="Posted vouchers grouped by jobber, worst wastage first."
            actions={
              <ExportBar
                filename="wastage-by-jobber"
                rows={wastageGrid.matched.map((r: any) => ({
                  Jobber: r.jobber,
                  Vouchers: r.vouchers,
                  "Produced (pcs)": r.produced,
                  "Standard Consumption (kg)": r.standard,
                  "Wastage (kg)": r.wastage,
                  "Wastage %": Number(r.pct).toFixed(2),
                }))}
              />
            }
          >
            <ScopeNote>
              {scope} {scopeTail(wastageGrid.matched.length, wastageByJobber.length, "jobbers")}{" "}
              Wastage % is wastage divided by standard consumption.
            </ScopeNote>
            <GridScroll sticky>
              <table className="erp-table min-w-[46rem]">
                <caption className="sr-only">
                  Wastage by jobber, with vouchers, production, standard consumption and wastage
                  percentage
                </caption>
                <thead>
                  <tr>
                    <SortHeader grid={wastageGrid} sortKey="jobber">
                      Jobber
                    </SortHeader>
                    <SortHeader grid={wastageGrid} sortKey="vouchers" align="right">
                      Vouchers
                    </SortHeader>
                    <SortHeader grid={wastageGrid} sortKey="produced" align="right">
                      Produced (pcs)
                    </SortHeader>
                    <SortHeader grid={wastageGrid} sortKey="standard" align="right">
                      Std. cons. (kg)
                    </SortHeader>
                    <SortHeader grid={wastageGrid} sortKey="wastage" align="right">
                      Wastage (kg)
                    </SortHeader>
                    <SortHeader grid={wastageGrid} sortKey="pct" align="right">
                      Wastage %
                    </SortHeader>
                  </tr>
                </thead>
                <tbody>
                  {status !== "ready" ? (
                    <RegisterState
                      status={status}
                      cols={6}
                      onRetry={() => void headsQuery.refetch()}
                    />
                  ) : wastageGrid.matched.length === 0 ? (
                    <RegisterState
                      status="ready"
                      cols={6}
                      emptyTitle={
                        filtersActive
                          ? "No production matches these filters."
                          : "No production yet."
                      }
                      emptyBody="Wastage is measured on posted production inward vouchers, so nothing can be grouped until one is posted in this period."
                      action={
                        filtersActive ? (
                          <Button size="sm" variant="outline" onClick={clearFilters}>
                            Clear filters
                          </Button>
                        ) : undefined
                      }
                    />
                  ) : (
                    wastageGrid.pageRows.map((r: any) => (
                      <tr key={r.jobber}>
                        <th scope="row" className="text-left font-medium">
                          {r.jobber}
                        </th>
                        <td className="num text-right">{NUM(r.vouchers)}</td>
                        <td className="num text-right">{PCS(r.produced)}</td>
                        <td className="num text-right">{KG(r.standard)}</td>
                        <td className="num text-right">{KG(r.wastage)}</td>
                        <td className="text-right">
                          <WastageCell pct={r.pct} threshold={threshold} />
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </GridScroll>
            <GridPager grid={wastageGrid} />
          </Panel>
        </TabsContent>

        <TabsContent value="product">
          <Panel
            title="Product-wise Production & Wastage"
            description="Posted vouchers grouped by finished product."
            actions={
              <ExportBar
                filename="product-wise-production"
                rows={productGrid.matched.map((r: any) => ({
                  Product: r.product,
                  Vouchers: r.vouchers,
                  "Produced (pcs)": r.produced,
                  "Standard Consumption (kg)": r.standard,
                  "Wastage (kg)": r.wastage,
                  "Wastage %": Number(r.pct).toFixed(2),
                }))}
              />
            }
          >
            <ScopeNote>
              {scope} {scopeTail(productGrid.matched.length, byProduct.length, "products")} Wastage
              % is wastage divided by standard consumption.
            </ScopeNote>
            <GridScroll sticky>
              <table className="erp-table min-w-[46rem]">
                <caption className="sr-only">
                  Production and wastage grouped by finished product
                </caption>
                <thead>
                  <tr>
                    <SortHeader grid={productGrid} sortKey="product">
                      Product
                    </SortHeader>
                    <SortHeader grid={productGrid} sortKey="vouchers" align="right">
                      Vouchers
                    </SortHeader>
                    <SortHeader grid={productGrid} sortKey="produced" align="right">
                      Produced (pcs)
                    </SortHeader>
                    <SortHeader grid={productGrid} sortKey="standard" align="right">
                      Std. cons. (kg)
                    </SortHeader>
                    <SortHeader grid={productGrid} sortKey="wastage" align="right">
                      Wastage (kg)
                    </SortHeader>
                    <SortHeader grid={productGrid} sortKey="pct" align="right">
                      Wastage %
                    </SortHeader>
                  </tr>
                </thead>
                <tbody>
                  {status !== "ready" ? (
                    <RegisterState
                      status={status}
                      cols={6}
                      onRetry={() => void headsQuery.refetch()}
                    />
                  ) : productGrid.matched.length === 0 ? (
                    <RegisterState
                      status="ready"
                      cols={6}
                      emptyTitle={
                        filtersActive
                          ? "No production matches these filters."
                          : "No production yet."
                      }
                      emptyBody="Product totals come from posted production inward vouchers. Nothing posted in this period can be grouped by product."
                      action={
                        filtersActive ? (
                          <Button size="sm" variant="outline" onClick={clearFilters}>
                            Clear filters
                          </Button>
                        ) : undefined
                      }
                    />
                  ) : (
                    productGrid.pageRows.map((r: any) => (
                      <tr key={r.product}>
                        <th scope="row" className="text-left font-medium">
                          {r.product}
                        </th>
                        <td className="num text-right">{NUM(r.vouchers)}</td>
                        <td className="num text-right">{PCS(r.produced)}</td>
                        <td className="num text-right">{KG(r.standard)}</td>
                        <td className="num text-right">{KG(r.wastage)}</td>
                        <td className="text-right">
                          <WastageCell pct={r.pct} threshold={threshold} />
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </GridScroll>
            <GridPager grid={productGrid} />
          </Panel>
        </TabsContent>

        <TabsContent value="consumption">
          <Panel
            title="Material Consumption"
            description="Consumption ledger rows where a production voucher consumed material."
            actions={
              <ExportBar
                filename="material-consumption"
                rows={consumptionGrid.matched.map((r: any) => ({
                  Material: r.material,
                  "Standard Consumption (kg)": r.standard,
                  "Wastage (kg)": r.wastage,
                  "Total Consumed (kg)": r.total,
                  "Wastage %": Number(r.pct).toFixed(2),
                }))}
              />
            }
          >
            <ScopeNote>
              {scope} {scopeTail(consumptionGrid.matched.length, consumption.length, "materials")}{" "}
              Consumed total is the quantity out of the godown on consumption rows.
            </ScopeNote>
            <GridScroll sticky>
              <table className="erp-table min-w-[42rem]">
                <caption className="sr-only">
                  Material consumption with standard consumption, wastage and total quantity out
                </caption>
                <thead>
                  <tr>
                    <SortHeader grid={consumptionGrid} sortKey="material">
                      Material
                    </SortHeader>
                    <SortHeader grid={consumptionGrid} sortKey="standard" align="right">
                      Std. cons. (kg)
                    </SortHeader>
                    <SortHeader grid={consumptionGrid} sortKey="wastage" align="right">
                      Wastage (kg)
                    </SortHeader>
                    <SortHeader grid={consumptionGrid} sortKey="total" align="right">
                      Consumed (kg)
                    </SortHeader>
                    <SortHeader grid={consumptionGrid} sortKey="pct" align="right">
                      Wastage %
                    </SortHeader>
                  </tr>
                </thead>
                <tbody>
                  {consumptionStatus !== "ready" ? (
                    <RegisterState
                      status={consumptionStatus}
                      cols={5}
                      onRetry={() => void rmLedgerQuery.refetch()}
                    />
                  ) : consumptionGrid.matched.length === 0 ? (
                    <RegisterState
                      status="ready"
                      cols={5}
                      emptyTitle={
                        filtersActive
                          ? "No consumption matches these filters."
                          : "No consumption recorded yet."
                      }
                      emptyBody="Consumption is recorded when a production inward voucher is posted. Nothing consumed in this period matches."
                      action={
                        filtersActive ? (
                          <Button size="sm" variant="outline" onClick={clearFilters}>
                            Clear filters
                          </Button>
                        ) : undefined
                      }
                    />
                  ) : (
                    consumptionGrid.pageRows.map((r: any) => (
                      <tr key={r.material}>
                        <th scope="row" className="text-left font-medium">
                          {r.material}
                        </th>
                        <td className="num text-right">{KG(r.standard)}</td>
                        <td className="num text-right">{KG(r.wastage)}</td>
                        <td className="num text-right font-semibold">{KG(r.total)}</td>
                        <td className="text-right">
                          <WastageCell pct={r.pct} threshold={threshold} />
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </GridScroll>
            <GridPager grid={consumptionGrid} />
          </Panel>
        </TabsContent>
      </Tabs>
    </div>
  );
}

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
import { PCS, dmy } from "@/lib/erp";

export const Route = createFileRoute("/_authenticated/inventory/fg-ledger")({
  validateSearch: (search: Record<string, unknown>): { product?: string } =>
    typeof search["product"] === "string" ? { product: search["product"] } : {},
  head: () => ({
    meta: [
      { title: "Finished goods ledger | JobberFlow" },
      {
        name: "description",
        content: "Every finished product movement, with a running balance per product.",
      },
    ],
  }),
  component: FgLedger,
});

function FgLedger() {
  const initial = Route.useSearch();
  const [product, setProduct] = useState(initial.product ?? "");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const { data: products } = useRows("finished_products", ["finished_products", "all"], (b) =>
    b.order("code"),
  );
  const { data: jobbers } = useRows("jobbers", ["jobbers", "all"], (b) => b.order("code"));
  const query = useRows("finished_goods_ledger", ["fg_ledger"], (b) =>
    b
      .order("transaction_date", { ascending: true })
      .order("created_at", { ascending: true })
      .limit(5000),
  );
  const status = queryStatus(query);

  const productById = useMemo(
    () => new Map((products ?? []).map((p: any) => [p.id, p])),
    [products],
  );
  const jobberById = useMemo(() => new Map((jobbers ?? []).map((j: any) => [j.id, j])), [jobbers]);

  // Running balance per product, accumulated before the date range is applied.
  const scoped = useMemo(() => {
    let running = 0;
    return (query.data ?? [])
      .filter((r: any) => !product || r.product_id === product)
      .map((r: any) => {
        running += Number(r.quantity_in ?? 0) - Number(r.quantity_out ?? 0);
        return { ...r, running };
      });
  }, [query.data, product]);
  const inRange = scoped.filter(
    (r: any) => (!from || r.transaction_date >= from) && (!to || r.transaction_date <= to),
  );
  const newestFirst = useMemo(() => [...inRange].reverse(), [inRange]);
  const showBalance = !!product;

  const pName = (id: string) => {
    const p: any = productById.get(id);
    return p ? `${p.code}, ${p.name}` : NIL;
  };
  const jName = (id: string | null) => (id ? ((jobberById.get(id) as any)?.name ?? NIL) : NIL);

  const grid = useGrid(newestFirst, {
    search: (r: any) =>
      [
        r.voucher_number,
        r.transaction_type,
        pName(r.product_id),
        jName(r.jobber_id),
        r.remarks,
      ].join(" "),
    filtersActive: !!(product || from || to),
    pageSize: 50,
  });
  const cols = showBalance ? 8 : 7;

  return (
    <div>
      <PageHeader
        title="Finished goods ledger"
        subtitle="Every finished product receipt, adjustment and reversal in date order. Choose one product to see its running balance."
        actions={
          <ExportBar
            filename="finished-goods-ledger"
            rows={[...grid.matched].reverse().map((r: any) => ({
              Date: dmy(r.transaction_date),
              Voucher: r.voucher_number,
              Type: humanize(r.transaction_type),
              Product: pName(r.product_id),
              Jobber: r.jobber_id ? jName(r.jobber_id) : "",
              In: r.quantity_in,
              Out: r.quantity_out,
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
          placeholder="Voucher, type, product or jobber"
          noun={["movement", "movements"]}
          onReset={() => {
            setProduct("");
            setFrom("");
            setTo("");
          }}
        >
          <FilterSelect
            label="Product"
            value={product}
            onChange={(value) => {
              setProduct(value);
              grid.resetPage();
            }}
            options={[
              { value: "", label: "All products" },
              ...(products ?? []).map((p: any) => ({ value: p.id, label: `${p.code}, ${p.name}` })),
            ]}
          />
          <DateFilter label="From" value={from} onChange={setFrom} max={to || undefined} />
          <DateFilter label="To" value={to} onChange={setTo} min={from || undefined} />
        </GridToolbar>
        <ScopeLine parts={[product ? pName(product) : "All products"]} from={from} to={to} />
        <GridScroll sticky>
          <table className="erp-table min-w-[52rem]">
            <caption className="sr-only">Finished goods movements, newest first</caption>
            <thead>
              <tr>
                <th scope="col">Date</th>
                <th scope="col">Voucher</th>
                <th scope="col">Type</th>
                <th scope="col">Product</th>
                <th scope="col">Jobber</th>
                <th scope="col" className="text-right!">
                  In (pcs)
                </th>
                <th scope="col" className="text-right!">
                  Out (pcs)
                </th>
                {showBalance && (
                  <th scope="col" className="text-right!">
                    Balance (pcs)
                  </th>
                )}
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
                      ? "Widen the date range or clear the product filter."
                      : "Posting a product inward records finished goods here."
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
                    <td className="max-w-56 truncate">{pName(r.product_id)}</td>
                    <td className="max-w-40 truncate">{jName(r.jobber_id)}</td>
                    <td className="num text-right">
                      {Number(r.quantity_in) ? PCS(r.quantity_in) : NIL}
                    </td>
                    <td className="num text-right">
                      {Number(r.quantity_out) ? PCS(r.quantity_out) : NIL}
                    </td>
                    {showBalance && (
                      <td className="num text-right font-semibold">{PCS(r.running)}</td>
                    )}
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

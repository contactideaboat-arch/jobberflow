/* eslint-disable @typescript-eslint/no-explicit-any */
import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/components/erp/AppShell";
import { ExportBar, Panel, RegisterState, queryStatus } from "@/components/erp/bits";
import {
  FilterSelect,
  GridPager,
  GridScroll,
  GridToolbar,
  SortHeader,
  useGrid,
} from "@/components/erp/grid";
import { useRows } from "@/hooks/use-erp";
import { PCS } from "@/lib/erp";

export const Route = createFileRoute("/_authenticated/inventory/finished-goods")({
  head: () => ({
    meta: [
      { title: "Finished goods stock | JobberFlow" },
      {
        name: "description",
        content: "Finished product balances received from jobbers after production.",
      },
    ],
  }),
  component: FinishedGoodsStock,
});

const STATES = [
  { value: "", label: "All products" },
  { value: "stock", label: "In stock" },
  { value: "none", label: "Nil balance" },
];

function FinishedGoodsStock() {
  const [state, setState] = useState("");
  const query = useRows("finished_goods_stock", ["finished_goods_stock"]);
  const status = queryStatus(query);

  const grid = useGrid((query.data ?? []) as any[], {
    search: (r) => [r.code, r.name].join(" "),
    filter: (r) =>
      !state ||
      (state === "stock" && Number(r.balance ?? 0) > 0) ||
      (state === "none" && Number(r.balance ?? 0) <= 0),
    filtersActive: !!state,
    sorters: {
      product: (r) => r.code,
      in: (r) => Number(r.total_in ?? 0),
      out: (r) => Number(r.total_out ?? 0),
      balance: (r) => Number(r.balance ?? 0),
    },
    initialSort: { key: "product", direction: "asc" },
  });
  const total = grid.matched.reduce((s: number, r: any) => s + Number(r.balance ?? 0), 0);

  return (
    <div>
      <PageHeader
        title="Finished goods stock"
        subtitle="Finished products received into the company after job work production."
        actions={
          <ExportBar
            filename="finished-goods-stock"
            rows={grid.matched.map((r: any) => ({
              Code: r.code,
              Product: r.name,
              "Total in": r.total_in,
              "Total out": r.total_out,
              Balance: r.balance,
              UOM: r.uom,
            }))}
          />
        }
      />
      <Panel>
        <GridToolbar
          grid={grid}
          searchLabel="Search products"
          placeholder="Product code or name"
          noun={["product", "products"]}
          onReset={() => setState("")}
        >
          <FilterSelect
            label="Stock"
            value={state}
            onChange={(value) => {
              setState(value);
              grid.resetPage();
            }}
            options={STATES}
          />
        </GridToolbar>
        <GridScroll sticky>
          <table className="erp-table min-w-[40rem]">
            <caption className="sr-only">Finished goods balances by product</caption>
            <thead>
              <tr>
                <SortHeader grid={grid} sortKey="product">
                  Product
                </SortHeader>
                <th scope="col">UOM</th>
                <SortHeader grid={grid} sortKey="in" align="right">
                  Total in
                </SortHeader>
                <SortHeader grid={grid} sortKey="out" align="right">
                  Total out
                </SortHeader>
                <SortHeader grid={grid} sortKey="balance" align="right">
                  Balance
                </SortHeader>
                <th scope="col">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {status !== "ready" ? (
                <RegisterState status={status} cols={6} onRetry={() => void query.refetch()} />
              ) : grid.matched.length === 0 ? (
                <RegisterState
                  status="ready"
                  cols={6}
                  emptyTitle={
                    grid.isFiltered ? "No product matches these filters." : "No finished goods yet."
                  }
                  emptyBody={
                    grid.isFiltered
                      ? "Clear the filters to see every product."
                      : "Finished goods appear here once a product inward voucher is posted."
                  }
                />
              ) : (
                grid.pageRows.map((r: any) => (
                  <tr key={r.product_id}>
                    <th scope="row" className="text-left font-normal">
                      <span className="block font-medium">{r.name}</span>
                      <span className="num block text-xs text-muted-foreground">{r.code}</span>
                    </th>
                    <td className="text-muted-foreground">{r.uom}</td>
                    <td className="num text-right">{PCS(r.total_in)}</td>
                    <td className="num text-right">{PCS(r.total_out)}</td>
                    <td className="num text-right font-semibold">{PCS(r.balance)}</td>
                    <td className="text-right">
                      <Link
                        to="/inventory/fg-ledger"
                        search={{ product: r.product_id }}
                        className="text-xs font-medium text-primary hover:underline"
                        aria-label={`Movements of ${r.name}`}
                      >
                        Movements
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {status === "ready" && grid.matched.length > 0 && (
              <tfoot>
                <tr>
                  <td colSpan={4}>
                    Total, {grid.isFiltered ? "matching products" : "all products"}
                  </td>
                  <td className="num text-right">{PCS(total)}</td>
                  <td />
                </tr>
              </tfoot>
            )}
          </table>
        </GridScroll>
        <GridPager grid={grid} />
      </Panel>
    </div>
  );
}

/* eslint-disable @typescript-eslint/no-explicit-any */
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/components/erp/AppShell";
import { IconAlert } from "@/components/icons";
import {
  EmptyState,
  ExportBar,
  Field,
  KpiCards,
  Panel,
  RegisterState,
  SearchSelect,
  queryStatus,
} from "@/components/erp/bits";
import { Input } from "@/components/ui/input";
import { useRows } from "@/hooks/use-erp";
import { KG, PCS, PCT, dmy } from "@/lib/erp";

export const Route = createFileRoute("/_authenticated/reconciliation")({
  head: () => ({
    meta: [
      { title: "Jobber Reconciliation. JobberFlow." },
      {
        name: "description",
        content:
          "Reconcile material issued, consumed, wasted and returned for each jobber with a printable statement.",
      },
      { property: "og:title", content: "Jobber Reconciliation, JobWork ERP" },
      {
        property: "og:description",
        content: "Printable jobber-wise material accountability statement.",
      },
    ],
  }),
  validateSearch: (search: Record<string, unknown>): { jobber?: string } =>
    typeof search["jobber"] === "string" ? { jobber: search["jobber"] } : {},
  component: Reconciliation,
});

function Reconciliation() {
  const initial = Route.useSearch();
  const [jobber, setJobber] = useState(initial.jobber ?? "");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const { data: jobbers } = useRows("jobbers", ["jobbers", "all"], (b) => b.order("code"));
  const { data: products } = useRows("finished_products", ["finished_products", "all"], (b) =>
    b.order("code"),
  );
  const { data: settings } = useRows("company_settings", ["company_settings"]);
  const stockQuery = useRows("jobber_stock", ["jobber_stock"]);
  const stock = stockQuery.data;
  const headsQuery = useRows("product_inward_headers", ["pi_headers"], (b) =>
    b.order("voucher_date", { ascending: false }).limit(2000),
  );
  const heads = headsQuery.data;

  const company = (settings ?? [])[0];
  const jRow = (jobbers ?? []).find((j: any) => j.id === jobber);
  const inRange = (d: string) => (from ? d >= from : true) && (to ? d <= to : true);

  /*
   * Loading and failure are tracked separately from "there is nothing here".
   * Before this, both rendered as zero figures and an empty table, so a first
   * paint told the operator a jobber had never been issued material and a
   * failed or RLS-denied query said the same thing permanently. On the screen
   * a settlement is argued from, that is the most damaging thing the
   * application can state. See RegisterState in bits.tsx.
   */
  const stockStatus = queryStatus(stockQuery);
  const headsStatus = queryStatus(headsQuery);
  const stockReady = stockStatus === "ready";
  const headsReady = headsStatus === "ready";

  const lines = (stock ?? []).filter((r: any) => stockReady && r.jobber_id === jobber);
  const production = (heads ?? []).filter(
    (h: any) =>
      headsReady && h.status === "POSTED" && h.jobber_id === jobber && inRange(h.voucher_date),
  );

  const totals = lines.reduce(
    (t: any, r: any) => ({
      received: t.received + Number(r.received ?? 0),
      consumed: t.consumed + Number(r.standard_consumed ?? 0),
      wastage: t.wastage + Number(r.wastage ?? 0),
      returned: t.returned + Number(r.returned ?? 0),
      balance: t.balance + Number(r.balance ?? 0),
    }),
    { received: 0, consumed: 0, wastage: 0, returned: 0, balance: 0 },
  );
  const wastagePct = totals.consumed > 0 ? (totals.wastage / totals.consumed) * 100 : 0;
  const producedPcs = production.reduce(
    (s: number, h: any) => s + Number(h.finished_quantity ?? 0),
    0,
  );
  const pName = (id: string) => {
    const p = (products ?? []).find((x: any) => x.id === id);
    return p ? `${p.code}, ${p.name}` : "-";
  };

  return (
    <div>
      <PageHeader
        title="Jobber reconciliation"
        breadcrumb={["Reports", "Jobber Reconciliation"]}
        subtitle="Material accountability statement: what was issued to the jobber, what production consumed, what was wasted and what is still lying with them."
        actions={
          jobber ? (
            <ExportBar
              filename={`reconciliation-${jRow?.code ?? "jobber"}`}
              printId="recon-print"
              title={`Jobber Reconciliation, ${jRow?.name ?? ""}`}
              rows={lines.map((r: any) => ({
                Material: `${r.material_code}, ${r.material_name}`,
                Received: r.received,
                "Standard Consumed": r.standard_consumed,
                Wastage: r.wastage,
                Returned: r.returned,
                Adjustment: r.adjustment,
                Balance: r.balance,
              }))}
            />
          ) : undefined
        }
      />

      <Panel className="mb-4">
        <div className="grid gap-3 p-3 sm:grid-cols-3">
          <Field label="Jobber">
            <SearchSelect
              options={(jobbers ?? []).map((j: any) => ({
                value: j.id,
                label: `${j.code}, ${j.name}`,
              }))}
              value={jobber}
              onChange={setJobber}
              placeholder="Select jobber…"
            />
          </Field>
          <Field label="Production from">
            <Input
              type="date"
              className="h-9"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
            />
          </Field>
          <Field label="Production to">
            <Input type="date" className="h-9" value={to} onChange={(e) => setTo(e.target.value)} />
          </Field>
        </div>
      </Panel>

      {!jobber && (
        <Panel>
          <div className="p-10 text-center text-sm text-muted-foreground">
            Select a jobber to generate the reconciliation statement.
          </div>
        </Panel>
      )}

      {jobber && (
        <>
          <KpiCards
            className="mb-4"
            label={`Material accountability for ${jRow?.name ?? "this jobber"}`}
            items={[
              {
                label: "Sent to jobber",
                value: stockReady ? KG(totals.received) : "…",
                unit: "kg",
              },
              {
                label: "Used for production",
                value: stockReady ? KG(totals.consumed) : "…",
                unit: "kg",
              },
              {
                label: "Wastage",
                value: stockReady ? KG(totals.wastage) : "…",
                unit: "kg",
                hint: stockReady ? `${PCT(wastagePct)} of what was used` : "Not loaded",
              },
              {
                label: "Taken back",
                value: stockReady ? KG(totals.returned) : "…",
                unit: "kg",
              },
              {
                label: "Still with jobber",
                value: stockReady ? KG(totals.balance) : "…",
                unit: "kg",
                // Deliberately not "loss". Material sitting on a jobber's
                // floor is company property, correctly recorded; it is the
                // product's central proof of custody. Only a negative or
                // unexplained variance takes the loss colour.
              },
            ]}
          />

          {stockStatus === "error" && (
            <p
              role="alert"
              className="mb-4 flex items-center gap-2 rounded-lg border border-warning/60 bg-warning-soft px-4 py-3 text-sm text-warning-foreground"
            >
              <IconAlert className="size-4 shrink-0" aria-hidden="true" />
              <span>
                The material position for this jobber could not be loaded, so the figures above are
                not real.{" "}
                <button
                  type="button"
                  onClick={() => void stockQuery.refetch()}
                  className="cursor-pointer font-semibold underline underline-offset-2"
                >
                  Try again
                </button>
              </span>
            </p>
          )}

          <div id="recon-print">
            <div className="mb-3 hidden print:block">
              <h1>{company?.company_name ?? "Company"}</h1>
              <div className="muted">Jobber Reconciliation Statement</div>
            </div>

            <Panel
              title={`Material statement, ${jRow?.name ?? ""}`}
              description="All movements to date. Production dates do not filter this table."
              className="mb-4"
            >
              <div className="overflow-x-auto">
                <table className="erp-table min-w-[46rem]">
                  <caption className="sr-only">
                    Material issued to {jRow?.name ?? "this jobber"}, with quantity received,
                    standard consumption, wastage, returned quantity, adjustments and the balance
                    still with the jobber
                  </caption>
                  <thead>
                    <tr>
                      <th scope="col">Material</th>
                      <th scope="col" className="text-right">
                        Received
                      </th>
                      <th scope="col" className="text-right">
                        Std. consumed
                      </th>
                      <th scope="col" className="text-right">
                        Wastage
                      </th>
                      <th scope="col" className="text-right">
                        Returned
                      </th>
                      <th scope="col" className="text-right">
                        Adjustment
                      </th>
                      <th scope="col" className="text-right">
                        Balance
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {stockStatus !== "ready" ? (
                      <RegisterState
                        status={stockStatus}
                        cols={7}
                        onRetry={() => void stockQuery.refetch()}
                      />
                    ) : lines.length === 0 ? (
                      <EmptyState
                        cols={7}
                        title="No material issued to this jobber yet."
                        body="Transfer material to this jobber, and the statement will build from that voucher."
                      />
                    ) : (
                      lines.map((r: any) => (
                        <tr key={r.material_id}>
                          <td>
                            <div className="num text-xs text-muted-foreground">
                              {r.material_code}
                            </div>
                            {r.material_name}
                          </td>
                          <td className="num text-right">{KG(r.received)}</td>
                          <td className="num text-right">{KG(r.standard_consumed)}</td>
                          {/* Wastage is ink unless it is over the company's own threshold.
                          Amber here contradicted the dashboard, which called
                          the same figure red. */}
                          <td className="num text-right">{KG(r.wastage)}</td>
                          <td className="num text-right">{KG(r.returned)}</td>
                          <td className="num text-right">{KG(r.adjustment)}</td>
                          <td className="num text-right font-semibold">{KG(r.balance)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                  {/* A total belongs in tfoot, where erp-table's total styling
                      applies. In tbody it rendered as an ordinary data row. */}
                  {lines.length > 0 && (
                    <tfoot>
                      <tr>
                        <th scope="row">Total</th>
                        <td className="num text-right">{KG(totals.received)}</td>
                        <td className="num text-right">{KG(totals.consumed)}</td>
                        <td className="num text-right">{KG(totals.wastage)}</td>
                        <td className="num text-right">{KG(totals.returned)}</td>
                        <td className="num text-right">·</td>
                        <td className="num text-right">{KG(totals.balance)}</td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            </Panel>

            <Panel
              title={`Production received, ${PCS(producedPcs)} pcs`}
              description={
                from || to
                  ? `Posted between ${from ? dmy(from) : "the start"} and ${to ? dmy(to) : "today"}.`
                  : "All posted production."
              }
            >
              <div className="overflow-x-auto">
                <table className="erp-table min-w-[52rem]">
                  <caption className="sr-only">
                    Production inward vouchers posted by {jRow?.name ?? "this jobber"}, with
                    finished quantity, standard and wastage
                  </caption>
                  <thead>
                    <tr>
                      <th scope="col">Voucher</th>
                      <th scope="col">Date</th>
                      <th scope="col">Product</th>
                      <th scope="col" className="text-right">
                        Finished qty
                      </th>
                      <th scope="col" className="text-right">
                        Std. consumption
                      </th>
                      <th scope="col" className="text-right">
                        Wastage kg
                      </th>
                      <th scope="col" className="text-right">
                        Wastage %
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {headsStatus !== "ready" ? (
                      <RegisterState
                        status={headsStatus}
                        cols={7}
                        onRetry={() => void headsQuery.refetch()}
                      />
                    ) : production.length === 0 ? (
                      <EmptyState
                        cols={7}
                        title="No production posted in this period."
                        body="Widen the production dates to see what this jobber has returned."
                      />
                    ) : (
                      production.map((h: any) => (
                        <tr key={h.id}>
                          <td className="num whitespace-nowrap font-medium">{h.voucher_number}</td>
                          <td className="num whitespace-nowrap">{dmy(h.voucher_date)}</td>
                          <td>{pName(h.product_id)}</td>
                          <td className="num text-right">{PCS(h.finished_quantity)}</td>
                          <td className="num text-right">{KG(h.total_standard_consumption)}</td>
                          <td className="num text-right">{KG(h.overall_wastage_kg)}</td>
                          <td className="num text-right">{PCT(h.wastage_percentage)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </Panel>

            <div className="sig hidden print:flex">
              <div>Prepared By</div>
              <div>Jobber Acknowledgement</div>
              <div>Authorised Signatory</div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

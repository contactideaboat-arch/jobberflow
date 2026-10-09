import { createFileRoute } from "@tanstack/react-router";
import { StockOverview } from "@/components/erp/stock/StockOverview";

export const Route = createFileRoute("/_authenticated/inventory/warehouse")({
  head: () => ({
    meta: [
      { title: "Raw Material Stock. JobberFlow." },
      {
        name: "description",
        content:
          "Combined warehouse and jobber-held raw material balances in one operational stock view.",
      },
      { property: "og:title", content: "Raw Material Stock, JobberFlow" },
      { property: "og:description", content: "Warehouse and jobber stock positions in one view." },
    ],
  }),
  component: () => <StockOverview initialView="all" />,
});

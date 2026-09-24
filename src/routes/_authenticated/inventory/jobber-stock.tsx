import { createFileRoute } from "@tanstack/react-router";
import { StockOverview } from "@/components/erp/stock/StockOverview";

export const Route = createFileRoute("/_authenticated/inventory/jobber-stock")({
  head: () => ({
    meta: [
      { title: "Jobber-held Material — JobberFlow" },
      {
        name: "description",
        content:
          "Company-owned raw material lying with jobbers, shown within the combined stock view.",
      },
      { property: "og:title", content: "Jobber-held Material — JobberFlow" },
      {
        property: "og:description",
        content: "Jobber material balances within the combined stock view.",
      },
    ],
  }),
  component: () => <StockOverview initialView="jobbers" />,
});

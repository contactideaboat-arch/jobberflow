import { createFileRoute } from "@tanstack/react-router";
import { ItemVoucher } from "@/components/erp/ItemVoucher";

export const Route = createFileRoute("/_authenticated/transactions/jobber-transfer")({
  head: () => ({
    meta: [
      { title: "Jobber to jobber transfer | JobberFlow" },
      {
        name: "description",
        content: "Move company-owned material from one jobber to another. Stock leaves one jobber and is received by the other.",
      },
      { property: "og:title", content: "Jobber to jobber transfer | JobberFlow" },
      {
        property: "og:description",
        content: "Jobber to jobber raw material transfer vouchers.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => (
    <ItemVoucher
      config={{
        kind: "TRANSFER",
        title: "Jobber to jobber transfer",
        breadcrumb: ["Transactions", "Jobber Transfer"],
        subtitle:
          "A transfer is a location change only; the material remains company stock and is tracked against the jobber until consumed.",
        prefix: "JJT",
        headerTable: "jobber_transfer_headers",
        itemTable: "jobber_transfer_items",
        postRpc: "post_jobber_transfer",
        needsJobber: true,
        sourceJobber: true,
        stockScope: "JOBBER",
        extraFields: [
          { key: "challan_number", label: "Challan No." },
          { key: "vehicle_number", label: "Vehicle No." },
          { key: "reference", label: "Reference" },
        ],
      }}
    />
  ),
});


import { createFileRoute } from "@tanstack/react-router";
import { ItemVoucher } from "@/components/erp/ItemVoucher";

export const Route = createFileRoute("/_authenticated/transactions/transfer")({
  head: () => ({
    meta: [
      { title: "Transfer to jobber | JobberFlow" },
      {
        name: "description",
        content:
          "Issue company-owned raw material to jobbers. Stock moves location, ownership stays with the company.",
      },
      { property: "og:title", content: "Transfer to jobber | JobberFlow" },
      {
        property: "og:description",
        content: "Warehouse to jobber raw material transfer vouchers.",
      },
    ],
  }),
  component: () => (
    <ItemVoucher
      config={{
        kind: "JOBBER_TRANSFER",
        title: "Transfer to jobber",
        breadcrumb: ["Transactions", "Material Transfer"],
        subtitle:
          "A transfer is a location change only, the material remains company stock and is tracked against the jobber until consumed.",
        prefix: "JTR",
        headerTable: "jobber_transfer_headers",
        itemTable: "jobber_transfer_items",
        postRpc: "post_jobber_transfer",
        needsJobber: true,
        stockScope: "WAREHOUSE",
        extraFields: [
          { key: "challan_number", label: "Challan No." },
          { key: "vehicle_number", label: "Vehicle No." },
          { key: "reference", label: "Reference" },
        ],
      }}
    />
  ),
});

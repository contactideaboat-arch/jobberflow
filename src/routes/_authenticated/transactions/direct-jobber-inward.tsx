import { createFileRoute } from "@tanstack/react-router";
import { ItemVoucher } from "@/components/erp/ItemVoucher";

export const Route = createFileRoute("/_authenticated/transactions/direct-jobber-inward")({
  head: () => ({
    meta: [
      { title: "Direct inward to jobber | JobberFlow" },
      {
        name: "description",
        content: "Receive raw material from a supplier straight into a jobber's stock, bypassing the warehouse.",
      },
      { property: "og:title", content: "Direct inward to jobber | JobberFlow" },
      {
        property: "og:description",
        content: "Supplier to jobber raw material inward vouchers.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => (
    <ItemVoucher
      config={{
        kind: "DIRECT_JOBBER_INWARD",
        title: "Direct inward to jobber",
        breadcrumb: ["Transactions", "Direct Jobber Inward"],
        subtitle: "Material arrives from the supplier straight at the jobber, never entering your godown.",
        prefix: "DJI",
        headerTable: "raw_material_inward_headers",
        itemTable: "raw_material_inward_items",
        postRpc: "post_raw_material_inward",
        needsJobber: true,
        stockScope: "NONE",
        extraFields: [
          {
            key: "transaction_type",
            label: "Type",
            type: "select",
            options: ["PURCHASE", "OPENING"],
          },
          { key: "supplier", label: "Supplier" },
          { key: "invoice_number", label: "Invoice No." },
          { key: "challan_number", label: "Challan No." },
          { key: "reference", label: "Reference" },
        ],
      }}
    />
  ),
});


import { createFileRoute } from "@tanstack/react-router";
import { ItemVoucher } from "@/components/erp/ItemVoucher";

export const Route = createFileRoute("/_authenticated/transactions/rm-inward")({
  head: () => ({
    meta: [
      { title: "Raw Material Inward — JobWork ERP" },
      { name: "description", content: "Record opening stock and purchase inward of raw material into the warehouse." },
      { property: "og:title", content: "Raw Material Inward — JobWork ERP" },
      { property: "og:description", content: "Warehouse raw material inward vouchers with posting and cancellation." },
    ],
  }),
  component: () => (
    <ItemVoucher
      config={{
        kind: "RAW_MATERIAL_INWARD",
        title: "Raw Material Inward",
        breadcrumb: ["Transactions", "Raw Material Inward"],
        subtitle: "Opening stock and purchases increase warehouse raw material balance.",
        prefix: "RMI",
        headerTable: "raw_material_inward_headers",
        itemTable: "raw_material_inward_items",
        postRpc: "post_raw_material_inward",
        needsJobber: false,
        stockScope: "NONE",
        extraFields: [
          { key: "transaction_type", label: "Type", type: "select", options: ["PURCHASE", "OPENING"] },
          { key: "supplier", label: "Supplier" },
          { key: "invoice_number", label: "Invoice No." },
          { key: "challan_number", label: "Challan No." },
          { key: "reference", label: "Reference" },
        ],
      }}
    />
  ),
});

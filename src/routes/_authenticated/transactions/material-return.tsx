import { createFileRoute } from "@tanstack/react-router";
import { ItemVoucher } from "@/components/erp/ItemVoucher";

export const Route = createFileRoute("/_authenticated/transactions/material-return")({
  head: () => ({
    meta: [
      { title: "Material Return from Jobber — JobWork ERP" },
      { name: "description", content: "Return unused raw material from a jobber back into the warehouse." },
      { property: "og:title", content: "Material Return from Jobber — JobWork ERP" },
      { property: "og:description", content: "Jobber to warehouse raw material return vouchers." },
    ],
  }),
  component: () => (
    <ItemVoucher
      config={{
        kind: "MATERIAL_RETURN",
        title: "Material Return from Jobber",
        breadcrumb: ["Transactions", "Material Return"],
        subtitle: "Unused material comes back to the warehouse and reduces the jobber's stock balance.",
        prefix: "MRT",
        headerTable: "material_return_headers",
        itemTable: "material_return_items",
        postRpc: "post_material_return",
        needsJobber: true,
        stockScope: "JOBBER",
        extraFields: [{ key: "reference", label: "Reference" }],
      }}
    />
  ),
});

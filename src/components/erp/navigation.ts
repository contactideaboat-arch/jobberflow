import {
  ArrowLeftRight,
  Boxes,
  Factory,
  FileBarChart2,
  LayoutDashboard,
  Settings2,
} from "lucide-react";

export type NavItem = { to: string; label: string };
export type NavGroup = { label: string; icon: typeof Boxes; items: NavItem[] };

export const NAV: NavGroup[] = [
  { label: "Overview", icon: LayoutDashboard, items: [{ to: "/dashboard", label: "Dashboard" }] },
  {
    label: "Masters",
    icon: Factory,
    items: [
      { to: "/masters/jobbers", label: "Jobber master" },
      { to: "/masters/materials", label: "Raw material master" },
      { to: "/masters/products", label: "Finished product master" },
      { to: "/masters/bom", label: "BOM master" },
    ],
  },
  {
    label: "Inventory",
    icon: Boxes,
    items: [
      { to: "/inventory/warehouse", label: "Raw material stock" },
      { to: "/inventory/finished-goods", label: "Finished goods" },
      { to: "/inventory/rm-ledger", label: "Raw material ledger" },
      { to: "/inventory/fg-ledger", label: "Finished goods ledger" },
    ],
  },
  {
    label: "Transactions",
    icon: ArrowLeftRight,
    items: [
      { to: "/transactions/rm-inward", label: "Raw material inward" },
      { to: "/transactions/transfer", label: "Transfer to jobber" },
      { to: "/transactions/product-inward", label: "Product inward" },
      { to: "/transactions/material-return", label: "Material return" },
      { to: "/transactions/adjustment", label: "Stock adjustment" },
    ],
  },
  {
    label: "Reports",
    icon: FileBarChart2,
    items: [
      { to: "/reports", label: "Reports centre" },
      { to: "/reconciliation", label: "Jobber reconciliation" },
    ],
  },
  {
    label: "Administration",
    icon: Settings2,
    items: [{ to: "/admin", label: "Users & settings" }],
  },
];

export function isActivePath(path: string, target: string) {
  if (target === "/inventory/warehouse" && path === "/inventory/jobber-stock") return true;
  return path === target || path.startsWith(`${target}/`);
}

export function findNavigation(path: string) {
  for (const group of NAV) {
    const item = group.items.find((candidate) => isActivePath(path, candidate.to));
    if (item) return { group, item };
  }
  return undefined;
}

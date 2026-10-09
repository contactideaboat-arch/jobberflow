import {
  IconBalance,
  IconBoxes,
  IconClipboardCheck,
  IconControls,
  IconCrate,
  IconExchange,
  IconFactory,
  IconGauge,
  IconHistory,
  IconLayers,
  IconLedger,
  IconPackage,
  IconPackageCheck,
  IconRefresh,
  IconReport,
  IconUsers,
  IconWarehouse,
  IconWeight,
  type IconComponent,
} from "@/components/icons";

export type NavItem = {
  to: string;
  label: string;
  icon: IconComponent;
  /**
   * Set on the daily-flow vouchers only. Drives the dashboard production path so
   * the flow panel and the sidebar read one list instead of repeating the
   * routes, which is how they drift apart.
   */
  flow?: {
    title: string;
    /** Compact label for the in-page workflow rail. */
    short: string;
    description: string;
    /** True for the sequential production path; false for same-day corrections. */
    stage: boolean;
  };
};

export type NavGroup = {
  id: "overview" | "flow" | "stock" | "analysis" | "masters" | "admin";
  label: string;
  icon: IconComponent;
  items: NavItem[];
};

/*
 * Ordered by how the day actually runs: look at the position, post the
 * vouchers, check stock, analyse, and only then touch master data. The
 * "flow" group is drawn as a connected path in the sidebar because its
 * order is the production sequence itself.
 */
export const NAV: NavGroup[] = [
  {
    id: "overview",
    label: "Overview",
    icon: IconGauge,
    items: [{ to: "/dashboard", label: "Dashboard", icon: IconGauge }],
  },
  {
    id: "flow",
    label: "Daily flow",
    icon: IconExchange,
    items: [
      {
        to: "/transactions/rm-inward",
        label: "Raw material inward",
        icon: IconBoxes,
        flow: {
          title: "Receive",
          short: "Receive",
          description: "Bring material into warehouse stock",
          stage: true,
        },
      },
      {
        to: "/transactions/transfer",
        label: "Transfer to jobber",
        icon: IconFactory,
        flow: {
          title: "Issue",
          short: "Issue",
          description: "Send material to a jobber",
          stage: true,
        },
      },
      {
        to: "/transactions/product-inward",
        label: "Product inward",
        icon: IconPackageCheck,
        flow: {
          title: "Receive output",
          short: "Produce",
          description: "Post production, BOM use and wastage",
          stage: true,
        },
      },
      {
        to: "/transactions/material-return",
        label: "Material return",
        icon: IconRefresh,
        flow: {
          title: "Return",
          short: "Return",
          description: "Take unused material back into stock",
          stage: false,
        },
      },
      {
        to: "/transactions/adjustment",
        label: "Stock adjustment",
        icon: IconBalance,
        flow: {
          title: "Correct",
          short: "Adjust",
          description: "Fix a balance after a count or error",
          stage: false,
        },
      },
    ],
  },
  {
    id: "stock",
    label: "Stock",
    icon: IconWarehouse,
    items: [
      { to: "/inventory/warehouse", label: "Raw material stock", icon: IconWarehouse },
      { to: "/inventory/finished-goods", label: "Finished goods", icon: IconPackage },
      { to: "/inventory/rm-ledger", label: "Raw material ledger", icon: IconLedger },
      { to: "/inventory/fg-ledger", label: "Finished goods ledger", icon: IconHistory },
    ],
  },
  {
    id: "analysis",
    label: "Analysis",
    icon: IconReport,
    items: [
      { to: "/reports", label: "Reports centre", icon: IconReport },
      { to: "/reconciliation", label: "Jobber reconciliation", icon: IconClipboardCheck },
    ],
  },
  {
    id: "masters",
    label: "Masters",
    icon: IconLayers,
    items: [
      { to: "/masters/jobbers", label: "Jobbers", icon: IconUsers },
      { to: "/masters/materials", label: "Raw materials", icon: IconWeight },
      { to: "/masters/products", label: "Finished products", icon: IconCrate },
      { to: "/masters/bom", label: "Bills of material", icon: IconLayers },
    ],
  },
  {
    id: "admin",
    label: "Administration",
    icon: IconControls,
    items: [{ to: "/admin", label: "Users & settings", icon: IconControls }],
  },
];

/** Vouchers a writer can start from the sidebar's "New voucher" menu. */
export const QUICK_ACTIONS: NavItem[] = NAV.find((group) => group.id === "flow")?.items ?? [];

/** Every daily-flow voucher, in the order the day runs. */
export const DAILY_FLOW: NavItem[] = QUICK_ACTIONS;

/** The sequential production path, drawn as connected stages. */
export const FLOW_STAGES: NavItem[] = DAILY_FLOW.filter((item) => item.flow?.stage);

/**
 * Daily-flow vouchers that are not stages: they can happen at any point, so
 * they are offered alongside the path rather than as a step in it.
 */
export const FLOW_EXTRAS: NavItem[] = DAILY_FLOW.filter((item) => item.flow && !item.flow.stage);

/**
 * Where the production path ends. Not a voucher, it is the review that proves
 * the vouchers balanced, so it closes the rail rather than joining the sidebar
 * daily-flow list.
 */
export const FLOW_TERMINUS = { label: "Reconcile", to: "/reconciliation" } as const;

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

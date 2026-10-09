/**
 * JobberFlow icon set.
 *
 * Hand-authored. No icon library. Drawing rules that make the set read as one
 * family rather than a pile of clipart:
 *
 *   - 24 x 24 grid, all artwork inside the 2..22 safe area (20 unit box)
 *   - 1.5 stroke throughout, round caps, round joins
 *   - no fills except deliberate optical dots, which use fill + no stroke
 *   - corners are drawn, never hinted at; if it needs a curve to feel right
 *     at 16px, the shape is wrong
 *   - icons are named for the job they do here, not for the object they
 *     resemble
 *
 * Weight note: 1.5 is deliberately lighter than the 2px most libraries ship.
 * At the sizes this UI uses, 2px reads heavy and turns a dense screen into
 * a page of clipart.
 *
 * Sizing: pass `className="size-4"` (or any Tailwind size) to override the
 * 20px default. Icons inherit `currentColor` and are aria-hidden by default;
 * the accessible name belongs on the control, not the glyph.
 */

import type { ReactNode, SVGProps } from "react";

export type IconProps = SVGProps<SVGSVGElement> & {
  /** Pixel size for both axes. A `className` size utility still wins. */
  size?: number;
};

/** The shape every glyph in this set satisfies, for typing registries. */
export type IconComponent = (props: IconProps) => ReactNode;

function Svg({ children, size, ...props }: IconProps & { children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size ?? 20}
      height={size ?? 20}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      focusable="false"
      aria-hidden="true"
      {...props}
    >
      {children}
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* Brand                                                                */
/* ------------------------------------------------------------------ */

/**
 * The mark. A registration target (four corner brackets) with the material
 * line passing through it. Registration marks are how you verify that
 * something is where you think it is, which is the entire product in one
 * idea. The bracket motif is reused as a UI detail throughout the app.
 */
export function Logo({ size = 24, ...props }: { size?: number } & IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      focusable="false"
      aria-hidden="true"
      {...props}
    >
      <g
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="square"
        fill="none"
        vectorEffect="non-scaling-stroke"
      >
        <path d="M3 9V5.4A2.4 2.4 0 0 1 5.4 3H9" />
        <path d="M15 3h3.6A2.4 2.4 0 0 1 21 5.4V9" />
        <path d="M21 15v3.6a2.4 2.4 0 0 1-2.4 2.4H15" />
        <path d="M9 21H5.4A2.4 2.4 0 0 1 3 18.6V15" />
      </g>
      <rect x="6.5" y="11" width="11" height="2" fill="currentColor" />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* Navigation                                                           */
/* ------------------------------------------------------------------ */

/** Overview. A dial, because this screen is an instrument panel. */
export function IconGauge(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M4 17a8 8 0 1 1 16 0" />
      <path d="m12 17 3.4-4.6" />
      <circle cx="12" cy="17" r="1.15" fill="currentColor" stroke="none" />
      <path d="M4 17h1.6M18.4 17H20M12 8.4v1.6" />
    </Svg>
  );
}

/** Masters. Stacked plates, offset the way a set of dies would be. */
export function IconLayers(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M12 3 3 7.5 12 12l9-4.5L12 3Z" />
      <path d="m3 16.5 9 4.5 9-4.5" />
    </Svg>
  );
}

/** Inventory. A carton drawn in projection so it reads as stock, not a cube. */
export function IconBoxes(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="m4 8.5 8-4.2 8 4.2v7.2l-8 4.3-8-4.3V8.5Z" />
      <path d="m4 8.5 8 4.3 8-4.3" />
      <path d="M12 12.8V20" />
    </Svg>
  );
}

/** Transactions. Two opposing flows, because material moves both ways. */
export function IconExchange(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M4 8.5h13.5" />
      <path d="m17.5 8.5-3.6-3.6M17.5 8.5l-3.6 3.6" />
      <path d="M20 15.5H6.5" />
      <path d="m6.5 15.5 3.6-3.6M6.5 15.5l3.6 3.6" />
    </Svg>
  );
}

/** Reports. A ruled sheet with a trend cut into it. */
export function IconReport(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M6 3.5h8.2L19 8.2V20H6a1 1 0 0 1-1-1V4.5a1 1 0 0 1 1-1Z" />
      <path d="M14 3.5v5h5" />
      <path d="m8.5 16.5 3-3.2 2.2 2 2.8-3.4" />
    </Svg>
  );
}

/** Settings. A control surface, not a gear. */
export function IconControls(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M3 8h10.5M18.5 8H21" />
      <circle cx="16" cy="8" r="2.2" />
      <path d="M3 16h4.5M12.5 16H21" />
      <circle cx="10" cy="16" r="2.2" />
    </Svg>
  );
}

/* ------------------------------------------------------------------ */
/* Domain                                                               */
/* ------------------------------------------------------------------ */

/** A jobber's floor. */
export function IconFactory(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M3 20.5h18" />
      <path d="M4.5 20.5V13l5 2.5V13l5 2.5V13l5 3v4.5" />
      <path d="M9.5 13V4.2h2.6V13.6" />
    </Svg>
  );
}

/** The company's own store. */
export function IconWarehouse(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M3 20.5h18" />
      <path d="M4.5 20.5V9.8L12 5.2l7.5 4.6v10.7" />
      <path d="M9.6 20.5v-5.8h4.8v5.8" />
    </Svg>
  );
}

/** Material held by someone else. */
export function IconPackage(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M12 3 4 7v10l8 4 8-4V7l-8-4Z" />
      <path d="m4 7 8 4 8-4" />
      <path d="M12 11v10" />
    </Svg>
  );
}

/** Output received and verified. */
export function IconPackageCheck(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M12 3 4.5 6.8v9.9L12 20.5l7.5-3.8V6.8L12 3Z" />
      <path d="m4.5 6.8 7.5 3.9 7.5-3.9" />
      <path d="m8.9 14.6 2.1 2.1 4.1-4.1" />
    </Svg>
  );
}

/** Reconciliation. A balance, because that is the argument being settled. */
export function IconBalance(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M12 4.2v16.3M7.5 20.5h9" />
      <path d="M4.5 8h15" />
      <path d="M4.5 8 2 14h5L4.5 8Z" />
      <path d="M19.5 8 17 14h5l-2.5-6Z" />
      <circle cx="12" cy="4.2" r="0" />
    </Svg>
  );
}

/** A checklist that someone actually signs off. */
export function IconClipboardCheck(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M9.2 4.6H7.4A1.4 1.4 0 0 0 6 6v13.6a1.4 1.4 0 0 0 1.4 1.4h9.2a1.4 1.4 0 0 0 1.4-1.4V6a1.4 1.4 0 0 0-1.4-1.4h-1.8" />
      <rect x="9.2" y="2.8" width="5.6" height="3.6" rx="1.1" />
      <path d="m9.6 13.2 1.7 1.7 3.2-3.2" />
      <path d="M9.4 17.6h5.2" />
    </Svg>
  );
}

export function IconUsers(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx="9.5" cy="8" r="3.3" />
      <path d="M3.4 19.6a6.1 6.1 0 0 1 12.2 0" />
      <path d="M16.2 5.3a3.3 3.3 0 0 1 0 5.4" />
      <path d="M17.6 14.3a6.1 6.1 0 0 1 3 5.3" />
    </Svg>
  );
}

export function IconUser(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx="12" cy="8" r="3.6" />
      <path d="M5 20.4a7 7 0 0 1 14 0" />
    </Svg>
  );
}

export function IconShieldCheck(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M12 3 5 6v5.6c0 4.1 2.8 7.5 7 9.4 4.2-1.9 7-5.3 7-9.4V6l-7-3Z" />
      <path d="m9.2 12 2 2 3.6-3.6" />
    </Svg>
  );
}

/** A live signal, not a spinner. */
export function IconSignal(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M2.8 12h3.9l2.4-5.6 4.8 11.2 2.3-5.6h5" />
    </Svg>
  );
}

export function IconTrendingUp(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="m3.5 16.4 5.4-5.5 3.4 3.4 8.2-8.2" />
      <path d="M15.6 6.1h4.9V11" />
    </Svg>
  );
}

/** Weight, in kilograms. */
export function IconWeight(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M7.6 8.4h8.8l2.1 12.1H5.5L7.6 8.4Z" />
      <path d="M9.6 8.4V6a2.4 2.4 0 0 1 4.8 0v2.4" />
      <path d="M12 11.4v4.6" />
    </Svg>
  );
}

/** Countable finished units, packed. */
export function IconCrate(props: IconProps) {
  return (
    <Svg {...props}>
      <rect x="3.5" y="7.5" width="17" height="12.2" rx="1.6" />
      <path d="M3.5 11.6h17" />
      <path d="M8.4 7.5v4.1M15.6 7.5v4.1" />
    </Svg>
  );
}

export function IconPercent(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="m6.2 17.8 11.6-11.6" />
      <circle cx="7.8" cy="7.8" r="2.6" />
      <circle cx="16.2" cy="16.2" r="2.6" />
    </Svg>
  );
}

/** Consumed or scrapped. */
export function IconScrap(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M3.6 6.4h16.8" />
      <path d="M9.4 6.4V4.7a1.3 1.3 0 0 1 1.3-1.3h2.6a1.3 1.3 0 0 1 1.3 1.3v1.7" />
      <path d="m6.4 6.4.9 12.8a1.5 1.5 0 0 0 1.5 1.4h6.4a1.5 1.5 0 0 0 1.5-1.4l.9-12.8" />
      <path d="M10.4 10.2v6.4M13.6 10.2v6.4" />
    </Svg>
  );
}

export function IconHistory(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx="12" cy="12" r="8.4" />
      <path d="M12 6.9v5.4l3.3 2" />
    </Svg>
  );
}

/* ------------------------------------------------------------------ */
/* Documents                                                            */
/* ------------------------------------------------------------------ */

export function IconDocument(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M6 3.5h8.2L19 8.2V20a.5.5 0 0 1-.5.5h-12A.5.5 0 0 1 6 20V3.5Z" />
      <path d="M14 3.5v5h5" />
      <path d="M8.8 12.6h6.4M8.8 16.2h4.2" />
    </Svg>
  );
}

export function IconLedger(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M5 4.5h14v15H5z" />
      <path d="M9 4.5v15" />
      <path d="M12.4 8.6h3.6M12.4 12h3.6M12.4 15.4h3.6" />
    </Svg>
  );
}

export function IconPrint(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M7 9V3.8h10V9" />
      <path d="M7 18H5.4A1.4 1.4 0 0 1 4 16.6v-4.2a1.4 1.4 0 0 1 1.4-1.4h13.2A1.4 1.4 0 0 1 20 12.4v4.2a1.4 1.4 0 0 1-1.4 1.4H17" />
      <rect x="7" y="14.4" width="10" height="6.3" rx="0.6" />
    </Svg>
  );
}

export function IconTable(props: IconProps) {
  return (
    <Svg {...props}>
      <rect x="3.4" y="4.6" width="17.2" height="14.8" rx="1.6" />
      <path d="M3.4 9.4h17.2M3.4 14.6h17.2M9.6 9.4v10" />
    </Svg>
  );
}

/* ------------------------------------------------------------------ */
/* Controls                                                             */
/* ------------------------------------------------------------------ */

export function IconCheck(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="m4.8 12.6 4.6 4.6L19.4 6.4" />
    </Svg>
  );
}

export function IconClose(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="m6.4 6.4 11.2 11.2M17.6 6.4 6.4 17.6" />
    </Svg>
  );
}

export function IconPlus(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M12 5.2v13.6M5.2 12h13.6" />
    </Svg>
  );
}

export function IconMinus(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M5.2 12h13.6" />
    </Svg>
  );
}

export function IconSearch(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx="10.8" cy="10.8" r="6.4" />
      <path d="m15.6 15.6 4.4 4.4" />
    </Svg>
  );
}

export function IconFilter(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M3.8 5.4h16.4l-6.4 7.6v6.6l-3.6-2.2v-4.4L3.8 5.4Z" />
    </Svg>
  );
}

export function IconCalendar(props: IconProps) {
  return (
    <Svg {...props}>
      <rect x="3.6" y="5.4" width="16.8" height="15" rx="1.8" />
      <path d="M3.6 10h16.8M8.4 3.4v4M15.6 3.4v4" />
    </Svg>
  );
}

export function IconDownload(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M12 3.6v11" />
      <path d="m7.6 10.6 4.4 4.4 4.4-4.4" />
      <path d="M4.6 19.4h14.8" />
    </Svg>
  );
}

export function IconUpload(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M12 15.4v-11" />
      <path d="m7.6 8.4 4.4-4.4 4.4 4.4" />
      <path d="M4.6 19.4h14.8" />
    </Svg>
  );
}

export function IconFileSpreadsheet(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M6 3.5h8.2L19 8.2V20a.5.5 0 0 1-.5.5h-12A.5.5 0 0 1 6 20V3.5Z" />
      <path d="M14 3.5v5h5" />
      <path d="M8.8 12.4h6.4M8.8 15.6h6.4M11.6 12.4v3.2" />
    </Svg>
  );
}

export function IconPencil(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M4 20.2h4.2L19 9.4a2.12 2.12 0 0 0-3-3L5.2 17.2v3Z" />
      <path d="m14.6 6.4 3 3" />
    </Svg>
  );
}

export function IconEye(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M2.6 12S6.2 5.6 12 5.6 21.4 12 21.4 12 17.8 18.4 12 18.4 2.6 12 2.6 12Z" />
      <circle cx="12" cy="12" r="2.9" />
    </Svg>
  );
}

export function IconRefresh(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M20.2 12a8.2 8.2 0 1 1-2.4-5.8" />
      <path d="M20.4 3.8v4.8h-4.8" />
    </Svg>
  );
}

export function IconLock(props: IconProps) {
  return (
    <Svg {...props}>
      <rect x="4.6" y="10.4" width="14.8" height="10.2" rx="2" />
      <path d="M8.2 10.4V7.6a3.8 3.8 0 0 1 7.6 0v2.8" />
      <path d="M12 14.6v2" />
    </Svg>
  );
}

export function IconMail(props: IconProps) {
  return (
    <Svg {...props}>
      <rect x="3" y="5.6" width="18" height="12.8" rx="2" />
      <path d="m3.9 7.1 8.1 5.9 8.1-5.9" />
    </Svg>
  );
}

export function IconHash(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M9.4 3.8 7.6 20.2M16.6 3.8l-1.8 16.4" />
      <path d="M4 8.6h16M3.4 15.4h16" />
    </Svg>
  );
}

/* ------------------------------------------------------------------ */
/* Navigation glyphs                                                    */
/* ------------------------------------------------------------------ */

export function IconArrowRight(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M4 12h15.4" />
      <path d="m13.6 6.2 5.8 5.8-5.8 5.8" />
    </Svg>
  );
}

export function IconArrowUpDown(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M7 20V4M3.4 7.6 7 4l3.6 3.6" />
      <path d="M17 4v16M13.4 16.4 17 20l3.6-3.6" />
    </Svg>
  );
}

export function IconChevronDown(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="m6.2 9.4 5.8 5.8 5.8-5.8" />
    </Svg>
  );
}

export function IconChevronRight(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="m9.4 6.2 5.8 5.8-5.8 5.8" />
    </Svg>
  );
}

export function IconChevrons(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="m7.6 9.6 4.4-4.4 4.4 4.4M7.6 14.4l4.4 4.4 4.4-4.4" />
    </Svg>
  );
}

export function IconChevronLeft(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="m14.6 6.2-5.8 5.8 5.8 5.8" />
    </Svg>
  );
}

export function IconChevronUp(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="m6.2 14.6 5.8-5.8 5.8 5.8" />
    </Svg>
  );
}

export function IconArrowLeft(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M20 12H4.6" />
      <path d="M10.4 6.2 4.6 12l5.8 5.8" />
    </Svg>
  );
}

export function IconMore(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx="5.6" cy="12" r="1.35" fill="currentColor" stroke="none" />
      <circle cx="12" cy="12" r="1.35" fill="currentColor" stroke="none" />
      <circle cx="18.4" cy="12" r="1.35" fill="currentColor" stroke="none" />
    </Svg>
  );
}

/** Reorder handle. Dots, because a grip of lines implies a different motion. */
export function IconGrip(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx="9" cy="6.5" r="1.2" fill="currentColor" stroke="none" />
      <circle cx="15" cy="6.5" r="1.2" fill="currentColor" stroke="none" />
      <circle cx="9" cy="12" r="1.2" fill="currentColor" stroke="none" />
      <circle cx="15" cy="12" r="1.2" fill="currentColor" stroke="none" />
      <circle cx="9" cy="17.5" r="1.2" fill="currentColor" stroke="none" />
      <circle cx="15" cy="17.5" r="1.2" fill="currentColor" stroke="none" />
    </Svg>
  );
}

export function IconCircle(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx="12" cy="12" r="7.4" />
    </Svg>
  );
}

/** Blocked, voided, or not permitted. Distinct from a plain close. */
export function IconBan(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx="12" cy="12" r="8.2" />
      <path d="m6.2 6.2 11.6 11.6" />
    </Svg>
  );
}

export function IconCheckCircle(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx="12" cy="12" r="8.2" />
      <path d="m8.4 12.2 2.6 2.6 4.8-4.8" />
    </Svg>
  );
}

/** Look up an item by its code inside stock. */
export function IconPackageSearch(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M12 3.4 5.4 6.7v7.6L12 17.6l6.6-3.3V6.7L12 3.4Z" />
      <path d="m5.4 6.7 6.6 3.3 6.6-3.3" />
      <circle cx="17.4" cy="17.4" r="3.4" />
      <path d="m20 20 2 2" />
    </Svg>
  );
}

export function IconStar(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="m12 3.6 2.6 5.6 6 .8-4.4 4.2 1.1 6-5.3-3-5.3 3 1.1-6L3.4 10l6-.8L12 3.6Z" />
    </Svg>
  );
}

export function IconSave(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M4.6 6.4A1.8 1.8 0 0 1 6.4 4.6h9.4l3.6 3.6v9.4a1.8 1.8 0 0 1-1.8 1.8H6.4a1.8 1.8 0 0 1-1.8-1.8V6.4Z" />
      <path d="M8.2 4.6v4.8h6V4.6" />
      <path d="M8.2 19.4v-5.2h7.6v5.2" />
    </Svg>
  );
}

export function IconCopy(props: IconProps) {
  return (
    <Svg {...props}>
      <rect x="8.4" y="8.4" width="11.8" height="11.8" rx="1.8" />
      <path d="M15.6 5.4V5a1.4 1.4 0 0 0-1.4-1.4H5a1.4 1.4 0 0 0-1.4 1.4v9.2a1.4 1.4 0 0 0 1.4 1.4h.4" />
    </Svg>
  );
}

export function IconSend(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M20.4 3.6 3.6 9.8l6.6 2.8 2.8 6.6 7.4-15.6Z" />
      <path d="m10.2 12.6 4.6-4.6" />
    </Svg>
  );
}

export function IconMenu(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M3.6 6.6h16.8M3.6 12h16.8M3.6 17.4h16.8" />
    </Svg>
  );
}

export function IconPanelLeft(props: IconProps) {
  return (
    <Svg {...props}>
      <rect x="3.4" y="4.6" width="17.2" height="14.8" rx="1.8" />
      <path d="M9.8 4.6v14.8" />
    </Svg>
  );
}

/* ------------------------------------------------------------------ */
/* Status                                                               */
/* ------------------------------------------------------------------ */

export function IconAlert(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M12 4.4 21 19.6H3L12 4.4Z" />
      <path d="M12 10.2v3.8" />
      <circle cx="12" cy="16.9" r="0.95" fill="currentColor" stroke="none" />
    </Svg>
  );
}

export function IconInfo(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx="12" cy="12" r="8.4" />
      <path d="M12 11.2v5.2" />
      <circle cx="12" cy="7.9" r="0.95" fill="currentColor" stroke="none" />
    </Svg>
  );
}

/** Busy. The arc carries the animation, so it is drawn as an open ring. */
export function IconSpin(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M12 3.6a8.4 8.4 0 1 0 8.4 8.4" />
    </Svg>
  );
}

export function IconExit(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M14 3.8H7.6A1.6 1.6 0 0 0 6 5.4v13.2a1.6 1.6 0 0 0 1.6 1.6H14" />
      <path d="m16.8 8.4 3.6 3.6-3.6 3.6" />
      <path d="M20.4 12H10" />
    </Svg>
  );
}

export function IconGoogle(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M21 12.2c0-.7-.06-1.2-.2-1.8H12v3.4h5a4.3 4.3 0 0 1-1.9 2.8v2.3h3c1.8-1.6 2.9-4.1 2.9-6.7Z" />
      <path d="M12 21.2c2.6 0 4.7-.8 6.3-2.3l-3-2.3a5.6 5.6 0 0 1-8.3-2.9h-3v2.4a9.2 9.2 0 0 0 8 5.1Z" />
      <path d="M7 13.7a5.5 5.5 0 0 1 0-3.4V7.9H4a9.2 9.2 0 0 0 0 8.2l3-2.4Z" />
      <path d="M12 6.5c1.5 0 2.8.5 3.8 1.5l2.8-2.8A9.2 9.2 0 0 0 4 7.9l3 2.4A5.5 5.5 0 0 1 12 6.5Z" />
    </Svg>
  );
}

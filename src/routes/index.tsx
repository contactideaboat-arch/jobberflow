import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Logo,
  IconBalance,
  IconBoxes,
  IconClipboardCheck,
  IconExchange,
  IconFactory,
  IconPackageCheck,
  IconShieldCheck,
  IconArrowRight,
} from "@/components/icons";
import { SHOWCASE, PRODUCT_SHOTS } from "@/components/erp/ProductShot";
import { ShotFrame } from "@/components/erp/Screenshot";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      {
        title: "JobberFlow. Job work inventory and reconciliation for accountable production.",
      },
      {
        name: "description",
        content:
          "Follow every kilogram of job work material from warehouse receipt to jobber return. BOM consumption, wastage and finished goods reconciled in one system.",
      },
      { property: "og:title", content: "JobberFlow. Job work inventory and reconciliation." },
      {
        property: "og:description",
        content:
          "Track raw material stock, jobber-held inventory, BOM consumption, voucher wastage and finished goods in one accountable production system.",
      },
      { property: "og:type", content: "website" },
      { property: "og:site_name", content: "JobberFlow" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

const FLOW = [
  {
    n: "01",
    title: "Receive",
    body: "Material inward is booked against a voucher with rate, quantity and supplier reference.",
  },
  {
    n: "02",
    title: "Issue",
    body: "Transferred stock is tracked per jobber. Company material on someone else's floor stays company material.",
  },
  {
    n: "03",
    title: "Produce",
    body: "Output inward applies the BOM, consumes components and records wastage as a measured figure.",
  },
  {
    n: "04",
    title: "Reconcile",
    body: "Issued, returned, consumed and lost are set against each other. The gap is quantified, not argued.",
  },
] as const;

const PROBLEMS = [
  {
    title: "Stock that exists only on paper",
    body: "Physical balances are kept in a notebook and the software is corrected to match at month end. Nobody trusts the number, so nobody uses it.",
  },
  {
    title: "Jobber accountability without evidence",
    body: "Material was issued and production came back, but there is no reliable record linking the two. Every settlement becomes a negotiation.",
  },
  {
    title: "Wastage discovered too late",
    body: "Loss is buried in a variance that surfaces during audit, long after the batch that caused it was consumed.",
  },
] as const;

const NAV_LINKS: ReadonlyArray<readonly [string, string]> = [
  ["How it works", "#flow"],
  ["Why", "#problem"],
  ["Screens", "#product"],
  ["Legal", "#legal"],
];

const PRODUCT_LINKS: ReadonlyArray<readonly [string, string]> = [
  ["How it works", "#flow"],
  ["Screens", "#product"],
  ["Sign in", "/auth"],
];

function Wordmark() {
  return (
    <span className="font-display text-[0.95rem] font-semibold tracking-[-0.02em]">JobberFlow</span>
  );
}

function Landing() {
  return (
    <div className="min-h-dvh bg-background">
      {/* ---------------------------------------------------------- nav */}
      <header className="sticky top-0 z-40 border-b bg-background/85 backdrop-blur-md">
        {/* h-auto on narrow widths so the section links can take their own row
            without being clipped by a fixed 56px header. */}
        <div className="mx-auto flex h-auto min-h-14 max-w-6xl flex-wrap items-center gap-x-4 gap-y-2 px-5 py-2 md:h-14 md:flex-nowrap md:py-0 lg:px-8">
          <Link to="/" className="flex items-center gap-2.5">
            <Logo size={20} className="text-primary" />
            <Wordmark />
          </Link>
          {/*
            The four section links drop to a second row rather than vanishing
            below `md`. `hidden md:flex` left a phone with no way to reach the
            flow, problem or product sections from the page it landed on.
          */}
          <nav
            aria-label="Sections"
            className="order-last ml-0 flex w-full items-center gap-5 overflow-x-auto pb-1 md:order-none md:ml-4 md:w-auto md:overflow-visible md:pb-0 lg:gap-6"
          >
            {NAV_LINKS.map(([label, href]) => (
              <a
                key={href}
                href={href}
                className="link-slide shrink-0 py-1 text-[0.8125rem] text-muted-foreground transition-colors hover:text-foreground pointer-coarse:py-2"
              >
                {label}
              </a>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <Link
              to="/auth"
              className="link-slide hidden px-1 text-[0.8125rem] font-medium text-muted-foreground transition-colors hover:text-foreground sm:inline-block"
            >
              Sign in
            </Link>
            {/* 44px, matching every other call to action on this page. */}
            <Link
              to="/auth"
              className="inline-flex h-11 items-center rounded-md bg-primary px-4 text-[0.8125rem] font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Open a workspace
            </Link>
          </div>
        </div>
      </header>

      {/* --------------------------------------------------------- hero */}
      <section className="border-b">
        <div className="mx-auto max-w-6xl px-5 py-16 lg:px-8 lg:py-24">
          <div className="grid grid-cols-[minmax(0,1fr)] gap-10 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:gap-16">
            {/* min-w-0: without it this cell takes min-width:auto and the
                longest word in the headline sets the page's minimum width. */}
            <div className="min-w-0">
              <p className="rule-eyebrow">Job work ERP</p>
              <h1 className="mt-6 max-w-[19ch] text-[clamp(2.25rem,4.6vw,3.5rem)]">
                Material is only accounted for when it can be{" "}
                <span className="font-serif text-primary">proven</span>.
              </h1>
              <p className="measure mt-7 text-[1.0625rem] leading-relaxed text-muted-foreground">
                JobberFlow records every kilogram a job work unit leaves your warehouse with,
                applies the BOM when production comes back, and states the wastage as a figure you
                can put in front of an auditor.
              </p>
              <div className="mt-9 flex flex-wrap items-center gap-3">
                <Link
                  to="/auth"
                  className="inline-flex h-11 items-center gap-2 rounded-md bg-primary px-5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                >
                  Start a workspace
                  <IconArrowRight size={16} />
                </Link>
                <a
                  href="#product"
                  className="link-slide inline-flex h-11 items-center px-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                >
                  See the screens
                </a>
              </div>
              {/*
                Three columns from `xs` upward. A bare grid-cols-3 gave each
                cell a min-content floor from "tracked to 3 dp", which made the
                whole hero cell 364px inside a 335px column and pushed the page
                9px into horizontal scroll.
              */}
              <dl className="mt-12 grid max-w-md grid-cols-1 gap-6 border-t pt-6 sm:grid-cols-3">
                {[
                  ["4", "stages tracked"],
                  ["KG", "tracked to 3 dp"],
                  ["100%", "voucher traced"],
                ].map(([v, k]) => (
                  <div key={k} className="min-w-0">
                    <dt className="num font-display text-2xl font-semibold tracking-tight">{v}</dt>
                    <dd className="label-xs mt-1.5 text-muted-foreground">{k}</dd>
                  </div>
                ))}
              </dl>
            </div>

            <div className="lg:pt-10">
              <ShotFrame url="jobberflow.app/transactions/product-inward" label="Voucher">
                <PRODUCT_SHOTS.voucher />
              </ShotFrame>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------- problem */}
      <section id="problem" className="scroll-mt-16 border-b">
        <div className="mx-auto max-w-6xl px-5 py-16 lg:px-8 lg:py-20">
          <p className="rule-eyebrow text-center">The problem</p>
          <h2 className="section-title mx-auto mt-5 max-w-3xl text-center">
            Job work fails on paperwork.
          </h2>
          <p className="section-lede measure mx-auto mt-6">
            The production floor is rarely the issue. What breaks is the record that is meant to
            travel alongside the material, and the settlement that depends on it.
          </p>

          <ol className="mx-auto mt-12 max-w-4xl space-y-px">
            {PROBLEMS.map((p, i) => (
              <li key={p.title} className="border-t bg-card px-0 py-5 first:border-t-0">
                <div className="flex gap-4">
                  <span className="num label-xs mt-0.5 shrink-0 text-muted-foreground">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div>
                    <h3 className="text-[0.9375rem] font-semibold">{p.title}</h3>
                    <p className="section-body measure mt-1.5 !text-[0.8125rem]">{p.body}</p>
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ---------------------------------------------------------- flow */}
      <section id="flow" className="scroll-mt-16 border-b bg-sidebar text-sidebar-foreground">
        <div className="mx-auto max-w-6xl px-5 py-16 lg:px-8 lg:py-20">
          <p className="rule-eyebrow text-center text-sidebar-subtle">How it works</p>
          <h2 className="section-title mx-auto mt-5 max-w-3xl text-center">
            One path, four stages.
          </h2>

          <ol className="mt-12 grid gap-px bg-sidebar-border sm:grid-cols-2 lg:grid-cols-4">
            {FLOW.map((s) => (
              <li key={s.n} className="bg-sidebar p-5">
                <p className="num font-display text-3xl font-semibold text-sidebar-primary">
                  {s.n}
                </p>
                <h3 className="mt-4 text-sm font-semibold">{s.title}</h3>
                <p className="mt-2 text-[0.8125rem] leading-relaxed text-sidebar-subtle">
                  {s.body}
                </p>
              </li>
            ))}
          </ol>

          <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-sidebar-subtle">
            <span className="inline-flex items-center gap-2">
              <IconExchange size={15} /> Material inward
            </span>
            <span className="inline-flex items-center gap-2">
              <IconBoxes size={15} /> Transfer to jobber
            </span>
            <span className="inline-flex items-center gap-2">
              <IconPackageCheck size={15} /> Product inward
            </span>
            <span className="inline-flex items-center gap-2">
              <IconBalance size={15} /> Reconciliation
            </span>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------- product */}
      <section id="product" className="scroll-mt-16 border-b">
        <div className="mx-auto max-w-6xl px-5 py-16 lg:px-8 lg:py-20">
          <p className="rule-eyebrow text-center">The product</p>
          <h2 className="section-title mx-auto mt-5 max-w-3xl text-center">
            Three screens, one argument.
          </h2>
          <p className="section-lede measure mx-auto mt-6">
            JobberFlow is a dense operational tool rather than a dashboard. These are the views
            where the accounting actually happens.
          </p>

          <div className="mt-14 space-y-20">
            {SHOWCASE.map((s, i) => {
              const Screen = PRODUCT_SHOTS[s.key];
              const flipped = i % 2 === 1;
              return (
                <div key={s.key} className="grid items-start gap-8 lg:grid-cols-2 lg:gap-16">
                  <div className={cn("min-w-0", flipped && "lg:order-2")}>
                    <p className="label-xs text-muted-foreground">{s.eyebrow}</p>
                    <h3 className="mt-3 text-[clamp(1.375rem,2.2vw,1.75rem)] font-semibold leading-[1.12] tracking-[-0.025em]">
                      {s.title}
                    </h3>
                    <p className="section-body measure mt-4">{s.body}</p>
                  </div>
                  {/* min-w-0 matters: a grid item defaults to min-width:auto,
                      so without it this cell is forced to the min-content width
                      of the capture's tables and pushes the whole page wide. */}
                  <div className={cn("min-w-0", flipped && "lg:order-1")}>
                    <ShotFrame url={s.url}>
                      <Screen />
                    </ShotFrame>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* --------------------------------------------------- foundations */}
      <section className="border-b bg-subtle">
        <div className="mx-auto max-w-6xl px-5 py-16 lg:px-8 lg:py-20">
          <p className="rule-eyebrow text-center">Built in</p>
          <h2 className="section-title mx-auto mt-5 max-w-3xl text-center">
            What makes a number trusted.
          </h2>

          <div className="mx-auto mt-12 grid max-w-5xl gap-px bg-border sm:grid-cols-2">
            {[
              {
                icon: IconClipboardCheck,
                title: "Every voucher is reversible and visible",
                body: "Nothing is edited in place. Corrections are separate, dated and attributed, so the audit trail is the primary record rather than a leftover.",
              },
              {
                icon: IconFactory,
                title: "Jobbers are entities, not free text",
                body: "A jobber carries a code, company, contact and tax details. Balances attach to the entity, so history follows the person.",
              },
              {
                icon: IconShieldCheck,
                title: "Roles that mean something",
                body: "Store, management, admin and viewer are enforced on write. A read-only account cannot post a voucher regardless of what the interface shows.",
              },
              {
                icon: IconBoxes,
                title: "Quantities stored to three decimals",
                body: "Kilograms are not integers in a job work unit. The schema keeps the precision that the trade actually needs.",
              },
            ].map((f) => (
              <div key={f.title} className="bg-card p-5">
                <f.icon size={18} className="text-primary" />
                <h3 className="mt-3.5 text-[0.875rem] font-semibold leading-snug">{f.title}</h3>
                <p className="section-body mt-2 !text-[0.8125rem]">{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------ cta */}
      <section className="border-b">
        <div className="mx-auto max-w-6xl px-5 py-16 lg:px-8 lg:py-24">
          <h2 className="section-title mx-auto max-w-3xl text-center">
            Put the record on the floor.
          </h2>
          <p className="section-lede measure mx-auto mt-6">
            Create a workspace and set up your first administrator. Masters, BOM and jobber records
            take an afternoon; the reconciliation pays for itself the first time a jobber settlement
            needs evidence.
          </p>
          <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/auth"
              className="inline-flex h-11 items-center gap-2 rounded-md bg-primary px-5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Start a workspace
              <IconArrowRight size={16} />
            </Link>
            <Link
              to="/auth"
              className="link-slide inline-flex h-11 items-center px-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Sign in instead
            </Link>
          </div>
        </div>
      </section>

      {/* --------------------------------------------------------- legal */}
      <footer id="legal" className="bg-sidebar text-sidebar-foreground">
        <div className="mx-auto max-w-6xl px-5 py-12 lg:px-8">
          <div className="flex flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">
            <div className="max-w-xs">
              <div className="flex items-center gap-2.5">
                <Logo size={20} className="text-sidebar-primary" />
                <Wordmark />
              </div>
              <p className="mt-4 text-[0.8125rem] leading-relaxed text-sidebar-subtle">
                Job work inventory, production and reconciliation for units that move material
                between a company and the people who process it.
              </p>
            </div>
            {/* Labelled "Footer", not "Legal": the first column holds Product
                links, so the old label misdescribed half of its own contents. */}
            <nav className="grid gap-8 sm:grid-cols-2" aria-label="Footer">
              <div>
                <p className="label-xs text-sidebar-subtle">Product</p>
                <ul className="mt-3 space-y-2 text-[0.8125rem]">
                  {PRODUCT_LINKS.map(([label, href]) => (
                    <li key={label}>
                      {href.startsWith("/") ? (
                        <Link to={href} className="link-slide text-sidebar-foreground">
                          {label}
                        </Link>
                      ) : (
                        <a href={href} className="link-slide text-sidebar-foreground">
                          {label}
                        </a>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="label-xs text-sidebar-subtle">Legal</p>
                <ul className="mt-3 space-y-2 text-[0.8125rem]">
                  <li>
                    <Link to="/legal/terms" className="link-slide text-sidebar-foreground">
                      Terms of service
                    </Link>
                  </li>
                  <li>
                    <Link to="/legal/privacy" className="link-slide text-sidebar-foreground">
                      Privacy policy
                    </Link>
                  </li>
                </ul>
              </div>
            </nav>
          </div>
          <p className="mt-10 border-t border-sidebar-border pt-6 text-xs text-sidebar-subtle">
            JobberFlow. Built for accountable production.
          </p>
        </div>
      </footer>
    </div>
  );
}

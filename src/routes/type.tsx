import { createFileRoute, Link } from "@tanstack/react-router";
import type { CSSProperties, ReactNode } from "react";
import { IconArrowRight, Logo } from "@/components/icons";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/type")({
  head: () => ({
    meta: [{ title: "Type specimen. JobberFlow." }],
    description:
      "Side-by-side typography specimen for the JobberFlow dashboard, rendered with the real components.",
  }),
  component: TypeSpecimen,
});

const SANS = "var(--font-sans)";
const DISPLAY = "var(--font-display)";
const MONO = "var(--font-mono)";

type Tone = {
  id: string;
  label: string;
  note: string;
  /** Applied to the specimen's section heading. */
  heading: CSSProperties;
  /** Applied to the specimen's large figure. */
  figure: CSSProperties;
};

const TONES: Tone[] = [
  {
    id: "now",
    label: "Now",
    note: "Big Shoulders, uppercase, 800. Signage on every heading and every number.",
    heading: {
      fontFamily: DISPLAY,
      textTransform: "uppercase",
      fontWeight: 800,
      lineHeight: 0.92,
      letterSpacing: "0.005em",
    },
    figure: {
      fontFamily: DISPLAY,
      textTransform: "uppercase",
      fontWeight: 800,
      lineHeight: 0.92,
      letterSpacing: "0.005em",
    },
  },
  {
    id: "sentence",
    label: "A · Sentence case",
    note: "Archivo semibold, sentence case. Matches the existing h1–h3 treatment already in the app.",
    heading: {
      fontFamily: SANS,
      textTransform: "none",
      fontWeight: 600,
      lineHeight: 1.12,
      letterSpacing: "-0.022em",
    },
    figure: {
      fontFamily: SANS,
      textTransform: "none",
      fontWeight: 700,
      lineHeight: 1,
      letterSpacing: "-0.03em",
    },
  },
  {
    id: "caps-tracked",
    label: "B · Caps, wide tracking",
    note: "Keeps the signage idea, drops the condensed shouting. Archivo, uppercase, tracked out.",
    heading: {
      fontFamily: SANS,
      textTransform: "uppercase",
      fontWeight: 600,
      lineHeight: 1.15,
      letterSpacing: "0.08em",
    },
    figure: {
      fontFamily: SANS,
      textTransform: "uppercase",
      fontWeight: 700,
      lineHeight: 1,
      letterSpacing: "0.04em",
    },
  },
  {
    id: "mono-figures",
    label: "C · Caps + mono figures",
    note: "B for headings, but numbers in JetBrains Mono so columns of figures align optically.",
    heading: {
      fontFamily: SANS,
      textTransform: "uppercase",
      fontWeight: 600,
      lineHeight: 1.15,
      letterSpacing: "0.08em",
    },
    figure: {
      fontFamily: MONO,
      textTransform: "none",
      fontWeight: 600,
      lineHeight: 1,
      letterSpacing: "-0.04em",
    },
  },
];

function Frame({ tone, children }: { tone: Tone; children: ReactNode }) {
  return (
    <div className="border bg-card">
      <div className="flex items-baseline justify-between gap-3 border-b px-4 py-2.5">
        <span className="text-xs font-semibold">{tone.label}</span>
        <span className="label-xs text-muted-foreground">{tone.id}</span>
      </div>
      <div className="space-y-4 p-4" style={tone.heading}>
        {children}
      </div>
    </div>
  );
}

/** The pieces that actually appear on the dashboard, in miniature. */
function Specimen({ tone }: { tone: Tone }) {
  return (
    <Frame tone={tone}>
      <div className="flex items-end justify-between gap-4 border-b-2 border-foreground pb-2">
        <h2 className="text-2xl" style={tone.heading}>
          Material in custody
        </h2>
        <Link
          to="/transactions/product-inward"
          className="link-slide text-xs font-semibold text-primary"
        >
          Post voucher
        </Link>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="border bg-subtle px-4 py-3">
          <p className="text-xs font-medium text-muted-foreground">Wastage this month</p>
          <p className="num mt-1.5 text-[2.5rem]" style={tone.figure}>
            3<span className="text-[0.45em] opacity-60">.240</span>
            <span className="ml-1.5 text-[0.4em] opacity-60">%</span>
          </p>
        </div>
        <div
          className="board-tile relative flex min-h-32 flex-col justify-between rounded-sm p-4"
          style={{ "--tile-bg": "oklch(0.72 0.13 152 / 0.16)" } as CSSProperties}
        >
          <div className="board-lettering flex items-start justify-between gap-2">
            <span className="line-clamp-2 text-lg" style={tone.heading}>
              ABC Plastics
            </span>
            <span className="num shrink-0 text-xs font-semibold opacity-80">42%</span>
          </div>
          <div className="board-lettering">
            <p className="num text-[2rem]" style={tone.figure}>
              1,284
              <span className="ml-1 text-[0.42em] opacity-75">kg</span>
            </p>
            <span className="mt-1 block truncate text-[0.6875rem] opacity-85">
              posted 18-03-2026
              <IconArrowRight className="ml-1.5 inline size-3" aria-hidden="true" />
            </span>
          </div>
        </div>
      </div>

      <table className="erp-table">
        <caption className="sr-only">Sample stock rows under this tone</caption>
        <thead>
          <tr>
            <th scope="col">Code</th>
            <th scope="col">Material</th>
            <th scope="col" className="text-right">
              Balance
            </th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="num font-medium">RM-0142</td>
            <td>PP plastic</td>
            <td className="num text-right font-semibold">1,284.500</td>
          </tr>
          <tr>
            <td className="num font-medium">RM-0208</td>
            <td>Master batch</td>
            <td className="num text-right font-semibold">612.000</td>
          </tr>
        </tbody>
      </table>

      <p
        className="max-w-md text-sm leading-relaxed text-muted-foreground"
        style={{ fontFamily: SANS }}
      >
        Body copy stays Archivo in every variant. This is the text operators read all day, so it is
        not part of the decision.
      </p>
    </Frame>
  );
}

function TypeSpecimen() {
  return (
    <div className="min-h-dvh bg-background">
      <header className="sticky top-0 z-40 border-b bg-background/90 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-3 px-5 lg:px-8">
          <Link to="/" className="flex items-center gap-2.5">
            <Logo size={20} className="text-primary" />
            <span className="font-display text-[0.95rem] font-semibold tracking-[-0.02em]">
              JobberFlow
            </span>
          </Link>
          <span className="label-xs ml-auto text-muted-foreground">
            Type specimen · not shipped
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-5 py-12 lg:px-8 lg:py-16">
        <p className="rule-eyebrow">Decision</p>
        <h1 className="mt-4 max-w-3xl font-display text-[clamp(1.75rem,3.4vw,2.5rem)] font-semibold leading-[1.06] tracking-[-0.03em]">
          Quieten the dashboard
        </h1>
        <p className="section-lede measure mt-5">
          Big Shoulders stays on the wordmark and the marketing figures. Everything inside the app,
          meaning section headings and every large number, moves to a face that does not shout. Body
          copy is unchanged. Pick a variant below and I will apply it to the tokens and the{" "}
          <code className="text-xs">.sign</code> / <code className="text-xs">.readout</code>{" "}
          utilities.
        </p>

        <div className="mt-12 grid gap-4 lg:grid-cols-2">
          {TONES.map((tone) => (
            <Specimen key={tone.id} tone={tone} />
          ))}
        </div>

        <section className="mt-14 border-t pt-8">
          <h2 className="text-sm font-bold uppercase tracking-[0.1em] text-muted-foreground">
            Wordmark and marketing, unchanged in every variant
          </h2>
          <div className="mt-4 flex flex-wrap items-center gap-10">
            <span className={cn("sign text-2xl")}>JobberFlow</span>
            <span className="num font-display text-4xl font-semibold">01</span>
            <span className="font-serif text-4xl italic text-primary">proven</span>
            <span className="num text-sm">1,284.500</span>
          </div>
        </section>

        <p className="mt-14 border-t pt-6 text-xs text-muted-foreground">
          Rendered with the same tokens and components as the real dashboard. Delete this route once
          the choice is made.
        </p>
      </main>
    </div>
  );
}

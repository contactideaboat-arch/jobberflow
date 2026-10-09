import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/*
 * Plain-language layer.
 *
 * This product is used by people who post vouchers all day and check a
 * number on a phone. Neither audience should have to know what "custody" or
 * "reconciliation" means before they can read a figure. Three components
 * here carry that weight:
 *
 *   Lead      one sentence stating what the page is about, in trade words
 *   Tell      a single fact as a sentence, with the figure inline
 *   Glossary  the four words this business uses, defined once, in trade words
 *
 * Copy rules for this layer: no domain jargon, no gerund pile-ups, one idea
 * per sentence, and every sentence short enough to read on a phone.
 */

/** One sentence that says what this page is, in the operator's words. */
export function Lead({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <p className={cn("max-w-2xl text-pretty text-sm leading-relaxed text-foreground", className)}>
      {children}
    </p>
  );
}

/**
 * A fact stated as a sentence rather than as a labelled figure. The figure
 * is bold because it is the answer, the rest is context because it is not.
 */
export function Tell({
  children,
  className,
  tone = "default",
}: {
  children: ReactNode;
  className?: string | undefined;
  tone?: "default" | "loss" | "good" | undefined;
}) {
  return (
    <p
      className={cn(
        "text-pretty text-sm leading-relaxed",
        tone === "loss" && "text-destructive",
        tone === "good" && "text-success",
        !tone && "text-muted-foreground",
        className,
      )}
    >
      {children}
    </p>
  );
}

/** A figure quoted inside a sentence. Keeps the sentence readable. */
export function Say({ children }: { children: ReactNode }) {
  return <strong className="num font-semibold text-foreground">{children}</strong>;
}

export type PlainTerm = {
  term: string;
  meaning: string;
};

/**
 * The four words this trade runs on, defined once in the words a shop floor
 * would use. Shown collapsed to one line and expandable, because someone who
 * already knows them should never have to read them, and someone who does not
 * should not have to leave the page to find out.
 */
export function Glossary({
  terms,
  className,
}: {
  terms: PlainTerm[];
  className?: string | undefined;
}) {
  return (
    <details
      className={cn(
        "group rounded-lg border bg-card open:pb-4",
        "[&_summary::-webkit-details-marker]:hidden",
        className,
      )}
    >
      <summary className="flex cursor-pointer list-none items-center gap-2 px-4 py-3 text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground">
        <span className="label-xs">What do these words mean?</span>
        <span
          aria-hidden="true"
          className="ml-auto text-muted-foreground transition-transform duration-150 ease-out group-open:rotate-90"
        >
          &rsaquo;
        </span>
      </summary>
      <dl className="grid gap-x-8 gap-y-3 border-t px-4 pt-4 sm:grid-cols-2">
        {terms.map((entry) => (
          <div key={entry.term}>
            <dt className="text-sm font-semibold">{entry.term}</dt>
            <dd className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
              {entry.meaning}
            </dd>
          </div>
        ))}
      </dl>
    </details>
  );
}

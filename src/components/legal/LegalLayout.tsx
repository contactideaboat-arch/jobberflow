import { Link } from "@tanstack/react-router";
import { Logo } from "@/components/icons";
import type { ReactNode } from "react";

/**
 * Shared chrome for the two legal documents. Kept in its own module so the
 * terms and privacy routes do not import each other.
 */
export function LegalLayout({
  title,
  updated,
  intro,
  children,
}: {
  title: string;
  updated: string;
  intro: string;
  children: ReactNode;
}) {
  return (
    <div className="min-h-dvh bg-background">
      <header className="border-b">
        <div className="mx-auto flex h-14 max-w-3xl items-center gap-3 px-5">
          <Link to="/" className="flex items-center gap-2.5">
            <Logo size={18} className="text-primary" />
            <span className="font-display text-[0.9rem] font-semibold tracking-[-0.02em]">
              JobberFlow
            </span>
          </Link>
          <Link
            to="/"
            className="link-slide ml-auto py-2 text-[0.8125rem] text-muted-foreground transition-colors hover:text-foreground pointer-coarse:min-h-11"
          >
            Back to site
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-5 py-14">
        <p className="rule-eyebrow">Legal</p>
        <h1 className="section-title mt-5">{title}</h1>
        <p className="label-xs mt-4 text-muted-foreground">Last updated {updated}</p>
        <p className="section-lede mt-6">{intro}</p>
        <div className="mt-12 space-y-10">{children}</div>
        <nav
          aria-label="Legal"
          className="mt-14 flex flex-wrap gap-x-6 gap-y-2 border-t pt-6 text-[0.8125rem]"
        >
          <Link
            to="/legal/terms"
            className="link-slide py-1 text-muted-foreground hover:text-foreground pointer-coarse:min-h-11"
          >
            Terms of service
          </Link>
          <Link
            to="/legal/privacy"
            className="link-slide py-1 text-muted-foreground hover:text-foreground pointer-coarse:min-h-11"
          >
            Privacy policy
          </Link>
        </nav>
      </main>
    </div>
  );
}

export function LegalSections({ sections }: { sections: readonly { h: string; p: string[] }[] }) {
  return (
    <>
      {sections.map((s) => (
        <section key={s.h}>
          <h2 className="text-[1.0625rem] font-semibold tracking-[-0.015em]">{s.h}</h2>
          {s.p.map((para) => (
            <p key={para} className="mt-3 text-[0.9375rem] leading-relaxed text-muted-foreground">
              {para}
            </p>
          ))}
        </section>
      ))}
    </>
  );
}

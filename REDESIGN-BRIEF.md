# JobberFlow — UI/UX Redesign Brief

**Deliverable:** a written redesign specification for the JobberFlow web app and marketing site.
**Do not write code.** Produce a design document: decisions, rationale, and per-surface specs.

---

## 1. Context

JobberFlow is an ERP for job work inventory — the Indian manufacturing practice where
a company sends raw material to independent jobbers who process it and return finished
goods. The domain is reconciliation: material leaves your warehouse, sits on someone
else's floor, comes back partly consumed, and the difference has to be quantified.

**Audience:** store staff posting vouchers all day on desktop; the owner checking position,
sometimes on a phone. Both are checking one question above all: *where is my material?*

**Stack (do not propose a rewrite):** TanStack Start + Router, React 19, Tailwind v4,
shadcn/ui over Radix, Supabase, Recharts, Sonner. Fonts self-hosted via Google Fonts
stylesheet in `src/routes/__root.tsx`.

**Scale:** ~25 routes, one design system in `src/styles.css`.

---

## 2. The existing design language — preserve it

`src/styles.css` carries an explicit, well-written contract. Read it before designing
anything. It is called **"Signboard"**: the hand-painted boards over a godown door and a
trader's shop.

Core identity:
- Flat enamel paint. No gradients, no glows, no card shadows.
- Enamel-teal shell, off-white board ground, black ink.
- Chrome yellow for the warehouse field and primary action.
- Tomato red reserved strictly for loss and long-out material.
- Small deliberate radii (2–8px), 1px ink rules, tabular figures.
- Big Shoulders Display for page/section titles and headline figures only.
- Archivo for every control, label and table.
- Icons only from `@/components/icons`. **No icon library.**

### Hard rules the redesign must not violate

1. Flat paint. Shadows only on floating surfaces (popover, sheet, dialog) via `--shadow-float`.
2. Tomato red means loss or long-out material. Nothing decorative is red. Ever.
3. Every color is an oklch semantic token. Never hardcode.
4. Big Shoulders Display is signage lettering — titles and figures, never body or UI.
5. Iconography from `@/components/icons` only.
6. Icons must be stroke-consistent. A 16px glyph and a 20px glyph must share a stroke weight.

`scripts/audit-violations.mjs` already enforces some of this (bans lucide-react, drop
shadows, em dashes, Space Grotesk/DM Sans, gradient backgrounds, pastel palettes). Treat
that script as the executable floor, not the ceiling. If the redesign legitimately needs
to change a rule, say so explicitly and justify it.

---

## 3. Problems to solve

These are findings from reading the current codebase. Verify each against the code
yourself before acting on it.

### P1 — The `h1` base rule fights every marketing headline (highest priority)

`src/styles.css:246` sets `h1` globally to `--font-display`, `font-weight: 800`,
`text-transform: uppercase`, `line-height: 1`.

The landing hero (`src/routes/index.tsx`) writes its headline in sentence case inside a
serif italic span:

> Material is only accounted for when it can be *proven*.

That `h1` carries no `font-display` override. It therefore renders **uppercase, in
Big Shoulders Display** — the exact opposite of the intent, and it destroys the
sentence-case serif emphasis mid-phrase. The same class of bug hits `auth.tsx:141` and
`legal/layout.tsx`.

**Fix direction:** stop styling `h1` by tag. Bare element selectors for type are a
category error in a component system — every consumer has to remember to override them.
Move typography to explicit utilities or a small set of named classes, and let tags be
semantic only.

### P2 — Type scale is fragmented and partly below accessible minimums

`styles.css` defines two label utilities (`label-xs` at 10px, `label-sm` at 11px).
Across the app there are **45 hardcoded** `text-[9px]` / `text-[10px]` / `text-[11px]`
occurrences in `AppShell.tsx`, `auth.tsx`, `AppNavigation.tsx`, `bits.tsx`,
`WorkflowRail.tsx`, `WorkflowJourney.tsx`, `StockTable.tsx`, `StockSummary.tsx`,
`dashboard.tsx`, `ItemVoucher.tsx`, `bom.tsx`, `product-inward.tsx`.

`text-[9px]` at `AppShell.tsx:70,78,99` and `auth.tsx:131,187` is below the WCAG 2.2
minimum and effectively unreadable on a phone in daylight — a real problem for the owner
auditing from mobile. Letterspaced uppercase at 9px is the worst case.

**Fix direction:** one auditable type scale. Minimum 11px, preferably 12px for anything
that must be read on a phone. Retire arbitrary values in favour of scale steps.

### P3 — Marketing and app run two different typographic systems

Marketing uses `clamp()` fluid sizes with tight negative tracking
(`clamp(2.5rem,5.6vw,4rem)`, `tracking-[-0.035em]`). The app uses fixed steps and
`label-xs`. Both sit on top of a global `h1` rule neither one asked for.

The result: the landing page and the product do not feel like one product, and neither
fully controls its own type.

**Fix direction:** a shared scale where marketing gets the expressive end (fluid,
display face, generous tracking) and the app gets the dense end (fixed steps, UI face),
with an explicit, documented boundary between them.

### P4 — Two competing implementations of the legal layout

`src/routes/legal/layout.tsx` and `src/components/legal/LegalLayout.tsx` both export
`LegalLayout`. The routes import the `components/` copy. Note: these files were in flux
during this analysis — confirm which is canonical before touching either, and delete the
orphan.

### P5 — Surface inventory is undocumented

`.impeccable/surfaces/` holds one brief, for the dashboard, and it is genuinely good —
it names audience, task, thesis, first viewport, and a signature element. The other ~24
routes have nothing. Consistency here is currently a matter of individual discipline.

**Fix direction:** a brief per major surface, same template.

### P6 — Destructive red has no documented usage contract in code

The rule "tomato red means loss or long-out" lives in a CSS comment. `StatusBadge`
(`AppShell.tsx:190`) maps `CANCELLED` to `destructive`. Nothing stops a future
contributor from using red for emphasis.

**Fix direction:** encode semantic status colors as named tokens, so misuse is
structurally awkward rather than merely discouraged.

---

## 4. Typography direction

Fonts are currently four families loaded in one stylesheet request. Assess honestly
whether each earns its place:

- **Big Shoulders Display** — signage. Keep for titles and figures, if it survives.
- **Archivo** — UI workhorse, variable width and weight. Keep.
- **Instrument Serif** — used in exactly one place, the hero word "proven". Ask whether
  one italic word justifies a third family, or whether it should come from the existing
  display or sans face at an angle.
- **JetBrains Mono** — tabular figures and codes. `num` utility already handles
  tabular-nums; check whether the mono family is actually load-bearing or redundant.

Four families is a real cost in payload and in coherence. Recommend a specific number,
not "consider reducing."

Define: the scale (with fluid and fixed variants), tracking per step, weight per step,
line-height per step, and the maximum measure per context. Body copy should sit at
roughly 60–75 characters per line.

---

## 5. Motion

The codebase is already disciplined here, and the pattern is worth naming explicitly:
motion happens **once on entry**, then the element sits still. `board-settle`,
`grow-x`, `grow-y`, `route-enter`, `route-progress`, `skeleton-sweep`.

Keep this. Preserve `prefers-reduced-motion` support. Define:
- Durations and easings as tokens. The current `cubic-bezier(0.22, 1, 0.36, 1)` is used
  ad hoc in several places — promote it.
- What animates on entry, what on interaction, what never animates.
- The rule that data updates do not animate unless the change is causal.

---

## 6. Accessibility

Treat as a requirement, not a pass/fail checkbox. This is a financial tool used all day
by people who need it to be correct.

- WCAG 2.2 AA minimum. Cover contrast for every token pair in light **and** dark.
- Keyboard paths for all interactive elements. The app has a skip link and `:focus-visible`
  rings — extend the discipline.
- Verify the `label-xs` and `text-[9px]` sizes against AA.
- Touch targets ≥ 44×44px. Check dense table rows and the sidebar.
- Screen reader semantics on the custody board, which encodes information in tile width.
  This is the highest-risk surface in the product: a proportional visual encoding with no
  text equivalent.
- Never encode state in color alone. The long-out red band must carry a text equivalent.

---

## 7. Responsive strategy

The app is desktop-first with a mobile sheet; the owner uses it on a phone. Define
breakpoints from content, not from device widths. State what reflows, what persists,
and what is intentionally not supported on small screens.

---

## 8. Required output format

Produce, in this order:

1. **Diagnosis** — confirm, correct, or refute each problem in §3 with file:line evidence.
2. **Design principles** — 5–7, each one sentence and falsifiable.
3. **Design tokens** — the full proposed set: type scale, color, spacing, radii, elevation,
   motion. Show before and after.
4. **Component specifications** — for each shared component, its variants, states,
   and anatomy.
5. **Surface specifications** — per route group, using the `.impeccable/surfaces/` brief
   format.
6. **Migration plan** — ordered, incremental, each step independently shippable and
   reversible. Identify anything that can break and how to verify it.
7. **Open questions** — decisions you could not make and why.

---

## 9. Quality bar

- Every recommendation traces to a file and line in this repository.
- Specificity over generality. "Increase contrast" is worthless; "`--muted-foreground`
  at `oklch(0.47 0.02 210)` on `--background` measures 4.2:1, below the 4.5:1 AA
  threshold for body text" is a finding.
- Respect the existing design language. This is a redesign **within** "Signboard", not a
  replacement of it. If you believe the identity itself is wrong, make that argument
  explicitly and separately — do not smuggle it in as a series of small changes.
- Where the honest answer is "this works, leave it alone," say so. A redesign that
  churns working code is a failed redesign.
- The domain is Indian job work manufacturing. Numbers are kilograms to three decimals,
  quantities are not integers, amounts use lakh/crore conventions, dates are dd/mm/yyyy.
  Any proposed change must survive contact with that reality.

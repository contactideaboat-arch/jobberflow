---
version: 2
slug: "src-routes-authenticated-dashboard-tsx"
primary_target: "src/routes/_authenticated/dashboard.tsx"
related_targets: ["src/components/erp/Kpi.tsx","src/components/erp/ShareBar.tsx","src/components/erp/Plain.tsx","src/styles.css"]
---

# Dashboard surface brief

Scope: /dashboard plus the app shell (sidebar, header). Mode: Operate.
Audience: store staff posting vouchers all day on desktop; owner checking position, sometimes on phone.
Task: answer "where is my material?" first, then "what came back this month?", then "what needs a phone call?".

## Direction contract

SEED: 3429c874 (assigned, candidate 7: hand-painted godown and shop signboards)

THESIS: The dashboard is an instrument panel, not a zoo of cards. Figures sit in
one flat band divided by 1px ink rules. The first sentence is the whole position
in plain words, and every figure carries its own one-sentence explanation, so
someone who has never seen the product can read it without a manual.

SUPERSEDES: v1 of this brief called the dashboard a custody board and said it
"refuses the category default of equal stat cards". That was reversed on
2026-10-09 by explicit user direction: the dashboard is now KPI-first, and the
board survives only as a single proportion bar. Do not restore the tile board.

OWN-WORLD: Flat painted fields, no gradients, no shadows. Enamel-teal shell,
off-white board ground, black ink, chrome yellow for the warehouse field and
the primary action, tomato red only for loss and long-out material. Big Shoulders
Display for figures and section titles only; Archivo for every label, note and
table. Small radii, 1px ink rules, tabular figures.

STORY: Open the page, read one sentence that says how much material you own and
where it is, read the four figures beside it, look at the bar to see the split
between your godown and the jobbers, find the two jobbers whose material has
gone still, then read what came back this month and what was wasted.

FIRST VIEWPORT: Page title lettered as a sign. One plain-language sentence with
the total in bold. The KPI band: four figures divided by hairlines, each with a
label, a figure, a unit and a sentence saying what it means.

SIGNATURE: The proportion bar. One horizontal band, each segment's width is its
share of the kilograms. It is a figure, not a chart. It has a sentence beneath
it and a full table of every number under that, because length encodes
information and must never be the only way to read it.

RAISES: From the zoo guide map: flat unmodulated colour, one geometry drives the
board. From instrument panels: readings on one face divided by hairlines rather
than a grid of bezels.

## Plain-language rules

1. No domain jargon on this page. "Custody", "days quiet" and "variance" are
   banned here. Say "material you own", "days sitting", "still here".
2. Every figure carries a `note`, one sentence, in the words of a shop floor.
   A number with no sentence beside it is decoration.
3. The lead sentence states the total position in full before any figure is read.
4. A glossary at the bottom defines jobber, your material at a jobber, BOM and
   wastage once, collapsed, in trade words.
5. "The day runs in four steps" explains the whole product on first open.

## Component contracts

- `KpiBand` / `KpiLink` / `Kpi` (Kpi.tsx): hairline-divided band, 2 to 6 columns.
  Division is a 1px grid gap over a rule-coloured ground, never per-cell borders.
- `ShareBar` / `ShareTable` (ShareBar.tsx): the proportion figure and its legend.
- `MonthBars`: fixed-height track per bar. A percentage height against an
  auto-height cell resolves against nothing and collapses every bar to one size.
- `Glossary` / `Lead` / `Say` (Plain.tsx): the plain-language layer.
- `KpiCards` (bits.tsx): the retained array API used by reconciliation, drawn with
  the same band.

## Invariants

- Figures never count up. A figure that animates cannot be trusted at a glance.
- Red appears only on wastage and long-out material, and never alone: the word
  sits beside the colour.
- Kilograms always show three decimals. The decimals are quiet, not absent.
- A KPI cell is the link. There is no separate "view details" target.
- Hover is gated behind `@media (hover: hover) and (pointer: fine)` so a phone
  tap cannot leave a cell stuck in its pressed look.
- Motion happens once on arrival, under 300ms for anything interactive.
- Type floor is 11px. No `text-[9px]` or `text-[10px]` on this page.
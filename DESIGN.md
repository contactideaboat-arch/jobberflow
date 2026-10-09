# Design System: JobberFlow

> **This document describes the system in `src/styles.css`.** That file is the
> contract; this is the prose around it. If the two disagree, `styles.css` is
> right and this file is out of date. An earlier version of this document
> described "Signboard" — enamel teal, chrome yellow, Big Shoulders Display —
> which was replaced. Do not reintroduce those names.

## Overview

**Creative North Star: "Steel ledger"**

JobberFlow is a working instrument, not a dashboard theme. The reference is a
ledger book kept by someone who has to be right: a near-white page, ruled lines,
figures aligned on the decimal, one pen for entries and one for the margin.

Everything follows from who uses it. Store staff post vouchers through a long
day on a desktop and need density, stable positions and nothing that moves
without cause. An owner checks a position, sometimes from a phone, and needs the
answer to be unambiguous. So: flat surfaces separated by hairlines, tabular
figures everywhere, and colour reserved almost entirely for meaning.

The one indulgence is the custody board on the dashboard — a band whose
segments are sized by the kilograms they represent. It is a figure, not a
chart, and it has a complete text equivalent in the table beneath it, which is
what makes it safe to read.

**Key characteristics**

- Flat paint. Shadows only on surfaces that genuinely float.
- One type family (Archivo). Hierarchy comes from size and weight, never from
  uppercase lettering or a second display face.
- Steel blue means "you can act here" or "you are here" — never decoration.
- Red means loss, wastage over the limit, long-out material, or a destructive
  action. Nothing else is ever red.
- 1px rules do the separating. Radii stay small and deliberate (3–10px).
- Hand-authored 1.5-stroke icon set in `@/components/icons`. No icon library.

## Colors

All colours are OKLCH semantic custom properties declared in `src/styles.css`.
Components use the token (`bg-accent`, `text-destructive`) and never a literal.

### Primary

- **Steel blue** (`--primary`): links, the default button, focus rings, inline
  text actions, the active sidebar row. It is the colour of an affordance.
- **Steel blue, raised** (`--primary-soft` / `--primary-soft-foreground`): the
  account initials and soft badges.

### Neutral

- **Ground** (`--background`): the page.
- **Card** (`--card`) and **Raised** (`--raised`): working surfaces. A table
  sits on card; a table head or total row sits on **Subtle** (`--subtle`).
- **Ink** (`--foreground`): body text and rules.
- **Muted ink** (`--muted-foreground`): secondary text, column heads, units,
  helper text. 5.0:1 on the ground.
- **Rules**: `--border` for dividers, `--border-strong` where a line carries
  weight, `--input` for control outlines (3:1, deliberately darker than a
  divider so an input reads as fillable).

### Status

Each has a strong token and a soft tint, and every pair was measured at 4.5:1
or better.

- **Success** — a voucher that has posted. Never spent on anything else.
- **Warning** — "look at this": a draft, a figure over the wastage limit, and
  **a failed load**. A failed request is a system state, not a loss of
  material, so it wears amber and never red.
- **Destructive** — loss, wastage over the limit, long-out material, and
  destructive actions.
- **Info** — neutral emphasis where nothing is wrong and nothing is posted.

### Named rules

**The Red Means Loss rule.** `--destructive` appears only on a figure that does
not add up, material that is or may be lost, and actions that remove or reverse
a record. Nothing decorative is red. In particular a _cancelled_ voucher is a
reversal, not a loss, so it is neutral — see `StatusBadge` in `AppShell.tsx`,
which encodes that rule and must be used rather than re-implemented.

**The Steel Means Act rule.** `--primary` marks something you can act on or
where you currently are. It is never used for emphasis on a figure.

**The Semantic Token rule.** Never hardcode a colour. Every status colour is a
named token so that misuse is structurally awkward rather than merely
discouraged.

## Typography

**One family: Archivo**, variable weight. `--font-display` resolves to the same
family; there is no separate display face. `--font-mono` is a system mono,
reserved for code.

### Scale

Fixed steps, nothing below 11px. Figures use the readout steps with tabular
numerals.

| Step                                  | Size    | Use                              |
| ------------------------------------- | ------- | -------------------------------- |
| `text-2xs` / `label-xs`               | 11px    | short labels. Sentence case      |
| `text-xs`                             | 12px    | helper text, notes, column heads |
| `text-sm`                             | 14px    | body, table cells, controls      |
| `text-base`                           | 16px    | dialog titles                    |
| `text-readout-sm` … `text-readout-xl` | 18–36px | figures                          |

### Named rules

**The Tabular Figure rule.** Every quantity, balance, percentage and count uses
`.num` (`font-variant-numeric: tabular-nums`). Columns of figures are
right-aligned so the decimal point lines up down the page.

**Three decimals are not decoration.** Kilograms in this trade run to three
decimals. `.kpi-decimals` keeps them visible but quiet so a reader lands on the
whole number first. Hiding them would misstate the precision the system holds.

**Sentence case, including in small type.** Letterspaced capitals at 11px are
the slowest thing on the screen to read. Hierarchy comes from weight and size.
`.rule-eyebrow` (uppercase, 0.14em) is the one exception and is reserved for
marketing section labels.

**Headings are set by their call site.** `h1`–`h4` in `@layer base` set only the
voice — family, weight 600, tight tracking — never the size. Sizing a heading by
tag is how the same word renders two different ways on two pages.

## Layout

A fixed sidebar on `lg` and up (256px, or a 68px rail toggled with Ctrl+B),
collapsing to a sheet (`min(18rem, 86vw)`) below it. A sticky 56px top bar
carries the breadcrumb on the left and role/date on the right. Content pads
16/20/32px by breakpoint inside a `90rem` container.

Every workspace page opens with `<PageHeader>`: title, one sentence of context,
actions on the right, closed by a 1px rule. This is the single most important
consistency in the product — if a screen does not use it, it does not belong.

Dense registers use `erp-table` inside `GridScroll`, with a `min-w` so they
scroll horizontally rather than compressing. Below `lg`, wide tables keep a
sticky first column so the record identity stays on screen while the numbers
scroll.

## Elevation & depth

Flat. A surface at rest has no shadow. Separation is 1px rules and a card-on-
ground tone shift.

### Shadow vocabulary

- **Float** (`--shadow-float`): popovers, dropdowns, dialogs, sheets, toasts,
  hover cards. Nothing else.

### Named rules

**The Flat Paint rule.** If it does not float above the page, it does not cast
a shadow. The skeleton sheen is a loading mechanism, not decoration.

## Shapes

Small and deliberate: 3px for bars, skeletons and kbd; 4px for badges and nav
rows; 6px for controls; 8px for panels; 10–12px for large floating surfaces.
Nothing is pill-shaped except dots.

## Components

### Buttons

`default` is the one action a screen is for. `outline` is everything secondary.
`ghost` has no chrome until hover and carries row actions. `destructive` only
removes or reverses. Sizes are tokenised (`h-control`, `h-control-sm`,
`h-control-lg`); every size grows to a 44px target on coarse pointers. Pressed
sinks 1px rather than scaling. `loading` swaps in a spinner, sets
`aria-busy` and blocks repeat presses — and handlers still guard their own
write, because a double click can land twice before React commits the disabled
state.

### Tables (`erp-table`)

13px body, 36px rows, 12px column heads on the subtle ground. Numeric columns
right-aligned. Hover is a neutral wash; a selected row takes `--selected`.

### The three states of a table

`RegisterState` is the only way a table expresses loading, error or empty, so
the distinction cannot be forgotten at a call site. This is not tidiness: a
register that renders "No records found." while loading or after a failed query
tells an operator whose access has lapsed that there is no data, which is the
most damaging thing this application can say. `queryStatus(query)` derives the
state from a TanStack Query result.

### Registers (`useGrid`)

Search, filter, sort and page all happen on the rows already loaded. Export
from `grid.matched` — every row that passes the current filters — so a file
always contains what the screen says it contains.

### Status indicators

Never colour alone. A badge states its condition in a word. `WastageCell` adds
the words "Over 5.00%" and a marker rule when a figure breaches the company's
threshold, and adds nothing at all when it does not.

### Forms

`<Field>` wires label to control, links hint and error through
`aria-describedby`, and marks the control invalid and required. It distinguishes
**Required**, **Optional** and **Calculated**. `<ReadOnlyValue>` draws a value
that cannot be edited on the subtle ground with no input border, so it can never
be mistaken for a field. Validation belongs next to the field that caused it,
and recoverable errors must not clear what was typed.

### Dialogs

`useGuardedClose(dirty, setOpen)` asks before discarding input. Every dialog
carries a title and description. Confirmations name the consequence
("Discard this entry?"), not just "Are you sure?".

## Motion

Motion happens once on arrival, then the element sits still. Entrances:
`route-stage`, `rise`, `board-settle`, `grow-x`, `grow-y`, `skeleton-sweep`.

Durations and easings are tokens: `--ease-settle` for entrances, 150ms default
for state changes, 150–220ms for simple interface transitions.

**Rules**

- Data updates do not animate unless the change is causal.
- A figure never counts up. A figure that animates cannot be trusted at a
  glance, and this is a financial instrument.
- Reduced motion drops travel and scale, keeps short opacity and colour
  transitions so affordances fade rather than snap.

## Do's and don'ts

**Do**

- Use `PageHeader`, `Panel`, `Badge`, `Button`, `erp-table` and the grid before
  writing a local version of any of them.
- Reach for `RegisterState` rather than an ad-hoc empty row.
- Name the source of a figure. If it is a voucher, say so.
- Show what is genuinely true: no limit means no limit, not a default.

**Don't**

- Don't hardcode colours. Don't use a second font family.
- Don't introduce sub-11px type.
- Don't use red for anything but loss or a destructive action.
- Don't add a shadow to a surface that isn't floating.
- Don't put an icon-library glyph in place of a hand-drawn one.
- Don't animate a number.

## Known debt

- `.dark` defines a subset of the tokens; `--accent` inverts to chrome yellow
  there and the soft status tints are undefined. No theme toggle ships, so
  this is latent rather than live, but the block should either be completed or
  removed.
- Several shadcn primitives in `src/components/ui/` have no importers. They
  are a route to reintroducing defects the ERP components already fixed (16px
  close targets, unscoped table heads), and are candidates for deletion.

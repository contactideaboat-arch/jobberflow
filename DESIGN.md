---
name: JobberFlow
description: Job work, inventory and reconciliation for a manufacturer that sends material out to jobbers, lettered like a godown signboard.
colors:
  board-ground: "oklch(0.968 0.006 100)"
  ink: "oklch(0.2 0.025 215)"
  subtle-ground: "oklch(0.94 0.008 105)"
  card: "oklch(0.993 0.003 100)"
  raised: "oklch(1 0 0)"
  enamel-teal: "oklch(0.43 0.075 205)"
  enamel-teal-ink: "oklch(0.985 0.005 100)"
  teal-wash: "oklch(0.93 0.014 195)"
  teal-wash-ink: "oklch(0.3 0.05 205)"
  muted: "oklch(0.944 0.007 105)"
  muted-ink: "oklch(0.47 0.02 210)"
  chrome-yellow: "oklch(0.86 0.165 92)"
  chrome-yellow-ink: "oklch(0.24 0.045 80)"
  tomato: "oklch(0.6 0.2 33)"
  tomato-ink: "oklch(0.985 0.005 100)"
  success-green: "oklch(0.54 0.12 160)"
  warning-amber: "oklch(0.79 0.15 75)"
  info-blue: "oklch(0.55 0.08 220)"
  rule: "oklch(0.875 0.01 110)"
  rule-strong: "oklch(0.74 0.016 110)"
  input-stroke: "oklch(0.83 0.012 110)"
  paint-green: "oklch(0.5 0.1 160)"
  paint-plum: "oklch(0.47 0.11 345)"
  paint-sky: "oklch(0.66 0.09 228)"
  shell-teal: "oklch(0.33 0.058 205)"
  shell-ink: "oklch(0.93 0.02 190)"
  shell-row: "oklch(0.39 0.062 205)"
  shell-rule: "oklch(0.43 0.055 205)"
  shell-subtle: "oklch(0.77 0.04 195)"
typography:
  display:
    fontFamily: "Big Shoulders Display, Archivo, ui-sans-serif, system-ui, sans-serif"
    fontSize: "4.75rem"
    fontWeight: 800
    lineHeight: 0.92
    letterSpacing: "0.005em"
  headline:
    fontFamily: "Big Shoulders Display, Archivo, ui-sans-serif, system-ui, sans-serif"
    fontSize: "2.5rem"
    fontWeight: 800
    lineHeight: 1
    letterSpacing: "0.005em"
  title:
    fontFamily: "Big Shoulders Display, Archivo, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 800
    lineHeight: 0.92
    letterSpacing: "0.005em"
  body:
    fontFamily: "Archivo, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.55
    fontFeature: "\"cv05\" 1"
  table:
    fontFamily: "Archivo, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.8125rem"
    fontWeight: 400
    lineHeight: 1.55
    fontFeature: "\"tnum\""
  label:
    fontFamily: "Archivo, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 600
    lineHeight: 1.35
  code:
    fontFamily: "JetBrains Mono, ui-monospace, SFMono-Regular, monospace"
    fontSize: "0.75rem"
    fontWeight: 500
rounded:
  xs: "2px"
  sm: "3px"
  md: "4px"
  lg: "5px"
  xl: "6px"
spacing:
  tile-gap: "6px"
  cell-y: "7px"
  cell-x: "12px"
  panel: "20px"
  panel-lg: "24px"
  page: "24px"
  section: "48px"
components:
  button-primary:
    backgroundColor: "{colors.enamel-teal}"
    textColor: "{colors.enamel-teal-ink}"
    rounded: "{rounded.md}"
    padding: "8px 16px"
    height: "36px"
  button-signal:
    backgroundColor: "{colors.chrome-yellow}"
    textColor: "{colors.chrome-yellow-ink}"
    rounded: "{rounded.md}"
    padding: "0 12px"
    height: "36px"
  button-outline:
    backgroundColor: "{colors.board-ground}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "0 12px"
    height: "36px"
  button-destructive:
    backgroundColor: "{colors.tomato}"
    textColor: "{colors.tomato-ink}"
    rounded: "{rounded.md}"
    padding: "8px 16px"
    height: "36px"
  input:
    backgroundColor: "{colors.board-ground}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "4px 12px"
    height: "36px"
  nav-row:
    textColor: "{colors.shell-ink}"
    rounded: "{rounded.md}"
    padding: "0 8px"
    height: "32px"
  nav-row-active:
    backgroundColor: "{colors.shell-row}"
    textColor: "{colors.enamel-teal-ink}"
    rounded: "{rounded.md}"
  new-voucher:
    backgroundColor: "{colors.chrome-yellow}"
    textColor: "{colors.chrome-yellow-ink}"
    rounded: "{rounded.md}"
    padding: "0 12px"
    height: "36px"
  board-tile-warehouse:
    backgroundColor: "{colors.chrome-yellow}"
    textColor: "{colors.chrome-yellow-ink}"
    rounded: "{rounded.sm}"
    padding: "24px"
  board-tile-jobber:
    backgroundColor: "{colors.enamel-teal}"
    textColor: "{colors.enamel-teal-ink}"
    rounded: "{rounded.sm}"
    padding: "24px"
  days-plate:
    backgroundColor: "{colors.tomato}"
    textColor: "{colors.tomato-ink}"
    padding: "0 24px"
    height: "32px"
  status-live:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.board-ground}"
    rounded: "{rounded.sm}"
    padding: "6px 10px"
  table-head:
    backgroundColor: "{colors.subtle-ground}"
    textColor: "{colors.muted-ink}"
    padding: "7px 12px"
---

# Design System: JobberFlow

## Overview

**Creative North Star: "The Signboard"**

JobberFlow is lettered and painted like the boards over a godown door and a trader's shop: flat enamel paint, a teal shell, an off-white board, black ink, chrome yellow and a tomato red that only ever means trouble. The world is working signage, not a dashboard theme. Paint is unmodulated, depth comes from borders and ink rules rather than shadows, and heavy condensed lettering is reserved for the things a sign would actually say: the page name, the section name, the number.

Density follows the work. Staff post vouchers all day, so tables are ledger-tight (13px rows, 7px cell padding, tabular figures) and controls sit at 32 to 36px. The signage moments are few and large: a page title, a section title with a 2px ink rule under it, a headline figure whose decimals and unit drop to a smaller size. Everything between is Archivo at 14px.

The signature is the custody board: one painted tile per location, its width set by its share of the kilograms in custody, framed by a painted keyline, with a red days plate on any jobber that has sat too long. The wall is the chart.

**Key Characteristics:**
- Flat enamel paint; no gradients, no card shadows.
- Enamel-teal shell (sidebar and header band) around an off-white board ground.
- Chrome yellow marks the warehouse, the live signal, selection and the high-intent action.
- Tomato red is reserved for loss and long-out material.
- Big Shoulders Display uppercase for titles and figures only; Archivo for all UI.
- Small, deliberate corners (2 to 5px); 1px rules, 2px ink rules for boards.
- Hand-authored 1.5-stroke icon set; no icon library.

## Colors

Enamel paints on an off-white board: one cool teal for structure, one warm yellow for signal, one red for loss, and an ink that is nearly black with a teal cast. All tokens are OKLCH semantic custom properties in `src/styles.css`, with a full `.dark` counterpart.

### Primary
- **Enamel Teal** (enamel-teal): links, default buttons, the focus ring, inline text actions, the first jobber paint and past months in the production strip. The structural colour of the app.
- **Shell Teal** (shell-teal): the sidebar and the sticky header band, a deeper teal so the shell reads as the painted frame around the board. Rows within it use **Shell Row** (shell-row) for hover and active fill, **Shell Rule** (shell-rule) for dividers and station rings, **Shell Subtle** (shell-subtle) for group labels and idle icons.

### Secondary
- **Chrome Yellow** (chrome-yellow): the warehouse tile, the live dot, the current month bar, the New voucher trigger, the Reconcile action, text selection (at 32%) and table row hover (at 6%). Text on it is always **Chrome Yellow Ink** (chrome-yellow-ink), never white.

### Tertiary
- **Tomato** (tomato): the destructive token. Loss figures (wastage), the long-out days plate, long-out counts and days in tables, error status, destructive buttons.
- **Board Paints** (paint-green, paint-plum, paint-sky): jobber tiles take enamel-teal, paint-green, paint-plum, paint-sky in turn. These are the `--chart-*` tokens and stay the order jobber tiles use.

### Neutral
- **Board Ground** (board-ground): the page ground, a warm off-white.
- **Ink** (ink): body text, the 2px board and section rules, the live status plate.
- **Card** (card) and **Subtle Ground** (subtle-ground): tables and lists sit on card; table heads and footers sit on subtle ground.
- **Muted Ink** (muted-ink): secondary text, table head labels, panel labels.
- **Rule** (rule) / **Rule Strong** (rule-strong) / **Input Stroke** (input-stroke): 1px dividers, table head underline and outline buttons, field strokes.
- **Status** (success-green, warning-amber, info-blue): semantic states only. Warning amber fills a cover bar that has fallen under 25%.

### Named Rules
**The Red Means Loss Rule.** Tomato appears only on loss, long-out material, errors and destructive actions. Nothing decorative is red.

**The Warehouse Is Yellow Rule.** The warehouse tile is always chrome yellow; jobbers never take it. Yellow on a screen means our own godown, live state, or the one action to take now.

**The Semantic Token Rule.** Components use semantic tokens (`bg-accent`, `text-destructive`, `var(--color-chart-1)`), never literal colours.

## Typography

**Display Font:** Big Shoulders Display, weight 800 (with Archivo fallback)
**Body Font:** Archivo, variable width and weight (with ui-sans-serif fallback)
**Label/Mono Font:** JetBrains Mono for voucher numbers and material codes

**Character:** Condensed, heavy signwriter capitals set against a sturdy grotesque. The sign does the shouting in a few places; Archivo does all the reading and typing.

### Hierarchy
- **Display** (800, 3.5rem mobile to 4.75rem desktop, 0.92): the custody total. Decimals at 0.45em and unit at 0.4em, both at 60% opacity.
- **Headline** (800, 2rem to 2.5rem, 1): page titles (every `h1` is lettered automatically) and panel figures at 2.5rem; tile figures at 2.25 to 2.75rem.
- **Title** (800, 1.5rem, 0.92, uppercase): section titles, tile names (1.25 to 1.625rem), the sidebar wordmark, empty-state headings.
- **Body** (400, 0.875rem, 1.55): all running UI text. Subtitles cap at max-w-2xl.
- **Table** (400 to 600, 0.8125rem, tabular figures): ledger cells. Heads at 0.625rem, 600, uppercase, 0.06em tracking.
- **Label** (500 to 600, 0.75rem or 11px): panel labels, link actions, notes, status plates. Sentence case.

### Named Rules
**The Sign Says Little Rule.** Display lettering (`.sign`, `.readout`, `h1`) is for page titles, section titles, tile names and headline figures. Every control, label, nav item and table stays in Archivo. `h2` to `h4` default to Archivo 600 unless a section title opts into `.sign`.

**The Tabular Figure Rule.** Every quantity, share and day count uses tabular numerals (`num`). KG at 3 decimals, en-IN grouping.

## Layout

Sidebar shell plus a fluid board. The sidebar is a fixed teal column on desktop that collapses to an icon rail (Ctrl+B) and becomes a sheet (`min(18rem, 86vw)`) below `lg` (1024px). A sticky 56px header band in shell teal carries the location and role. Content pads 12 / 16 / 24px by breakpoint inside a `90rem` max container.

Pages open with a header block (title, subtitle, actions) closed by a 1px rule and 20px gap. Sections are separated by 48px. Section heads sit on a 2px ink rule with the title left and a text link right. Secondary sections split on a 12-column grid (5 / 7) at `lg` with 40px gutters.

The custody board is a single flex row on `sm` and up (min height 224px, 6px gaps), each tile's `flex-grow` set to its kg share with a floor of 6. Below `sm` tiles stack and a 12px weight-split strip above them keeps the proportions visible. Month panels sit in a 2-up grid that becomes 4-up at `lg`.

## Elevation & Depth

Flat. Surfaces at rest have no shadow; separation comes from 1px rules, card-on-ground tone shifts, and 2px ink rules on framed boards. The one sanctioned shadow belongs to surfaces that genuinely float above the page: popovers, dropdowns, selects, dialogs, sheets, hover cards, toasts.

### Shadow Vocabulary
- **Float** (`box-shadow: 0 1px 1px oklch(0.2 0.02 255 / 0.04), 0 8px 24px -6px oklch(0.2 0.02 255 / 0.14), 0 24px 48px -12px oklch(0.2 0.02 255 / 0.1)`): floating overlays only.

### Named Rules
**The Flat Paint Rule.** No gradients, glows or card shadows on painted or resting surfaces. If it does not float above the page, it does not cast a shadow. (The skeleton sheen is a loading mechanism, not paint.)

## Shapes

Small, deliberate corners: 2px for skeletons, bars and kbd, 3px for tiles, status plates, tables and lists, 4px for buttons, inputs and nav rows, 5px for panels. Nothing is pill-shaped except dots. Signboards are framed: a 1px keyline in the tile's own ink, inset 8px, at 28% opacity. Boards that group several readings use a 2px ink border with 2px ink rules between panels. Empty boards use a 2px dashed strong rule.

## Components

### Buttons
Painted and plain; they press rather than glow.
- **Shape:** gently squared (4px).
- **Primary:** enamel teal with off-white text, 36px tall, 16px sides. Hover lightens to 90%.
- **Signal:** chrome yellow with yellow ink for the one action to take now (Reconcile, New voucher). Hover darkens via `brightness(0.95)` or mixes 12% white in the shell.
- **Outline:** 1px input stroke on board ground; hover fills chrome yellow.
- **Press:** every button drops 1px on `:active`. Focus is a 2px ring in enamel teal (chrome yellow inside the shell).
- **Text action:** enamel teal 12px 600 with an underline that draws in from the left on hover and focus.

### Cards / Containers
- **Corner Style:** 3 to 5px.
- **Background:** card on board ground.
- **Shadow Strategy:** none (see Elevation).
- **Border:** 1px rule; framed boards take 2px ink.
- **Internal Padding:** 20px, 24px at `sm`. Lists use 16px by 14px rows.

### Inputs / Fields
- **Style:** 1px input stroke, transparent fill, 4px corners, 36px tall, 12px sides.
- **Focus:** 1px ring in enamel teal.
- **Disabled:** 50% opacity, not-allowed cursor.

### Tables
Ledger-grade: 13px body, 7px by 12px cells, 1px rules between rows, subtle-ground head with 10px uppercase labels and a strong rule beneath, numbers right-aligned in tabular figures, a 6% chrome-yellow wash on row hover. Cancelled rows drop to 55% opacity.

### Navigation
- **Style:** shell teal column; rows 32px, 13px Archivo, 4px corners, icons 16px in 24px slots.
- **Hover:** a quieter version of the active fill (shell row at 62%).
- **Active:** shell-row fill, 600 weight, icon lit chrome yellow. No edge stripe.
- **Workflow spine:** the daily-flow group (Receive, Issue, Receive output, Reconcile) reads as one production line: each icon sits in a ringed station joined by a 1px shell-rule line; the active station fills chrome yellow.
- **New voucher:** a full-width chrome-yellow trigger at the top of the sidebar, shown to writers only; its plus rotates 45 degrees when open.
- **Rail:** collapsed state keeps icons centred with tooltips; group labels become 24px hairlines.
- **Mobile:** the shell becomes a sheet; the header band shows the wordmark lettered as a sign.

### Custody Board (signature)
One painted tile per location: warehouse first in chrome yellow, then up to four jobbers in board-paint order, then a muted "N more" tile. Width is share of kg in custody. Each tile carries its name lettered as a sign, share percentage, a headline kg figure and a quiet note. A painted keyline frames it at 28% and paints to 90% on hover or focus while the lettering lifts 2px. The whole tile is the link. A jobber with no movement for over 30 days carries a 32px tomato days plate along the bottom. Tiles settle from equal widths to their weight once on load (720ms); reduced motion skips it.

### Status Plate
A small 3px-cornered plate in the page header: ink with a chrome-yellow dot when live, muted while loading, tomato on error.

## Do's and Don'ts

### Do:
- **Do** letter page titles, section titles and headline figures in Big Shoulders Display 800 uppercase, and nothing else.
- **Do** keep paint flat and separate surfaces with 1px rules or 2px ink rules.
- **Do** use chrome yellow for the warehouse, live state and the single high-intent action on a view.
- **Do** set every quantity in tabular figures, KG to 3 decimals, with decimals and unit smaller than the whole on headline figures.
- **Do** draw icons from `src/components/icons` (24 grid, 1.5 stroke, round caps and joins, currentColor).
- **Do** make every board tile and record a real link to its records.
- **Do** keep motion to one authored entrance per surface and short colour transitions (120 to 220ms); honour reduced motion.

### Don't:
- **Don't** use gradients, glows or shadows on resting surfaces; `--shadow-float` is for floating overlays only.
- **Don't** use tomato red for anything but loss, long-out material, errors and destructive actions.
- **Don't** put white text on chrome yellow.
- **Don't** set controls, nav items, labels or tables in the display face.
- **Don't** add an icon library or glyph characters as icons.
- **Don't** mark active nav rows with an edge stripe; active is a fill with the icon lit.
- **Don't** hardcode colours in components.

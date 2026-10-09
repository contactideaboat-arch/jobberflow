# JobberFlow redesign specification

Answers `REDESIGN-BRIEF.md`. A redesign **within** Signboard, not a replacement of it.
Evidence was read from the working tree on 2026-10-09 (branch `main`, 71 uncommitted paths).
Line numbers refer to that tree. Contrast figures were computed from the oklch values in
`src/styles.css` (oklch to sRGB, WCAG 2.x relative luminance). Rendered output was **not**
inspected: the shared Playwright browser was locked by another session, so typography
claims come from reading the cascade, and are marked where that matters.

---

## 0. Summary

The identity is sound and the contract in `styles.css` is unusually good. Most of the work is
not visual invention but making the contract executable: type assigned by class instead of
by tag, red guarded by components instead of by a comment, and an audit script that
actually passes.

The five changes that matter most, in order:

1. **The most important number on the reconciliation page is invisible.** "Balance with
   jobber" is set in `text-accent` (chrome yellow) on a card: **1.50:1**
   (`reconciliation.tsx:150-155`, `bits.tsx:43`). Not in the brief; fix first.
2. **Remove the `h1` tag rule** (P1), but only after `PageHeader` (`AppShell.tsx:157`)
   opts in explicitly, because every app page title currently *depends* on that rule.
3. **Four semantic colors fail AA as text in light mode** (tomato 3.95:1, success 4.35:1,
   info 4.31:1, the POSTED/CANCELLED badges 3.73:1 and 3.37:1), and input borders fail
   the 3:1 non-text minimum (1.54:1). Small lightness changes fix all of them.
4. **Two font families, not four.** Drop Instrument Serif and JetBrains Mono, and subset
   Archivo. Latin font payload for the app falls from about 166 KB to 70 KB.
5. **Encode red as components** (`LossFigure`, `LongOutPlate`, `StatusPlate`) and ban the
   raw `destructive` color outside them. There are 9 misuses today.

---

## 1. Diagnosis

### P1: the `h1` base rule. **Confirmed, with one correction and one complication.**

`styles.css:246-253` sets `h1` to the display face, weight 800, uppercase, `line-height: 1`
inside `@layer base`. Tailwind v4 utilities sit in a later layer, so a utility class beats
the base rule **only for properties it sets**. Each `h1` in the codebase:

| Site | Sets family? | Sets case? | Result |
|---|---|---|---|
| `index.tsx:142` hero | no | no | **Big Shoulders, uppercase**, weight 600, tracking -0.035em. The serif span at `:144` is uppercased too, so the sentence-case italic emphasis is lost. Confirmed. |
| `LegalLayout.tsx:40` | no | no | Big Shoulders, uppercase, -0.03em. Confirmed. The brief cited `legal/layout.tsx`, which no longer exists (see P4). |
| `auth.tsx:141` | **yes**, `font-display` on purpose | no | Display face is intended here. Uppercase is inherited, and that is consistent with Signboard. **Correction:** the real defects are `tracking-[-0.035em]` on a condensed face (counters close up) and `font-bold` (700) where the system says 800. |
| `AppShell.tsx:157` `PageHeader` | no | no | **Works only because of the tag rule.** It carries size classes only. Removing the rule without changing this line turns every app page title into Archivo 400 sentence case. |
| `__root.tsx:20` 404 | no | no | "404" in Big Shoulders. Fine by accident. |
| `__root.tsx:48` error page | no | no | "This page didn't load" uppercase in Big Shoulders with `tracking-tight`. Unintended. |
| `reconciliation.tsx:160` print header | n/a | n/a | Printed through `printElement`, which writes its own stylesheet (`erp.ts:146-159`), so `styles.css` does not apply. |

`jf-01-hero.png` at the repo root shows the hero in sentence-case Archivo. It predates the
tag rule, so it is not evidence of the current render.

**Decision:** stop styling headings by tag. Remove the `h1` rule (`:246-253`) **and** the
`h2, h3, h4` rule (`:255-263`). The second rule causes no visible bug today, but it is the
same category error: the dashboard's `.sign` headings win over it only because
`@layer components` comes after `@layer base`. Keep `text-wrap: balance` as a separate
global rule on `h1-h4`. Wrapping is not type.

### P2: fragmented scale below accessible minimums. **Confirmed in substance. The counts, line numbers and WCAG claim need correcting.**

- **Count:** 39 arbitrary sub-12px sizes, not 45: 2 x `text-[9px]`, 14 x `text-[10px]`,
  23 x `text-[11px]`, across 14 files. `ProductShot.tsx:79` and `Screenshot.tsx:30`
  were not in the brief's list. On top of that, the **system itself** ships 10px: `label-xs`
  (`styles.css:664`, 14 uses), the `erp-table` header (`:741`) and `.rule-eyebrow`
  (`:790`). In practice every table header in the product is 10px uppercase.
- **Line numbers:** `AppShell.tsx` no longer contains `text-[9px]`. The cited lines
  70/78/99 are stale. The only 9px text is at `auth.tsx:131` and `auth.tsx:187`.
- **WCAG claim is wrong:** WCAG 2.2 has **no minimum font size**. The failures that apply
  are contrast (1.4.3) and resize (1.4.4). The 9px line at `auth.tsx:131` uses
  `text-sidebar-foreground/45`, which measures **3.22:1**. The footer at `auth.tsx:175`
  (`/35`) measures **2.51:1**. Both fail on contrast. The size argument still stands as a
  product requirement: a phone in daylight. It is not a conformance requirement.
- Arbitrary rem sizes add 14 more distinct values (`0.8rem`, `0.9rem`, `0.95rem`,
  `0.8125rem` x11, `0.9375rem` x7, ...). Tracking has 11 distinct arbitrary values.

### P3: two typographic systems. **Confirmed.**

Marketing uses 7 distinct `clamp()` expressions (`index.tsx:142,193,225,264,280,301,343`)
plus `LegalLayout.tsx:40`, all in Archivo with negative tracking. The app uses fixed
steps in Big Shoulders uppercase. The two halves share only body copy.

### P4: two legal layouts. **Refuted. It is already resolved.**

`src/routes/legal/` contains only `privacy.tsx` and `terms.tsx`. Both import
`@/components/legal/LegalLayout` (`terms.tsx:2`). `src/routes/legal/layout.tsx` does not
exist and has no git history. Both directories are untracked.

The actual orphans are different files:
- `src/components/erp/WorkflowJourney.tsx` has **no importers**. Its CSS
  (`.journey-panel`, `.journey-icon`, `styles.css:473-481`) is dead with it.
- `src/routes/type.tsx` is a public `/type` type-specimen route that ships in the route
  tree. Its `description` is outside `meta` and is ignored (`:8-10`), and its title
  contains an em dash.

### P5: undocumented surfaces. **Confirmed.**

`.impeccable/surfaces/` holds one brief. Section 5 below provides the rest.

### P6: red has no contract in code. **Confirmed, and worse than stated.**

Every red usage, classified:

| Use | Location | Verdict |
|---|---|---|
| Long-out band, count, days column | `dashboard.tsx:292,395,709` | correct |
| Wastage > 0 | `dashboard.tsx:420,671` | correct (loss) |
| Wastage over threshold | `reports.tsx:187,227,266,303`, `product-inward.tsx:307,432` | correct |
| Scrap glyph | `ItemVoucher.tsx:478`, `bom.tsx:437` | correct |
| Short quantity blocking a post | `product-inward.tsx:466` | correct (material does not add up) |
| Negative adjustment | `adjustment.tsx:252` | acceptable (a write-down) |
| **CANCELLED status** | `AppShell.tsx:173` | **misuse**: a reversal, not a loss |
| **Outward quantity column** | `fg-ledger.tsx:124`, `rm-ledger.tsx:160` | **misuse**: an issue is not a loss. The paired green inward column is the same accounting cliché. |
| **Below minimum stock** | `StockTable.tsx:113`, `materials.tsx:183` | **misuse**: a reorder warning |
| **"No BOM" badge** | `products.tsx:167` | **misuse**: a setup gap |
| **Load failure** | `dashboard.tsx:248`, `StockSummary.tsx:61`, `StockTable.tsx:23` | **misuse**: a system state |
| **Cancel buttons** | `ItemVoucher.tsx:337,626`, `adjustment.tsx:278,412`, `product-inward.tsx:336` | **misuse** under the current rule (see 3.2) |

Wastage also contradicts itself across screens. The reconciliation page shows it in
**amber** (`reconciliation.tsx:145,187`). The dashboard shows it red whenever it is
greater than zero. Reports show it red only over the threshold.

### Additional findings (not in the brief)

| # | Finding | Evidence |
|---|---|---|
| A1 | Reconciliation's key figure at 1.50:1 | `reconciliation.tsx:154` `tone="accent"` mapped to `text-accent` at `bits.tsx:43` |
| A2 | Icons break hard rule 6. `strokeWidth={1.5}` sits in a 24-unit viewBox with no `vector-effect`, so rendered stroke scales with size: 0.75px at `size-3`, 1.0px at `size-4`, 1.25px at 20px, 2.0px at `size-8`. `Logo` already uses `non-scaling-stroke`. | `icons/index.tsx:42` vs `:80` |
| A3 | The audit script, described as the floor, **fails today: 111 hits** (109 em dashes, 2 banned fonts). It also has holes: bare `shadow` is not matched (`badge.tsx:11,15`, `checkbox.tsx:14`, `radio-group.tsx:23`, `navigation-menu.tsx:83`, `sidebar.tsx:249,321`), and neither is `background: linear-gradient`. | `scripts/audit-violations.mjs:11,14` |
| A4 | The printed voucher and reconciliation statement, the artifacts an auditor actually sees, use DM Sans and Space Grotesk. Neither is loaded in the popup, so they fall back to system-ui. They also use hardcoded hex colors and lack tabular figures. | `erp.ts:147-157` |
| A5 | Icon codemod damaged copy that users see: "Account created. **IconCheck** your email", and three search placeholders read "**IconSearch** code, name…". | `auth.tsx:102`, `jobbers.tsx:163`, `materials.tsx:141`, `products.tsx:138` |
| A6 | Workflow rail removes the focus outline and provides no replacement (2.4.7). The complete state is color only (1.4.1). Below 38rem the rail scrolls sideways. | `WorkflowRail.tsx:58,64,74,49` |
| A7 | `aria-live="polite"` wraps the **entire route** content, so any re-render inside a page is announced. | `AppShell.tsx:117` |
| A8 | The view-voucher icon button has no accessible name. Post and Cancel rely on `title` only. | `ItemVoucher.tsx:317,324,334` (repeated in `product-inward.tsx`, `bom.tsx`) |
| A9 | Dark theme is never activated: no code adds `.dark`. Yet `__root.tsx:84` advertises a dark `theme-color`, so phones in dark mode get dark browser chrome over a light app. If dark mode were turned on, jobber tile 4 would letter light ink on light blue (**1.96:1**) and DRAFT badges would measure **1.35:1**. | `styles.css:157-210`, `dashboard.tsx:38` |
| A10 | Three different nil glyphs: `"—"` (`erp.ts:67,72`, most tables), `"-"` (`fg-ledger.tsx:119`, `reconciliation.tsx:198`), and `&nbsp;`. Two unit spellings: `KG` (`reconciliation.tsx:140`, `ProductShot.tsx:39`) and `kg` (dashboard). | as cited |
| A11 | `today()` takes the date from `toISOString()`, which is UTC. In India between 00:00 and 05:29 IST, every new voucher defaults to **yesterday's date**. A data issue, not a design one, but it directly breaks the dd/mm/yyyy promise. | `erp.ts:37`, used at `ItemVoucher.tsx:61`, `product-inward.tsx:59`, `adjustment.tsx:53`, `bom.tsx:60` |
| A12 | The marketing mock shows an ISO date, `2026-03-18`. | `ProductShot.tsx:140` |
| A13 | Hovering an outline or ghost button floods it with chrome yellow, which dilutes yellow's meaning on every CSV, Excel and Print button. The default button lifts on hover and has a dangling empty `hover:` class. | `button.tsx:12,14,16` |
| A14 | Input borders measure **1.54:1** on the background and **1.65:1** on a card. `border-strong` measures 2.10:1. WCAG 1.4.11 needs 3:1 for a control's boundary. | `styles.css:133-135` |
| A15 | The contract contradicts itself about the primary action: chrome yellow is "the primary action" (`styles.css:13,119`), and teal is "primary buttons" (`:109`). In code, buttons are teal (`button.tsx:12`), but the dashboard's Reconcile link is yellow (`dashboard.tsx:308`). | as cited |
| A16 | Reconciliation, the domain's core surface, is a row of five equal KPI cards. That is exactly the pattern the dashboard brief rejects. Its totals row sits in `tbody`, not `tfoot`, so the `erp-table` tfoot style (`styles.css:765`) never applies. | `reconciliation.tsx:139-156,191` |
| A17 | Legal body text runs at about 98 characters per line: `max-w-3xl` (48rem) at 15px. | `LegalLayout.tsx:38,72` |
| A18 | Page titles are Title Case in source ("Raw Material Ledger") while nav labels are sentence case ("Raw material ledger"). CSS uppercase hides the mismatch on screen, but it leaks into `<title>`, screen readers and print. | `fg-ledger`, `reports.tsx:104`, `navigation.ts:131` |
| A19 | The hero shows "100% voucher traced" as a statistic. `PRODUCT.md` forbids fabricated metrics. This is a claim about the design rather than a measurement, but it is styled as a measurement. | `index.tsx:168` |
| A20 | Core files are **untracked**: `src/components/icons/`, `src/components/legal/`, `src/routes/legal/`, `ProductShot.tsx`, `Screenshot.tsx`, `scripts/`. Lovable syncs from git, so a clean checkout of `main` may not build. | `git status` |

**Where the brief's example finding is wrong:** `--muted-foreground` on `--background`
measures **6.17:1** in light mode and 7.32:1 in dark, not 4.2:1. Muted text is not the
problem. The semantic colors are.

**What works and should be left alone:** the color identity; the custody board's concept
and its once-only settle motion; `prefers-reduced-motion` handling (`styles.css:805-835`,
which is better than most design systems); the skip link; `:focus-visible` rings; the
en-IN number formatters (`erp.ts:13-35`, which already give lakh grouping, e.g.
`1,23,456.789`); UTC-pinned date parsing (`erp.ts:45-63`); the sidebar's production-line
path; the 4px spacing grid; the page gutters (`AppShell.tsx:112`); and the single
`--shadow-float`.

---

## 2. Design principles

Each principle can be checked mechanically or by inspection.

1. **Type is assigned by role class, never by tag.** No rule in `@layer base` sets
   `font-family`, `font-size`, `font-weight` or `text-transform` on an element selector.
2. **If it ends with a full stop, it is not uppercase.** Signage case is for labels,
   titles and figures of four words or fewer. Sentences are sentence case in every face.
   Source strings are always sentence case, and uppercasing happens only in CSS.
3. **Red means the material does not add up.** Every rendered tomato pixel traces to
   loss, wastage over threshold, long-out custody, or a quantity shortfall that blocks a
   post. It is applied only through the status components in `src/components/erp/status/`.
4. **A figure is ink.** A number takes color only from a status component that states its
   condition in words. Color is never used for emphasis on a number.
5. **Nothing mixed-case below 12px, nothing at all below 11px.** 11px is allowed only for
   uppercase labels at weight 600. The audit enforces this.
6. **Every visual encoding has a text twin in the same DOM.** Tile width has a kg and %
   text, a color has a word, a red band has a day count. A screen-reader pass of any
   surface loses no fact.
7. **Motion happens once, on arrival. After that, only color changes.** The exceptions are
   indeterminate progress indicators and the custody tile's lettering lift. Data refetches
   never animate.

---

## 3. Design tokens

### 3.1 Type

**Families: two.**

| Family | Before | After | Reason |
|---|---|---|---|
| Big Shoulders Display | `wght@500..900` | `wght@600..800` | 600, 700 and 800 are the weights in use. One variable file either way (35 KB latin). |
| Archivo | `ital,wdth,wght` full axes (90 KB roman latin; italic 102 KB if triggered) | `wght@400..700`, roman only (35 KB) | No `font-stretch` or width utility is used anywhere. Weights in use are 400/500/600/700 (`font-medium` x66, `font-semibold` x104, `font-bold` x19, `font-normal` x4). No italic text exists outside the hero. |
| Instrument Serif | loaded, roman and italic | **removed** | Used once, for one word (`index.tsx:144`). 22 KB and a third voice for a single word. |
| JetBrains Mono | `wght@100..800` (40 KB) | **removed** | Used twice in product UI (`dashboard.tsx:507,571`, codes) and once in `chart.tsx`. Archivo with `tnum` already aligns digits. Voucher codes like `PI-2026-0042` scan fine in Archivo `num` at weight 500. |

Measured latin woff2 transfer: **app about 166 KB down to 70 KB; landing about 148 KB down
to 70 KB.** These sizes are what Google Fonts served a Chrome user agent on 2026-10-09.

**Hero emphasis replacing the serif:** "proven" stays in the headline face and changes
only color (`--primary`) and weight (800 against 700). It is a painter switching paint on
one word, which Signboard already does. An alternative is in Open questions.

**Verify before shipping:** the `₹` (U+20B9) glyph in Archivo's latin subset. No currency
is rendered today (see Open questions), but it will be.

**Scale.** One scale, two registers: **app** (fixed steps, dense) and **marketing** (fluid,
expressive). The boundary is the route. Marketing classes are allowed only under `/`,
`/auth` and `/legal/*`, and the audit enforces this by path.

App register, fixed (all rem values assume a 16px root):

| Token / utility | Face | Size / line-height | Weight | Tracking | Case | Replaces |
|---|---|---|---|---|---|---|
| `type-label` | Archivo | 11px / 1.3 | 600 | +0.08em | upper | `label-xs` 10px +0.14em, `label-sm` 11px +0.11em, `erp-table th` 10px +0.06em, `.rule-eyebrow` 10px +0.16em, all `text-[9px]`/`text-[10px]` uppercase |
| `type-caption` | Archivo | 12px / 1.45 | 400 or 500 | 0 | sentence | `text-[11px]` mixed case (hints, notes, footers) |
| `type-ui` | Archivo | 13px / 1.45 | 400 to 600 | 0 | sentence | `text-[13px]`, `text-[0.8125rem]`, table body, nav rows |
| `type-body` | Archivo | 14px / 1.55 | 400 | 0 | sentence | body default (unchanged, `styles.css:237`) |
| `type-heading` | Archivo | 16px / 1.25 | 600 | -0.01em | sentence | dialog titles, `Panel` titles (now uppercase 14px at `bits.tsx:81`) |
| `sign-sm` | Big Shoulders | 20px / 0.95 | 800 | +0.005em | upper | tile names (`dashboard.tsx:695`) |
| `sign-md` | Big Shoulders | 24px / 0.95 | 800 | +0.005em | upper | section titles (`.sign text-2xl`) |
| `sign-lg` | Big Shoulders | 32px, 40px at lg / 0.95 | 800 | +0.005em | upper | `PageHeader` (`AppShell.tsx:157`) |
| `figure-md` | Big Shoulders | 40px / 0.92 | 800 | +0.005em | n/a | `.readout text-[2.5rem]` |
| `figure-lg` | Big Shoulders | 56px, 76px at sm / 0.92 | 800 | +0.005em | n/a | custody total (`dashboard.tsx:284`) |

Marketing register, fluid:

| Token | Face | Size | Line-height | Weight | Tracking | Case |
|---|---|---|---|---|---|---|
| `display-hero` | Big Shoulders | `clamp(2.75rem, 1.9rem + 3.6vw, 4.5rem)` | 0.98 | 700 | 0 | sentence |
| `display-section` | Big Shoulders | `clamp(2rem, 1.6rem + 1.8vw, 2.875rem)` | 1.0 | 700 | 0 | sentence |
| `display-sub` | Archivo | `clamp(1.25rem, 1.1rem + 0.7vw, 1.625rem)` | 1.15 | 600 | -0.015em | sentence |
| `lead` | Archivo | `clamp(1rem, 0.95rem + 0.25vw, 1.0625rem)` | 1.6 | 400 | 0 | sentence |
| `prose` | Archivo | 15px | 1.65 | 400 | 0 | sentence |

The marketing register gets the display face, which P3 asks for and which makes the
landing page and the product look like one family. It is set in sentence case per
principle 2, and **tracking is never negative on Big Shoulders**. A condensed face has
already spent its spacing, and -0.035em (`index.tsx:142`, `auth.tsx:141`) closes the
counters. Large Archivo may track to -0.015em at most.

**Measure.** Replace `measure` (34rem) and `measure-tight` (26rem) with values in `ch`, so
the measure tracks font size:

| Utility | Value | Use |
|---|---|---|
| `measure` | `66ch` | marketing lead and body, legal prose (fixes A17), page subtitles |
| `measure-narrow` | `48ch` | notes, empty states, form hints |
| (none) | uncapped | tables and dense UI. Columns set their own width. |

### 3.2 Color

The palette identity is unchanged. These are the changes, with measured results:

| Token | Before (light) | Ratio | After (light) | Ratio | Notes |
|---|---|---|---|---|---|
| `--loss` (new; `--destructive` becomes an alias, then is removed) | `oklch(0.6 0.2 33)` | 3.95 on bg; white on it 4.15 | `oklch(0.53 0.19 33)` | **5.29** on bg; white on it **5.56**; on its own 10% tint 4.53 | Same hue, deeper enamel. Passes as text and as a plate. |
| `--success` | `oklch(0.54 0.12 160)` | 4.35; POSTED badge 3.73 | `oklch(0.5 0.11 160)` | **5.17**; on its 10% tint 4.51 | |
| `--info` | `oklch(0.55 0.08 220)` | 4.31 | `oklch(0.5 0.08 220)` | **5.32** | |
| `--input` | `oklch(0.83 0.012 110)` | 1.54 / 1.65 on card | `oklch(0.6 0.015 110)` | **3.59** / **3.86** | Fixes 1.4.11. Inputs read as ruled boxes, which suits a ledger. |
| `--border-strong` | `oklch(0.74 0.016 110)` | 2.10 | `oklch(0.62 0.016 110)` | **3.31** | Used where a rule carries meaning (table head, totals). `--border` stays decorative at 1.33. |
| `--accent` as **text** | 1.40 to 1.50 | | **banned** | | Yellow is a field color, never a text color on light grounds. If yellow-family text is ever needed, use `--accent-ink: oklch(0.45 0.1 85)` (7.34). |

Dark theme fixes, required only if dark mode ships (see Open questions):
`--chart-6` tile ink becomes `--background` (7.97, was 1.96); `--input` needs about
`oklch(0.56 0.02 210)` (0.5 measured 2.78, so verify ≥3:1); the DRAFT plate uses
`--warning` fill with ink text (9.13) instead of a tint.

Unchanged and passing: foreground 16.43; muted-foreground 6.17 / 5.68 on subtle; primary
7.13; primary on primary-foreground 7.49; accent plate 10.77; all sidebar text pairs
(lowest is `sidebar-subtle` on `sidebar-accent`, 4.58); tiles 1 to 4 in light mode
(5.46 to 7.49).

**Roles, resolving A15:**

- **Teal = act.** Buttons, links, focus rings, the shell.
- **Chrome yellow = here.** The warehouse field, the active nav station, selection, the
  current-period bar. It is not used for buttons or hover. The yellow Reconcile link at
  `dashboard.tsx:308` becomes a teal button. Outline and ghost hover becomes `--subtle`.
- **Tomato = does not add up.** See principle 3.
- **Amber (`--warning`) = look at this.** Below minimum stock, no BOM, DRAFT, data failed
  to load, form validation.
- **Green (`--success`) = settled.** POSTED. Nothing else. Ledger inward columns go back
  to ink.

**Status tokens.** Each one is consumed only by components in `src/components/erp/status/`:

```
--status-posted-fg / -bg / -rule      success family
--status-draft-fg  / -bg / -rule      ink on warning
--status-cancelled-fg / -bg / -rule   muted-foreground on muted, with the word "Cancelled" (not red)
--loss / --loss-foreground            tomato
--long-out (alias of --loss)          named separately so the dashboard reads true
--attention / --attention-foreground  amber plate (warnings, errors)
```

How misuse becomes structurally awkward:
1. `@theme` exposes `--color-loss`, but the shadcn `destructive` variants are removed from
   `Button` and `Badge`.
2. The audit bans `(text|bg|border)-(loss|destructive)` outside `src/components/erp/status/`
   and `src/components/ui/`.
3. A red figure must be written as `<LossFigure>`, whose required `reason` prop
   (`"wastage" | "long-out" | "short" | "write-down"`) also renders the accessible text.

**Cancel actions are not red.** Cancelling a voucher is a reversal, and the landing page
promises that "every voucher is reversible". The confirm button is an ink-filled button
labelled with the consequence ("Cancel PV-2411"). The confirmation dialog provides the
friction that red would otherwise imply.

**Print** (`erp.ts:146-159`): hex colors are tolerated in the popup document, since tokens
do not exist there, but the values are named constants derived from the tokens, the fonts
load the same Google URL, and a `num` class sets tabular figures. `styles.css:846`
`#ccc` becomes `var(--color-border-strong)`.

### 3.3 Spacing

**Leave it alone.** It sits on the Tailwind 4px grid. Named here for the surface specs:
page gutter 12/16/24px (`AppShell.tsx:112`), section gap 48px (`mt-12`), panel padding
16px, table cell 7px by 12px (`styles.css:742`). The only change is a touch-density
override (section 6).

### 3.4 Radii

Six radii a pixel apart (`styles.css:35-40`: 2/3/4/5/6/8) cannot be told apart and invite
arbitrary choices. Change the values only, not the names, so no call sites change:

| Name | Before | After | Role |
|---|---|---|---|
| `xs`, `sm` | 2, 3 | 2 | plates, badges, tiles, kbd |
| `md`, `lg` | 4, 5 | 4 | controls, panels, cards |
| `xl`, `2xl` | 6, 8 | 8 | floating surfaces only |

Fix the stray `rounded-[0.5rem]` at `AppNavigation.tsx:309`.

### 3.5 Elevation

**Leave it alone.** Paint is flat, and `--shadow-float` is the one shadow. The fix is in
enforcement: remove the bare `shadow` classes listed in A3, and add `\bshadow\b(?!-)` and
`shadow-(?!float|none)` to the audit.

### 3.6 Motion

| Token | Value | Before | Use |
|---|---|---|---|
| `--ease-settle` | `cubic-bezier(0.22, 1, 0.36, 1)` | 6 ad hoc copies, plus 2 near-duplicates `(0.23, 1, 0.32, 1)` at `styles.css:347,592` | all entry motion |
| `--ease-loop` | `cubic-bezier(0.4, 0, 0.2, 1)` | `styles.css:376` | indeterminate progress |
| `--dur-instant` | 120ms | 120, 150 | hover color, row wash |
| `--dur-quick` | 200ms | 150 to 220, `duration-200` x17 | buttons, nav, link underline, tile lettering |
| `--dur-enter` | 240ms | 240, 260, 380 (`auth-stage`) | route and section entry |
| `--dur-settle` | 720ms | 700, 720 | board settle, bar growth |
| (none) | | 500ms sheet open (`sheet.tsx:34`), 300ms close | sheets use `--dur-enter` / `--dur-quick` |

What moves, and when:

- **On entry (once):** `route-stage`, `rise` (staggered), `board-settle`, `grow-x`, `grow-y`.
- **On interaction:** color, background, border and opacity only. Allowed transforms are
  the 1px press (`active:translate-y-px`), the `link-slide` underline, the tile lettering
  lift (the dashboard brief's signature) and the `+` rotation on New voucher.
- **Never:** hover lift on buttons (remove `hover:-translate-y-px` at `button.tsx:12`),
  number tickers, refetch animation, toasts that bounce.
- **Loops:** only for indeterminate waits: `route-progress`, skeleton sheen, `IconSpin`.
  `animate-pulse` on the status dot (`dashboard.tsx:257`) and the skeletons in
  `StockSummary.tsx` should use the `skeleton` utilities. The skeleton sheen is a
  gradient. That is a documented exception to "flat paint", because it is a loading
  instrument rather than paint.
- **Data rule:** a value animates only when the user caused the change (posting a voucher
  moves the balance). Background refetches swap values in place. Today this holds
  because tiles and bars are keyed by stable ids. Keep the keys stable.
- **Reduced motion:** keep `styles.css:805-835` as it is. Add `.rise`, `.grow-x` and
  `.grow-y` to the explicit `animation: none` list so they cannot depend on the 0.01ms
  hack.

### 3.7 Iconography

Fix hard rule 6 (A2) by adding `vector-effect: non-scaling-stroke` to every drawn
element. It does not inherit, so set it in CSS (`[data-icon] :is(path,line,circle,rect,polyline,polygon,ellipse) { vector-effect: non-scaling-stroke }`)
with `data-icon` on `Svg` in `icons/index.tsx:36`. Every icon then renders a true 1.5px
stroke at any size. Size steps: 14, 16 and 20px only. `size-3` (12px) is too small to
draw at 1.5px, and `size-8` decorative glyphs (`StockTable.tsx:23`) become 20px inside a
plate.

---

## 4. Component specifications

All components live where they live today. Proposed new files are marked **new**.

### PageHeader (`AppShell.tsx:143`)
- **Anatomy:** `h1.sign-lg`, optional subtitle (`type-body`, muted, `measure`), actions
  slot, and a 1px bottom rule.
- **Variants:** default. `compact` for phone (`sign-lg` held at 32px, actions wrap below).
- **Change:** add the `sign-lg` class (this unblocks P1); drop the unused `breadcrumb` prop
  once its call sites are gone.

### SectionHead (`dashboard.tsx:636`, promote to `bits.tsx`)
- **Anatomy:** `h2.sign-md`, an optional teal `link-slide` link, and a 2px ink rule below.
- Used for every section title in the app. Replaces `Panel` titles that render uppercase
  Archivo (`bits.tsx:81`).

### Figure (`dashboard.tsx:616`, promote to `bits.tsx`)
- **Anatomy:** whole part, then a smaller fraction and unit (0.45em / 0.4em at 60% opacity).
- **Variants:** `md`, `lg`; unit `kg | pcs | %`.
- **Rule:** always ink, or wrapped in `LossFigure`. Units are lowercase SI (`kg`, `pcs`).
- **A11y:** `aria-label` gives the full value ("1,23,456.789 kilograms"), because a split
  fraction can be read as two numbers.

### KpiCard (`bits.tsx:25`): **retire**
Its only consumer is reconciliation (`reconciliation.tsx:140-155`), and the statement
component replaces it. Its `tone` prop is how yellow text reached a figure (A1).

### Statement (**new**, `erp/Statement.tsx`)
The reconciliation equation as a ruled ledger strip:
`Received − Std. consumed − Wastage − Returned ± Adjustment = Balance with jobber`.
- **Anatomy:** term cells holding a `type-label` name and a `figure-md` value, with
  operator glyphs between cells (aria-hidden). The result cell takes `figure-lg`, a
  double ink rule above (the accounting convention for a total) and the label "Balance
  with jobber".
- **States:** loading (skeleton per cell); balanced (balance is 0.000, and the result
  plate reads "Settled" in `--status-posted`); negative balance (`LossFigure reason="short"`).
- **Responsive:** a row when the container is at least 56rem; otherwise a vertical
  list with right-aligned figures and a rule before the result.
- **A11y:** an `<dl>`. Operators are spoken through a visually hidden sentence: "Received
  minus consumed minus wastage minus returned, plus adjustment, equals balance."

### StatusPlate (**new**, replaces `StatusBadge` at `AppShell.tsx:169`)
- **Variants:** `posted`, `draft`, `cancelled`. Each uses its status tokens with a 1px
  rule and `type-label` text. Text is always the word; color is never the only signal.
- **Cancelled** additionally sets the row's figures to `line-through` at 55% opacity
  (DESIGN.md already describes this).

### LossFigure, LongOutPlate (**new**, `erp/status/`)
- `LossFigure`: a `Figure` in `--loss`, with required `reason` and visually hidden text
  ("wastage", "over threshold", "short by").
- `LongOutPlate`: the tile band (`dashboard.tsx:709`). Its text is "42 days no movement",
  and it is the tile's `aria-describedby` target. At 12px semibold it needs ≥4.5:1, which
  the new `--loss` gives (5.56).
- `AttentionPlate`: amber plate with ink text and an alert glyph, for low stock, no BOM,
  load failure and validation.

### Button (`ui/button.tsx`)
- **Variants:** `default` (teal), `outline` (ink rule; hover `--subtle`), `ghost` (hover
  `--subtle`), `ink` (**new**: foreground fill, used for consequential confirms such as
  cancel or delete), `link`. `destructive` and `secondary` are **removed** (`secondary` has
  no distinct role).
- **Sizes:** `sm` 32px, `default` 36px, `lg` 44px, `icon` 36px. Under `pointer: coarse`,
  `sm`, `default` and `icon` grow to 44px (section 6).
- **States:** rest, hover (color only), active (1px press), focus-visible (2px ring with
  offset, as today), disabled (50% opacity, `aria-disabled` kept focusable when a tooltip
  explains why), busy (`IconSpin` plus a changed label, as `auth.tsx` does).
- **Rule:** an icon-only button requires `aria-label`. Type this as a discriminated prop:
  `size="icon"` requires `label`, rendered as `aria-label` plus a tooltip. That fixes A8.

### Badge (`ui/badge.tsx`)
Remove the bare `shadow` and the `destructive` variant. Status meaning goes through
`StatusPlate`; `Badge` is for neutral counts and categories only.

### Input, NumInput, Field (`ui/input.tsx`, `bits.tsx:160-204`)
- **Input:** 36px (44px coarse), border `--input` (3.59:1), focus ring 2px teal.
  `aria-invalid` shows the amber rule plus a message below.
- **Field:** the label becomes `type-label` (11px upper; it is 11px today via an arbitrary
  value). The hint becomes `type-caption` (12px). The hint is linked by `aria-describedby`;
  today it is not linked.
- **NumInput:** switch from `type="number"` to `type="text" inputMode="decimal"`, with
  en-IN grouping on blur and raw digits while focused. `type="number"` changes value on
  scroll-wheel, cannot show lakh grouping, and its `Number(v) || 0` coercion
  (`bits.tsx:201`) needs checking against partially typed decimals ("12."). Always show
  three decimals for kg once committed.

### SearchSelect (`bits.tsx:94`)
Keep it. Raise the hint (`text-xs` today) to `type-caption`. The selected-row check uses
opacity, which is fine. Add `aria-label` to the trigger when there is no visible `Field`
label.

### Panel (`bits.tsx:66`)
Title becomes `SectionHead` style (`sign-md`) or no title. `CardTitle` at 14px uppercase
Archivo is a third heading voice and goes away.

### Table (`erp-table` utility, `styles.css:729`)
- `th`: `type-label` (11px, was 10px), `--border-strong` rule below.
- `td`: `type-ui` 13px, 7px by 12px padding. **Leave the density.** Rows are about 34px,
  which suits a desktop ledger. On coarse pointers, action cells grow instead (section 6).
- Totals go in `<tfoot>` (fixes `reconciliation.tsx:191`) with a double rule above.
- Numbers right-aligned, `num`. The nil glyph is the en dash `–` (U+2013), exported once
  from `erp.ts` as `NIL`. It replaces the three variants in A10 and clears the em-dash
  audit hits that are placeholders rather than prose.
- Sticky first column when the table scrolls sideways.
- `EmptyRow`: `type-body`, muted, with an optional action link, as on the dashboard.

### Nav row and sidebar (`AppNavigation.tsx`, `styles.css:383-460`)
**Leave the design alone.** It is good. Changes: the group label (`AppNavigation.tsx:199`,
11px mixed case) becomes `type-label`; the 10px `kbd` (`:293`) becomes 11px; rows are
32px on fine pointers and 44px in the mobile sheet.

### WorkflowRail (`WorkflowRail.tsx`)
- Restore focus: replace `focus-visible:outline-none` (`:58`) with the system ring.
- Complete state: add a check glyph inside the step number, and visually hidden "done".
- The step number becomes `type-label` (was 10px).
- Below 38rem: a single line, "Step 2 of 5 · Issue", with previous and next links. No
  sideways scroll.

### BoardTile and custody board (`dashboard.tsx:681`)
See the dashboard surface brief in section 5. Component-level changes:
- The link's accessible name carries the facts: "Shree Plastics, 1,234.500 kg, 18 percent
  of custody, last moved 12/08/2026. Open reconciliation." Use `aria-describedby` to point
  at the note and the long-out plate, rather than replacing the visible text.
- Lettering stays exactly as it is.

### Toast (`ui/sonner.tsx`)
`richColors` (`__root.tsx:142`) paints error toasts red. Map them: error toasts use
`AttentionPlate` styling; only a toast reporting a loss-type outcome may be red. Position
top-right on desktop, bottom-center on phone, so it is not under the header band.

### Dialog and Sheet
Keep `--shadow-float`. Durations follow the motion tokens. Voucher dialogs
(`ItemVoucher.tsx:352`, `max-w-3xl`) become a full-height sheet below 40rem.

### Skeleton
Keep `skeleton-line` and `skeleton-block`. Retire `animate-pulse` blocks.

---

## 5. Surface specifications

Same template as `.impeccable/surfaces/src-routes-authenticated-dashboard-tsx.md`. The
shared OWN-WORLD paragraph is not repeated; it applies to all of them. Each brief below is
meant to be saved as its own file in `.impeccable/surfaces/` when the surface is worked on.

### 5.1 Dashboard (`/dashboard` plus shell): **exists, amend only**
The brief stands. Amendments:
- **A11Y:** tile link names carry kg, share and last movement (section 4). The companion
  table (`dashboard.tsx:361`) adds the Warehouse row and the "N more" row, and drops the
  `slice(0, 8)` cap or states "Showing 8 of N". The table is the board's text twin, so it
  must be complete.
- **TRUTH:** tiles below 6% are drawn at 6% (`dashboard.tsx:686`), and `sm:min-w-40` widens
  small tiles further. The visible % label is the honest value; keep both, and the brief
  should say that width is approximate under 6%.
- **RESPONSIVE:** use a container query instead of `sm`. Tiles go in one row when the
  board container is at least 62rem (6 tiles x 10rem); otherwise a 2-column grid down to
  36rem; below that, stacked under the weight strip (already built, `dashboard.tsx:337`).
  This prevents up to 6 x 160px tiles overflowing a 640 to 960px container (likely; not
  verified in a browser).
- **COLOR:** the Reconcile action becomes teal (A15). The "Live" status pill (`:243`) keeps
  ink and yellow. The error pill becomes an amber `AttentionPlate`.
- **LONG-OUT:** make the 30-day threshold (`dashboard.tsx:32`) an admin setting next to the
  wastage threshold (see Open questions).

### 5.2 Reconciliation (`/reconciliation`)
Scope: jobber reconciliation statement. Mode: Prove.
Audience: owner and accountant settling with a jobber, sometimes in front of the jobber.
Task: state, for one jobber and period, what was sent, what the BOM says was used, what
was wasted and returned, and what must still be on their floor.
THESIS: A reconciliation is an equation, not a dashboard. Retire the 5 KPI cards
(`reconciliation.tsx:139-156`) for one `Statement` strip that reads left to right and
ends in the balance.
FIRST VIEWPORT: `PageHeader` "Reconciliation"; the filter bar (jobber, from, to) in one
row; the Statement with the balance as the largest figure on the screen; then the
per-material table.
SIGNATURE: The double-ruled balance cell. When the balance is 0.000 kg it reads
"Settled" on a posted plate. A negative balance is a `LossFigure reason="short"`.
STORY: Arrive from a dashboard tile (jobber pre-selected via `?jobber=`), read the
balance, scan the materials for the line that does not close, open its ledger, then print.
PRINT: The printed statement is the artifact that leaves the building. It uses the same
Statement structure, company header, Archivo with tabular figures, and the three
signature boxes (`reconciliation.tsx:246-250`).
COLOR: Wastage is ink unless over threshold (then `LossFigure`); this ends the amber
contradiction. Balance is ink.
MOBILE: Statement as a vertical list; the material table scrolls sideways with the
material column sticky.
EMPTY: "Select a jobber" becomes a `SearchSelect` placed in the empty state itself.

### 5.3 Daily-flow vouchers (`/transactions/*`, `ItemVoucher.tsx`, `product-inward.tsx`, `adjustment.tsx`)
Scope: RM inward, transfer, product inward, material return, adjustment. Mode: Enter.
Audience: store staff, desktop, many vouchers a day, keyboard-first.
Task: post a correct voucher fast; find and correct a wrong one.
THESIS: A register with an entry sheet, not a form page. The register is the page; a new
voucher opens over it and returns to it with the new row highlighted once.
FIRST VIEWPORT: `WorkflowRail` (the stage is the location), `PageHeader` with "New
voucher" as the only teal button, then the register.
SIGNATURE: On product inward, the BOM consumption block shows standard use, entered
wastage, and the resulting wastage % next to the threshold in one ruled line. Over the
threshold it becomes a `LossFigure`; the post button stays enabled but its label changes
to "Post with 7.40% wastage". That is a decision made visible, not a block.
KEYBOARD: Enter in the last line row adds a row; Ctrl+Enter posts; Esc closes with a
confirm if the voucher is dirty. Tab order runs left to right through each line.
ROW ACTIONS: view, post and cancel use icon buttons with names (A8). Cancel opens an
`ink` confirm naming the voucher.
DATES: default from a local-date `today()` (fix A11), shown dd/mm/yyyy. The native date
input shows the OS locale; open question whether to replace it.
MOBILE: Supported for viewing. Posting works but gets no bespoke design (Open questions).
The dialog becomes a full-height sheet below 40rem.

### 5.4 Stock (`/inventory/*`, `StockOverview.tsx`, ledgers)
Scope: warehouse, jobber stock, finished goods, RM and FG ledgers. Mode: Look up.
Audience: both; the owner on phone for "how much X do we have, and where".
THESIS: Stock pages answer one item's position. Ledgers answer how it got there.
FIRST VIEWPORT: summary measures (`StockSummary.tsx`) as `Figure`s in a ruled board like
the dashboard's month board; location filter; search; table.
COLOR: below-minimum rows get an `AttentionPlate` "Below minimum" in the balance cell, not
red text (`StockTable.tsx:113`). Ledger in and out columns are ink (A10, P6).
NIL: `–` everywhere.
MOBILE: summary stacks 2-up; the table keeps code, name and balance and puts the rest
behind a row disclosure. Ledgers scroll sideways (intentionally not reflowed).

### 5.5 Reports (`/reports`)
Scope: production register, wastage by jobber, product-wise, consumption. Mode: Review and export.
Audience: owner and accountant, desktop.
THESIS: Every report is a table you can hand to someone. The filter bar is shared and
sticky; tabs switch the table, not the filters.
COLOR: wastage over threshold is a `LossFigure`; under threshold is ink (today green,
`reports.tsx:187`; green is reserved for posted).
EXPORT: `ExportBar` stays. Outline buttons, with hover `--subtle` instead of yellow.
TABS: labels in sentence case ("Wastage by jobber").
MOBILE: not a target. Tables scroll; export works.

### 5.6 Masters (`/masters/*`)
Scope: jobbers, raw materials, finished products, BOM. Mode: Maintain.
Audience: admin and store, occasional.
THESIS: Masters are reference cards, rarely edited. A searchable table with an edit sheet.
COLOR: "No BOM" is an `AttentionPlate` (`products.tsx:167`). BOM revision status uses
`StatusPlate`.
COPY: fix the "IconSearch" placeholders (A5).
BOM SIGNATURE: the primary material row is marked with a "Primary" label and an
explanation of why it absorbs wastage, because that rule (`bom.tsx:225`) surprises people.

### 5.7 Admin (`/admin`)
Scope: users and roles, company settings, audit trail. Mode: Configure.
Audience: admin only.
THESIS: Settings that change printed documents show a print preview of the header next to
the fields.
ADD: the long-out days threshold next to the wastage threshold.
AUDIT TRAIL: an `erp-table` with dd/mm/yyyy hh:mm (24-hour) timestamps.

### 5.8 Marketing (`/`)
Scope: landing. Mode: Persuade.
Audience: owners of job work units evaluating a tool; often on phone from a WhatsApp link.
THESIS: The landing page is the product's signboard. Same paint, same lettering,
sentence case because it speaks in sentences.
FIRST VIEWPORT: `display-hero` in Big Shoulders sentence case, "proven" in teal 800; lead
paragraph at `measure`; one teal CTA plus a text link; the voucher product shot.
FIX: the stats strip (`index.tsx:164-177`) loses "100%" (A19) or gets reworded as a
property ("Every voucher traced"); its `dt`/`dd` are inverted (value in `dt`, label in
`dd`; swap them). Mock dates become dd/mm/yyyy (A12). Mock units become lowercase `kg`.
SECTIONS: section headings use `display-section`; eyebrows use `type-label`.
MOBILE: hero stacks with the shot below the CTA; the stats strip becomes 3 columns of
`type-label` text, already fine at 320px.

### 5.9 Auth (`/auth`)
Scope: sign in, create workspace. Mode: Enter.
THESIS: The teal board on the left is the shop sign; the form on the right is the counter.
FIX: 9px lines (`auth.tsx:131,187`) become `type-label` at full `sidebar-subtle` (5.84:1);
`/45`, `/35` and `/60` alpha text become `sidebar-subtle` or `sidebar-foreground`
(currently 3.22, 2.51, 4.55). The h1 tracking becomes 0. The Google "G" glyph in Big
Shoulders (`auth.tsx:316`) should be the real Google mark per Google's branding rules, or
plain text. The `auth-grid` class (`auth.tsx:124`) has no CSS behind it; delete it. Fix
the "IconCheck" toast (A5). Replace the em dash at `auth.tsx:144`.

### 5.10 Legal (`/legal/*`)
Scope: terms and privacy. Mode: Read.
THESIS: A document. Prose at `measure` (66ch), headings in `type-heading`, the title as
`sign-lg` (it is a title, not a sentence).
FIX: 98ch lines (A17).

### 5.11 System pages (404, error, `/type`)
404 and error use `sign-lg` and `type-body` explicitly (`__root.tsx:20,48`). The error
page's buttons use `Button`, not hand-rolled classes. `/type` is removed from production
(gate it to dev or delete it). It has served its purpose: this spec makes the decision it
was built to inform.

---

## 6. Accessibility requirements

- **Conformance target:** WCAG 2.2 AA, plus two product rules above AA: 44px targets on
  coarse pointers, and the type floor in principle 5.
- **Contrast:** every pair in section 3.2 is re-measured by committing the scratch
  contrast script as `scripts/contrast.mjs` and running it in CI over both themes.
  Thresholds: text 4.5, large text (24px, or 18.66px bold) 3.0, control boundaries and
  meaningful rules 3.0.
- **Targets:** WCAG 2.2 AA (2.5.8) requires 24px, and every control passes today (the
  smallest are 24px nav nodes inside 32px rows). The 44px rule is a product decision for
  the owner on a phone: under `@media (pointer: coarse)`, buttons, nav rows, inputs and
  table action cells are at least 44px. Desktop density is unchanged.
- **Keyboard:** fix the rail focus (A6). Every icon button is named (A8). Ctrl+B is
  documented (`aria-keyshortcuts` is already present). Voucher keyboard paths per 5.3.
- **Live regions:** remove `aria-live` from the route wrapper (A7). Announce only
  outcomes: post succeeded, post failed, figures failed to load. The `role="status"` pill
  (`dashboard.tsx:245`) is right.
- **Custody board:** link names carry the facts; the companion table is complete (5.1);
  the long-out plate is text, not color only, and was already correct; the mobile weight
  strip stays `aria-hidden` because the list repeats it.
- **Production sparkline** (`dashboard.tsx:441`): `role="img"` with a full label is
  correct. Keep it.
- **Language:** `<html lang="en">` is fine. Use `lang="en-IN"` if spoken numbers should
  follow Indian grouping in screen readers that support it (verify with NVDA).

---

## 7. Responsive strategy

Breakpoints come from content. Where possible they are container queries, because the
sidebar changes the available width.

| Content | Breakpoint | Behavior |
|---|---|---|
| Sidebar | viewport 64rem (`lg`, unchanged) | 16rem sidebar + 48rem minimum main, enough for a 7-column ledger. Below it, the teal header band and sheet. |
| Custody board | container 62rem / 36rem | row / 2-column grid / stack (5.1) |
| Statement | container 56rem | row / list |
| Workflow rail | container 38rem | full rail / "Step n of 5" line |
| Voucher dialog | viewport 40rem | dialog / full-height sheet |
| Ledger tables | none | always tabular; scroll sideways with a sticky first column |
| Stock tables | container 36rem | full columns / code, name, balance plus disclosure |
| Marketing hero | container 60rem | two columns / stacked |

**Persists at every width:** the custody total, the long-out count, every balance, the
status of every voucher.

**Not supported on small screens, on purpose:** bespoke voucher posting layouts, multi-tab
reports, and admin. These must work without horizontal page scroll, with all scrolling
contained in the tables, but they get no phone design.

The `min-width: 320px` on body (`styles.css:233`) stays.

---

## 8. Migration plan

Each step is one commit or PR, ships alone, and reverts alone. Because Lovable syncs
`main`, nothing below rewrites history, and each step keeps the branch building.

**Step 0: stabilize the tree.** Commit the untracked foundations (A20) after the
in-progress work lands. Verify with a clean clone, `npm ci && npm run build`.
*Breaks if:* any file references a still-untracked path.

**Step 1: copy and print fixes. No visual risk.**
A5 strings; A12 mock dates; `auth-grid` deletion; local-date `today()` (A11); the print
stylesheet fonts and colors (A4); delete `WorkflowJourney.tsx` plus `.journey-*` CSS;
gate or remove `/type`.
*Verify:* grep `Icon[A-Z][a-z]+ [a-z]` in strings returns nothing; post a voucher at
00:30 IST (mock the clock); print a reconciliation.

**Step 2: audit hardening, report-only.**
Add rules: bare `shadow`, `background:.*gradient` (with the skeleton exempted),
`text-\[(9|10|11)px\]`, `(text|bg|border)-(destructive|loss)` outside the allowed
directories, `text-accent\b`, Instrument Serif and JetBrains Mono, `font-mono`. Record
today's counts as a baseline; CI fails only when a count **rises**. Split em dash
detection: prose em dashes fail; placeholders migrate to `NIL`.
*Verify:* the script prints a per-rule baseline that matches this document.

**Step 3: contrast token values.**
`--loss` (alias `--destructive` to it), `--success`, `--info`, `--input`,
`--border-strong`. `reconciliation.tsx:154` drops `tone="accent"`. Commit
`scripts/contrast.mjs`.
*Breaks if:* the darker tomato reads as a different brand red. Compare the dashboard
long-out tile before and after. *Revert:* the values only.

**Step 4: type utilities (additive).**
Add `type-*`, `sign-*`, `figure-*`, `display-*`, `lead`, `prose` and the `ch`-based
`measure`. No consumers yet, so nothing changes visually.

**Step 5: make heading consumers explicit, then remove tag styling.**
Add classes at `AppShell.tsx:157`, `index.tsx:142`, `auth.tsx:141`, `LegalLayout.tsx:40`,
`__root.tsx:20,48`, and every `h2`/`h3` that relies on the base rule. In the **same**
commit, delete `styles.css:246-263` (keeping `text-wrap: balance`).
*Breaks if:* any heading was missed, in which case it renders Archivo 400. *Verify:*
screenshot `/`, `/auth`, `/legal/terms`, `/dashboard`, `/reconciliation`,
`/transactions/product-inward`, `/masters/bom`, `/reports`, `/admin` and a 404 before and
after; every `<h1>` to `<h4>` in `src` carries a type class (a grep check added to the
audit).

**Step 6: fonts.**
Swap the Google Fonts URL (`__root.tsx:109`); remove `--font-serif` and `--font-mono`
(`styles.css:31-32`); replace `font-mono` at `dashboard.tsx:507,571` and `chart.tsx`;
change the hero emphasis.
*Verify:* network panel shows 2 font files; the `₹` glyph renders in Archivo; voucher
codes remain scannable in the register.

**Step 7: retire arbitrary sizes, file by file.**
One commit per file group (shell and nav; bits; dashboard; stock; vouchers; marketing;
auth). Mapping: `text-[9px]`/`text-[10px]` uppercase to `type-label`; `text-[10px]`/
`text-[11px]` mixed case to `type-caption`; `text-[13px]`/`0.8125rem` to `type-ui`;
marketing `clamp()` to `display-*`; arbitrary tracking deleted. Then retire `label-xs`
and `label-sm` (aliasing them to `type-label` for one release).
*Verify:* the audit count for rule `text-\[(9|10|11)px\]` reaches 0; screenshot diff per group.

**Step 8: status components.**
Add `erp/status/`; replace the 9 misuses in P6; remove the `destructive` variants from
`Button` and `Badge`; add the `ink` button; map Sonner error toasts. Then promote the
audit rule from report-only to failing.
*Breaks if:* a `variant="destructive"` call site is missed. TypeScript catches it once the
variant is removed.

**Step 9: motion tokens.** Replace the 8 bezier copies and the duration values; remove
the hover lift; set sheet durations. *Verify:* reduced-motion on and off on the dashboard
and in the voucher sheet.

**Step 10: icon stroke.** Add `data-icon` and the `vector-effect` CSS. *Verify:* a
specimen of 14, 16 and 20px glyphs shows equal stroke widths; `Logo` is unaffected.

**Step 11: accessibility fixes.** A6, A7, A8, board link names and the companion table.
*Verify:* keyboard-only run through post voucher, open reconciliation and print; an NVDA
pass on the dashboard.

**Step 12: touch density.** `pointer: coarse` overrides. *Verify:* emulate a phone; no
target below 44px in the sheet nav or voucher rows.

**Step 13: surface rework,** one surface per PR, in this order: reconciliation Statement
(5.2), dashboard amendments (5.1), stock (5.4), vouchers (5.3), reports (5.5), masters
(5.6), marketing and auth (5.8, 5.9). Write each surface brief into
`.impeccable/surfaces/` in the same PR.

**Step 14: radii values.** Change values only. Reverting is a one-line change per token.

**Step 15: dark theme**, only if Open question 1 resolves yes.

---

## 9. Open questions

1. **Ship dark mode or delete it?** It is unreachable today (A9), and its tokens have two
   failures. Recommendation: delete the `.dark` block and the dark `theme-color` meta
   until someone asks for it. Godown offices are bright, and an untested theme is a
   liability. This needs the owner's call.
2. **Color of errors.** This spec makes validation and system errors amber, to keep red
   meaning loss. That breaks a strong convention (red = error). Recommendation: try amber
   with an alert glyph on one surface (vouchers) and watch whether staff miss errors.
   Needs user testing that I cannot do.
3. **Hero emphasis.** Teal at weight 800 (chosen) versus "proven" lettered uppercase in
   the same face, as a stamp. The second is more Signboard but breaks principle 2
   mid-sentence. This is a taste call.
4. **Phone posting.** Is voucher posting from a phone a real job (a store hand on the floor
   with a tablet)? If so, 5.3 needs a bespoke phone design and the keyboard-first thesis
   weakens.
5. **Currency.** No amounts are rendered anywhere in the app. The landing page mentions
   "rate" on inward (`index.tsx:45`), but the UI does not show it. If rates and values
   arrive, the spec needs a `INR()` formatter (en-IN, `₹`, lakh/crore abbreviations for
   figures only: "₹1.24 Cr", never in tables) and a decision on paise display.
6. **Long-out threshold.** 30 days is hardcoded (`dashboard.tsx:32`). It probably varies by
   material and jobber. Is it a company setting, or per jobber?
7. **Date input.** The native `<input type="date">` displays in the OS locale, which is
   often mm/dd/yyyy on PCs bought abroad. Do we replace it with a dd/mm/yyyy text field
   with a calendar popover? The calendar component exists (`ui/calendar.tsx`).
8. **Is Signboard itself right?** Yes, and I would not argue otherwise. The one structural
   weakness is A15: the contract had two "primary" colors. Section 3.2 resolves it inside
   the identity (teal acts, yellow locates) rather than changing it.

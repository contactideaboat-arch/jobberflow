# JobberFlow — Design Brief

Adapted from an institutional design brief and rewritten for this codebase. Product truth lives in `PRODUCT.md`; tokens and component rules live in `DESIGN.md`. This file is the direction every remaining screen is designed against.

Act as a senior product designer, information designer and interaction designer who has shipped operational software people use eight hours a day. You are designing a **working instrument of accountability**, not an ERP template.

---

## 01 — Core thesis

> **Every kilogram has a place, and the screen shows where.**

JobberFlow should feel like a custody ledger you can see: material leaves the godown, sits with a jobber, comes back as product, wastage or a return, and the app proves every step.

Not: "an ERP with a dashboard, a sidebar and twenty CRUD tables."

The experience communicates:

- accountability
- precision
- speed for daily entry
- calm for occasional review
- trust in the numbers

without becoming:

- a generic admin template
- a SaaS dashboard of equal KPI cards
- an accounting package
- decorative or "Indian-themed"

## 02 — Absolute rule

**Do not compose screens out of cards.**

Do not use:

- grids of equal stat cards
- rounded containers around every section
- glass, gradients, glows, drop shadows on resting surfaces
- pill buttons and pill badges everywhere
- icon-in-a-tile feature rows
- fake or rounded numbers
- "Welcome back 👋" chrome
- charts that exist because dashboards have charts

Use instead (all already in the Signboard system, see `DESIGN.md`):

- signage lettering for titles and headline figures
- painted flat fields where colour carries meaning (custody board)
- framed boards with ruled panels for grouped figures
- ledger tables: dense, ruled, tabular figures, decimals aligned
- 2px ink rules under section heads
- metadata set small, monospaced for codes and voucher numbers
- whitespace between sections instead of boxes

Tables are allowed and expected. This is a ledger product; a table is the honest form for rows of vouchers. Cards are not.

## 03 — Principles

**01 — Objects before modules.**
Do not think "the Transactions module". Think: what are the actual things? A **voucher**, a **jobber**, a **material**, a **product**, a **BOM revision**, a **ledger line**. Each is a first-class object with its own page.

**02 — Evidence before claims.**
Never write "Wastage under control." Show the vouchers, the BOM standard, the actual consumption and the difference. Every figure on every screen must be traceable to the vouchers that produced it, one click away.

**03 — Sequence before totals.**
Totals are fine, but the story is the movement: issued on 25 Aug, 252 kg, challan 01, vehicle GJ-01…; nothing back in 45 days. Show the chain, then the sum.

**04 — Metadata is part of the design.**
Voucher numbers, challan numbers, vehicle numbers, dates, UOM and status are visual language, not database noise:

```
JTR-2026-0002          POSTED
DASRATH BHAI CTM       25 AUG 2026
CHALLAN 01             250.000 KG
```

Small, uppercase labels in Archivo; codes and numbers in JetBrains Mono; generous spacing.

**05 — Every important object gets a permanent home.**
Today most screens are lists with local state. Target URLs:

| Object | Target route | Today |
|---|---|---|
| Jobber | `/masters/jobbers/$jobberId` | list only |
| Material | `/masters/materials/$materialId` | list only |
| Product | `/masters/products/$productId` | list only |
| BOM | `/masters/bom/$bomId` | list only |
| Voucher (any type) | `/transactions/<type>/$voucherId` | dialog inside list |
| Reconciliation | `/reconciliation?jobber=$id&from=&to=` | `?jobber` done; dates local |
| Ledger filtered | `/inventory/rm-ledger?material=$id` | local filters |

Filters, date ranges and selections live in search params so any view can be bookmarked, shared on WhatsApp, and printed.

## 04 — Visual direction: Signboard

The visual world is **Signboard**, chosen by the user on 2026-10-09 and recorded in `DESIGN.md`. It replaces the original brief's ivory/terracotta palette.

| Role | Token | Use |
|---|---|---|
| Shell | enamel teal `--sidebar` | sidebar, header band |
| Ground | off-white board `--background` | page |
| Ink | `--foreground` | text, 2px rules |
| Primary | enamel teal `--primary` | links, default buttons, focus |
| Signal | chrome yellow `--accent` | warehouse field, live dot, the one high-intent action |
| Loss | tomato `--destructive` | wastage, long-out material, cancel only |
| Paints | `--chart-1/3/4/6` | jobber tiles, data series |

Rules: flat paint; no gradients; `--shadow-float` only on popovers, sheets and dialogs; red never decorates.

## 05 — Typography

Three levels, already loaded in `src/routes/__root.tsx`:

| Level | Face | Use |
|---|---|---|
| Sign | Big Shoulders Display 800, uppercase (`.sign`, `.readout`, every `h1`) | page titles, section heads, headline figures, tile names |
| Interface | Archivo | navigation, buttons, body, labels, table text |
| Record | JetBrains Mono | voucher numbers, codes, challan, vehicle numbers |

Signage lettering stays out of controls, table cells and form labels. Hierarchy comes from scale and weight, not boxes.

## 06 — Grid

- App shell: sidebar 16rem (rail 4.25rem) + content `max-w-[90rem]`.
- Content: 12 columns on desktop. Asymmetric splits by default (7/5, 5/7, 8/4), not 4/4/4.
- Tables run full content width; never squeeze a ledger into a third.
- Mobile: recompose, don't shrink. Tiles stack with a weight strip; tables drop secondary columns; actions move to the bottom of the form.

## 07 — Shell

Built (`AppNavigation.tsx`, `AppShell.tsx`):

- Teal sidebar ordered by the working day: Dashboard → Daily flow (drawn as a connected production line) → Stock → Analysis → Masters; Users & settings in the footer.
- "New voucher" menu for writers only; collapse to icon rail with Ctrl+B.
- Solid teal header band naming "Group · Page"; no kicker labels, no glass.

Still to do: global search (§30) and the read-only state shown once, quietly, in the header band.

## 08 — Dashboard (the "homepage")

Built. Narrative order:

```
WHERE IS MY MATERIAL?        custody board, tiles sized by kg, long-out plate
          ↓
WHO HAS IT, FOR HOW LONG?    jobber table with days quiet
          ↓
WHAT CAME BACK?              month board: produced / wastage / avg / FG ready
          ↓
WHAT NEEDS ACTION?           below minimum · latest inwards
```

Never: KPI row → chart → table → chart.

## 09 — The three stocks

The original "what we preserve" becomes **the three places material can be**:

1. **Warehouse**: raw material in the godown (`warehouse_stock`)
2. **With jobbers**: raw material out for work (`jobber_stock`)
3. **Finished goods**: product back and ready (`finished_goods_stock`)

`/inventory/warehouse`, `/inventory/jobber-stock` and `/inventory/finished-goods` should feel related but deliberately unequal: the warehouse page is a reorder view (minimums, cover), the jobber page is a custody view (who, how much, how long), the finished goods page is a dispatch view.

## 10 — Jobber index (replaces "Field Atlas")

`/masters/jobbers` becomes the place you meet each jobber, not a CRUD table.

One row per jobber, set as an editorial list:

```
DASRATH BHAI CTM                    252.000 KG HELD
CTM · AHMEDABAD                     LAST MOVED 25 AUG 2026 · 45 DAYS
ISSUED 252.000   CONSUMED 0.000   WASTED 0.000   RETURNED 0.000
```

A thin flow bar per row: issued split into consumed / wasted / returned / still held. Click opens the jobber record (§18). Add and edit stay available but move behind the record, not in front of it.

## 11 — Featured record

On the dashboard, a long-out jobber is the featured record (built as the red plate). On reports, the worst-wastage voucher of the period gets the same treatment: large figure, small metadata, "Open the voucher →".

## 12 — Reconciliation reveal (replaces "Before / After")

The signature interaction for accountability. On `/reconciliation`:

```
ISSUED                       ACCOUNTED FOR
252.000 KG       →           consumed per BOM   0.000
                             wastage            0.000
                             returned           0.000
                             still held       252.000
                             ─────────────────────────
                             variance           0.000
```

The issued bar and the accounted bar sit side by side; the accounted bar is built segment by segment. A non-zero variance is painted tomato and links to the vouchers that cause it. The motion has a reason: it shows the ledger closing.

## 13–14 — Voucher viewer (replaces "Tadpatra viewer")

Every voucher opens as a document, not a dialog:

- left: the challan as printed: header block, line items, totals, signatures area
- right: the record panel

```
VOUCHER       JTR-2026-0002
TYPE          Transfer to jobber
STATUS        POSTED
DATE          25 AUG 2026
JOBBER        Dasrath Bhai CTM →
CHALLAN       01
VEHICLE       —
POSTED BY     store@… · 25 AUG 2026 14:02
```

Then the trail from `audit_logs`: created, posted, cancelled (with reason). Then **Related**: the materials on it, the jobber, later inwards against the same jobber. Print uses the same layout (`printElement`).

## 15–16 — Ledger search (replaces "Archive")

`/inventory/rm-ledger` and `/inventory/fg-ledger` become a research room:

- one search: "Search vouchers, materials, jobbers, challans…"
- filters in search params: object type, material, jobber, date range, voucher type, status
- results as an editorial list with thin rules, not a card grid:

```
25 AUG 2026   JTR-2026-0002   TRANSFER    PP GRANULES     −250.000 KG   →
15 AUG 2026   JTR-2026-0001   TRANSFER    PP GRANULES       −2.000 KG   →
```

Running balance column, decimals aligned, every row opens its voucher.

## 17–18 — Jobber record (replaces "Project detail")

`/masters/jobbers/$jobberId`:

- header: name in sign lettering, code, city, contact, status
- **Holding now**: the material lines with them (`jobber_stock`)
- **Movement**: chronological sequence of transfers, inwards, returns
- **Performance**: wastage % by voucher and product, against BOM standard
- **Reconcile**: link to `/reconciliation?jobber=…` with the reveal
- **Related**: products they make, BOMs used

## 19–20 — Activity journal (replaces "Field Journal")

A chronological journal of what happened, built from voucher headers and `audit_logs`:

```
9 OCT 2026
14:02   POSTED      JTR-2026-0003   Transfer to Dasrath Bhai CTM   250.000 kg
11:40   CANCELLED   PIN-2026-0007   "wrong product"                 by admin
```

Grouped by day, filterable by user and voucher type. This replaces "recent activity" widgets.

## 21–22 — Company and people (replaces "About / Trustees")

`/admin` becomes two calm pages:

- **Company**: name, GST, address and voucher prefixes from `company_settings`, set as a letterhead preview
- **People**: each user as a row with role (admin, store, management, viewer), what that role can do in plain words, and last activity. No avatar cards.

## 23 — Audit (replaces "Transparency")

Audit trail as document-first design: every change with who, when, what, before → after. Filter by object. Export CSV and Excel using the existing `downloadCsv` / `downloadExcel`.

## 24–25 — Voucher entry (replaces "Donation")

Posting a voucher is the conversion. Design it like the donation page brief: honest, simple, nothing extra.

- split on desktop: left 5 columns = context (current warehouse balance of each chosen material, the jobber's holding, BOM standard for the product); right 7 columns = the form
- fields in the order the paper challan is filled
- line items as a ledger grid with keyboard entry (Enter to add a row, Tab across)
- totals and the effect on stock shown live: "Warehouse PP granules 328.000 → 78.000 kg"
- one primary action: **Post voucher**, chrome yellow; Save draft secondary
- errors name the problem and the fix: "Only 78.000 kg in the warehouse. Reduce the quantity or receive more first."

## 26 — Quiet pathways (replaces "I have something to preserve")

Where a master is missing, offer a quiet inline path instead of a dead end: "Material not in the list? **Add raw material**" without leaving the voucher.

## 27–29 — Not applicable

Films, partners and an institutional footer do not apply inside the app. The public landing page (`src/routes/index.tsx`) and the legal pages carry the footer; bring them into Signboard and remove their eyebrow labels (`label-xs`, `.rule-eyebrow`).

## 30 — Search

Ctrl+K opens full-screen search (not a dropdown):

```
Search vouchers, jobbers, materials, products…

VOUCHERS     JTR-2026-0002 · Transfer · Dasrath Bhai CTM
JOBBERS      Dasrath Bhai CTM · 252.000 kg held
MATERIALS    PP granules · 78.000 kg in warehouse
PAGES        Stock adjustment
ACTIONS      New transfer to jobber
```

Built on the existing `cmdk` (`src/components/ui/command.tsx`).

## 31 — Motion

Motion communicates state, once:

| Moment | Motion |
|---|---|
| Custody board load | tiles settle from equal widths to their weight (built) |
| Reconciliation | accounted bar builds segment by segment |
| Posting a voucher | affected balances tick to new values |
| Navigation | 150–250 ms, no page choreography |
| Rail collapse | width 200 ms (built) |

Never: bounce, parallax, staggered page loads, count-up numbers on every figure. `prefers-reduced-motion` removes all of it (already handled in `styles.css`).

## 32–33 — Imagery

The app has no photography; **data is the imagery**: painted fields, flow bars, the printed challan. The landing page may use real photographs of granules, moulds, finished buckets and tubs, and the godown, never stock imagery. Until real photos exist, use the product screenshots (`ProductShot`, `Screenshot`).

## 34–35 — Micro typography and source labels

Every figure can say where it came from:

```
SOURCE   jobber_stock · 9 OCT 2026 14:05
BASIS    BOM REV 2 · STANDARD 1.240 KG / PC
```

Use on reports, reconciliation and the voucher viewer. This is what makes the numbers feel audited, not generated.

## 36 — Mobile

Mobile users are mostly the owner checking position. Priorities: position → long-out jobbers → today's activity → search. Voucher entry on mobile is a single column with a sticky Post bar. Tables drop secondary columns; nothing scrolls sideways to reach the key figure.

## 37 — Accessibility

Keyboard-first entry for store staff; visible focus everywhere (teal ring, yellow in the shell); semantic headings (one `h1` per page); tables with real `<th>`; colour never the only signal (red plates always carry text); WCAG AA contrast on every paint; reduced motion honoured.

## 38 — Discoverability

The authenticated app is private: keep it `noindex`. Structured data, Open Graph and canonical URLs apply to the landing and legal pages only. Inside the app, "discoverability" means search params and deep links (§03.05, §30).

## 39 — Information architecture

```
JOBBERFLOW
├── Dashboard                     /dashboard
├── Daily flow
│   ├── Raw material inward       /transactions/rm-inward[/$id]
│   ├── Transfer to jobber        /transactions/transfer[/$id]
│   ├── Product inward            /transactions/product-inward[/$id]
│   ├── Material return           /transactions/material-return[/$id]
│   └── Stock adjustment          /transactions/adjustment[/$id]
├── Stock
│   ├── Raw material stock        /inventory/warehouse
│   ├── Stock at jobbers          /inventory/jobber-stock
│   ├── Finished goods            /inventory/finished-goods
│   ├── Raw material ledger       /inventory/rm-ledger
│   └── Finished goods ledger     /inventory/fg-ledger
├── Analysis
│   ├── Reports centre            /reports
│   └── Jobber reconciliation     /reconciliation
├── Masters
│   ├── Jobbers                   /masters/jobbers[/$id]
│   ├── Raw materials             /masters/materials[/$id]
│   ├── Finished products         /masters/products[/$id]
│   └── Bills of material         /masters/bom[/$id]
└── Users & settings              /admin
```

## 40 — The object graph

Every record links to its neighbours. Bottom of every detail page: **Related**.

```
RAW MATERIAL ─→ BOM ITEM ─→ BOM ─→ FINISHED PRODUCT
     │                                    │
     └─→ TRANSFER ─→ JOBBER ←─ PRODUCT INWARD
              │           │          │
              └──── RETURN    CONSUMPTION + WASTAGE
```

From a material you can reach every voucher that moved it; from a jobber, every material they hold and every product they made; from a voucher, everything it touched.

## 41 — Ask the ledger (future)

Not a chat bubble. A quiet "Ask" field inside search: "How much PP is with Dasrath?", "Which jobber had the highest wastage in September?" Every answer cites the vouchers and ledger lines it used. Read-only; never posts.

## 43 — Anti-slop rules

Never: purple/blue gradients · glass · blobs · equal stat-card rows · pill everything · icon tiles · fake metrics · count-up animations on load · "Welcome back" banners · colored background on every section · eyebrow labels above headings · generic copy ("Streamline your operations") · random fonts · decorative red.

## 45 — Signature experiences

1. **Custody board**: where every kilogram is (built)
2. **Reconciliation reveal**: issued vs accounted, closing the ledger
3. **Voucher viewer**: the challan as a document with its trail
4. **Ledger search**: Ctrl+K and the research-room ledgers
5. **Activity journal**: the day's work as a record

Five moments. Everything else stays quiet.

## 47 — Deliverables and status

| # | Deliverable | Status |
|---|---|---|
| 01–09 | Philosophy, identity, type, colour, spacing, grid, components, motion | Done: `DESIGN.md`, `.impeccable/design.json` |
| 10–12 | Dashboard desktop + mobile | Done |
| — | Sidebar + header shell | Done |
| 13 | Voucher entry (5 forms, shared `ItemVoucher.tsx`) | To do |
| 14 | Voucher viewer + routes | To do |
| 15 | Ledger search (RM, FG) | To do |
| 16 | Reconciliation reveal | To do |
| 17 | Jobber index + record | To do |
| 18 | Stock pages (warehouse, jobber, FG) | To do |
| 19 | Activity journal | To do |
| 20 | Reports centre | To do |
| 21 | Masters: materials, products, BOM records | To do |
| 22 | Admin: company, people, audit | To do |
| 23 | Global search (Ctrl+K) | To do |
| 24 | Sign-in page | To do |
| 25 | Landing + legal in Signboard | To do |
| 26 | 404 / empty / loading / error states | Partly (dashboard done) |

## Pass order

Do not redesign twenty screens in one shot.

1. ~~Art direction~~: Signboard, `DESIGN.md` ✔
2. ~~Dashboard + shell~~: visual grammar proven ✔
3. **Transfer to jobber**: prove voucher entry + voucher viewer on the busiest form, then roll to the other four through `ItemVoucher.tsx`
4. **Reconciliation**: prove the reveal
5. **Jobber index + record**: prove object pages and the graph
6. **Ledgers + Ctrl+K search**: prove the research room
7. **Stock pages + reports**: prove analysis
8. **Masters + admin + audit**: prove the institutional layer
9. **Sign-in, landing, legal**: bring the public surfaces into Signboard
10. **Mobile pass**: recompose each, don't resize
11. **Systemise**: only then extract shared pieces into `bits.tsx` / `components/erp`

## 48 — Quality bar

Before calling a screen done:

1. Could this be mistaken for a generic admin template? If yes, redo it.
2. Remove the colour: does hierarchy survive on type and rules alone?
3. Does every motion show a state change?
4. Is anything a card only because the content didn't get composed?
5. Can every figure be traced to its vouchers in one click?
6. Can store staff post a voucher without touching the mouse?
7. Can the owner see who is holding material, and for how long, within 5 seconds on a phone?
8. Does the reconciliation actually close, or only claim to?
9. Is every object reachable by URL and printable?
10. Would it still be distinctive with all borders removed?

**The most important instruction:** design from the material itself: kilograms, challans, jobbers, moulds, wastage, time. The interface should feel kept, not generated.

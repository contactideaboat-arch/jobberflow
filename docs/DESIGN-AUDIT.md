# JobberFlow — Product Discovery and Design Audit

Date: 9 October 2026. Method: read the implementation (routes, shared components, hooks, `src/lib/erp.ts`, Supabase migrations) plus live inspection of `/dashboard` and `/transactions/transfer` earlier today. No code was changed for this audit.

**Repo state at audit time (important):**
- Two Claude sessions plus a third party have edited the same files today. `src/styles.css`, `src/components/ui/*`, `AppShell.tsx`, `AppNavigation.tsx` and `dashboard.tsx` are mid-change between two competing visual directions (see §6). Screen notes below describe behaviour, which is stable; visual notes describe the pre-today baseline unless stated.
- **The build is currently broken**: `EmptyRow` was removed from `src/components/erp/bits.tsx` (replaced by `RegisterState`), but 7 files still import it: `ItemVoucher.tsx`, `product-inward.tsx`, `adjustment.tsx`, `reports.tsx`, `reconciliation.tsx`, `admin.tsx`, plus whatever `tsc` lists. All five voucher screens, reports, reconciliation and admin are affected.

---

## 1. Critical findings (fix before visual work)

These are correctness and security problems found while reading the code. They outrank every design item.

| # | Finding | Where | Effect | Severity |
|---|---|---|---|---|
| C1 | **Every new account becomes `store` (write).** `ensure_profile` gives the first user `admin` and every later user without a role `store`. `/auth` offers open email sign-up and Google OAuth. | `supabase/migrations/…0011.sql` L44–60; `src/routes/auth.tsx` | Anyone who registers can post, cancel and edit company data. | Critical |
| C2 | **Ledgers and the audit trail are directly editable.** The policy loop grants insert/update/delete to `can_write()` on all tables including `raw_material_ledger`, `finished_goods_ledger` and `audit_logs`. | same migration L285–300 | Store users can rewrite stock history or delete audit rows outside the posting functions, which breaks "every figure is traceable". | Critical |
| C3 | **Voucher save is not atomic.** Client calls `next_voucher_number` → insert header → insert items → `post_*` as four separate requests. | `ItemVoucher.tsx` L150–200, `product-inward.tsx` L168–205, `adjustment.tsx` L118–140 | A failure mid-way leaves a DRAFT header with no items, or a consumed voucher number. | High |
| C4 | **BOM revision can leave a product with no usable BOM.** Deactivates current BOM (error ignored) → inserts header → inserts items. | `masters/bom.tsx` L159–195 | Failure after step 1 = no active BOM; after step 2 = active BOM with no lines, so product inward fails with "no primary material". | High |
| C5 | **Ledgers can silently truncate.** RM and FG ledgers request 5,000 rows **oldest first**; Supabase's API caps responses at its `max_rows` setting (1,000 by default; this project's value is **unknown**). | `rm-ledger.tsx` L40, `fg-ledger.tsx` L37, `reports.tsx` L46 | Past the cap, the newest movements disappear and the running balance is wrong, with no warning. Reconciliation and reports filter client-side from 2,000 newest headers, so old vouchers drop out of jobber statements. | High |
| C6 | **Loading and errors show "No records found".** `(rows ?? []).length === 0 && <EmptyRow/>` renders the empty message while loading and on error. | 5 voucher screens, reports, reconciliation, admin | An RLS denial or failed request reads as "there is no data". `RegisterState` already fixes this; masters and ledgers use it, transactions do not. | High |
| C7 | **Default voucher date is the UTC date.** `today()` = `new Date().toISOString().slice(0,10)`. | `src/lib/erp.ts` L37 | Between 00:00 and 05:30 IST new vouchers default to yesterday. | Medium |
| C8 | **Public dev page.** `/type` is a typography specimen with no auth. | `src/routes/type.tsx` | Internal page exposed; not a security leak, but shouldn't ship. | Low |

C1 and C2 need a database migration. Schema changes are out of scope for this audit, so they are flagged for an owner decision, not proposed as edits.

## 2. Route inventory

| Route | File | Purpose | Data (tables / RPCs) | Writes | Guard |
|---|---|---|---|---|---|
| `/` | `routes/index.tsx` (422) | Public landing | none | none | public |
| `/auth` | `routes/auth.tsx` (336) | Sign in, sign up, Google | Supabase auth, Lovable OAuth | account | public |
| `/legal/privacy`, `/legal/terms` | `routes/legal/*` | Legal | none | none | public |
| `/type` | `routes/type.tsx` (257) | Type specimen (dev) | none | none | **public** |
| `/dashboard` | `_authenticated/dashboard.tsx` | Position overview | warehouse_stock, jobber_stock, finished_goods_stock, jobbers, finished_products, raw_materials, product_inward_headers, jobber_transfer_headers | none | auth |
| `/transactions/rm-inward` | ItemVoucher config | Purchase / opening receipt | raw_material_inward_headers/items, `post_raw_material_inward` | yes | auth + canWrite (UI) |
| `/transactions/transfer` | ItemVoucher config | Issue to jobber | jobber_transfer_headers/items, `post_jobber_transfer` | yes | same |
| `/transactions/product-inward` | `product-inward.tsx` (634) | Receive FG, BOM consumption, wastage | product_inward_headers, product_inward_consumption, bom_headers/items, jobber_stock, company_settings, `post_product_inward` | yes | same |
| `/transactions/material-return` | ItemVoucher config | Jobber returns RM | material_return_headers/items, `post_material_return` | yes | same |
| `/transactions/adjustment` | `adjustment.tsx` (420) | Stock correction (RM/FG, warehouse/jobber) | stock_adjustments, `post_stock_adjustment` | yes | same |
| `/inventory/warehouse` | StockOverview `all` | RM stock, all locations | warehouse_stock, jobber_stock, jobbers | none | auth |
| `/inventory/jobber-stock` | StockOverview `jobbers` | RM at jobbers | same | none | auth |
| `/inventory/finished-goods` | `finished-goods.tsx` | FG balance | finished_goods_stock | none | auth |
| `/inventory/rm-ledger` | `rm-ledger.tsx` | RM movements + running balance | raw_material_ledger | none | auth |
| `/inventory/fg-ledger` | `fg-ledger.tsx` | FG movements | finished_goods_ledger | none | auth |
| `/masters/jobbers` | `jobbers.tsx` (341) | Jobber CRUD | jobbers | yes | canWrite (UI) |
| `/masters/materials` | `materials.tsx` (296) | RM CRUD, minimum stock | raw_materials, warehouse_stock | yes | same |
| `/masters/products` | `products.tsx` (292) | FG CRUD | finished_products, finished_goods_stock, bom_headers | yes | same |
| `/masters/bom` | `bom.tsx` (518) | BOM revisions | bom_headers, bom_items | yes | same |
| `/reports` | `reports.tsx` (336) | 4 tabs: production, wastage by jobber, product-wise, consumption | product_inward_headers, raw_material_ledger, company_settings | none | auth |
| `/reconciliation` | `reconciliation.tsx` (259) | Jobber accountability statement, printable | jobber_stock, product_inward_headers | none | auth |
| `/admin` | `admin.tsx` (249) | Users & roles, company settings, audit trail | profiles, user_roles, company_settings, audit_logs | admin only (UI + RLS) | auth |

**Modals (all `Dialog`):** new voucher ×5, view voucher ×5, cancel voucher ×5 (reason required), master create/edit ×4, BOM create/revise. **Drawers:** mobile nav `Sheet`. **No** detail routes exist: every object is a list row plus a dialog.

**Unknown:** Supabase `max_rows` setting; whether email confirmation is enforced; deployment target beyond Lovable; whether the landing page is the production marketing site; real user counts and devices.

## 3. Shell and shared component inventory

| Piece | File | Notes |
|---|---|---|
| App shell | `AppShell.tsx` | Desktop sidebar + sticky header + `<main>`; mobile header + `Sheet`. `PageHeader`, `StatusBadge` live here. Being edited by another session. |
| Navigation | `AppNavigation.tsx`, `navigation.ts` | Sidebar grouped by workflow, collapse to rail (Ctrl+B), "New voucher" menu (writers only). Being edited. |
| Workflow rail | `WorkflowRail.tsx` | Receive → Issue → Produce → Reconcile strip on transaction pages. |
| Workflow journey | `WorkflowJourney.tsx` | Large 4-step panel; no longer used on the dashboard. Candidate for removal. |
| KPI band | `Kpi.tsx`, `KpiCards` in `bits.tsx` | Hairline band of figures. Used by reconciliation. |
| Panel | `bits.tsx` `Panel` | `Card` + uppercase title. Used everywhere: the main "card" pattern. |
| SearchSelect | `bits.tsx` | Popover + cmdk combobox. Good; no keyboard "create new" path. |
| Field | `bits.tsx` | Label is uppercase 11px tracked: an eyebrow pattern repeated on every form. |
| NumInput | `bits.tsx` | `type=number`, `Number(v) || 0`: can't clear the field, accepts `e`, no negative guard while typing. |
| ExportBar | `bits.tsx` | CSV / Excel / Print. Good, consistent. |
| RegisterState family | `bits.tsx` | Correct loading/empty/error handling. Adopted by masters + ledgers, not by transactions/reports/admin. |
| StockOverview / Table / Summary | `components/erp/stock/*` | Shared RM stock view, location toggle via `aria-pressed`. |
| ShareBar, Plain, ProductShot, Screenshot | `components/erp/*` | Landing/marketing helpers. |
| Icons | `components/icons/index.tsx` | Hand-authored set, consistent 1.5 stroke. Good asset. |
| UI primitives | `components/ui/*` | shadcn set; Button, Dialog, Tabs, Badge etc. Being edited. |
| Tokens | `src/styles.css` | oklch semantic tokens, `erp-table`, skeletons, `num`. Being edited. |

## 4. Screen audit

Each screen uses the brief's seven points: **Purpose · Problems · Hierarchy · Actions · Preserve · Responsive/a11y · Proposal.**

### 4.1 Dashboard `/dashboard`
- **Purpose:** answer "where is my material and what came back" in seconds.
- **Problems:** mid-edit between two directions; the long-out threshold (30 days) is a constant invented in UI, not a company setting; the wastage figure ignores the real `wastage_warning_threshold`; the queries are capped (200 inwards, 500 transfers).
- **Hierarchy:** custody total → split by location → long-out jobbers → month production/wastage → actions (below minimum, latest inwards).
- **Actions:** primary = open reconciliation for a flagged jobber; secondary = stock at jobbers, product inward register.
- **Preserve:** all figures and links; role-aware nothing (read-only page).
- **Responsive/a11y:** board stacks on mobile with a weight strip; tiles are links with labels.
- **Proposal:** keep the structure; read thresholds from `company_settings` (add a "long-out days" setting only with owner approval); move aggregates server-side later (§8 Phase 3).

### 4.2 Voucher screens (RM inward, transfer, material return) via `ItemVoucher`
- **Purpose:** record material movement fast and correctly; review and cancel.
- **Problems:** C3, C6; the form is a modal (`max-w-3xl`, scrolls inside 90vh) for the most-used task in the app; validation is toast-only (errors vanish, field not marked); icon-only Eye/Ban/Trash buttons have no `aria-label`; voucher view is a dialog with no URL, so it can't be bookmarked or shared; no search or date filter on the register (500 newest only); "Available" shows only for the chosen scope; Enter doesn't add a line.
- **Hierarchy (entry):** party (jobber/supplier) + date → line items with available stock → totals and stock effect → post. **(Register):** voucher no., date, party, qty, status; filters above.
- **Actions:** primary = Post voucher; secondary = Save draft; per-row = View, Post draft, Cancel (reason).
- **Preserve:** prefixes (RMI/JTR/MRT), duplicate-material and insufficient-stock checks, draft → post → cancel lifecycle with reason, extra fields per type, exports, print layout.
- **Responsive/a11y:** form must work single-column on mobile with sticky actions; tables need captions and labelled icon buttons; inline errors with `aria-invalid` + `aria-describedby`.
- **Proposal:** entry as a full page (`/transactions/<type>/new`) or a wide side sheet, not a centred modal; inline field errors; live "stock after posting" line; register with search + date range in URL; voucher detail at `/transactions/<type>/$id`; single server RPC per save (Phase 1, C3).

### 4.3 Product inward `/transactions/product-inward`
- **Purpose:** receive finished goods, apply BOM consumption and one wastage figure.
- **Problems:** same as 4.2; computes consumption client-side from the active BOM (if two are active, `.find` takes the first: relies on C4 being correct); wastage % turns red against the threshold only in the register, not while entering.
- **Hierarchy:** jobber + product → quantity → computed standard consumption per material vs jobber's holding → wastage (kg, %, against threshold) → post.
- **Actions:** as 4.2.
- **Preserve:** BOM base-quantity math, primary-material wastage rule, threshold from settings, batch/challan/production ref fields.
- **Proposal:** same page pattern as 4.2 with a consumption preview table that flags shortfalls and an inline wastage-vs-threshold indicator.

### 4.4 Stock adjustment `/transactions/adjustment`
- **Purpose:** correct physical differences with a mandatory reason.
- **Problems:** C3, C6; one form branches for RM/FG × warehouse/jobber with conditional fields; no "current balance" shown before choosing quantity.
- **Proposal:** show current balance for the chosen item and location, then the after-balance; keep the mandatory reason; same page pattern.

### 4.5 Raw material stock `/inventory/warehouse` and `/inventory/jobber-stock`
- **Purpose:** see RM balances by location; spot low stock.
- **Problems:** two routes render the same component with a different starting toggle; 10-column table on mobile scrolls sideways; search/jobber filter not in URL.
- **Preserve:** combined view, location toggle, minimum vs balance.
- **Proposal:** one route with `?view=` and `?jobber=`; mobile shows material, location, balance, cover only.

### 4.6 Finished goods `/inventory/finished-goods`
- **Purpose:** FG balances. **Problems:** fine functionally; no link to the product's ledger. **Proposal:** row links to `/inventory/fg-ledger?product=`.

### 4.7 Ledgers `/inventory/rm-ledger`, `/inventory/fg-ledger`
- **Purpose:** audit movements with running balance.
- **Problems:** C5 (truncation + client-side running balance); filters local state only; voucher numbers aren't links.
- **Preserve:** filters (material/product, jobber, location, date), running balance, exports.
- **Proposal:** server-side filtering and paging with a server-computed running balance (needs an RPC or view: flag for owner), filters in URL, voucher links.

### 4.8 Masters: jobbers, materials, products `/masters/*`
- **Purpose:** maintain reference data. **Problems:** create/edit in a modal; active toggle is a bare `Switch` in a table cell with no label or confirmation; no detail page (a jobber's holding, history and performance live on other screens). Already on `RegisterState`.
- **Preserve:** code/name required, GST/contact fields, minimum stock, status toggle.
- **Proposal:** keep list + side-sheet edit; add `/masters/jobbers/$id` (holding, movements, wastage, reconcile link) as the first detail page; label the switch ("Active").

### 4.9 BOM `/masters/bom`
- **Purpose:** define standard consumption per product, with revisions.
- **Problems:** C4; uses `next_voucher_number` for BOM numbers (fine); revision deactivates silently.
- **Proposal:** single RPC "create BOM revision" (Phase 1); show the revision history per product; confirm before deactivating.

### 4.10 Reports `/reports`
- **Purpose:** production, wastage by jobber, product-wise, consumption.
- **Problems:** C5/C6; four tabs share filters held in local state; tab not in URL.
- **Proposal:** tabs and filters in URL; same register-state handling; threshold highlighting kept.

### 4.11 Reconciliation `/reconciliation`
- **Purpose:** printable accountability statement per jobber.
- **Problems:** C5 (2,000-header window), C6; date range local; `?jobber=` now supported.
- **Preserve:** statement layout, print, KPI band, company header.
- **Proposal:** dates in URL; computed server-side for the selected jobber only; show variance explicitly.

### 4.12 Admin `/admin`
- **Purpose:** roles, company settings, audit trail.
- **Problems:** C1/C2 context; audit trail capped at 300 with no filter; non-admins see disabled controls rather than a clear read-only explanation.
- **Proposal:** audit tab with filters (user, table, date) and paging; role descriptions in plain words; settings form with inline validation.

### 4.13 Auth `/auth`
- **Purpose:** sign in / create account / Google. **Problems:** C1 (open sign-up), hydration mismatch logged in console (seen live), password rules unknown. **Proposal:** invite-only or admin approval (owner decision); fix hydration.

### 4.14 Landing `/`, legal, `/type`
- **Problems:** "100% voucher traced" is a claim, not evidence; eyebrow labels; `/type` public. **Proposal:** remove or guard `/type`; align landing with the chosen visual direction later.

## 5. Cross-cutting problems

1. **Modal-first workflows.** Every create, view and edit is a centred dialog: no URLs, cramped on laptops, poor on mobile.
2. **Toast-only validation.** Errors disappear and aren't attached to fields.
3. **No object URLs.** Vouchers, jobbers and materials can't be linked, shared or reopened.
4. **Filters in component state.** Refresh loses them; links can't carry them.
5. **Inconsistent register states** (C6).
6. **Icon-only buttons without accessible names** (16 icon buttons; only 2 have `title`, none `aria-label`).
7. **Wide tables on mobile** with sideways scroll as the only strategy.
8. **Naming drift:** page titles mix "JobberFlow" and "JobWork ERP"; "Raw Material Master" vs "Raw materials" in nav.
9. **Uppercase tracked labels everywhere** (`Field`, `Panel` titles, table heads): an eyebrow pattern that flattens hierarchy.
10. **Client-side aggregation** of business figures on capped datasets (C5).

## 6. Proposed design system

### Visual direction: owner decision required
Two directions were implemented today by different sessions:

| | A — Signboard | B — Restrained steel-blue |
|---|---|---|
| Source | Chosen in session 1, recorded in `PRODUCT.md`, `DESIGN.md`, `docs/DESIGN-BRIEF.md` | Requested in session 2's brief ("global design system and app shell") |
| Shell | Enamel-teal sidebar and header | Light shell, white surfaces |
| Accent | Chrome yellow (signal), tomato (loss) | Steel-blue primary, neutral accent |
| Type | Big Shoulders Display for titles/figures + Archivo | Archivo throughout, sentence case |

Everything below is direction-agnostic: the same structure works with either token set.

### Structure (both directions)
- **Tokens:** keep the oklch semantic set already in `styles.css` (background, card, foreground, primary, accent, destructive, success, warning, info, border, ring, sidebar-*). Add `--loss` as an alias of destructive so "red means loss" is enforceable.
- **Type scale (product UI, ratio ~1.2):** 12 / 13 (table) / 14 (body) / 16 / 20 / 24 / 32. Numerals always `tabular-nums`; codes in JetBrains Mono.
- **Spacing:** 4px base; section gap 40–48px; form row gap 16px; table cell 7×12px (current).
- **Radius:** 4–6px controls, 6–8px containers; none on table cells.
- **Elevation:** flat surfaces; shadow only on popover/sheet/dialog.
- **States:** every control ships default, hover, focus-visible, active, disabled, loading; every register ships loading/empty/error via `RegisterState`.
- **Motion:** 150–200 ms state transitions; no page choreography; `prefers-reduced-motion` respected (already).

### Shared components to fix once
| Component | Change | Unblocks |
|---|---|---|
| `RegisterState` | Adopt in every table (removes `EmptyRow`) | C6, build break |
| `VoucherForm` (from `ItemVoucher`) | Page or wide sheet layout, inline errors, live stock effect, keyboard line entry | 5 voucher screens |
| `VoucherDetail` | Route-based view: header metadata, lines, audit trail, print, cancel | 5 voucher screens |
| `Field` | Sentence-case label, `error` prop wired to `aria-invalid`/`aria-describedby` | every form |
| `NumInput` | Text input with decimal parsing, allows empty, rejects negatives | every form |
| `IconButton` | Required `label` prop → `aria-label` + tooltip | 16 icon buttons |
| `FilterBar` | Filters bound to URL search params | ledgers, registers, reports, stock |
| `PageHeader` | Title, one-line purpose, actions; no breadcrumb eyebrow | all pages |
| `Panel` | Optional; prefer section + rule over card where content isn't grouped | all pages |
| `ResponsiveTable` | Column priority prop; mobile hides low-priority columns | all tables |

## 7. Phased implementation plan

**Smallest coherent set with the biggest gain:** Phase 0 + Phase 1. They fix the broken build, the data-integrity risks a redesign would otherwise hide, and the shared components every screen uses, without touching the visual direction.

### Phase 0: unblock (hours)
1. Owner picks visual direction A or B; one session owns shared files.
2. Replace `EmptyRow` imports with `RegisterState` in the 7 files (fixes build + C6).
3. Fix `today()` to local date (C7). Guard or remove `/type` (C8).

### Phase 1: integrity (needs owner approval; schema changes)
4. Decide sign-up policy and default role (C1): e.g. new users get `viewer`; admin promotes.
5. Restrict ledgers and `audit_logs` to insert-via-functions only (C2).
6. One RPC per voucher save and per BOM revision (C3, C4).
7. Confirm Supabase `max_rows`; move ledger running balance and reconciliation to server queries (C5).

### Phase 2: shared components (1–2 days)
8. `Field` with inline errors, `NumInput`, `IconButton`, `FilterBar` (URL params), `ResponsiveTable`.
9. Apply across masters and ledgers first (lowest risk, already on `RegisterState`).

### Phase 3: voucher experience (2–3 days)
10. `VoucherForm` as page/sheet + `VoucherDetail` route, starting with Transfer to jobber, then the other ItemVoucher types, then product inward and adjustment.

### Phase 4: object pages (2 days)
11. `/masters/jobbers/$id` (holding, movements, wastage, reconcile); then material and product pages.

### Phase 5: analysis and admin (1–2 days)
12. Reports and reconciliation with URL state and server aggregates; audit trail filters and paging.

### Phase 6: public surfaces and mobile pass
13. Auth (fix hydration, apply sign-up decision), landing and legal in the chosen direction; mobile recomposition of every table and form.

## 8. Open questions for the owner

1. Visual direction: A (Signboard) or B (restrained steel-blue)?
2. Should anyone be able to create an account, and what role should a new account get?
3. Should `store` users be able to edit ledger rows and delete audit entries directly? (Recommended: no.)
4. What is the Supabase project's `max_rows` setting?
5. Is "long-out" (material with a jobber and no movement) a business rule? If so, how many days, and should it live in Company settings?
6. Is `/` the real marketing site, and are its claims approved?

# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- **Store staff** post vouchers through the working day on office desktop PCs: raw material inward, transfers to jobbers, product inward, returns, adjustments.
- **Owner / management** check stock positions, production and wastage, mostly on desktop, occasionally on phone. Management and viewer roles are read-only.

## Product Purpose

JobberFlow is a BOM, job work, inventory and reconciliation system for a plastic household products manufacturer that outsources manufacturing to third-party units called jobbers. The company sends raw material to jobbers and receives finished goods back. Success means every kilogram sent out is accounted for: consumed per BOM, recorded as wastage, returned, or still lying with the jobber.

## Positioning

Built around the core principle that sending material to a jobber is not consumption. Material stays company stock until a product inward posts BOM consumption and wastage against it, so jobber-wise reconciliation is exact rather than estimated.

## Operating Context

- Daily flow: Receive (raw material inward) → Issue (transfer to jobber) → Receive output (product inward with BOM use and wastage) → Reconcile (returns, adjustments, jobber reconciliation).
- Vouchers move through DRAFT → POSTED → CANCELLED.
- Units: KG for material (3 decimals), PCS for finished goods, en-IN number formatting.
- Roles: admin, store (write); management, viewer (read-only).

## Capabilities and Constraints

- Masters: jobbers, raw materials (with minimum stock), finished products, BOMs with revisions.
- Inventory: warehouse stock, stock at jobbers, finished goods, RM and FG ledgers.
- Reports centre and jobber reconciliation; admin for users, company settings and audit trail.
- Stack: TanStack Start + React 19, Tailwind v4, Supabase. Project syncs with Lovable; pushed history must not be rewritten.

## Brand Commitments

- Name: JobberFlow. Hand-authored icon set in `src/components/icons` (no icon library).
- Visual world "Signboard" chosen by the user on 2026-10-09 (replacing the earlier bone/ink/amber palette): enamel-teal shell, off-white board ground, chrome yellow for the warehouse and primary action, tomato red only for loss and long-out material; Big Shoulders Display for page titles, section titles and figures, Archivo for all UI.

## Evidence on Hand

- Real operational data lives in Supabase. No testimonials, customers or metrics exist for marketing use; do not fabricate them.

## Product Principles

1. Accountability over decoration: every figure traces to a voucher or ledger.
2. The workflow order (receive, issue, produce, reconcile) is the spine of navigation.
3. Fast for repeat daily entry; calm for occasional review.
4. Read-only users see the same truth without write affordances.

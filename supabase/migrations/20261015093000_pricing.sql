-- PRICING
-- Quantity-break prices for finished products, maintained on the product
-- itself. Money is held in paise, not rupees: a rupee column of numeric(14,4)
-- invites a float that quietly loses a paisa, and an integer paise column
-- makes every price exactly the number the operator typed. The app divides by
-- 100 only at the point of display.

create table public.finished_product_price_tiers (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.finished_products(id) on delete cascade,
  -- Quantity at which this rate starts. 0 is the base rate.
  min_quantity numeric(14,3) not null check (min_quantity >= 0),
  -- Paise per unit. 4250 means 42.50.
  unit_price_paise bigint not null check (unit_price_paise >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- Two breaks of the same product cannot start at the same quantity, or the
  -- tier that wins would be arbitrary.
  unique (product_id, min_quantity)
);

create index fp_price_tier_product_idx on public.finished_product_price_tiers(product_id, min_quantity);

grant select on public.finished_product_price_tiers to authenticated;
grant select, insert, update, delete on public.finished_product_price_tiers to service_role;

alter table public.finished_product_price_tiers enable row level security;
create policy "product price tiers readable" on public.finished_product_price_tiers
  for select to authenticated using (true);
create policy "product price tiers written by staff" on public.finished_product_price_tiers
  for all to authenticated using (public.can_write()) with check (public.can_write());
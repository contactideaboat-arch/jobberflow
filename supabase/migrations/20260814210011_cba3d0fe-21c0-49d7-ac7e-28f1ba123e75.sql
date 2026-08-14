
-- ROLES
create type public.app_role as enum ('admin','store','management','viewer');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  created_at timestamptz not null default now()
);
grant select, insert, update on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;
create policy "profiles readable" on public.profiles for select to authenticated using (true);
create policy "own profile insert" on public.profiles for insert to authenticated with check (auth.uid() = id);
create policy "own profile update" on public.profiles for update to authenticated using (auth.uid() = id);

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

create policy "roles readable" on public.user_roles for select to authenticated using (true);
create policy "admins manage roles" on public.user_roles for all to authenticated
  using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

create or replace function public.can_write()
returns boolean language sql stable security definer set search_path = public as $$
  select public.has_role(auth.uid(),'admin') or public.has_role(auth.uid(),'store')
$$;

-- bootstrap: create profile, first user becomes admin
create or replace function public.ensure_profile(_full_name text default null)
returns public.app_role language plpgsql security definer set search_path = public as $$
declare v_uid uuid := auth.uid(); v_role public.app_role; v_count int;
begin
  if v_uid is null then raise exception 'not authenticated'; end if;
  insert into public.profiles(id, email, full_name)
  values (v_uid, (select email from auth.users where id = v_uid), _full_name)
  on conflict (id) do update set full_name = coalesce(excluded.full_name, public.profiles.full_name);
  select role into v_role from public.user_roles where user_id = v_uid limit 1;
  if v_role is null then
    select count(*) into v_count from public.user_roles;
    v_role := case when v_count = 0 then 'admin'::public.app_role else 'store'::public.app_role end;
    insert into public.user_roles(user_id, role) values (v_uid, v_role) on conflict do nothing;
  end if;
  return v_role;
end $$;

-- COMPANY SETTINGS
create table public.company_settings (
  id int primary key default 1,
  company_name text not null default 'My Plastics Company',
  address text, city text, state text, pin_code text,
  gst_number text, phone text, email text,
  wastage_warning_threshold numeric(6,3) not null default 5.000,
  updated_at timestamptz not null default now()
);
grant select, insert, update on public.company_settings to authenticated;
grant all on public.company_settings to service_role;
alter table public.company_settings enable row level security;
create policy "settings readable" on public.company_settings for select to authenticated using (true);
create policy "admins update settings" on public.company_settings for update to authenticated using (public.has_role(auth.uid(),'admin'));
insert into public.company_settings(id) values (1);

-- MASTERS
create table public.jobbers (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  company_name text, contact_person text, phone text, alt_phone text, email text,
  address text, city text, state text, pin_code text,
  gst_number text, pan_number text, remarks text,
  status boolean not null default true,
  created_at timestamptz not null default now(),
  created_by uuid, updated_at timestamptz not null default now(), updated_by uuid
);

create table public.raw_materials (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  category text not null default 'Other',
  uom text not null default 'KG',
  minimum_stock numeric(14,3) not null default 0,
  description text,
  status boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.finished_products (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  category text,
  uom text not null default 'PCS',
  description text,
  status boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.bom_headers (
  id uuid primary key default gen_random_uuid(),
  bom_number text not null unique,
  product_id uuid not null references public.finished_products(id),
  version text not null default 'V1',
  base_quantity numeric(14,3) not null check (base_quantity > 0),
  effective_from date not null default current_date,
  effective_to date,
  active boolean not null default true,
  remarks text,
  created_at timestamptz not null default now(),
  created_by uuid
);

create table public.bom_items (
  id uuid primary key default gen_random_uuid(),
  bom_id uuid not null references public.bom_headers(id) on delete cascade,
  material_id uuid not null references public.raw_materials(id),
  standard_quantity numeric(14,3) not null check (standard_quantity >= 0),
  uom text not null default 'KG',
  sequence int not null default 1,
  is_primary_material boolean not null default false
);
create unique index bom_items_one_primary on public.bom_items(bom_id) where is_primary_material;

-- VOUCHERS
create table public.raw_material_inward_headers (
  id uuid primary key default gen_random_uuid(),
  voucher_number text not null unique,
  voucher_date date not null default current_date,
  transaction_type text not null default 'PURCHASE',
  supplier text, invoice_number text, challan_number text, reference text, remarks text,
  status text not null default 'DRAFT',
  created_at timestamptz not null default now(), created_by uuid,
  posted_at timestamptz, posted_by uuid, cancelled_at timestamptz, cancelled_by uuid, cancellation_reason text
);
create table public.raw_material_inward_items (
  id uuid primary key default gen_random_uuid(),
  header_id uuid not null references public.raw_material_inward_headers(id) on delete cascade,
  material_id uuid not null references public.raw_materials(id),
  quantity numeric(14,3) not null check (quantity > 0),
  remarks text
);

create table public.jobber_transfer_headers (
  id uuid primary key default gen_random_uuid(),
  voucher_number text not null unique,
  voucher_date date not null default current_date,
  jobber_id uuid not null references public.jobbers(id),
  challan_number text, vehicle_number text, reference text, remarks text,
  status text not null default 'DRAFT',
  created_at timestamptz not null default now(), created_by uuid,
  posted_at timestamptz, posted_by uuid, cancelled_at timestamptz, cancelled_by uuid, cancellation_reason text
);
create table public.jobber_transfer_items (
  id uuid primary key default gen_random_uuid(),
  header_id uuid not null references public.jobber_transfer_headers(id) on delete cascade,
  material_id uuid not null references public.raw_materials(id),
  quantity numeric(14,3) not null check (quantity > 0),
  remarks text
);

create table public.product_inward_headers (
  id uuid primary key default gen_random_uuid(),
  voucher_number text not null unique,
  voucher_date date not null default current_date,
  jobber_id uuid not null references public.jobbers(id),
  product_id uuid not null references public.finished_products(id),
  finished_quantity numeric(14,3) not null check (finished_quantity > 0),
  bom_id uuid not null references public.bom_headers(id),
  batch_number text, jobber_challan_number text, production_reference text,
  total_standard_consumption numeric(14,3) not null default 0,
  overall_wastage_kg numeric(14,3) not null default 0 check (overall_wastage_kg >= 0),
  wastage_percentage numeric(10,3) not null default 0,
  primary_material_id uuid references public.raw_materials(id),
  actual_total_consumption numeric(14,3) not null default 0,
  wastage_remarks text, remarks text,
  status text not null default 'DRAFT',
  created_at timestamptz not null default now(), created_by uuid,
  posted_at timestamptz, posted_by uuid, cancelled_at timestamptz, cancelled_by uuid, cancellation_reason text
);
create table public.product_inward_consumption (
  id uuid primary key default gen_random_uuid(),
  product_inward_id uuid not null references public.product_inward_headers(id) on delete cascade,
  material_id uuid not null references public.raw_materials(id),
  standard_consumption numeric(14,3) not null default 0,
  wastage_quantity numeric(14,3) not null default 0,
  stock_before numeric(14,3) not null default 0,
  stock_after numeric(14,3) not null default 0
);

create table public.material_return_headers (
  id uuid primary key default gen_random_uuid(),
  voucher_number text not null unique,
  voucher_date date not null default current_date,
  jobber_id uuid not null references public.jobbers(id),
  reference text, remarks text,
  status text not null default 'DRAFT',
  created_at timestamptz not null default now(), created_by uuid,
  posted_at timestamptz, posted_by uuid, cancelled_at timestamptz, cancelled_by uuid, cancellation_reason text
);
create table public.material_return_items (
  id uuid primary key default gen_random_uuid(),
  header_id uuid not null references public.material_return_headers(id) on delete cascade,
  material_id uuid not null references public.raw_materials(id),
  quantity numeric(14,3) not null check (quantity > 0),
  remarks text
);

create table public.stock_adjustments (
  id uuid primary key default gen_random_uuid(),
  voucher_number text not null unique,
  voucher_date date not null default current_date,
  location_type text not null,
  jobber_id uuid references public.jobbers(id),
  material_id uuid references public.raw_materials(id),
  product_id uuid references public.finished_products(id),
  adjustment_type text not null,
  quantity numeric(14,3) not null check (quantity > 0),
  reason text, remarks text,
  status text not null default 'DRAFT',
  created_at timestamptz not null default now(), created_by uuid,
  posted_at timestamptz, posted_by uuid, cancelled_at timestamptz, cancelled_by uuid, cancellation_reason text
);

-- LEDGERS
create table public.raw_material_ledger (
  id uuid primary key default gen_random_uuid(),
  transaction_date date not null default current_date,
  transaction_type text not null,
  voucher_type text not null,
  voucher_id uuid,
  voucher_number text,
  material_id uuid not null references public.raw_materials(id),
  location_type text not null,
  jobber_id uuid references public.jobbers(id),
  quantity_in numeric(14,3) not null default 0,
  quantity_out numeric(14,3) not null default 0,
  standard_consumption numeric(14,3) not null default 0,
  wastage_quantity numeric(14,3) not null default 0,
  remarks text,
  created_at timestamptz not null default now()
);
create index rml_material_idx on public.raw_material_ledger(material_id, location_type, jobber_id);

create table public.finished_goods_ledger (
  id uuid primary key default gen_random_uuid(),
  transaction_date date not null default current_date,
  transaction_type text not null,
  voucher_type text not null,
  voucher_id uuid, voucher_number text,
  product_id uuid not null references public.finished_products(id),
  jobber_id uuid references public.jobbers(id),
  quantity_in numeric(14,3) not null default 0,
  quantity_out numeric(14,3) not null default 0,
  remarks text,
  created_at timestamptz not null default now()
);

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null,
  entity_id uuid,
  action text not null,
  details jsonb,
  performed_by uuid,
  performed_at timestamptz not null default now()
);

-- GRANTS + RLS for business tables
do $$
declare t text;
begin
  foreach t in array array['jobbers','raw_materials','finished_products','bom_headers','bom_items',
    'raw_material_inward_headers','raw_material_inward_items','jobber_transfer_headers','jobber_transfer_items',
    'product_inward_headers','product_inward_consumption','material_return_headers','material_return_items',
    'stock_adjustments','raw_material_ledger','finished_goods_ledger','audit_logs']
  loop
    execute format('grant select, insert, update, delete on public.%I to authenticated', t);
    execute format('grant all on public.%I to service_role', t);
    execute format('alter table public.%I enable row level security', t);
    execute format('create policy "read all" on public.%I for select to authenticated using (true)', t);
    execute format('create policy "write staff" on public.%I for insert to authenticated with check (public.can_write())', t);
    execute format('create policy "update staff" on public.%I for update to authenticated using (public.can_write())', t);
    execute format('create policy "delete staff" on public.%I for delete to authenticated using (public.can_write())', t);
  end loop;
end $$;

-- STOCK VIEWS
create or replace view public.warehouse_stock as
select m.id as material_id, m.code, m.name, m.category, m.uom, m.minimum_stock,
  coalesce(sum(l.quantity_in),0) as total_in,
  coalesce(sum(l.quantity_out),0) as total_out,
  coalesce(sum(l.quantity_in - l.quantity_out),0) as balance
from public.raw_materials m
left join public.raw_material_ledger l on l.material_id = m.id and l.location_type = 'WAREHOUSE'
group by m.id;

create or replace view public.jobber_stock as
select l.jobber_id, j.code as jobber_code, j.name as jobber_name,
  l.material_id, m.code as material_code, m.name as material_name, m.uom,
  coalesce(sum(l.quantity_in),0) as received,
  coalesce(sum(l.standard_consumption),0) as standard_consumed,
  coalesce(sum(l.wastage_quantity),0) as wastage,
  coalesce(sum(case when l.transaction_type = 'RETURN' then l.quantity_out else 0 end),0) as returned,
  coalesce(sum(case when l.transaction_type = 'ADJUSTMENT' then l.quantity_in - l.quantity_out else 0 end),0) as adjustment,
  coalesce(sum(l.quantity_in - l.quantity_out),0) as balance
from public.raw_material_ledger l
join public.jobbers j on j.id = l.jobber_id
join public.raw_materials m on m.id = l.material_id
where l.location_type = 'JOBBER'
group by l.jobber_id, j.code, j.name, l.material_id, m.code, m.name, m.uom;

create or replace view public.finished_goods_stock as
select p.id as product_id, p.code, p.name, p.uom,
  coalesce(sum(l.quantity_in),0) as total_in,
  coalesce(sum(l.quantity_out),0) as total_out,
  coalesce(sum(l.quantity_in - l.quantity_out),0) as balance
from public.finished_products p
left join public.finished_goods_ledger l on l.product_id = p.id
group by p.id;

grant select on public.warehouse_stock, public.jobber_stock, public.finished_goods_stock to authenticated;
grant select on public.warehouse_stock, public.jobber_stock, public.finished_goods_stock to service_role;

-- HELPERS
create or replace function public.next_voucher_number(_prefix text)
returns text language plpgsql security definer set search_path = public as $$
declare n int;
begin
  execute format('create sequence if not exists public.seq_%s', lower(_prefix));
  execute format('select nextval(''public.seq_%s'')', lower(_prefix)) into n;
  return _prefix || '-' || to_char(now(),'YYYY') || '-' || lpad(n::text, 4, '0');
end $$;

create or replace function public.wh_balance(_material uuid)
returns numeric language sql stable security definer set search_path = public as $$
  select coalesce(sum(quantity_in - quantity_out),0) from public.raw_material_ledger
  where material_id = _material and location_type = 'WAREHOUSE'
$$;

create or replace function public.jb_balance(_jobber uuid, _material uuid)
returns numeric language sql stable security definer set search_path = public as $$
  select coalesce(sum(quantity_in - quantity_out),0) from public.raw_material_ledger
  where material_id = _material and location_type = 'JOBBER' and jobber_id = _jobber
$$;

create or replace function public.fg_balance(_product uuid)
returns numeric language sql stable security definer set search_path = public as $$
  select coalesce(sum(quantity_in - quantity_out),0) from public.finished_goods_ledger where product_id = _product
$$;

-- POSTING FUNCTIONS
create or replace function public.post_raw_material_inward(_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare h record; it record;
begin
  if not public.can_write() then raise exception 'Not authorized'; end if;
  select * into h from public.raw_material_inward_headers where id = _id for update;
  if h is null then raise exception 'Voucher not found'; end if;
  if h.status <> 'DRAFT' then raise exception 'Only DRAFT vouchers can be posted'; end if;
  if not exists (select 1 from public.raw_material_inward_items where header_id = _id) then
    raise exception 'Add at least one material'; end if;
  for it in select * from public.raw_material_inward_items where header_id = _id loop
    insert into public.raw_material_ledger(transaction_date, transaction_type, voucher_type, voucher_id, voucher_number,
      material_id, location_type, quantity_in, remarks)
    values (h.voucher_date, 'INWARD', 'RM_INWARD', h.id, h.voucher_number, it.material_id, 'WAREHOUSE', it.quantity, it.remarks);
  end loop;
  update public.raw_material_inward_headers set status='POSTED', posted_at=now(), posted_by=auth.uid() where id=_id;
  insert into public.audit_logs(entity_type, entity_id, action, performed_by) values ('RM_INWARD', _id, 'POSTED', auth.uid());
end $$;

create or replace function public.post_jobber_transfer(_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare h record; it record; avail numeric; mname text;
begin
  if not public.can_write() then raise exception 'Not authorized'; end if;
  select * into h from public.jobber_transfer_headers where id = _id for update;
  if h is null then raise exception 'Voucher not found'; end if;
  if h.status <> 'DRAFT' then raise exception 'Only DRAFT vouchers can be posted'; end if;
  if not exists (select 1 from public.jobber_transfer_items where header_id = _id) then
    raise exception 'Add at least one material'; end if;
  for it in select * from public.jobber_transfer_items where header_id = _id loop
    avail := public.wh_balance(it.material_id);
    select name into mname from public.raw_materials where id = it.material_id;
    if it.quantity > avail then
      raise exception 'Insufficient Warehouse Stock for %. Available: % KG, Requested: % KG.',
        mname, to_char(avail,'FM999999990.000'), to_char(it.quantity,'FM999999990.000');
    end if;
    insert into public.raw_material_ledger(transaction_date, transaction_type, voucher_type, voucher_id, voucher_number,
      material_id, location_type, quantity_out, remarks)
    values (h.voucher_date, 'TRANSFER_OUT', 'TRANSFER', h.id, h.voucher_number, it.material_id, 'WAREHOUSE', it.quantity, it.remarks);
    insert into public.raw_material_ledger(transaction_date, transaction_type, voucher_type, voucher_id, voucher_number,
      material_id, location_type, jobber_id, quantity_in, remarks)
    values (h.voucher_date, 'TRANSFER_IN', 'TRANSFER', h.id, h.voucher_number, it.material_id, 'JOBBER', h.jobber_id, it.quantity, it.remarks);
  end loop;
  update public.jobber_transfer_headers set status='POSTED', posted_at=now(), posted_by=auth.uid() where id=_id;
  insert into public.audit_logs(entity_type, entity_id, action, performed_by) values ('TRANSFER', _id, 'POSTED', auth.uid());
end $$;

create or replace function public.post_product_inward(_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare h record; bi record; std numeric; total_std numeric := 0; primary_id uuid;
  avail numeric; required numeric; mname text;
begin
  if not public.can_write() then raise exception 'Not authorized'; end if;
  select * into h from public.product_inward_headers where id = _id for update;
  if h is null then raise exception 'Voucher not found'; end if;
  if h.status <> 'DRAFT' then raise exception 'Only DRAFT vouchers can be posted'; end if;
  if h.finished_quantity <= 0 then raise exception 'Finished quantity must be greater than zero'; end if;
  if not exists (select 1 from public.bom_items where bom_id = h.bom_id) then
    raise exception 'Selected BOM has no components'; end if;
  select material_id into primary_id from public.bom_items where bom_id = h.bom_id and is_primary_material limit 1;
  if primary_id is null then raise exception 'BOM has no Primary Raw Material defined'; end if;

  delete from public.product_inward_consumption where product_inward_id = _id;

  for bi in select b.*, m.name as material_name from public.bom_items b
      join public.raw_materials m on m.id = b.material_id
      where b.bom_id = h.bom_id order by b.sequence loop
    std := round(h.finished_quantity / (select base_quantity from public.bom_headers where id = h.bom_id) * bi.standard_quantity, 3);
    total_std := total_std + std;
    avail := public.jb_balance(h.jobber_id, bi.material_id);
    required := std + case when bi.material_id = primary_id then h.overall_wastage_kg else 0 end;
    if required > avail then
      raise exception 'Insufficient % stock with jobber. Available: %, Standard Consumption: %, Overall Wastage: %, Total Required: %, Shortage: %',
        bi.material_name, to_char(avail,'FM999999990.000'), to_char(std,'FM999999990.000'),
        to_char(case when bi.material_id = primary_id then h.overall_wastage_kg else 0 end,'FM999999990.000'),
        to_char(required,'FM999999990.000'), to_char(required - avail,'FM999999990.000');
    end if;
    insert into public.product_inward_consumption(product_inward_id, material_id, standard_consumption, wastage_quantity, stock_before, stock_after)
    values (_id, bi.material_id, std, case when bi.material_id = primary_id then h.overall_wastage_kg else 0 end, avail, avail - required);
    insert into public.raw_material_ledger(transaction_date, transaction_type, voucher_type, voucher_id, voucher_number,
      material_id, location_type, jobber_id, quantity_out, standard_consumption, wastage_quantity, remarks)
    values (h.voucher_date, 'CONSUMPTION', 'PRODUCT_INWARD', h.id, h.voucher_number, bi.material_id, 'JOBBER', h.jobber_id,
      required, std, case when bi.material_id = primary_id then h.overall_wastage_kg else 0 end, h.wastage_remarks);
  end loop;

  insert into public.finished_goods_ledger(transaction_date, transaction_type, voucher_type, voucher_id, voucher_number, product_id, jobber_id, quantity_in)
  values (h.voucher_date, 'PRODUCT_INWARD', 'PRODUCT_INWARD', h.id, h.voucher_number, h.product_id, h.jobber_id, h.finished_quantity);

  update public.product_inward_headers set
    total_standard_consumption = total_std,
    actual_total_consumption = total_std + h.overall_wastage_kg,
    wastage_percentage = case when total_std > 0 then round(h.overall_wastage_kg / total_std * 100, 3) else 0 end,
    primary_material_id = primary_id,
    status = 'POSTED', posted_at = now(), posted_by = auth.uid()
  where id = _id;
  insert into public.audit_logs(entity_type, entity_id, action, details, performed_by)
  values ('PRODUCT_INWARD', _id, 'POSTED', jsonb_build_object('overall_wastage_kg', h.overall_wastage_kg, 'standard', total_std), auth.uid());
end $$;

create or replace function public.post_material_return(_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare h record; it record; avail numeric; mname text;
begin
  if not public.can_write() then raise exception 'Not authorized'; end if;
  select * into h from public.material_return_headers where id = _id for update;
  if h is null then raise exception 'Voucher not found'; end if;
  if h.status <> 'DRAFT' then raise exception 'Only DRAFT vouchers can be posted'; end if;
  if not exists (select 1 from public.material_return_items where header_id = _id) then
    raise exception 'Add at least one material'; end if;
  for it in select * from public.material_return_items where header_id = _id loop
    avail := public.jb_balance(h.jobber_id, it.material_id);
    select name into mname from public.raw_materials where id = it.material_id;
    if it.quantity > avail then
      raise exception 'Return exceeds jobber stock for %. Available: % KG, Requested: % KG.',
        mname, to_char(avail,'FM999999990.000'), to_char(it.quantity,'FM999999990.000');
    end if;
    insert into public.raw_material_ledger(transaction_date, transaction_type, voucher_type, voucher_id, voucher_number,
      material_id, location_type, jobber_id, quantity_out, remarks)
    values (h.voucher_date, 'RETURN', 'MATERIAL_RETURN', h.id, h.voucher_number, it.material_id, 'JOBBER', h.jobber_id, it.quantity, it.remarks);
    insert into public.raw_material_ledger(transaction_date, transaction_type, voucher_type, voucher_id, voucher_number,
      material_id, location_type, quantity_in, remarks)
    values (h.voucher_date, 'RETURN_IN', 'MATERIAL_RETURN', h.id, h.voucher_number, it.material_id, 'WAREHOUSE', it.quantity, it.remarks);
  end loop;
  update public.material_return_headers set status='POSTED', posted_at=now(), posted_by=auth.uid() where id=_id;
  insert into public.audit_logs(entity_type, entity_id, action, performed_by) values ('MATERIAL_RETURN', _id, 'POSTED', auth.uid());
end $$;

create or replace function public.post_stock_adjustment(_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare a record; avail numeric;
begin
  if not public.can_write() then raise exception 'Not authorized'; end if;
  select * into a from public.stock_adjustments where id = _id for update;
  if a is null then raise exception 'Voucher not found'; end if;
  if a.status <> 'DRAFT' then raise exception 'Only DRAFT vouchers can be posted'; end if;
  if a.location_type = 'FINISHED_GOODS' then
    if a.product_id is null then raise exception 'Select a finished product'; end if;
    if a.adjustment_type = 'NEGATIVE' then
      avail := public.fg_balance(a.product_id);
      if a.quantity > avail then raise exception 'Adjustment exceeds finished goods stock (available %)', to_char(avail,'FM999999990.000'); end if;
    end if;
    insert into public.finished_goods_ledger(transaction_date, transaction_type, voucher_type, voucher_id, voucher_number, product_id, quantity_in, quantity_out, remarks)
    values (a.voucher_date, 'ADJUSTMENT', 'ADJUSTMENT', a.id, a.voucher_number, a.product_id,
      case when a.adjustment_type='POSITIVE' then a.quantity else 0 end,
      case when a.adjustment_type='NEGATIVE' then a.quantity else 0 end, a.reason);
  else
    if a.material_id is null then raise exception 'Select a raw material'; end if;
    if a.location_type = 'JOBBER' and a.jobber_id is null then raise exception 'Select a jobber'; end if;
    if a.adjustment_type = 'NEGATIVE' then
      avail := case when a.location_type='JOBBER' then public.jb_balance(a.jobber_id, a.material_id) else public.wh_balance(a.material_id) end;
      if a.quantity > avail then raise exception 'Adjustment exceeds available stock (available %)', to_char(avail,'FM999999990.000'); end if;
    end if;
    insert into public.raw_material_ledger(transaction_date, transaction_type, voucher_type, voucher_id, voucher_number,
      material_id, location_type, jobber_id, quantity_in, quantity_out, remarks)
    values (a.voucher_date, 'ADJUSTMENT', 'ADJUSTMENT', a.id, a.voucher_number, a.material_id, a.location_type, a.jobber_id,
      case when a.adjustment_type='POSITIVE' then a.quantity else 0 end,
      case when a.adjustment_type='NEGATIVE' then a.quantity else 0 end, a.reason);
  end if;
  update public.stock_adjustments set status='POSTED', posted_at=now(), posted_by=auth.uid() where id=_id;
  insert into public.audit_logs(entity_type, entity_id, action, performed_by) values ('ADJUSTMENT', _id, 'POSTED', auth.uid());
end $$;

create or replace function public.cancel_voucher(_voucher_type text, _id uuid, _reason text)
returns void language plpgsql security definer set search_path = public as $$
declare tbl text; l record; st text;
begin
  if not public.can_write() then raise exception 'Not authorized'; end if;
  tbl := case _voucher_type
    when 'RM_INWARD' then 'raw_material_inward_headers'
    when 'TRANSFER' then 'jobber_transfer_headers'
    when 'PRODUCT_INWARD' then 'product_inward_headers'
    when 'MATERIAL_RETURN' then 'material_return_headers'
    when 'ADJUSTMENT' then 'stock_adjustments'
    else null end;
  if tbl is null then raise exception 'Unknown voucher type'; end if;
  execute format('select status from public.%I where id = $1', tbl) into st using _id;
  if st is null then raise exception 'Voucher not found'; end if;
  if st = 'CANCELLED' then raise exception 'Voucher already cancelled'; end if;

  if st = 'POSTED' then
    for l in select * from public.raw_material_ledger where voucher_id = _id and voucher_type = _voucher_type and transaction_type not like 'REVERSAL%' loop
      insert into public.raw_material_ledger(transaction_date, transaction_type, voucher_type, voucher_id, voucher_number,
        material_id, location_type, jobber_id, quantity_in, quantity_out, standard_consumption, wastage_quantity, remarks)
      values (current_date, 'REVERSAL', _voucher_type, _id, l.voucher_number, l.material_id, l.location_type, l.jobber_id,
        l.quantity_out, l.quantity_in, -l.standard_consumption, -l.wastage_quantity, 'Cancellation reversal');
    end loop;
    for l in select * from public.finished_goods_ledger where voucher_id = _id and voucher_type = _voucher_type and transaction_type <> 'REVERSAL' loop
      insert into public.finished_goods_ledger(transaction_date, transaction_type, voucher_type, voucher_id, voucher_number, product_id, jobber_id, quantity_in, quantity_out, remarks)
      values (current_date, 'REVERSAL', _voucher_type, _id, l.voucher_number, l.product_id, l.jobber_id, l.quantity_out, l.quantity_in, 'Cancellation reversal');
    end loop;
  end if;
  execute format('update public.%I set status=''CANCELLED'', cancelled_at=now(), cancelled_by=$2, cancellation_reason=$3 where id=$1', tbl)
    using _id, auth.uid(), _reason;
  insert into public.audit_logs(entity_type, entity_id, action, details, performed_by)
  values (_voucher_type, _id, 'CANCELLED', jsonb_build_object('reason', _reason), auth.uid());
end $$;

-- DEMO DATA
insert into public.raw_materials(code, name, category, uom, minimum_stock) values
 ('RM001','PP Plastic','Plastic Raw Material','KG',100),
 ('RM002','Blue Master Batch','Master Batch','KG',5),
 ('RM003','Packaging Bags','Bags','KG',10),
 ('RM004','Stickers','Stickers','KG',5),
 ('RM005','Labels','Labels','KG',5);

insert into public.jobbers(code, name, company_name, contact_person, phone, city, state) values
 ('JOB001','ABC Plastics','ABC Plastics Pvt Ltd','Ramesh Patel','9876543210','Ahmedabad','Gujarat'),
 ('JOB002','XYZ Industries','XYZ Industries LLP','Suresh Shah','9876500011','Rajkot','Gujarat'),
 ('JOB003','PQR Plastics','PQR Plastics','Mahesh Joshi','9876500022','Surat','Gujarat');

insert into public.finished_products(code, name, category, uom) values
 ('FG001','1 Litre Plastic Bottle','Bottles','PCS'),
 ('FG002','500 ML Plastic Bottle','Bottles','PCS');

insert into public.bom_headers(bom_number, product_id, version, base_quantity, remarks)
select 'BOM-0001', id, 'V1', 1000, 'Standard BOM per 1000 PCS' from public.finished_products where code='FG001';

insert into public.bom_items(bom_id, material_id, standard_quantity, uom, sequence, is_primary_material)
select b.id, m.id, v.qty, 'KG', v.seq, v.prim
from public.bom_headers b
join (values ('RM001',25.000,1,true),('RM002',0.500,2,false),('RM003',1.000,3,false),('RM004',0.300,4,false)) as v(code,qty,seq,prim) on true
join public.raw_materials m on m.code = v.code
where b.bom_number = 'BOM-0001';

insert into public.raw_material_inward_headers(voucher_number, transaction_type, supplier, remarks, status, posted_at)
values ('RMI-2026-0001','OPENING','Opening Stock','Initial inventory','POSTED', now());

insert into public.raw_material_inward_items(header_id, material_id, quantity)
select h.id, m.id, v.qty from public.raw_material_inward_headers h
join (values ('RM001',500.000),('RM002',20.000),('RM003',30.000),('RM004',10.000),('RM005',10.000)) as v(code,qty) on true
join public.raw_materials m on m.code = v.code
where h.voucher_number = 'RMI-2026-0001';

insert into public.raw_material_ledger(transaction_date, transaction_type, voucher_type, voucher_id, voucher_number, material_id, location_type, quantity_in, remarks)
select h.voucher_date, 'INWARD', 'RM_INWARD', h.id, h.voucher_number, i.material_id, 'WAREHOUSE', i.quantity, 'Opening stock'
from public.raw_material_inward_headers h join public.raw_material_inward_items i on i.header_id = h.id
where h.voucher_number = 'RMI-2026-0001';

select public.next_voucher_number('RMI');

-- Allowing RM inward vouchers to land directly at a jobber, and jobber-to-jobber transfers.
alter table public.raw_material_inward_headers add column jobber_id uuid references public.jobbers(id);
alter table public.jobber_transfer_headers add column from_jobber_id uuid references public.jobbers(id);
create index if not exists rm_inward_jobber_idx on public.raw_material_inward_headers(jobber_id) where jobber_id is not null;
create index if not exists jobber_transfer_origin_idx on public.jobber_transfer_headers(from_jobber_id) where from_jobber_id is not null;

create or replace function public.post_raw_material_inward(_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare h record; it record; loc text;
begin
  if not public.can_write() then raise exception 'Not authorized'; end if;
  select * into h from public.raw_material_inward_headers where id = _id for update;
  if h is null then raise exception 'Voucher not found'; end if;
  if h.status <> 'DRAFT' then raise exception 'Only DRAFT vouchers can be posted'; end if;
  if not exists (select 1 from public.raw_material_inward_items where header_id = _id) then
    raise exception 'Add at least one material'; end if;
  loc := case when h.jobber_id is null then 'WAREHOUSE' else 'JOBBER' end;
  for it in select * from public.raw_material_inward_items where header_id = _id loop
    insert into public.raw_material_ledger(transaction_date, transaction_type, voucher_type, voucher_id, voucher_number,
      material_id, location_type, jobber_id, quantity_in, remarks)
    values (h.voucher_date,
      case when h.jobber_id is null then 'INWARD' else 'DIRECT_INWARD' end,
      case when h.jobber_id is null then 'RM_INWARD' else 'DIRECT_JOBBER_INWARD' end,
      h.id, h.voucher_number, it.material_id, loc, h.jobber_id, it.quantity, it.remarks);
  end loop;
  update public.raw_material_inward_headers set status='POSTED', posted_at=now(), posted_by=auth.uid() where id=_id;
  insert into public.audit_logs(entity_type, entity_id, action, performed_by) values ('RM_INWARD', _id, 'POSTED', auth.uid());
end $$;

create or replace function public.post_jobber_transfer(_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare h record; it record; avail numeric; mname text; src text;
begin
  if not public.can_write() then raise exception 'Not authorized'; end if;
  select * into h from public.jobber_transfer_headers where id = _id for update;
  if h is null then raise exception 'Voucher not found'; end if;
  if h.status <> 'DRAFT' then raise exception 'Only DRAFT vouchers can be posted'; end if;
  if not exists (select 1 from public.jobber_transfer_items where header_id = _id) then
    raise exception 'Add at least one material'; end if;
  if h.from_jobber_id is null then src := 'WAREHOUSE'; else src := 'JOBBER'; end if;
  for it in select * from public.jobber_transfer_items where header_id = _id loop
    avail := case when src = 'WAREHOUSE' then public.wh_balance(it.material_id)
                  else public.jb_balance(h.from_jobber_id, it.material_id) end;
    select name into mname from public.raw_materials where id = it.material_id;
    if it.quantity > avail then
      raise exception 'Insufficient stock for %. Available: % KG, Requested: % KG.',
        mname, to_char(avail,'FM999999990.000'), to_char(it.quantity,'FM999999990.000');
    end if;
    insert into public.raw_material_ledger(transaction_date, transaction_type, voucher_type, voucher_id, voucher_number,
      material_id, location_type, jobber_id, quantity_out, remarks)
    values (h.voucher_date,
      case when src = 'WAREHOUSE' then 'TRANSFER_OUT' else 'JOBBER_TRANSFER_OUT' end,
      'TRANSFER', h.id, h.voucher_number, it.material_id, src,
      case when src='JOBBER' then h.from_jobber_id end, it.quantity, it.remarks);
    insert into public.raw_material_ledger(transaction_date, transaction_type, voucher_type, voucher_id, voucher_number,
      material_id, location_type, jobber_id, quantity_in, remarks)
    values (h.voucher_date, 'TRANSFER_IN', 'TRANSFER', h.id, h.voucher_number, it.material_id, 'JOBBER', h.jobber_id, it.quantity, it.remarks);
  end loop;
  update public.jobber_transfer_headers set status='POSTED', posted_at=now(), posted_by=auth.uid() where id=_id;
  insert into public.audit_logs(entity_type, entity_id, action, performed_by) values ('TRANSFER', _id, 'POSTED', auth.uid());
end $$;
" path":"c:\\ideabot internships\\jobberflow\\supabase\\migrations\\20261015120000_inward_directions.sql"
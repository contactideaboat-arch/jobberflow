alter view public.warehouse_stock set (security_invoker = on);
alter view public.jobber_stock set (security_invoker = on);
alter view public.finished_goods_stock set (security_invoker = on);

do $$
declare f record;
begin
  for f in select p.oid::regprocedure as sig from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname='public' and p.prosecdef
  loop
    execute format('revoke all on function %s from public, anon', f.sig);
    execute format('grant execute on function %s to authenticated, service_role', f.sig);
  end loop;
end $$;
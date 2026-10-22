-- Pay Hub step 3: dashboard numbers. Admin only (checks ph_is_admin inside). Days are counted in Indian time.
create or replace function public.ph_stats() returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare tz constant text := 'Asia/Kolkata'; d0 date := (now() at time zone 'Asia/Kolkata')::date;
begin
  if not public.ph_is_admin() then return null; end if;
  return jsonb_build_object(
    'today',   (select jsonb_build_object('count', count(*), 'paise', coalesce(sum(amount_paise), 0)) from public.ph_orders where status = 'paid' and (paid_at at time zone tz)::date = d0),
    'week',    (select jsonb_build_object('count', count(*), 'paise', coalesce(sum(amount_paise), 0)) from public.ph_orders where status = 'paid' and (paid_at at time zone tz)::date >= d0 - 6),
    'month',   (select jsonb_build_object('count', count(*), 'paise', coalesce(sum(amount_paise), 0)) from public.ph_orders where status = 'paid' and (paid_at at time zone tz)::date >= d0 - 29),
    'all',     (select jsonb_build_object('count', count(*), 'paise', coalesce(sum(amount_paise), 0)) from public.ph_orders where status = 'paid'),
    'refunded',(select jsonb_build_object('count', count(*), 'paise', coalesce(sum(amount_paise), 0)) from public.ph_orders where status = 'refunded'),
    'waiting', (select count(*) from public.ph_orders where status = 'created' and created_at > now() - interval '1 day'),
    'days',    (select coalesce(jsonb_agg(jsonb_build_object('d', to_char(g.d, 'YYYY-MM-DD'), 'paise', coalesce(s.p, 0), 'n', coalesce(s.n, 0)) order by g.d), '[]'::jsonb)
                from (select x::date as d from generate_series(d0 - 29, d0, interval '1 day') x) g
                left join (select (paid_at at time zone tz)::date dd, sum(amount_paise) p, count(*) n from public.ph_orders where status = 'paid' group by 1) s on s.dd = g.d),
    'pages',   (select coalesce(jsonb_agg(jsonb_build_object('title', t, 'count', n, 'paise', p) order by p desc), '[]'::jsonb)
                from (select pg.title t, count(*) n, sum(o.amount_paise) p from public.ph_orders o join public.ph_pages pg on pg.id = o.page_id where o.status = 'paid' group by pg.id, pg.title) z)
  );
end $$;
revoke all on function public.ph_stats() from public, anon;
grant execute on function public.ph_stats() to authenticated;

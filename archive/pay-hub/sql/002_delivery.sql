-- Pay Hub step 2: automatic delivery. What the customer receives is stored per page and handed out only AFTER a payment is verified.
alter table public.ph_pages
  add column if not exists delivery_message text not null default '' check (char_length(delivery_message) <= 4000),
  add column if not exists delivery_url text not null default '' check (delivery_url = '' or (delivery_url ~ '^https://' and char_length(delivery_url) <= 1000));

create or replace function public.ph_mark_paid(p_order text, p_payment text) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare o public.ph_orders; p public.ph_pages;
begin
  update public.ph_orders set status = 'paid', payment_id = p_payment, paid_at = coalesce(paid_at, now())
    where order_id = p_order and status in ('created','failed') returning * into o;
  if o.id is null then select * from public.ph_orders where order_id = p_order into o; end if;
  if o.id is null then return jsonb_build_object('ok', false, 'error', 'unknown_order'); end if;
  select * from public.ph_pages where id = o.page_id into p;
  return jsonb_build_object('ok', o.status in ('paid','refunded'), 'status', o.status,
    'success_message', p.success_message, 'redirect_url', p.redirect_url, 'title', p.title,
    'delivery_message', case when o.status = 'paid' then p.delivery_message else '' end,
    'delivery_url', case when o.status = 'paid' then p.delivery_url else '' end);
end $$;

-- Lets a customer come back later to their purchase with the order id + payment id they were given. Paid orders only.
create or replace function public.ph_receipt(p_order text, p_payment text) returns jsonb
language sql stable security definer set search_path = '' as $$
  select jsonb_build_object('ok', true, 'title', p.title, 'amount_paise', o.amount_paise, 'paid_at', o.paid_at,
    'success_message', p.success_message, 'delivery_message', p.delivery_message, 'delivery_url', p.delivery_url)
  from public.ph_orders o join public.ph_pages p on p.id = o.page_id
  where o.order_id = p_order and o.payment_id = p_payment and o.status = 'paid'
$$;

revoke all on function public.ph_mark_paid(text, text) from public, anon, authenticated;
grant execute on function public.ph_mark_paid(text, text) to service_role;
revoke all on function public.ph_receipt(text, text) from public, anon, authenticated;
grant execute on function public.ph_receipt(text, text) to service_role;

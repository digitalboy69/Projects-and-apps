-- Pay Hub: your own payment pages on Razorpay. Everything is prefixed ph_ so it never touches the Door tables.
-- Safe to run once on the Supabase project. Browsers can read nothing directly: public pages go through ph_public_page(),
-- admins go through row-level security, and money state only changes through the service role (edge functions).

create table if not exists public.ph_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table public.ph_admins enable row level security;

create or replace function public.ph_is_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.ph_admins where user_id = (select auth.uid()))
$$;

create table if not exists public.ph_pages (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9][a-z0-9-]{1,60}$'),
  title text not null check (char_length(title) between 1 and 120),
  description text not null default '' check (char_length(description) <= 2000),
  amount_paise integer not null default 10000 check (amount_paise >= 100 and amount_paise <= 50000000),
  currency text not null default 'INR' check (currency in ('INR')),
  pay_what_you_want boolean not null default false,
  min_paise integer not null default 100 check (min_paise >= 100),
  button_text text not null default 'Pay now' check (char_length(button_text) between 1 and 40),
  collect_phone boolean not null default false,
  collect_note boolean not null default false,
  success_message text not null default 'Thank you! Your payment was received.' check (char_length(success_message) <= 500),
  redirect_url text check (redirect_url is null or redirect_url ~ '^https://'),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.ph_pages enable row level security;

create or replace function public.ph_touch() returns trigger language plpgsql set search_path = '' as $$
begin new.updated_at = now(); return new; end $$;
drop trigger if exists ph_pages_touch on public.ph_pages;
create trigger ph_pages_touch before update on public.ph_pages for each row execute function public.ph_touch();

create table if not exists public.ph_orders (
  id uuid primary key default gen_random_uuid(),
  page_id uuid not null references public.ph_pages(id) on delete restrict,
  order_id text not null unique,
  payment_id text,
  amount_paise integer not null check (amount_paise >= 100),
  currency text not null default 'INR',
  status text not null default 'created' check (status in ('created','paid','failed','refunded')),
  name text not null,
  email text not null,
  phone text,
  note text,
  created_at timestamptz not null default now(),
  paid_at timestamptz
);
alter table public.ph_orders enable row level security;
create index if not exists ph_orders_page_idx on public.ph_orders (page_id);
create index if not exists ph_orders_created_idx on public.ph_orders (created_at desc);

-- Admin-only access through row-level security
drop policy if exists ph_admins_read on public.ph_admins;
create policy ph_admins_read on public.ph_admins for select to authenticated using ((select public.ph_is_admin()));
drop policy if exists ph_pages_admin on public.ph_pages;
create policy ph_pages_admin on public.ph_pages for all to authenticated using ((select public.ph_is_admin())) with check ((select public.ph_is_admin()));
drop policy if exists ph_orders_admin_read on public.ph_orders;
create policy ph_orders_admin_read on public.ph_orders for select to authenticated using ((select public.ph_is_admin()));

-- First signed-in person to call this becomes the admin; after that it only confirms who is admin.
create or replace function public.ph_claim_admin() returns boolean
language plpgsql security definer set search_path = '' as $$
declare uid uuid := (select auth.uid());
begin
  if uid is null then return false; end if;
  perform pg_advisory_xact_lock(7001);
  if exists (select 1 from public.ph_admins) then
    return exists (select 1 from public.ph_admins where user_id = uid);
  end if;
  insert into public.ph_admins(user_id) values (uid);
  return true;
end $$;

-- What a visitor may see about a page
create or replace function public.ph_public_page(p_slug text) returns jsonb
language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'slug', slug, 'title', title, 'description', description, 'amount_paise', amount_paise,
    'currency', currency, 'pay_what_you_want', pay_what_you_want, 'min_paise', min_paise,
    'button_text', button_text, 'collect_phone', collect_phone, 'collect_note', collect_note)
  from public.ph_pages where slug = lower(p_slug) and active
$$;

-- Marks an order paid (idempotent). Only the service role (edge functions) may call it.
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
    'success_message', p.success_message, 'redirect_url', p.redirect_url, 'title', p.title);
end $$;

revoke all on function public.ph_is_admin() from public, anon;
grant execute on function public.ph_is_admin() to authenticated;
revoke all on function public.ph_claim_admin() from public, anon;
grant execute on function public.ph_claim_admin() to authenticated;
revoke all on function public.ph_public_page(text) from public;
grant execute on function public.ph_public_page(text) to anon, authenticated;
revoke all on function public.ph_mark_paid(text, text) from public, anon, authenticated;
grant execute on function public.ph_mark_paid(text, text) to service_role;
revoke all on function public.ph_touch() from public, anon, authenticated;

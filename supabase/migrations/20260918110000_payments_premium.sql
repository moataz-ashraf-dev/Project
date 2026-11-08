create table if not exists public.payment_orders (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  provider text not null check (provider in ('paymob')), plan text not null check (plan in ('monthly','yearly')),
  amount_cents integer not null check (amount_cents > 0), currency text not null default 'EGP', status text not null default 'pending' check (status in ('pending','paid','failed','refunded','cancelled')),
  merchant_reference text not null unique, provider_intention_id text, provider_order_id bigint, provider_transaction_id text,
  provider_payload jsonb, webhook_payload jsonb, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index if not exists payment_orders_user_idx on public.payment_orders(user_id, created_at desc);
create unique index if not exists payment_orders_provider_tx_idx on public.payment_orders(provider_transaction_id) where provider_transaction_id is not null;
alter table public.payment_orders enable row level security;
revoke all on public.payment_orders from anon;
grant select on public.payment_orders to authenticated;
drop policy if exists payment_orders_select_own on public.payment_orders;
create policy payment_orders_select_own on public.payment_orders for select to authenticated using (user_id = auth.uid());

create table if not exists public.premium_entitlements (
  user_id uuid primary key references auth.users(id) on delete cascade,
  status text not null default 'inactive' check (status in ('active','past_due','cancelled','inactive')),
  plan text check (plan in ('monthly','yearly')),
  provider text check (provider in ('paymob')),
  provider_transaction_id text,
  current_period_end timestamptz,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
alter table public.premium_entitlements enable row level security;
revoke all on public.premium_entitlements from anon;
grant select on public.premium_entitlements to authenticated;
drop policy if exists premium_entitlements_select_own on public.premium_entitlements;
create policy premium_entitlements_select_own on public.premium_entitlements for select to authenticated using (user_id = auth.uid());

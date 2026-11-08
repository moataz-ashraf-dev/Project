-- Private, account-scoped storage for Premium study packs, exam plans and review state.
create table if not exists public.premium_learning_data (
  user_id uuid primary key references auth.users(id) on delete cascade,
  payload jsonb not null default '{"version":1,"packs":[],"tasks":[]}'::jsonb
    check (jsonb_typeof(payload) = 'object' and pg_column_size(payload) <= 1500000),
  updated_at timestamptz not null default now()
);

alter table public.premium_learning_data enable row level security;
revoke all on public.premium_learning_data from anon, public;
grant select, insert, update on public.premium_learning_data to authenticated;

drop policy if exists premium_learning_data_owner_active on public.premium_learning_data;
create policy premium_learning_data_owner_active
  on public.premium_learning_data
  for all to authenticated
  using (
    user_id = auth.uid()
    and exists (
      select 1 from public.premium_entitlements pe
      where pe.user_id = auth.uid()
        and pe.status = 'active'
        and (pe.current_period_end is null or pe.current_period_end > now())
    )
  )
  with check (
    user_id = auth.uid()
    and exists (
      select 1 from public.premium_entitlements pe
      where pe.user_id = auth.uid()
        and pe.status = 'active'
        and (pe.current_period_end is null or pe.current_period_end > now())
    )
  );

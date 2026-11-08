-- StudyQuest production foundation: authoritative economy, planner, inventory, events,
-- server-side study completion, and tighter data boundaries.

create extension if not exists pgcrypto;

alter table public.profiles
  add column if not exists timezone text not null default 'UTC',
  add column if not exists country_code text,
  add column if not exists city text,
  add column if not exists avatar_url text;

create table if not exists public.economy_accounts (
  user_id uuid primary key references auth.users(id) on delete cascade,
  coins bigint not null default 0 check (coins >= 0),
  gems bigint not null default 0 check (gems >= 0),
  stars bigint not null default 0 check (stars >= 0),
  updated_at timestamptz not null default now()
);

create table if not exists public.economy_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  idempotency_key text not null,
  transaction_type text not null check (transaction_type in ('study_reward','purchase','event_reward','admin_adjustment','migration')),
  coins_delta bigint not null default 0,
  gems_delta bigint not null default 0,
  stars_delta bigint not null default 0,
  reference_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique(user_id, idempotency_key)
);

create index if not exists economy_transactions_user_created_idx
  on public.economy_transactions(user_id, created_at desc);

create table if not exists public.study_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  plan_date date not null,
  source text not null default 'manual' check (source in ('manual','ai')),
  prompt text,
  title text not null default 'Study Plan',
  timezone text not null default 'UTC',
  status text not null default 'active' check (status in ('draft','active','completed','archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, plan_date)
);

create table if not exists public.study_plan_tasks (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references public.study_plans(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  subject_id uuid references public.subjects(id) on delete set null,
  position integer not null default 0 check (position >= 0 and position < 200),
  title text not null check (char_length(title) between 1 and 160),
  notes text,
  start_at timestamptz,
  duration_minutes integer not null check (duration_minutes between 5 and 240),
  status text not null default 'pending' check (status in ('pending','in_progress','completed','skipped')),
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists study_plan_tasks_plan_position_idx on public.study_plan_tasks(plan_id, position);
create index if not exists study_plan_tasks_user_date_idx on public.study_plan_tasks(user_id, created_at desc);

create table if not exists public.user_inventory (
  user_id uuid not null references auth.users(id) on delete cascade,
  item_type text not null check (item_type in ('pet','skin')),
  item_id text not null,
  acquired_via text not null default 'reward' check (acquired_via in ('reward','purchase','event','migration')),
  acquired_at timestamptz not null default now(),
  primary key(user_id, item_type, item_id)
);

create table if not exists public.user_equipment (
  user_id uuid primary key references auth.users(id) on delete cascade,
  equipped_pet_id text not null default 'sparky',
  equipped_skins jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.study_events (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  description text,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  reward jsonb not null default '{}'::jsonb,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  check (ends_at > starts_at)
);

alter table public.study_sessions
  add column if not exists client_operation_id text,
  add column if not exists verification_method text not null default 'legacy' check (verification_method in ('server','offline','legacy'));

create unique index if not exists study_sessions_user_operation_idx
  on public.study_sessions(user_id, client_operation_id)
  where client_operation_id is not null;

create or replace function public.touch_updated_at()
returns trigger language plpgsql security invoker as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists study_plans_touch_updated_at on public.study_plans;
create trigger study_plans_touch_updated_at before update on public.study_plans
for each row execute function public.touch_updated_at();

drop trigger if exists study_plan_tasks_touch_updated_at on public.study_plan_tasks;
create trigger study_plan_tasks_touch_updated_at before update on public.study_plan_tasks
for each row execute function public.touch_updated_at();

drop trigger if exists economy_accounts_touch_updated_at on public.economy_accounts;
create trigger economy_accounts_touch_updated_at before update on public.economy_accounts
for each row execute function public.touch_updated_at();

drop trigger if exists user_equipment_touch_updated_at on public.user_equipment;
create trigger user_equipment_touch_updated_at before update on public.user_equipment
for each row execute function public.touch_updated_at();

create or replace function public.ensure_user_game_defaults()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.economy_accounts(user_id, coins, gems, stars)
  values (new.id, 0, 0, 0)
  on conflict (user_id) do nothing;
  insert into public.user_equipment(user_id, equipped_pet_id)
  values (new.id, 'sparky')
  on conflict (user_id) do nothing;
  insert into public.user_inventory(user_id, item_type, item_id, acquired_via)
  values (new.id, 'pet', 'sparky', 'migration')
  on conflict do nothing;
  return new;
end;
$$;

drop trigger if exists on_profile_game_defaults on public.profiles;
create trigger on_profile_game_defaults after insert on public.profiles
for each row execute function public.ensure_user_game_defaults();

-- Backfill accounts for users that already exist.
insert into public.economy_accounts(user_id, coins, gems, stars)
select id, 0, 0, 0 from auth.users
on conflict (user_id) do nothing;
insert into public.user_equipment(user_id, equipped_pet_id)
select id, 'sparky' from auth.users
on conflict (user_id) do nothing;
insert into public.user_inventory(user_id, item_type, item_id, acquired_via)
select id, 'pet', 'sparky', 'migration' from auth.users
on conflict do nothing;

-- RLS: users can read their own private data; sensitive balances and ledgers are not client-writable.
alter table public.economy_accounts enable row level security;
alter table public.economy_transactions enable row level security;
alter table public.study_plans enable row level security;
alter table public.study_plan_tasks enable row level security;
alter table public.user_inventory enable row level security;
alter table public.user_equipment enable row level security;
alter table public.study_events enable row level security;

do $policy$
begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'economy_accounts' and policyname = 'economy_accounts_select_own') then
    create policy economy_accounts_select_own on public.economy_accounts for select to authenticated using (user_id = auth.uid());
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'economy_transactions' and policyname = 'economy_transactions_select_own') then
    create policy economy_transactions_select_own on public.economy_transactions for select to authenticated using (user_id = auth.uid());
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'study_plans' and policyname = 'study_plans_own') then
    create policy study_plans_own on public.study_plans for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'study_plan_tasks' and policyname = 'study_plan_tasks_own') then
    create policy study_plan_tasks_own on public.study_plan_tasks for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'user_inventory' and policyname = 'inventory_select_own') then
    create policy inventory_select_own on public.user_inventory for select to authenticated using (user_id = auth.uid());
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'user_equipment' and policyname = 'equipment_own') then
    create policy equipment_own on public.user_equipment for select to authenticated using (user_id = auth.uid());
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'study_events' and policyname = 'study_events_read') then
    create policy study_events_read on public.study_events for select to authenticated using (active = true and starts_at <= now() and ends_at >= now());
  end if;
end
$policy$;

-- No client INSERT/UPDATE/DELETE policies are intentionally created for economy accounts,
-- transactions, or inventory. Purchases/rewards must go through trusted functions.

create or replace function public.complete_study_session(
  p_subject_id uuid,
  p_duration_minutes integer,
  p_client_operation_id text,
  p_source text default 'server'
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_session_id uuid;
  v_coins integer;
  v_gems integer;
  v_stars integer;
  v_xp integer;
  v_level integer;
  v_existing jsonb;
begin
  if v_user_id is null then raise exception 'not_authenticated'; end if;
  if p_client_operation_id is null or char_length(p_client_operation_id) < 8 then raise exception 'invalid_operation_id'; end if;
  if p_duration_minutes < 5 or p_duration_minutes > 120 then raise exception 'invalid_duration'; end if;
  if p_source <> 'server' then raise exception 'invalid_source'; end if;

  select jsonb_build_object(
    'session_id', s.id,
    'coins', coalesce(e.coins,0),
    'gems', coalesce(e.gems,0),
    'stars', coalesce(e.stars,0),
    'total_xp', coalesce(pr.total_xp,0),
    'level', coalesce(pr.level,1)
  ) into v_existing
  from public.study_sessions s
  left join public.economy_accounts e on e.user_id = s.user_id
  left join public.profiles pr on pr.id = s.user_id
  where s.user_id = v_user_id and s.client_operation_id = p_client_operation_id
  limit 1;
  if v_existing is not null then return v_existing; end if;

  if not exists (select 1 from public.subjects where id = p_subject_id and user_id = v_user_id) then
    raise exception 'subject_not_owned';
  end if;

  insert into public.study_sessions(user_id, subject_id, duration_minutes, completed, xp_earned, client_operation_id, verification_method)
  values (v_user_id, p_subject_id, p_duration_minutes, true, p_duration_minutes, p_client_operation_id, p_source)
  returning id into v_session_id;

  -- Conservative server reward formula. Money never buys academic rank.
  v_coins := least(240, p_duration_minutes * 2);
  v_gems := case when p_duration_minutes >= 45 then 1 else 0 end;
  v_stars := case when p_duration_minutes >= 25 then 1 else 0 end;
  v_xp := p_duration_minutes;

  insert into public.economy_accounts(user_id, coins, gems, stars)
  values (v_user_id, v_coins, v_gems, v_stars)
  on conflict (user_id) do update set
    coins = public.economy_accounts.coins + excluded.coins,
    gems = public.economy_accounts.gems + excluded.gems,
    stars = public.economy_accounts.stars + excluded.stars,
    updated_at = now();

  insert into public.economy_transactions(user_id, idempotency_key, transaction_type, coins_delta, gems_delta, stars_delta, reference_id, metadata)
  values (v_user_id, 'study:' || p_client_operation_id, 'study_reward', v_coins, v_gems, v_stars, v_session_id,
    jsonb_build_object('duration_minutes', p_duration_minutes, 'verification_method', p_source));

  update public.profiles
  set total_xp = coalesce(total_xp,0) + v_xp,
      level = greatest(1, floor((coalesce(total_xp,0) + v_xp) / 100) + 1),
      current_streak = case when last_study_date = current_date then coalesce(current_streak,0) else coalesce(current_streak,0) + 1 end,
      longest_streak = greatest(coalesce(longest_streak,0), case when last_study_date = current_date then coalesce(current_streak,0) else coalesce(current_streak,0) + 1 end),
      last_study_date = current_date,
      updated_at = now()
  where id = v_user_id;

  select coins, gems, stars into v_coins, v_gems, v_stars from public.economy_accounts where user_id = v_user_id;
  select total_xp, level into v_xp, v_level from public.profiles where id = v_user_id;

  return jsonb_build_object('session_id',v_session_id,'coins',v_coins,'gems',v_gems,'stars',v_stars,'total_xp',v_xp,'level',v_level);
exception when unique_violation then
  select jsonb_build_object('session_id', s.id, 'coins', e.coins, 'gems', e.gems, 'stars', e.stars, 'total_xp', pr.total_xp, 'level', pr.level)
  into v_existing
  from public.study_sessions s
  join public.economy_accounts e on e.user_id = s.user_id
  join public.profiles pr on pr.id = s.user_id
  where s.user_id = v_user_id and s.client_operation_id = p_client_operation_id;
  return v_existing;
end;
$$;

revoke all on function public.complete_study_session(uuid, integer, text, text) from public;
grant execute on function public.complete_study_session(uuid, integer, text, text) to authenticated;

-- Leaderboard source: only verified server sessions contribute to competitive ranking.
create or replace view public.public_leaderboard as
select
  p.id as user_id,
  coalesce(nullif(p.display_name,''), 'StudyHero') as display_name,
  p.country_code,
  p.city,
  coalesce(p.total_xp,0) as total_xp,
  coalesce(p.level,1) as level,
  coalesce(p.current_streak,0) as current_streak,
  coalesce(p.longest_streak,0) as longest_streak
from public.profiles p;

revoke all on public.public_leaderboard from anon;
grant select on public.public_leaderboard to authenticated;

-- Prevent clients from impersonating progression fields through profiles.
create or replace function public.guard_profile_progression()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() = new.id then
    new.total_xp := old.total_xp;
    new.level := old.level;
    new.current_streak := old.current_streak;
    new.longest_streak := old.longest_streak;
    new.last_study_date := old.last_study_date;
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_guard_progression on public.profiles;
create trigger profiles_guard_progression before update on public.profiles
for each row execute function public.guard_profile_progression();

-- Keep the app's legacy app_state readable for compatibility, but do not allow balances to be changed directly.
create or replace function public.guard_app_state_economy()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() = new.user_id then
    new.coins := old.coins;
    new.gems := old.gems;
    new.pet_xp := old.pet_xp;
    new.pet_level := old.pet_level;
    new.pet_xp_max := old.pet_xp_max;
  end if;
  return new;
end;
$$;

drop trigger if exists app_state_guard_economy on public.app_state;
create trigger app_state_guard_economy before update on public.app_state
for each row execute function public.guard_app_state_economy();

-- Replace the generic profile trigger with a guarded rule that permits trusted SECURITY DEFINER
-- functions (owned by postgres) to update progression while ordinary JWT requests cannot.
create or replace function public.guard_profile_progression()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if coalesce(current_setting('studyquest.trusted', true), '') <> '1' then
    new.total_xp := old.total_xp;
    new.level := old.level;
    new.current_streak := old.current_streak;
    new.longest_streak := old.longest_streak;
    new.last_study_date := old.last_study_date;
  end if;
  return new;
end;
$$;

-- Allow the trusted RPC to update the compatibility app_state only when it is not the client.
-- Client-side balance changes remain blocked by the trigger.
create or replace function public.guard_app_state_economy()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if coalesce(current_setting('studyquest.trusted', true), '') <> '1' then
    new.coins := old.coins;
    new.gems := old.gems;
    new.pet_xp := old.pet_xp;
    new.pet_level := old.pet_level;
    new.pet_xp_max := old.pet_xp_max;
  end if;
  return new;
end;
$$;

-- Keep compatibility balances aligned after trusted reward calls.
create or replace function public.complete_study_session(
  p_subject_id uuid,
  p_duration_minutes integer,
  p_client_operation_id text,
  p_source text default 'server'
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_session_id uuid;
  v_reward_coins integer;
  v_reward_gems integer;
  v_reward_stars integer;
  v_total_coins bigint;
  v_total_gems bigint;
  v_total_stars bigint;
  v_total_xp bigint;
  v_level integer;
  v_current_streak integer;
  v_existing jsonb;
begin
  if v_user_id is null then raise exception 'not_authenticated'; end if;
  if p_client_operation_id is null or char_length(p_client_operation_id) < 8 then raise exception 'invalid_operation_id'; end if;
  if p_duration_minutes < 5 or p_duration_minutes > 120 then raise exception 'invalid_duration'; end if;
  if p_source <> 'server' then raise exception 'invalid_source'; end if;

  select jsonb_build_object('session_id', s.id, 'coins', e.coins, 'gems', e.gems, 'stars', e.stars, 'total_xp', pr.total_xp, 'level', pr.level)
  into v_existing
  from public.study_sessions s
  join public.economy_accounts e on e.user_id = s.user_id
  join public.profiles pr on pr.id = s.user_id
  where s.user_id = v_user_id and s.client_operation_id = p_client_operation_id
  limit 1;
  if v_existing is not null then return v_existing; end if;

  if not exists (select 1 from public.subjects where id = p_subject_id and user_id = v_user_id) then raise exception 'subject_not_owned'; end if;

  insert into public.study_sessions(user_id, subject_id, duration_minutes, completed, xp_earned, client_operation_id, verification_method)
  values (v_user_id, p_subject_id, p_duration_minutes, true, p_duration_minutes, p_client_operation_id, p_source)
  returning id into v_session_id;

  v_reward_coins := least(240, p_duration_minutes * 2);
  v_reward_gems := case when p_duration_minutes >= 45 then 1 else 0 end;
  v_reward_stars := case when p_duration_minutes >= 25 then 1 else 0 end;

  insert into public.economy_accounts(user_id, coins, gems, stars)
  values (v_user_id, v_reward_coins, v_reward_gems, v_reward_stars)
  on conflict (user_id) do update set
    coins = public.economy_accounts.coins + excluded.coins,
    gems = public.economy_accounts.gems + excluded.gems,
    stars = public.economy_accounts.stars + excluded.stars,
    updated_at = now();

  insert into public.economy_transactions(user_id, idempotency_key, transaction_type, coins_delta, gems_delta, stars_delta, reference_id, metadata)
  values (v_user_id, 'study:' || p_client_operation_id, 'study_reward', v_reward_coins, v_reward_gems, v_reward_stars, v_session_id,
    jsonb_build_object('duration_minutes', p_duration_minutes, 'verification_method', p_source));

  select total_xp, level, current_streak into v_total_xp, v_level, v_current_streak from public.profiles where id = v_user_id;
  v_total_xp := coalesce(v_total_xp,0) + p_duration_minutes;
  v_current_streak := case when (select last_study_date from public.profiles where id = v_user_id) = current_date then coalesce(v_current_streak,0) else coalesce(v_current_streak,0) + 1 end;
  v_level := floor(v_total_xp / 100) + 1;

  perform set_config('studyquest.trusted', '1', true);
  update public.profiles
  set total_xp = v_total_xp, level = v_level, current_streak = v_current_streak,
      longest_streak = greatest(coalesce(longest_streak,0), v_current_streak), last_study_date = current_date, updated_at = now()
  where id = v_user_id;

  select coins, gems, stars into v_total_coins, v_total_gems, v_total_stars from public.economy_accounts where user_id = v_user_id;
  return jsonb_build_object('session_id', v_session_id, 'coins', v_total_coins, 'gems', v_total_gems, 'stars', v_total_stars, 'total_xp', v_total_xp, 'level', v_level);
exception when unique_violation then
  select jsonb_build_object('session_id', s.id, 'coins', e.coins, 'gems', e.gems, 'stars', e.stars, 'total_xp', pr.total_xp, 'level', pr.level)
  into v_existing
  from public.study_sessions s join public.economy_accounts e on e.user_id = s.user_id join public.profiles pr on pr.id = s.user_id
  where s.user_id = v_user_id and s.client_operation_id = p_client_operation_id;
  return v_existing;
end;
$$;

revoke all on function public.complete_study_session(uuid, integer, text, text) from public;
grant execute on function public.complete_study_session(uuid, integer, text, text) to authenticated;


create or replace function public.validate_study_plan_task()
returns trigger language plpgsql security invoker as $$
begin
  if not exists (select 1 from public.study_plans p where p.id = new.plan_id and p.user_id = auth.uid()) then
    raise exception 'plan_not_owned';
  end if;
  if new.subject_id is not null and not exists (select 1 from public.subjects s where s.id = new.subject_id and s.user_id = auth.uid()) then
    raise exception 'subject_not_owned';
  end if;
  return new;
end;
$$;

drop trigger if exists study_plan_task_validate on public.study_plan_tasks;
create trigger study_plan_task_validate before insert or update on public.study_plan_tasks
for each row execute function public.validate_study_plan_task();

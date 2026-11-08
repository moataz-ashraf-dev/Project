-- StudyQuest final integrity layer
-- The browser is not trusted to declare that a study session actually lasted
-- the requested duration. Online competitive sessions are opened by a server
-- RPC and can only be rewarded after the server clock has elapsed.

alter table public.study_sessions
  add column if not exists started_at timestamptz,
  add column if not exists completed_at timestamptz;

alter table public.study_sessions
  drop constraint if exists study_sessions_verification_method_check;
alter table public.study_sessions
  add constraint study_sessions_verification_method_check
  check (verification_method in ('server','offline','legacy'));

create index if not exists study_sessions_user_started_idx
  on public.study_sessions(user_id, started_at desc);

create unique index if not exists study_sessions_one_active_per_user_idx
  on public.study_sessions(user_id)
  where user_id is not null and completed = false and verification_method = 'server';

-- Competitive session rows are never directly writable by the client.
revoke insert, update, delete on table public.study_sessions from anon, authenticated;
grant select on table public.study_sessions to authenticated;

create or replace function public.start_study_session(
  p_subject_id uuid,
  p_duration_minutes integer,
  p_client_operation_id text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_session_id uuid;
  v_existing jsonb;
begin
  if v_user_id is null then raise exception 'not_authenticated'; end if;
  if p_client_operation_id is null or char_length(p_client_operation_id) < 8 or char_length(p_client_operation_id) > 100 then
    raise exception 'invalid_operation_id';
  end if;
  if p_duration_minutes < 5 or p_duration_minutes > 120 then raise exception 'invalid_duration'; end if;
  if not exists (select 1 from public.subjects where id = p_subject_id and user_id = v_user_id) then
    raise exception 'subject_not_owned';
  end if;

  select jsonb_build_object('session_id', id, 'operation_id', client_operation_id, 'started_at', started_at)
    into v_existing
  from public.study_sessions
  where user_id = v_user_id and client_operation_id = p_client_operation_id
  limit 1;
  if v_existing is not null then return v_existing; end if;

  -- A stale abandoned session should not permanently lock the account.
  update public.study_sessions
  set completed = true,
      verification_method = 'offline',
      completed_at = coalesce(completed_at, now())
  where user_id = v_user_id
    and completed = false
    and verification_method = 'server'
    and started_at < now() - interval '24 hours';

  if exists (
    select 1 from public.study_sessions
    where user_id = v_user_id and completed = false and verification_method = 'server'
  ) then
    raise exception 'active_session_exists';
  end if;

  insert into public.study_sessions(
    user_id, subject_id, duration_minutes, completed, xp_earned,
    client_operation_id, verification_method, started_at
  ) values (
    v_user_id, p_subject_id, p_duration_minutes, false, 0,
    p_client_operation_id, 'server', now()
  ) returning id into v_session_id;

  return jsonb_build_object(
    'session_id', v_session_id,
    'operation_id', p_client_operation_id,
    'started_at', now()
  );
exception when unique_violation then
  select jsonb_build_object('session_id', id, 'operation_id', client_operation_id, 'started_at', started_at)
    into v_existing
  from public.study_sessions
  where user_id = v_user_id and client_operation_id = p_client_operation_id
  limit 1;
  if v_existing is not null then return v_existing; end if;
  raise;
end;
$$;

revoke all on function public.start_study_session(uuid, integer, text) from public;
grant execute on function public.start_study_session(uuid, integer, text) to authenticated;

-- Replace completion with a version that operates on an already-open server session.
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
  v_session public.study_sessions%rowtype;
  v_coins integer;
  v_gems integer;
  v_stars integer;
  v_total_coins bigint;
  v_total_gems bigint;
  v_total_stars bigint;
  v_total_xp bigint;
  v_level integer;
  v_current_streak integer;
  v_last_date date;
begin
  if v_user_id is null then raise exception 'not_authenticated'; end if;
  if p_source <> 'server' then raise exception 'invalid_source'; end if;
  if p_client_operation_id is null or char_length(p_client_operation_id) < 8 or char_length(p_client_operation_id) > 100 then
    raise exception 'invalid_operation_id';
  end if;
  if p_duration_minutes < 5 or p_duration_minutes > 120 then raise exception 'invalid_duration'; end if;

  select * into v_session
  from public.study_sessions
  where user_id = v_user_id and client_operation_id = p_client_operation_id
  for update;

  if not found then raise exception 'session_not_started'; end if;
  if v_session.subject_id is distinct from p_subject_id then raise exception 'subject_mismatch'; end if;
  if v_session.duration_minutes <> p_duration_minutes then raise exception 'duration_mismatch'; end if;

  if v_session.completed then
    select coins, gems, stars into v_total_coins, v_total_gems, v_total_stars
      from public.economy_accounts where user_id = v_user_id;
    select total_xp, level into v_total_xp, v_level from public.profiles where id = v_user_id;
    return jsonb_build_object('session_id', v_session.id, 'coins', coalesce(v_total_coins,0), 'gems', coalesce(v_total_gems,0), 'stars', coalesce(v_total_stars,0), 'total_xp', coalesce(v_total_xp,0), 'level', coalesce(v_level,1));
  end if;

  if v_session.started_at is null or now() < v_session.started_at + make_interval(mins => v_session.duration_minutes) then
    raise exception 'session_not_elapsed';
  end if;

  v_coins := least(240, v_session.duration_minutes * 2);
  v_gems := case when v_session.duration_minutes >= 45 then 1 else 0 end;
  v_stars := case when v_session.duration_minutes >= 25 then 1 else 0 end;

  update public.study_sessions
  set completed = true,
      completed_at = now(),
      xp_earned = v_session.duration_minutes,
      verification_method = 'server'
  where id = v_session.id;

  insert into public.economy_accounts(user_id, coins, gems, stars)
  values (v_user_id, v_coins, v_gems, v_stars)
  on conflict (user_id) do update set
    coins = public.economy_accounts.coins + excluded.coins,
    gems = public.economy_accounts.gems + excluded.gems,
    stars = public.economy_accounts.stars + excluded.stars,
    updated_at = now();

  insert into public.economy_transactions(
    user_id, idempotency_key, transaction_type, coins_delta, gems_delta,
    stars_delta, reference_id, metadata
  ) values (
    v_user_id, 'study:' || p_client_operation_id, 'study_reward',
    v_coins, v_gems, v_stars, v_session.id,
    jsonb_build_object('duration_minutes', v_session.duration_minutes, 'verification_method', 'server')
  ) on conflict (user_id, idempotency_key) do nothing;

  select total_xp, level, current_streak, last_study_date
    into v_total_xp, v_level, v_current_streak, v_last_date
  from public.profiles where id = v_user_id for update;

  v_total_xp := coalesce(v_total_xp,0) + v_session.duration_minutes;
  v_current_streak := case
    when v_last_date = current_date then coalesce(v_current_streak,0)
    when v_last_date = current_date - 1 then coalesce(v_current_streak,0) + 1
    else 1
  end;
  v_level := floor(v_total_xp / 100) + 1;

  update public.profiles
  set total_xp = v_total_xp,
      level = v_level,
      current_streak = v_current_streak,
      longest_streak = greatest(coalesce(longest_streak,0), v_current_streak),
      last_study_date = current_date,
      updated_at = now()
  where id = v_user_id;

  select coins, gems, stars into v_total_coins, v_total_gems, v_total_stars
    from public.economy_accounts where user_id = v_user_id;

  return jsonb_build_object(
    'session_id', v_session.id,
    'coins', coalesce(v_total_coins,0),
    'gems', coalesce(v_total_gems,0),
    'stars', coalesce(v_total_stars,0),
    'total_xp', v_total_xp,
    'level', v_level
  );
end;
$$;

revoke all on function public.complete_study_session(uuid, integer, text, text) from public;
grant execute on function public.complete_study_session(uuid, integer, text, text) to authenticated;

create or replace function public.cancel_study_session(p_client_operation_id text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
begin
  if v_user_id is null then raise exception 'not_authenticated'; end if;
  if p_client_operation_id is null or char_length(p_client_operation_id) < 8 then raise exception 'invalid_operation_id'; end if;
  update public.study_sessions
  set completed = true,
      completed_at = now(),
      verification_method = 'offline'
  where user_id = v_user_id
    and client_operation_id = p_client_operation_id
    and completed = false;
  return found;
end;
$$;

revoke all on function public.cancel_study_session(text) from public;
grant execute on function public.cancel_study_session(text) to authenticated;

-- Only server RPCs create competitive sessions. Offline local records remain browser-only.
drop policy if exists "Users can insert own study sessions" on public.study_sessions;

-- Server-owned shop catalog. Stars are intentionally absent from the purchase model.
create table if not exists public.catalog_items (
  item_type text not null check (item_type in ('pet','skin')),
  item_id text not null,
  name text not null,
  rarity text not null check (rarity in ('Common','Rare','Epic','Legendary','Mythic')),
  coin_price bigint not null default 0 check (coin_price >= 0),
  gem_price bigint not null default 0 check (gem_price >= 0),
  purchasable boolean not null default true,
  event_only boolean not null default false,
  primary key(item_type, item_id)
);

insert into public.catalog_items(item_type,item_id,name,rarity,coin_price,gem_price,purchasable,event_only) values
('pet','sparky','Sparky','Common',0,0,false,false),
('pet','volcanic-pup','Volcanic Pup','Rare',500,0,true,false),
('pet','frost-kit','Frost Kit','Rare',750,0,true,false),
('pet','aqua-turtle','Aqua Turtle','Common',350,0,true,false),
('pet','shadow-wyrm','Shadow Wyrm','Epic',0,25,true,false),
('pet','celestial-phoenix','Celestial Phoenix','Legendary',0,60,true,false),
('skin','cyber-hoodie','Cyber Hoodie','Rare',300,0,true,false),
('skin','neon-shades','Neon Shades','Rare',300,0,true,false),
('skin','gold-crown','Golden Crown','Legendary',0,30,true,false),
('skin','horse','Horse','Common',250,0,true,false),
('skin','lada','Lada','Common',250,0,true,false),
('skin','winter-scarf','Winter Scarf','Epic',800,0,true,false),
('skin','fancy-monocle','Fancy Monocle','Epic',1000,0,true,false),
('skin','wizard-hat','Wizard Hat','Mythic',0,50,true,false)
on conflict (item_type,item_id) do update set
  name=excluded.name, rarity=excluded.rarity, coin_price=excluded.coin_price,
  gem_price=excluded.gem_price, purchasable=excluded.purchasable, event_only=excluded.event_only;

alter table public.catalog_items enable row level security;
revoke all on table public.catalog_items from anon;
grant select on table public.catalog_items to authenticated;
drop policy if exists catalog_items_read on public.catalog_items;
create policy catalog_items_read on public.catalog_items for select to authenticated using (true);

create or replace function public.purchase_item(
  p_item_type text,
  p_item_id text,
  p_currency text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_item public.catalog_items%rowtype;
  v_account public.economy_accounts%rowtype;
  v_cost bigint;
  v_idempotency text;
begin
  if v_user is null then raise exception 'not_authenticated'; end if;
  if p_currency not in ('coins','gems') then raise exception 'invalid_currency'; end if;
  select * into v_item from public.catalog_items where item_type=p_item_type and item_id=p_item_id;
  if not found or not v_item.purchasable or v_item.event_only then raise exception 'item_not_purchasable'; end if;
  if v_item.coin_price = 0 and v_item.gem_price = 0 then raise exception 'item_not_purchasable'; end if;
  v_cost := case when p_currency='coins' then v_item.coin_price else v_item.gem_price end;
  if v_cost <= 0 then raise exception 'currency_not_supported'; end if;

  if exists (select 1 from public.user_inventory where user_id=v_user and item_type=p_item_type and item_id=p_item_id) then
    raise exception 'item_already_owned';
  end if;

  select * into v_account from public.economy_accounts where user_id=v_user for update;
  if not found then raise exception 'economy_account_missing'; end if;
  if p_currency='coins' and v_account.coins < v_cost then raise exception 'insufficient_coins'; end if;
  if p_currency='gems' and v_account.gems < v_cost then raise exception 'insufficient_gems'; end if;

  if p_currency='coins' then
    update public.economy_accounts set coins=coins-v_cost, updated_at=now() where user_id=v_user;
  else
    update public.economy_accounts set gems=gems-v_cost, updated_at=now() where user_id=v_user;
  end if;

  insert into public.user_inventory(user_id,item_type,item_id,acquired_via)
  values(v_user,p_item_type,p_item_id,'purchase');

  v_idempotency := 'purchase:' || p_item_type || ':' || p_item_id || ':' || extract(epoch from clock_timestamp())::bigint || ':' || gen_random_uuid()::text;
  insert into public.economy_transactions(user_id,idempotency_key,transaction_type,coins_delta,gems_delta,reference_id,metadata)
  values(v_user,v_idempotency,'purchase',case when p_currency='coins' then -v_cost else 0 end,case when p_currency='gems' then -v_cost else 0 end,null,jsonb_build_object('item_type',p_item_type,'item_id',p_item_id,'currency',p_currency));

  select coins,gems,stars into v_account.coins,v_account.gems,v_account.stars from public.economy_accounts where user_id=v_user;
  return jsonb_build_object('item_type',p_item_type,'item_id',p_item_id,'coins',v_account.coins,'gems',v_account.gems,'stars',v_account.stars);
end;
$$;

revoke all on function public.purchase_item(text,text,text) from public;
grant execute on function public.purchase_item(text,text,text) to authenticated;

create or replace function public.equip_item(p_item_type text, p_item_id text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_category text;
begin
  if v_user is null then raise exception 'not_authenticated'; end if;
  if not exists (select 1 from public.user_inventory where user_id=v_user and item_type=p_item_type and item_id=p_item_id) then
    raise exception 'item_not_owned';
  end if;
  if p_item_type='pet' then
    update public.user_equipment set equipped_pet_id=p_item_id, updated_at=now() where user_id=v_user;
  elsif p_item_type='skin' then
    select case
      when item_id in ('cyber-hoodie','winter-scarf') then 'clothes'
      when item_id in ('neon-shades','fancy-monocle') then 'glasses'
      when item_id in ('gold-crown','wizard-hat') then 'crown'
      when item_id in ('horse','lada') then 'vehicle'
      else null end into v_category
    from public.catalog_items where item_type='skin' and item_id=p_item_id;
    if v_category is null then raise exception 'invalid_skin_category'; end if;
    update public.user_equipment
    set equipped_skins=jsonb_set(coalesce(equipped_skins,'{}'::jsonb), array[v_category], to_jsonb(p_item_id), true), updated_at=now()
    where user_id=v_user;
  else
    raise exception 'invalid_item_type';
  end if;
  return true;
end;
$$;

revoke all on function public.equip_item(text,text) from public;
grant execute on function public.equip_item(text,text) to authenticated;

-- Bounded leaderboard RPC: the client can request a scope, but cannot choose
-- another user's city/country. Ranking is based only on server-verified XP.
drop function if exists public.get_leaderboard(text, integer);

create function public.get_leaderboard(p_scope text default 'global', p_limit integer default 50)
returns table(
  user_id uuid,
  display_name text,
  country_code text,
  city text,
  total_xp bigint,
  level integer,
  current_streak integer,
  longest_streak integer
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_country text;
  v_city text;
begin
  if v_user is null then raise exception 'not_authenticated'; end if;
  if p_scope not in ('global','international','city') then raise exception 'invalid_scope'; end if;
  if p_limit < 1 or p_limit > 100 then raise exception 'invalid_limit'; end if;
  select lp.country_code, lp.city into v_country, v_city from public.leaderboard_profiles lp where lp.user_id=v_user;

  return query
  select lp.user_id, lp.display_name, lp.country_code, lp.city, lp.total_xp, lp.level, lp.current_streak, lp.longest_streak
  from public.leaderboard_profiles lp
  where lp.leaderboard_visible = true
    and (p_scope='global'
      or (p_scope='international' and v_country is not null and lp.country_code=v_country)
      or (p_scope='city' and v_country is not null and v_city is not null and lp.country_code=v_country and lower(lp.city)=lower(v_city)))
  order by lp.total_xp desc, lp.current_streak desc, lp.user_id
  limit p_limit;
end;
$$;

revoke all on function public.get_leaderboard(text, integer) from public;
grant execute on function public.get_leaderboard(text, integer) to authenticated;

-- Moderation reports are user-submitted safety records. No public read access.
create table if not exists public.room_reports (
  id uuid primary key default gen_random_uuid(),
  room_id text not null check (char_length(room_id) between 1 and 80),
  reporter_id uuid not null references auth.users(id) on delete cascade,
  reason text not null check (reason in ('disruption','harassment','spam')),
  created_at timestamptz not null default now()
);
create index if not exists room_reports_created_idx on public.room_reports(created_at desc);
alter table public.room_reports enable row level security;
revoke all on table public.room_reports from anon, authenticated;
grant insert on table public.room_reports to authenticated;
drop policy if exists room_reports_insert_own on public.room_reports;
create policy room_reports_insert_own on public.room_reports for insert to authenticated with check (reporter_id = auth.uid());

-- Streak state is also derived from verified progression; keep the historical
-- seven-day cache readable but not client-writable online.
revoke insert, update, delete on table public.streak_days from anon, authenticated;
grant select on table public.streak_days to authenticated;

-- Make shop purchases idempotent as well; a lost response must not cause a second debit.
drop function if exists public.purchase_item(text,text,text);
create or replace function public.purchase_item(
  p_item_type text,
  p_item_id text,
  p_currency text,
  p_client_operation_id text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_item public.catalog_items%rowtype;
  v_account public.economy_accounts%rowtype;
  v_cost bigint;
  v_coins bigint;
  v_gems bigint;
  v_stars bigint;
  v_key text := 'purchase:' || p_client_operation_id;
begin
  if v_user is null then raise exception 'not_authenticated'; end if;
  if p_client_operation_id is null or char_length(p_client_operation_id) < 8 or char_length(p_client_operation_id) > 100 then raise exception 'invalid_operation_id'; end if;
  if p_currency not in ('coins','gems') then raise exception 'invalid_currency'; end if;

  if exists (select 1 from public.economy_transactions where user_id=v_user and idempotency_key=v_key) then
    select coins,gems,stars into v_coins,v_gems,v_stars from public.economy_accounts where user_id=v_user;
    return jsonb_build_object('coins',v_coins,'gems',v_gems,'stars',v_stars,'item_type',p_item_type,'item_id',p_item_id);
  end if;

  select * into v_item from public.catalog_items where item_type=p_item_type and item_id=p_item_id;
  if not found or not v_item.purchasable or v_item.event_only then raise exception 'item_not_purchasable'; end if;
  v_cost := case when p_currency='coins' then v_item.coin_price else v_item.gem_price end;
  if v_cost <= 0 then raise exception 'currency_not_supported'; end if;
  if exists (select 1 from public.user_inventory where user_id=v_user and item_type=p_item_type and item_id=p_item_id) then raise exception 'item_already_owned'; end if;

  select * into v_account from public.economy_accounts where user_id=v_user for update;
  if p_currency='coins' and v_account.coins < v_cost then raise exception 'insufficient_coins'; end if;
  if p_currency='gems' and v_account.gems < v_cost then raise exception 'insufficient_gems'; end if;

  if p_currency='coins' then
    update public.economy_accounts set coins=coins-v_cost, updated_at=now() where user_id=v_user;
  else
    update public.economy_accounts set gems=gems-v_cost, updated_at=now() where user_id=v_user;
  end if;

  insert into public.user_inventory(user_id,item_type,item_id,acquired_via) values(v_user,p_item_type,p_item_id,'purchase');
  insert into public.economy_transactions(user_id,idempotency_key,transaction_type,coins_delta,gems_delta,reference_id,metadata)
  values(v_user,v_key,'purchase',case when p_currency='coins' then -v_cost else 0 end,case when p_currency='gems' then -v_cost else 0 end,null,jsonb_build_object('item_type',p_item_type,'item_id',p_item_id,'currency',p_currency));

  select coins,gems,stars into v_coins,v_gems,v_stars from public.economy_accounts where user_id=v_user;
  return jsonb_build_object('coins',v_coins,'gems',v_gems,'stars',v_stars,'item_type',p_item_type,'item_id',p_item_id);
end;
$$;
revoke all on function public.purchase_item(text,text,text,text) from public;
grant execute on function public.purchase_item(text,text,text,text) to authenticated;

-- The original prototype trigger blocked even SECURITY DEFINER reward RPCs.
-- Direct profile progression writes are already prevented by column privileges;
-- remove the obsolete trigger so the trusted completion RPC can update progression.
drop trigger if exists tr_prevent_profile_progression_direct_update on public.profiles;

-- Remove the earlier compatibility view; leaderboard access is now through the bounded RPC.
drop view if exists public.public_leaderboard;

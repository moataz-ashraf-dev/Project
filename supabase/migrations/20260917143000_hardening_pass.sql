-- StudyQuest hardening pass 2
-- Fixes: client grants, safe leaderboard view, legacy balance migration, planner/task integrity,
-- and removes unsafe trigger-based privilege bypass patterns.

-- Preserve existing legacy balances when the new authoritative economy is introduced.
insert into public.economy_accounts(user_id, coins, gems, stars)
select a.user_id, greatest(0, coalesce(a.coins,0)), greatest(0, coalesce(a.gems,0)), 0
from public.app_state a
where a.user_id is not null
on conflict (user_id) do update set
  coins = greatest(public.economy_accounts.coins, excluded.coins),
  gems = greatest(public.economy_accounts.gems, excluded.gems),
  updated_at = now();

-- Do not rely on a trigger/session GUC to distinguish trusted writes.
-- Restrict client column privileges instead; only the reward RPC can change progression/economy.
revoke update on table public.profiles from authenticated;
grant update (username, display_name, avatar_url, locale, country_code, city, timezone) on table public.profiles to authenticated;

revoke insert, update, delete on table public.economy_accounts from anon, authenticated;
revoke insert, update, delete on table public.economy_transactions from anon, authenticated;
revoke insert, update, delete on table public.user_inventory from anon, authenticated;
revoke insert, update, delete on table public.user_equipment from anon, authenticated;

-- app_state remains a compatibility cache. Clients may update only non-authoritative fields.
revoke insert, update, delete on table public.app_state from authenticated;
grant select on table public.app_state to authenticated;
grant insert (id, user_id, pet_name, ambient_sound, active_subject_id) on table public.app_state to authenticated;
grant update (pet_name, ambient_sound, active_subject_id) on table public.app_state to authenticated;

-- Remove unsafe/obsolete guards that attempted to identify trusted calls using a session setting.
drop trigger if exists profiles_guard_progression on public.profiles;
drop trigger if exists app_state_guard_economy on public.app_state;

-- The authoritative RPC remains the only writer of progression/economy.
revoke all on function public.complete_study_session(uuid, integer, text, text) from public;
grant execute on function public.complete_study_session(uuid, integer, text, text) to authenticated;

-- A leaderboard must not expose the private profiles table through a security-invoker view,
-- because profiles are intentionally owner-readable. Maintain a separate public projection.
alter table public.profiles add column if not exists leaderboard_visible boolean not null default true;

create table if not exists public.leaderboard_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default 'StudyHero',
  country_code text,
  city text,
  total_xp bigint not null default 0 check (total_xp >= 0),
  level integer not null default 1 check (level >= 1),
  current_streak integer not null default 0 check (current_streak >= 0),
  longest_streak integer not null default 0 check (longest_streak >= 0),
  leaderboard_visible boolean not null default true,
  updated_at timestamptz not null default now()
);

alter table public.leaderboard_profiles enable row level security;
revoke all on table public.leaderboard_profiles from anon, authenticated;
grant select on table public.leaderboard_profiles to authenticated;
drop policy if exists leaderboard_profiles_select on public.leaderboard_profiles;
create policy leaderboard_profiles_select on public.leaderboard_profiles
  for select to authenticated using (leaderboard_visible = true);

create or replace function public.sync_leaderboard_profile()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.leaderboard_profiles(
    user_id, display_name, country_code, city, total_xp, level, current_streak, longest_streak, leaderboard_visible, updated_at
  ) values (
    new.id,
    coalesce(nullif(new.display_name,''), 'StudyHero'),
    new.country_code,
    new.city,
    coalesce(new.total_xp,0),
    greatest(1, coalesce(new.level,1)),
    greatest(0, coalesce(new.current_streak,0)),
    greatest(0, coalesce(new.longest_streak,0)),
    coalesce(new.leaderboard_visible,true),
    now()
  )
  on conflict (user_id) do update set
    display_name = excluded.display_name,
    country_code = excluded.country_code,
    city = excluded.city,
    total_xp = excluded.total_xp,
    level = excluded.level,
    current_streak = excluded.current_streak,
    longest_streak = excluded.longest_streak,
    leaderboard_visible = excluded.leaderboard_visible,
    updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_sync_leaderboard on public.profiles;
create trigger profiles_sync_leaderboard
after insert or update of display_name, country_code, city, total_xp, level, current_streak, longest_streak, leaderboard_visible
on public.profiles
for each row execute function public.sync_leaderboard_profile();

insert into public.leaderboard_profiles(user_id, display_name, country_code, city, total_xp, level, current_streak, longest_streak, leaderboard_visible)
select id, coalesce(nullif(display_name,''),'StudyHero'), country_code, city,
       coalesce(total_xp,0), greatest(1,coalesce(level,1)), greatest(0,coalesce(current_streak,0)),
       greatest(0,coalesce(longest_streak,0)), coalesce(leaderboard_visible,true)
from public.profiles
on conflict (user_id) do update set
  display_name=excluded.display_name, country_code=excluded.country_code, city=excluded.city,
  total_xp=excluded.total_xp, level=excluded.level, current_streak=excluded.current_streak,
  longest_streak=excluded.longest_streak, leaderboard_visible=excluded.leaderboard_visible, updated_at=now();

revoke all on public.leaderboard_profiles from anon;

-- Ensure plan tasks can never reference a subject belonging to another account, while also
-- allowing server-side inserts where the caller is authenticated.
create or replace function public.validate_study_plan_task()
returns trigger language plpgsql security invoker as $$
begin
  if not exists (select 1 from public.study_plans p where p.id = new.plan_id and p.user_id = auth.uid()) then
    raise exception 'plan_not_owned';
  end if;
  if new.user_id <> auth.uid() then
    raise exception 'user_not_owned';
  end if;
  if new.subject_id is not null and not exists (select 1 from public.subjects s where s.id = new.subject_id and s.user_id = auth.uid()) then
    raise exception 'subject_not_owned';
  end if;
  return new;
end;
$$;

-- Prevent anonymous access to private planner/economy data even if a future policy is added accidentally.
revoke all on table public.study_plans, public.study_plan_tasks, public.economy_accounts, public.economy_transactions,
  public.user_inventory, public.user_equipment from anon;

-- Tighten the public event surface to read-only.
revoke insert, update, delete on table public.study_events from anon, authenticated;
grant select on table public.study_events to authenticated;

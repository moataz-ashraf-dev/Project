-- Fix verified session rewards failing when the streak mirror hits its partial unique index.
-- streak_days_user_day_key is WHERE user_id IS NOT NULL, so PostgreSQL requires the
-- matching predicate in the ON CONFLICT target.
create or replace function public.sync_streak_day_from_verified_session()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_day integer := extract(dow from coalesce(NEW.completed_at, now()))::integer;
begin
  if NEW.completed = true
     and NEW.verification_method = 'server'
     and NEW.user_id is not null
     and NEW.completed_at is not null then
    insert into public.streak_days(user_id, day_of_week, completed, updated_at)
    values(NEW.user_id, v_day, true, NEW.completed_at)
    on conflict (user_id, day_of_week) where (user_id is not null)
    do update set completed = true, updated_at = excluded.updated_at;
  end if;
  return NEW;
end;
$$;

revoke all on function public.sync_streak_day_from_verified_session() from public;

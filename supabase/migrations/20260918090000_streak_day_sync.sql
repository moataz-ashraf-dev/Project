-- StudyQuest: keep the weekly streak board synchronized with verified sessions.
-- The verified study-session RPC remains authoritative; this trigger only mirrors
-- the completed day into the user's weekly display rows.

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
    on conflict (user_id, day_of_week)
    do update set completed = true, updated_at = excluded.updated_at;
  end if;
  return NEW;
end;
$$;

drop trigger if exists tr_sync_streak_day_from_verified_session on public.study_sessions;
create trigger tr_sync_streak_day_from_verified_session
after update of completed, verification_method, completed_at on public.study_sessions
for each row
when (NEW.completed = true)
execute function public.sync_streak_day_from_verified_session();

revoke all on function public.sync_streak_day_from_verified_session() from public;

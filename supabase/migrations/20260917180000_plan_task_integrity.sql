-- Final planner integrity: a task can only become completed after a verified
-- server study session for the same user and duration.

create or replace function public.complete_study_plan_task(
  p_task_id uuid,
  p_session_id uuid
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_task public.study_plan_tasks%rowtype;
  v_session public.study_sessions%rowtype;
begin
  if v_user is null then raise exception 'not_authenticated'; end if;

  select * into v_task
  from public.study_plan_tasks
  where id = p_task_id and user_id = v_user
  for update;
  if not found then raise exception 'task_not_owned'; end if;

  select * into v_session
  from public.study_sessions
  where id = p_session_id and user_id = v_user
  for update;
  if not found then raise exception 'session_not_owned'; end if;
  if not v_session.completed or v_session.verification_method <> 'server' then
    raise exception 'session_not_verified';
  end if;
  if v_task.subject_id is not null and v_session.subject_id is distinct from v_task.subject_id then
    raise exception 'task_subject_mismatch';
  end if;
  if v_session.duration_minutes <> v_task.duration_minutes then
    raise exception 'task_duration_mismatch';
  end if;

  update public.study_plan_tasks
  set status = 'completed', completed_at = coalesce(completed_at, now()), updated_at = now()
  where id = v_task.id;
  return true;
end;
$$;

revoke all on function public.complete_study_plan_task(uuid, uuid) from public;
grant execute on function public.complete_study_plan_task(uuid, uuid) to authenticated;

-- Client writes can still move a task into progress or skipped, but cannot
-- directly forge completion. The trusted RPC above is the only completion path.
create or replace function public.guard_plan_task_completion()
returns trigger
language plpgsql
security invoker
as $$
begin
  if old.status is distinct from 'completed' and new.status = 'completed' then
    raise exception 'use_complete_study_plan_task';
  end if;
  if new.status = 'completed' and new.completed_at is null then
    raise exception 'completed_at_required';
  end if;
  return new;
end;
$$;

drop trigger if exists study_plan_tasks_guard_completion on public.study_plan_tasks;
create trigger study_plan_tasks_guard_completion
before update on public.study_plan_tasks
for each row execute function public.guard_plan_task_completion();

-- Preserve the existing starter experience without trusting localStorage. New
-- accounts receive starter balances from the database; legacy zero-balance
-- accounts with no ledger history are initialized once.
create or replace function public.ensure_user_game_defaults()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.economy_accounts(user_id, coins, gems, stars)
  values (new.id, 1200, 5, 0)
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

insert into public.economy_accounts(user_id, coins, gems, stars)
select u.id, 1200, 5, 0
from auth.users u
left join public.economy_transactions t on t.user_id = u.id
where t.user_id is null
on conflict (user_id) do update
set coins = case when public.economy_accounts.coins = 0 then excluded.coins else public.economy_accounts.coins end,
    gems = case when public.economy_accounts.gems = 0 then excluded.gems else public.economy_accounts.gems end,
    updated_at = now();

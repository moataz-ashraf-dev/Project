-- StudyQuest Clean Focus Timer
-- Replaces the legacy active study_sessions timer lifecycle.
-- study_sessions remains the verified reward/history ledger.

begin;

-- Retire legacy timer RPCs.
drop function if exists public.start_study_session(uuid, integer, text, uuid);
drop function if exists public.start_study_session(uuid, integer, text);
drop function if exists public.get_active_study_session();
drop function if exists public.cancel_study_session(text);

-- Remove the old "one unfinished study session" lock.
drop index if exists public.study_sessions_one_active_per_user_idx;

-- Old unfinished server timer rows must not generate rewards.
delete from public.study_sessions
where completed = false
  and verification_method = 'server';

-- One clean lifecycle table for the timer itself.
create table if not exists public.focus_timer_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  operation_id text not null unique,
  subject_id uuid not null references public.subjects(id) on delete cascade,
  task_id uuid references public.study_plan_tasks(id) on delete set null,
  duration_seconds integer not null check (duration_seconds between 300 and 7200),
  accumulated_seconds integer not null default 0 check (accumulated_seconds >= 0),
  status text not null default 'running'
    check (status in ('running', 'paused', 'cancelled', 'completed')),
  started_at timestamptz not null default now(),
  resumed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists focus_timer_sessions_user_updated_idx
  on public.focus_timer_sessions(user_id, updated_at desc);

create unique index if not exists focus_timer_sessions_one_open_per_user_idx
  on public.focus_timer_sessions(user_id)
  where status in ('running', 'paused');

alter table public.focus_timer_sessions enable row level security;

drop policy if exists "Users can view own focus timer sessions"
  on public.focus_timer_sessions;

create policy "Users can view own focus timer sessions"
  on public.focus_timer_sessions
  for select
  to authenticated
  using (auth.uid() = user_id);

revoke insert, update, delete on public.focus_timer_sessions from anon, authenticated;

create or replace function public.focus_timer_start(
  p_subject_id uuid,
  p_duration_minutes integer,
  p_operation_id text,
  p_task_id uuid default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_existing jsonb;
  v_id uuid;
  v_started timestamptz;
  v_duration integer;
begin
  if v_user is null then
    raise exception 'not_authenticated';
  end if;

  if p_operation_id is null
     or char_length(p_operation_id) < 8
     or char_length(p_operation_id) > 100 then
    raise exception 'invalid_operation_id';
  end if;

  if p_duration_minutes < 5 or p_duration_minutes > 120 then
    raise exception 'invalid_duration';
  end if;

  if not exists (
    select 1
    from public.subjects
    where id = p_subject_id
      and user_id = v_user
  ) then
    raise exception 'subject_not_owned';
  end if;

  if p_task_id is not null and not exists (
    select 1
    from public.study_plan_tasks
    where id = p_task_id
      and user_id = v_user
      and (subject_id = p_subject_id or subject_id is null)
  ) then
    raise exception 'task_not_owned_or_subject_mismatch';
  end if;

  select jsonb_build_object(
    'session_id', id,
    'operation_id', operation_id,
    'subject_id', subject_id,
    'task_id', task_id,
    'duration_minutes', duration_seconds / 60,
    'started_at', started_at,
    'status', status
  )
  into v_existing
  from public.focus_timer_sessions
  where user_id = v_user
    and operation_id = p_operation_id
  limit 1;

  if v_existing is not null then
    return v_existing;
  end if;

  -- Starting a new timer cleanly closes any previous timer.
  update public.focus_timer_sessions
  set status = 'cancelled',
      resumed_at = null,
      updated_at = now()
  where user_id = v_user
    and status in ('running', 'paused');

  v_duration := p_duration_minutes * 60;
  v_started := now();

  insert into public.focus_timer_sessions (
    user_id,
    operation_id,
    subject_id,
    task_id,
    duration_seconds,
    accumulated_seconds,
    status,
    started_at,
    resumed_at
  )
  values (
    v_user,
    p_operation_id,
    p_subject_id,
    p_task_id,
    v_duration,
    0,
    'running',
    v_started,
    v_started
  )
  returning id into v_id;

  return jsonb_build_object(
    'session_id', v_id,
    'operation_id', p_operation_id,
    'subject_id', p_subject_id,
    'task_id', p_task_id,
    'duration_minutes', p_duration_minutes,
    'started_at', v_started,
    'status', 'running'
  );
end;
$$;

create or replace function public.focus_timer_pause(
  p_operation_id text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_row public.focus_timer_sessions%rowtype;
  v_added integer;
  v_total integer;
begin
  if v_user is null then
    raise exception 'not_authenticated';
  end if;

  select *
  into v_row
  from public.focus_timer_sessions
  where user_id = v_user
    and operation_id = p_operation_id
  for update;

  if not found then
    raise exception 'timer_session_not_found';
  end if;

  if v_row.status <> 'running' or v_row.resumed_at is null then
    return jsonb_build_object(
      'session_id', v_row.id,
      'operation_id', v_row.operation_id,
      'status', v_row.status,
      'accumulated_seconds', v_row.accumulated_seconds
    );
  end if;

  v_added := greatest(
    0,
    floor(extract(epoch from (now() - v_row.resumed_at)))::integer
  );

  v_total := least(
    v_row.duration_seconds,
    v_row.accumulated_seconds + v_added
  );

  update public.focus_timer_sessions
  set accumulated_seconds = v_total,
      status = case when v_total >= duration_seconds then 'paused' else 'paused' end,
      resumed_at = null,
      updated_at = now()
  where id = v_row.id;

  return jsonb_build_object(
    'session_id', v_row.id,
    'operation_id', v_row.operation_id,
    'status', 'paused',
    'accumulated_seconds', v_total
  );
end;
$$;

create or replace function public.focus_timer_resume(
  p_operation_id text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_row public.focus_timer_sessions%rowtype;
begin
  if v_user is null then
    raise exception 'not_authenticated';
  end if;

  select *
  into v_row
  from public.focus_timer_sessions
  where user_id = v_user
    and operation_id = p_operation_id
  for update;

  if not found then
    raise exception 'timer_session_not_found';
  end if;

  if v_row.status <> 'paused' then
    return jsonb_build_object(
      'session_id', v_row.id,
      'operation_id', v_row.operation_id,
      'status', v_row.status,
      'accumulated_seconds', v_row.accumulated_seconds
    );
  end if;

  if v_row.accumulated_seconds >= v_row.duration_seconds then
    return jsonb_build_object(
      'session_id', v_row.id,
      'operation_id', v_row.operation_id,
      'status', 'paused',
      'accumulated_seconds', v_row.accumulated_seconds
    );
  end if;

  update public.focus_timer_sessions
  set status = 'running',
      resumed_at = now(),
      updated_at = now()
  where id = v_row.id;

  return jsonb_build_object(
    'session_id', v_row.id,
    'operation_id', v_row.operation_id,
    'status', 'running',
    'accumulated_seconds', v_row.accumulated_seconds
  );
end;
$$;

create or replace function public.focus_timer_cancel(
  p_operation_id text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_row public.focus_timer_sessions%rowtype;
begin
  if v_user is null then
    raise exception 'not_authenticated';
  end if;

  select *
  into v_row
  from public.focus_timer_sessions
  where user_id = v_user
    and operation_id = p_operation_id
  for update;

  if not found then
    return jsonb_build_object(
      'cancelled', false,
      'reason', 'timer_session_not_found'
    );
  end if;

  update public.focus_timer_sessions
  set status = 'cancelled',
      resumed_at = null,
      updated_at = now()
  where id = v_row.id
    and status <> 'completed';

  return jsonb_build_object(
    'cancelled', true,
    'session_id', v_row.id,
    'operation_id', v_row.operation_id
  );
end;
$$;

create or replace function public.focus_timer_complete(
  p_operation_id text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_row public.focus_timer_sessions%rowtype;
  v_elapsed integer;
  v_study_duration integer;
  v_reward jsonb;
begin
  if v_user is null then
    raise exception 'not_authenticated';
  end if;

  select *
  into v_row
  from public.focus_timer_sessions
  where user_id = v_user
    and operation_id = p_operation_id
  for update;

  if not found then
    raise exception 'timer_session_not_found';
  end if;

  if v_row.status = 'cancelled' then
    raise exception 'timer_session_cancelled';
  end if;

  v_elapsed := v_row.accumulated_seconds;

  if v_row.status = 'running' and v_row.resumed_at is not null then
    v_elapsed := least(
      v_row.duration_seconds,
      v_elapsed + greatest(
        0,
        floor(extract(epoch from (now() - v_row.resumed_at)))::integer
      )
    );
  end if;

  -- Small network grace so finishing the exact final second is reliable.
  if v_elapsed + 2 < v_row.duration_seconds then
    raise exception 'timer_not_elapsed';
  end if;

  v_study_duration := greatest(5, least(120, round(v_row.duration_seconds / 60.0)::integer));

  update public.focus_timer_sessions
  set accumulated_seconds = v_row.duration_seconds,
      status = 'completed',
      resumed_at = null,
      updated_at = now()
  where id = v_row.id;

  insert into public.study_sessions (
    user_id,
    subject_id,
    task_id,
    duration_minutes,
    completed,
    xp_earned,
    client_operation_id,
    verification_method,
    started_at
  )
  values (
    v_user,
    v_row.subject_id,
    v_row.task_id,
    v_study_duration,
    false,
    0,
    v_row.operation_id,
    'server',
    now() - make_interval(secs => v_row.duration_seconds)
  )
  on conflict (user_id, client_operation_id) do nothing;

  select public.complete_study_session(
    v_row.subject_id,
    v_study_duration,
    v_row.operation_id,
    'server'
  )
  into v_reward;

  return v_reward || jsonb_build_object(
    'timer_session_id', v_row.id,
    'timer_operation_id', v_row.operation_id
  );
end;
$$;

revoke all on function public.focus_timer_start(uuid, integer, text, uuid) from public;
revoke all on function public.focus_timer_pause(text) from public;
revoke all on function public.focus_timer_resume(text) from public;
revoke all on function public.focus_timer_cancel(text) from public;
revoke all on function public.focus_timer_complete(text) from public;

grant execute on function public.focus_timer_start(uuid, integer, text, uuid) to authenticated;
grant execute on function public.focus_timer_pause(text) to authenticated;
grant execute on function public.focus_timer_resume(text) to authenticated;
grant execute on function public.focus_timer_cancel(text) to authenticated;
grant execute on function public.focus_timer_complete(text) to authenticated;

commit;

-- Link verified study sessions to the exact Study Plan Card/Task that started them.
-- This keeps task identity separate from subject identity.

alter table public.study_sessions
  add column if not exists task_id uuid
    references public.study_plan_tasks(id)
    on delete set null;

create index if not exists study_sessions_user_task_idx
  on public.study_sessions(user_id, task_id);

-- Replace the client-facing start RPC with a task-aware version.
drop function if exists public.start_study_session(uuid, integer, text);

create or replace function public.start_study_session(
  p_subject_id uuid,
  p_duration_minutes integer,
  p_client_operation_id text,
  p_task_id uuid default null
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
  if v_user_id is null then
    raise exception 'not_authenticated';
  end if;

  if p_client_operation_id is null
     or char_length(p_client_operation_id) < 8
     or char_length(p_client_operation_id) > 100 then
    raise exception 'invalid_operation_id';
  end if;

  if p_duration_minutes < 5 or p_duration_minutes > 120 then
    raise exception 'invalid_duration';
  end if;

  if not exists (
    select 1
    from public.subjects
    where id = p_subject_id
      and user_id = v_user_id
  ) then
    raise exception 'subject_not_owned';
  end if;

  if p_task_id is not null then
    if not exists (
      select 1
      from public.study_plan_tasks
      where id = p_task_id
        and user_id = v_user_id
        and (subject_id = p_subject_id or subject_id is null)
    ) then
      raise exception 'task_not_owned_or_subject_mismatch';
    end if;
  end if;

  select jsonb_build_object(
    'session_id', id,
    'operation_id', client_operation_id,
    'started_at', started_at,
    'task_id', task_id
  )
  into v_existing
  from public.study_sessions
  where user_id = v_user_id
    and client_operation_id = p_client_operation_id
  limit 1;

  if v_existing is not null then
    return v_existing;
  end if;

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
    select 1
    from public.study_sessions
    where user_id = v_user_id
      and completed = false
      and verification_method = 'server'
  ) then
    raise exception 'active_session_exists';
  end if;

  insert into public.study_sessions(
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
    v_user_id,
    p_subject_id,
    p_task_id,
    p_duration_minutes,
    false,
    0,
    p_client_operation_id,
    'server',
    now()
  )
  returning id into v_session_id;

  return jsonb_build_object(
    'session_id', v_session_id,
    'operation_id', p_client_operation_id,
    'started_at', now(),
    'task_id', p_task_id
  );

exception
  when unique_violation then
    select jsonb_build_object(
      'session_id', id,
      'operation_id', client_operation_id,
      'started_at', started_at,
      'task_id', task_id
    )
    into v_existing
    from public.study_sessions
    where user_id = v_user_id
      and client_operation_id = p_client_operation_id
    limit 1;

    if v_existing is not null then
      return v_existing;
    end if;

    raise;
end;
$$;

revoke all on function public.start_study_session(uuid, integer, text, uuid) from public;
grant execute on function public.start_study_session(uuid, integer, text, uuid) to authenticated;


create or replace function public.get_active_study_session()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_session public.study_sessions%rowtype;
  v_task_title text;
begin
  if v_user_id is null then
    raise exception 'not_authenticated';
  end if;

  select *
  into v_session
  from public.study_sessions
  where user_id = v_user_id
    and completed = false
    and verification_method = 'server'
  order by started_at desc
  limit 1;

  if not found then
    return null;
  end if;

  if v_session.task_id is not null then
    select title
    into v_task_title
    from public.study_plan_tasks
    where id = v_session.task_id
      and user_id = v_user_id;
  end if;

  return jsonb_build_object(
    'session_id', v_session.id,
    'operation_id', v_session.client_operation_id,
    'subject_id', v_session.subject_id,
    'task_id', v_session.task_id,
    'task_title', v_task_title,
    'duration_minutes', v_session.duration_minutes,
    'started_at', v_session.started_at
  );
end;
$$;

revoke all on function public.get_active_study_session() from public;
grant execute on function public.get_active_study_session() to authenticated;
